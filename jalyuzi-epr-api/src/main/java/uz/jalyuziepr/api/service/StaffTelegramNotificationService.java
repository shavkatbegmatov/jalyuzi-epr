package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import uz.jalyuziepr.api.dto.response.UserResponse;
import uz.jalyuziepr.api.entity.User;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.event.EscalationCreatedEvent;
import uz.jalyuziepr.api.event.StaffOrderAssignedEvent;
import uz.jalyuziepr.api.event.StaffTelegramUnlinkedEvent;
import uz.jalyuziepr.api.repository.UserRepository;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Telegram akkaunti ulangan xodimlarga (users.telegram_user_id, V58) bot orqali
 * bildirishnomalar. Har bir xabarda Mini App'ni kerakli sahifada ochadigan
 * inline web_app tugmasi bor: {@code /tg?next=<ichki yo'l>}.
 *
 * <p>Tinglovchilar tranzaksiya commit bo'lgandan keyin ({@code AFTER_COMMIT}) va
 * alohida oqimda ({@code @Async}) ishlaydi — Telegram API'ga so'rov foydalanuvchi
 * so'rovini sekinlashtirmaydi, tranzaksiya bekor bo'lsa xabar ketmaydi.
 * Har qanday xatolik faqat log qilinadi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StaffTelegramNotificationService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private final TelegramService telegramService;
    private final UserRepository userRepository;

    /**
     * O'lchuvchi yoki o'rnatuvchi buyurtmaga tayinlanganda — xodimning o'ziga xabar.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onOrderAssigned(StaffOrderAssignedEvent event) {
        try {
            if (!telegramService.isEnabled()) {
                log.debug("Telegram bot o'chirilgan — tayinlash xabari yuborilmadi: order={}", event.orderNumber());
                return;
            }
            if (event.userId() == null) {
                return;
            }

            User user = userRepository.findByIdWithRolesAndPermissions(event.userId()).orElse(null);
            if (user == null || user.getTelegramUserId() == null || !Boolean.TRUE.equals(user.getActive())) {
                log.debug("Xodim Telegram'ga ulanmagan — tayinlash xabari yuborilmadi: order={}, userId={}",
                        event.orderNumber(), event.userId());
                return;
            }

            String path = orderPath(roleCode(user), event.orderId());
            Map<String, Object> button = telegramService.inlineWebAppButton("📋 Buyurtmani ochish", webAppUrl(path));
            boolean sent = telegramService.sendMessage(user.getTelegramUserId(), buildAssignmentText(event), button);

            log.info("Telegram tayinlash xabari: order={}, kind={}, user={}, next={}, yuborildi={}",
                    event.orderNumber(), event.kind(), user.getUsername(), path, sent);
        } catch (Exception e) {
            log.warn("Telegram tayinlash xabarini yuborishda xatolik: order={}, userId={}, error={}",
                    event.orderNumber(), event.userId(), e.getMessage());
        }
    }

    /**
     * Yangi SOS (eskalatsiya) — uni hal qila oladigan (ORDERS_UPDATE), Telegram'i
     * ulangan faol xodimlarga (menejerlar) xabar. SOS yuborgan xodimning o'ziga yuborilmaydi.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onEscalationCreated(EscalationCreatedEvent event) {
        try {
            if (!telegramService.isEnabled()) {
                log.debug("Telegram bot o'chirilgan — SOS xabari yuborilmadi: order={}", event.orderNumber());
                return;
            }

            List<User> recipients = userRepository.findTelegramLinkedActiveWithRolesAndPermissions().stream()
                    .filter(u -> event.createdById() == null || !u.getId().equals(event.createdById()))
                    .filter(u -> u.hasPermission(PermissionCode.ORDERS_UPDATE.getCode()))
                    .toList();

            if (recipients.isEmpty()) {
                log.info("SOS Telegram xabari: Telegram'i ulangan menejer yo'q — order={}", event.orderNumber());
                return;
            }

            String text = buildEscalationText(event);
            int sentCount = 0;
            for (User user : recipients) {
                try {
                    String path = escalationPath(roleCode(user), event.orderId());
                    Map<String, Object> button = telegramService.inlineWebAppButton("🆘 Ko'rib chiqish", webAppUrl(path));
                    if (telegramService.sendMessage(user.getTelegramUserId(), text, button)) {
                        sentCount++;
                    }
                } catch (Exception e) {
                    log.warn("SOS Telegram xabarini yuborishda xatolik: order={}, user={}, error={}",
                            event.orderNumber(), user.getUsername(), e.getMessage());
                }
            }

            log.info("SOS Telegram xabari: order={}, escalationId={}, qabul qiluvchilar={}, yuborildi={}",
                    event.orderNumber(), event.escalationId(), recipients.size(), sentCount);
        } catch (Exception e) {
            log.warn("SOS Telegram xabarlarini yuborishda xatolik: order={}, error={}",
                    event.orderNumber(), e.getMessage());
        }
    }

    /**
     * Telegram akkaunt uzildi — shaxsiy "Ilova" menyu tugmasini tiklash va xabar berish.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onTelegramUnlinked(StaffTelegramUnlinkedEvent event) {
        try {
            if (!telegramService.isEnabled() || event.telegramUserId() == null) {
                return;
            }
            telegramService.resetChatMenuButton(event.telegramUserId());
            String text = event.byAdmin()
                    ? "🔒 Telegram akkauntingiz administrator tomonidan ERP'dan uzildi. "
                            + "Ilovadan foydalanish uchun administratorga murojaat qiling."
                    : "Telegram akkauntingiz ERP'dan uzildi. Qayta ulash uchun ilovani oching va login qiling.";
            boolean sent = telegramService.sendMessage(event.telegramUserId(), text);
            log.info("Telegram uzilish xabari: admin={}, yuborildi={}", event.byAdmin(), sent);
        } catch (Exception e) {
            log.warn("Telegram uzilish xabarini yuborishda xatolik: {}", e.getMessage());
        }
    }

    // ==================== Matnlar ====================

    private String buildAssignmentText(StaffOrderAssignedEvent event) {
        boolean measurement = event.kind() == StaffOrderAssignedEvent.Kind.MEASUREMENT;
        StringBuilder sb = new StringBuilder();
        sb.append(measurement ? "📐 <b>Sizga o'lchov tayinlandi</b>" : "🛠 <b>Sizga o'rnatish tayinlandi</b>");
        sb.append("\n\n");
        sb.append("📋 Buyurtma: <b>").append(escapeHtml(event.orderNumber())).append("</b>\n");
        sb.append("👤 Mijoz: ").append(orDash(event.customerName())).append('\n');
        if (event.customerPhone() != null && !event.customerPhone().isBlank()) {
            sb.append("📞 Telefon: ").append(escapeHtml(event.customerPhone())).append('\n');
        }
        sb.append("📍 Manzil: ").append(orDash(event.address())).append('\n');
        sb.append("🗓 Sana: ").append(formatDate(event.scheduledDate()));
        return sb.toString();
    }

    private String buildEscalationText(EscalationCreatedEvent event) {
        StringBuilder sb = new StringBuilder();
        sb.append("🆘 <b>Tezkor yordam so'rovi</b>\n\n");
        sb.append("📋 Buyurtma: <b>").append(escapeHtml(event.orderNumber())).append("</b>\n");
        sb.append("⚠️ Sabab: ").append(orDash(event.reasonLabel())).append('\n');
        if (event.description() != null && !event.description().isBlank()) {
            sb.append("💬 Izoh: ").append(escapeHtml(event.description())).append('\n');
        }
        sb.append("👷 Yuborgan: ").append(orDash(event.createdByName())).append('\n');
        sb.append("👤 Mijoz: ").append(orDash(event.customerName())).append('\n');
        sb.append("📍 Manzil: ").append(orDash(event.address()));
        return sb.toString();
    }

    // ==================== Mini App yo'llari ====================

    /**
     * Xodim roli bo'yicha buyurtma sahifasi. Rol frontend'dagi kabi aniqlanadi
     * ({@link UserResponse#from}) — panel layout'lari shu qiymatga qarab yo'naltiradi.
     */
    private static String orderPath(String roleCode, Long orderId) {
        if ("INSTALLER".equals(roleCode)) {
            return "/installer/" + orderId;
        }
        if ("MANAGER".equals(roleCode)) {
            return "/manager/orders/" + orderId;
        }
        return "/orders/" + orderId;
    }

    private static String escalationPath(String roleCode, Long orderId) {
        if ("MANAGER".equals(roleCode)) {
            return "/manager/escalations";
        }
        return orderPath(roleCode, orderId);
    }

    /** Mini App manzili + {@code next} parametri (ichki yo'l, URL-kodlangan). */
    private String webAppUrl(String nextPath) {
        String base = telegramService.getWebAppUrl();
        String separator = base.contains("?") ? "&" : "?";
        return base + separator + "next=" + URLEncoder.encode(nextPath, StandardCharsets.UTF_8);
    }

    private static String roleCode(User user) {
        return UserResponse.from(user).getRole();
    }

    // ==================== Yordamchilar ====================

    private static String formatDate(LocalDateTime date) {
        return date != null ? date.format(DATE_FORMAT) : "belgilanmagan";
    }

    private static String orDash(String value) {
        return value != null && !value.isBlank() ? escapeHtml(value) : "—";
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
