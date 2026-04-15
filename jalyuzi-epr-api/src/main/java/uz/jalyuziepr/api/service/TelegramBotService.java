package uz.jalyuziepr.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.entity.Customer;
import uz.jalyuziepr.api.entity.TelegramPhoneLink;
import uz.jalyuziepr.api.repository.CustomerRepository;
import uz.jalyuziepr.api.repository.TelegramPhoneLinkRepository;

import java.time.LocalDateTime;
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

    private static final String VERIFY_PAYLOAD_PREFIX = "verify_";

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
        if (text.startsWith("/start")) {
            handleStart(chatId, text);
        } else if (text.equalsIgnoreCase("/help")) {
            sendHelp(chatId);
        } else {
            sendDefault(chatId);
        }
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

                Bu bot sizga quyidagilarda yordam beradi:
                • Veb-saytda ro'yxatdan o'tish va kirish uchun tasdiqlash kodi
                • Buyurtma statuslari haqida xabarlar (tez orada)

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
