package uz.jalyuziepr.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.entity.Customer;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.entity.TelegramPhoneLink;
import uz.jalyuziepr.api.enums.OrderStatus;
import uz.jalyuziepr.api.repository.CustomerRepository;
import uz.jalyuziepr.api.repository.DebtRepository;
import uz.jalyuziepr.api.repository.OrderRepository;
import uz.jalyuziepr.api.repository.TelegramPhoneLinkRepository;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Telegram bot bilan foydalanuvchi dialogini boshqaradi.
 * Update'larni tahlil qiladi va kerakli javob yuboradi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramBotService {

    private final TelegramService telegramService;
    private final SmsService smsService; // Kod generatsiyasi uchun (sms_verifications jadvalidan foydalanamiz)
    private final TelegramPhoneLinkRepository telegramPhoneLinkRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final DebtRepository debtRepository;

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final NumberFormat MONEY = NumberFormat.getInstance(new Locale("uz"));

    private static final String VERIFY_PAYLOAD_PREFIX = "verify_";

    @Value("${app.public-base-url:https://kanjaltib.uz}")
    private String publicBaseUrl;

    /**
     * Telegram'dan kelgan Update'ni qayta ishlash
     */
    @Transactional
    public void handleUpdate(JsonNode update) {
        JsonNode message = update.path("message");
        if (message.isMissingNode()) {
            return;
        }

        JsonNode chat = message.path("chat");
        Long chatId = chat.path("id").asLong();
        if (chatId == 0) {
            return;
        }

        JsonNode from = message.path("from");
        Long fromUserId = from.path("id").asLong();
        String username = from.path("username").asText(null);
        String firstName = from.path("first_name").asText(null);
        String lastName = from.path("last_name").asText(null);

        // Kontakt ulashildimi?
        if (!message.path("contact").isMissingNode()) {
            handleContact(chatId, fromUserId, message.path("contact"), username, firstName, lastName);
            return;
        }

        // Matn xabari
        String text = message.path("text").asText("");
        String lower = text.toLowerCase().trim();

        if (text.startsWith("/start")) {
            handleStart(chatId, text);
        } else if (lower.equals("/help") || lower.equals("/yordam")) {
            sendHelp(chatId);
        } else if (lower.equals("/buyurtmalarim") || lower.equals("/orders")) {
            handleMyOrders(chatId);
        } else if (lower.equals("/qarzlarim") || lower.equals("/qarz") || lower.equals("/debts")) {
            handleMyDebts(chatId);
        } else if (lower.equals("/shikoyat") || lower.equals("/complaint")) {
            handleComplaintHint(chatId);
        } else if (lower.equals("/profil") || lower.equals("/profile")) {
            handleProfile(chatId);
        } else {
            sendDefault(chatId);
        }
    }

    /**
     * Berilgan chat_id ga bog'langan mijozni topadi.
     */
    private Optional<Customer> findCustomerByChatId(Long chatId) {
        return customerRepository.findAll().stream()
                .filter(c -> chatId.equals(c.getTelegramChatId()))
                .findFirst();
    }

    private void handleMyOrders(Long chatId) {
        Optional<Customer> customerOpt = findCustomerByChatId(chatId);
        if (customerOpt.isEmpty()) {
            telegramService.sendMessage(chatId,
                    "Avval telefon raqamingizni ulashing va veb-saytda ro'yxatdan o'ting.");
            return;
        }

        Customer customer = customerOpt.get();
        List<Order> orders = orderRepository.findByCustomerId(
                customer.getId(),
                org.springframework.data.domain.PageRequest.of(0, 5,
                        org.springframework.data.domain.Sort.by("createdAt").descending())
        ).getContent();

        if (orders.isEmpty()) {
            telegramService.sendMessage(chatId, "Sizda hozircha buyurtma yo'q.");
            return;
        }

        StringBuilder sb = new StringBuilder("<b>Oxirgi buyurtmalaringiz:</b>\n\n");
        for (Order o : orders) {
            sb.append("📋 <b>").append(o.getOrderNumber()).append("</b>\n");
            sb.append("Holat: ").append(o.getStatus().getDisplayName()).append("\n");
            sb.append("Summa: ").append(money(o.getTotalAmount())).append(" so'm\n");
            if (o.getRemainingAmount() != null && o.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0) {
                sb.append("Qoldiq: <b>").append(money(o.getRemainingAmount())).append(" so'm</b>\n");
            }
            if (o.getInstallationDate() != null) {
                sb.append("O'rnatish: ").append(DATE.format(o.getInstallationDate())).append("\n");
            }
            sb.append("\n");
        }
        sb.append("Batafsil: https://kanjaltib.uz/kabinet/buyurtmalar");
        telegramService.sendMessage(chatId, sb.toString());
    }

    private void handleMyDebts(Long chatId) {
        Optional<Customer> customerOpt = findCustomerByChatId(chatId);
        if (customerOpt.isEmpty()) {
            telegramService.sendMessage(chatId,
                    "Avval telefon raqamingizni ulashing va veb-saytda ro'yxatdan o'ting.");
            return;
        }

        Customer customer = customerOpt.get();
        BigDecimal balance = customer.getBalance() != null ? customer.getBalance() : BigDecimal.ZERO;

        String response;
        if (balance.compareTo(BigDecimal.ZERO) >= 0) {
            response = "✅ <b>Sizda qarz yo'q</b>\n\n" +
                    "Hisob: <b>" + money(balance) + " so'm</b>";
        } else {
            BigDecimal debt = balance.abs();
            response = "💰 <b>Qarz miqdori:</b> " + money(debt) + " so'm\n\n" +
                    "To'lash uchun aloqaga chiqing: +998 ...\n" +
                    "Batafsil: https://kanjaltib.uz/kabinet/qarzlar";
        }
        telegramService.sendMessage(chatId, response);
    }

    private void handleComplaintHint(Long chatId) {
        Optional<Customer> customerOpt = findCustomerByChatId(chatId);
        if (customerOpt.isEmpty()) {
            telegramService.sendMessage(chatId,
                    "Avval telefon raqamingizni ulashing va veb-saytda ro'yxatdan o'ting.");
            return;
        }
        telegramService.sendMessage(chatId,
                "🔧 <b>Kafolat shikoyati</b>\n\n" +
                "Mahsulot bilan muammo bo'lsa, shaxsiy kabinetingizdan shikoyat qoldiring:\n" +
                "https://kanjaltib.uz/kabinet/shikoyatlar\n\n" +
                "Sayt orqali muammoni batafsil yozasiz va biz tez orada usta yuboramiz.");
    }

    private void handleProfile(Long chatId) {
        Optional<Customer> customerOpt = findCustomerByChatId(chatId);
        if (customerOpt.isEmpty()) {
            telegramService.sendMessage(chatId,
                    "Avval telefon raqamingizni ulashing va veb-saytda ro'yxatdan o'ting.");
            return;
        }
        Customer c = customerOpt.get();
        String text = "👤 <b>Sizning profilingiz</b>\n\n" +
                "Ism: " + c.getFullName() + "\n" +
                "Telefon: " + c.getPhone() + "\n" +
                "Hisob: " + money(c.getBalance()) + " so'm";
        telegramService.sendMessage(chatId, text);
    }

    private String money(BigDecimal v) {
        if (v == null) return "0";
        return MONEY.format(v);
    }

    /**
     * /start [payload] buyrug'i
     */
    private void handleStart(Long chatId, String text) {
        String payload = "";
        int spaceIdx = text.indexOf(' ');
        if (spaceIdx > 0) {
            payload = text.substring(spaceIdx + 1).trim();
        }

        log.info("Telegram /start: chatId={}, payload={}", chatId, payload);

        // Deep-link: buyurtma kuzatuviga obuna bo'lish (track_<code>)
        if (payload.startsWith(OrderTrackingService.TRACK_PAYLOAD_PREFIX)) {
            String code = payload.substring(OrderTrackingService.TRACK_PAYLOAD_PREFIX.length()).trim();
            handleTrackSubscribe(chatId, code);
            return;
        }

        String welcome = """
                👋 Assalomu alaykum! <b>Jalyuzi ERP</b> bot'iga xush kelibsiz.

                Ro'yxatdan o'tish yoki kirish uchun telefon raqamingizni ulashing. \
                Bu Telegram orqali xavfsiz tasdiqlash uchun kerak.

                📱 Pastdagi tugmani bosing:""";

        telegramService.sendMessage(
                chatId,
                welcome,
                telegramService.requestContactKeyboard("📱 Telefon raqamni ulashish")
        );
    }

    /**
     * Deep-link orqali buyurtma kuzatuviga obuna bo'lish (/start track_<code>).
     * Mijoz hali Telegram'ga ulanmagan bo'lsa, shu chatni bog'laymiz — keyin barcha
     * yangiliklar (status push, akt-kvitansiya) shu yerga keladi. Mavjud bog'lanishni
     * ALMASHTIRMAYMIZ (boshqa odam kanalni o'zlashtirmasligi uchun).
     */
    private void handleTrackSubscribe(Long chatId, String code) {
        Optional<Order> orderOpt = orderRepository.findByTrackingCodeWithDetails(
                code == null ? null : code.trim().toUpperCase());
        if (orderOpt.isEmpty()) {
            telegramService.sendMessage(chatId,
                    "❌ Buyurtma topilmadi. Kuzatuv havolasi noto'g'ri yoki eskirgan bo'lishi mumkin.");
            return;
        }

        Order order = orderOpt.get();
        Customer customer = order.getCustomer();

        boolean subscribed = false;
        if (customer != null && customer.getTelegramChatId() == null) {
            customer.setTelegramChatId(chatId);
            customerRepository.save(customer);
            subscribed = true;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("🪟 <b>Buyurtma ").append(order.getOrderNumber()).append("</b>\n\n");
        sb.append("Holat: <b>").append(order.getStatus().getDisplayName()).append("</b>\n");
        if (order.getRemainingAmount() != null && order.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0) {
            sb.append("Qoldiq: <b>").append(money(order.getRemainingAmount())).append(" so'm</b>\n");
        }
        sb.append("\n");
        if (subscribed) {
            sb.append("✅ Obuna bo'ldingiz! Bu buyurtma bo'yicha yangiliklar shu yerga keladi.");
        } else {
            sb.append("Buyurtma holatini quyidagi tugma orqali to'liq kuzating.");
        }

        telegramService.sendMessage(chatId, sb.toString(),
                telegramService.inlineUrlButton("📦 To'liq kuzatish", trackingUrl(order.getTrackingCode())));
    }

    private String trackingUrl(String code) {
        String base = (publicBaseUrl != null && publicBaseUrl.endsWith("/"))
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
        return base + "/t/" + code;
    }

    /**
     * Foydalanuvchi kontaktini ulashdi
     */
    private void handleContact(Long chatId, Long fromUserId, JsonNode contact,
                                String username, String firstName, String lastName) {
        String phoneRaw = contact.path("phone_number").asText(null);
        if (phoneRaw == null) {
            telegramService.sendMessage(chatId, "❌ Telefon raqam topilmadi. Qayta urinib ko'ring.");
            return;
        }

        // Kontakt foydalanuvchining o'ziniki ekanligini tekshirish
        Long contactUserId = contact.path("user_id").asLong();
        if (contactUserId != 0 && fromUserId != null && !contactUserId.equals(fromUserId)) {
            telegramService.sendMessage(chatId, "❌ Iltimos, o'zingizning kontaktingizni ulashing.");
            return;
        }

        // Telefonni normalizatsiya qilish: 998901234567 -> +998901234567
        String phone = normalizePhone(phoneRaw);

        log.info("Telegram kontakt qabul qilindi: chatId={}, phone={}", chatId, phone);

        // Bog'liqlikni saqlash yoki yangilash
        TelegramPhoneLink link = telegramPhoneLinkRepository.findByPhone(phone)
                .orElse(TelegramPhoneLink.builder().phone(phone).build());
        link.setChatId(chatId);
        link.setTelegramUsername(username);
        link.setTelegramFirstName(firstName);
        link.setTelegramLastName(lastName);
        link.setVerifiedAt(LocalDateTime.now());
        telegramPhoneLinkRepository.save(link);

        // Agar mavjud mijoz bo'lsa — unga ham chat_id saqlaymiz
        Optional<Customer> customerOpt = customerRepository.findByPhone(phone);
        customerOpt.ifPresent(c -> {
            c.setTelegramChatId(chatId);
            customerRepository.save(c);
        });

        // Kutayotgan tasdiqlash kodi bormi?
        try {
            String code = smsService.generateAndStoreCode(phone);
            String message = """
                    ✅ Telefon raqam tasdiqlandi: <b>%s</b>

                    🔐 Tasdiqlash kodingiz: <b><code>%s</code></b>

                    Ushbu kodni veb-saytda kiriting. Kod 5 daqiqa amal qiladi.
                    """.formatted(phone, code);

            telegramService.sendMessage(chatId, message, telegramService.removeKeyboard());
        } catch (Exception e) {
            log.error("Tasdiqlash kodini yuborishda xatolik: {}", e.getMessage());
            telegramService.sendMessage(
                    chatId,
                    "✅ Telefon tasdiqlandi: " + phone + "\n\nEndi veb-saytga qaytib, \"Kod yuborish\" tugmasini qayta bosing.",
                    telegramService.removeKeyboard()
            );
        }
    }

    private void sendHelp(Long chatId) {
        String help = """
                <b>Jalyuzi ERP Bot</b>

                Quyidagi komandalardan foydalaning:

                /buyurtmalarim — oxirgi buyurtmalar va holati
                /qarzlarim — qarz balansingiz
                /profil — sizning ma'lumotlaringiz
                /shikoyat — kafolat shikoyati uchun yo'riqnoma

                /start — boshlash
                /help — yordam""";
        telegramService.sendMessage(chatId, help);
    }

    private void sendDefault(Long chatId) {
        telegramService.sendMessage(
                chatId,
                "Buyruqni tushunmadim. /start yoki /help deb yozing.",
                telegramService.requestContactKeyboard("📱 Telefon raqamni ulashish")
        );
    }

    /**
     * Telefon raqamni standart formatga keltirish
     */
    private String normalizePhone(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() == 12 && digits.startsWith("998")) {
            return "+" + digits;
        }
        if (digits.length() == 9) {
            return "+998" + digits;
        }
        return "+" + digits;
    }
}
