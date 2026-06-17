package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.response.OrderTrackingResponse;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.enums.OrderStatus;
import uz.jalyuziepr.api.enums.StaffNotificationType;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.OrderRepository;

import java.security.SecureRandom;
import java.util.Map;

/**
 * "Jalyuzimni kuzat" — ommaviy buyurtma kuzatuvi xizmati.
 * Kod generatsiyasi, ommaviy o'qish (auth'siz), real-vaqt STOMP push va
 * mijozga kuzatuv havolasini SMS/Telegram orqali yuborishni boshqaradi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderTrackingService {

    // Chalkashtiradigan belgilar (0/O, 1/I/L) chiqarib tashlangan — telefonda o'qishga qulay
    private static final char[] CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray();
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrderRepository orderRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SmsService smsService;
    private final TelegramService telegramService;
    private final StaffNotificationService staffNotificationService;

    @Value("${app.public-base-url:https://kanjaltib.uz}")
    private String publicBaseUrl;

    // Telegram orqali yetkazib bo'lmasa SMS'ga o'tilsinmi? Default: yo'q (Eskiz SMS pullik).
    // Telegram bepul va asosiy kanal; SMS'ni faqat kerak bo'lganda yoqing (TRACKING_SMS_FALLBACK=true).
    @Value("${app.tracking.sms-fallback-enabled:false}")
    private boolean smsFallbackEnabled;

    /**
     * Ommaviy kuzatuv ma'lumotini kod bo'yicha qaytaradi (auth'siz endpoint ishlatadi).
     */
    @Transactional(readOnly = true)
    public OrderTrackingResponse getByCode(String code) {
        Order order = orderRepository.findByTrackingCodeWithDetails(normalize(code))
                .orElseThrow(() -> new ResourceNotFoundException("Kuzatuv", "kod", code));
        OrderTrackingResponse resp = OrderTrackingResponse.from(order);
        // Telegram'da obuna bo'lish deep-link'i (bot yoqilgan va username sozlangan bo'lsa)
        if (telegramService.isEnabled() && order.getTrackingCode() != null) {
            resp.setTelegramSubscribeUrl(telegramService.buildDeepLink(TRACK_PAYLOAD_PREFIX + order.getTrackingCode()));
        }
        return resp;
    }

    /** Telegram /start deep-link payload prefiksi (bot tomonidan track_ bilan boshlanadi) */
    public static final String TRACK_PAYLOAD_PREFIX = "track_";

    /**
     * Buyurtma uchun noyob kuzatuv kodini generatsiya qiladi (DB orqali noyoblik tekshiriladi).
     */
    public String generateUniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = randomCode();
            if (!orderRepository.existsByTrackingCode(code)) {
                return code;
            }
        }
        // Juda kam ehtimol: bir necha urinishdan keyin ham to'qnashuv — uzunroq kod bilan kafolatlaymiz
        return randomCode() + randomCode().substring(0, 4);
    }

    /**
     * Status o'zgarishini ochiq kuzatuv topic'iga e'lon qiladi.
     * Mijoz sahifasi xabar olgach to'liq holatni qayta yuklaydi.
     * Tashqi/WS nosozligi buyurtma oqimiga ta'sir qilmasligi kerak — xatolar yutiladi.
     */
    public void broadcastUpdate(String trackingCode, OrderStatus status) {
        if (trackingCode == null || trackingCode.isBlank()) {
            return;
        }
        try {
            messagingTemplate.convertAndSend(
                    "/topic/track/" + trackingCode,
                    Map.of(
                            "type", "STATUS_CHANGED",
                            "status", status.name(),
                            "statusLabel", status.getDisplayName()
                    ));
        } catch (Exception e) {
            log.warn("Kuzatuv push yuborilmadi (kod {}): {}", trackingCode, e.getMessage());
        }
    }

    /**
     * Mijozга kuzatuv havolasini yuboradi.
     * Asosiy kanal — Telegram (bepul, inline tugma bilan). Mijoz botga ulanmagan bo'lsa
     * va SMS zaxirasi yoqilgan bo'lsa — SMS; aks holda menejerга "qo'lda ulashing"
     * ogohlantirishi yuboriladi. Eslatma: kuzatuv sahifasi oddiy web — uni ochish uchun
     * Telegram shart emas; bu yerda Telegram faqat HAVOLANI yetkazish kanali.
     * Xatolar yutiladi — bildirishnoma nosozligi buyurtma jarayoniga ta'sir qilmasligi kerak.
     */
    public void sendTrackingLink(Long chatId, String phone, String orderNumber, Long orderId, String trackingCode) {
        if (trackingCode == null || trackingCode.isBlank()) {
            return;
        }
        try {
            String url = buildTrackingUrl(trackingCode);

            // 1) Asosiy kanal — Telegram (bepul)
            if (chatId != null && telegramService.isEnabled()) {
                String text = "🪟 <b>Buyurtmangiz ishlab chiqarishga qabul qilindi!</b>\n\n"
                        + "Buyurtma: <b>" + orderNumber + "</b>\n\n"
                        + "Holatini real vaqtda shu yerda kuzating 👇";
                Map<String, Object> markup = telegramService.inlineUrlButton("📦 Buyurtmani kuzatish", url);
                if (telegramService.sendMessage(chatId, text, markup)) {
                    return;
                }
                log.warn("Telegram orqali kuzatuv havolasi yuborilmadi (buyurtma {})", orderNumber);
            }

            // 2) Zaxira — SMS (faqat sozlamada yoqilgan bo'lsa; Eskiz pullik)
            if (smsFallbackEnabled && phone != null && !phone.isBlank()) {
                String sms = "Hurmatli mijoz! " + orderNumber
                        + " buyurtmangiz ishlab chiqarishga qabul qilindi. Kuzating: " + url;
                smsService.sendNotification(phone, sms);
                return;
            }

            // 3) Avtomatik yetkazib bo'lmadi — menejer havolani qo'lda ulashsin
            staffNotificationService.createGlobalNotification(
                    "Kuzatuv havolasi yuborilmadi",
                    "Buyurtma " + orderNumber + ": mijoz Telegram'ga ulanmagan. "
                            + "Kuzatuv havolasini qo'lda ulashing.",
                    StaffNotificationType.WARNING, "ORDER", orderId);
        } catch (Exception e) {
            log.warn("Kuzatuv havolasini yuborishda xatolik (buyurtma {}): {}", orderNumber, e.getMessage());
        }
    }

    /**
     * "O'lchovdan keyin" — narx tasdiqlangan, zaklad to'lanmagan mijozga
     * eslatma (win-back). Asosiy kanal Telegram; sozlamada yoqilgan bo'lsa SMS zaxira.
     */
    public void sendQuoteFollowup(Long chatId, String phone, String orderNumber, Long orderId, String trackingCode) {
        if (trackingCode == null || trackingCode.isBlank()) {
            return;
        }
        try {
            String url = buildTrackingUrl(trackingCode);

            if (chatId != null && telegramService.isEnabled()) {
                String text = "💡 <b>Buyurtmangizni rasmiylashtiramizmi?</b>\n\n"
                        + "Buyurtma: <b>" + orderNumber + "</b>\n"
                        + "Narx tasdiqlandi. Zaklad to'lab rasmiylashtirsangiz, biz ishlab "
                        + "chiqarishni boshlaymiz.\n\nTafsilotlar 👇";
                Map<String, Object> markup = telegramService.inlineUrlButton("📦 Buyurtmani ko'rish", url);
                if (telegramService.sendMessage(chatId, text, markup)) {
                    return;
                }
                log.warn("Telegram orqali zaklad follow-up yuborilmadi (buyurtma {})", orderNumber);
            }

            if (smsFallbackEnabled && phone != null && !phone.isBlank()) {
                String sms = "Hurmatli mijoz! " + orderNumber
                        + " buyurtmangiz narxi tasdiqlandi. Zaklad to'lab rasmiylashtiring: " + url;
                smsService.sendNotification(phone, sms);
                return;
            }

            staffNotificationService.createGlobalNotification(
                    "Zaklad follow-up yuborilmadi",
                    "Buyurtma " + orderNumber + ": mijoz Telegram'ga ulanmagan. Qo'lda bog'laning.",
                    StaffNotificationType.WARNING, "ORDER", orderId);
        } catch (Exception e) {
            log.warn("Zaklad follow-up yuborishda xatolik (buyurtma {}): {}", orderNumber, e.getMessage());
        }
    }

    public String buildTrackingUrl(String trackingCode) {
        String base = publicBaseUrl != null && publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
        return base + "/t/" + trackingCode;
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_ALPHABET[RANDOM.nextInt(CODE_ALPHABET.length)]);
        }
        return sb.toString();
    }

    private String normalize(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }
}
