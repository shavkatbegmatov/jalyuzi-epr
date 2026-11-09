package uz.jalyuziepr.api.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import uz.jalyuziepr.api.config.TelegramConfig;
import uz.jalyuziepr.api.exception.BadRequestException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Telegram Mini App {@code initData}'sini tekshiradi.
 *
 * <p>Algoritm (core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
 * <ol>
 *   <li>data_check_string = {@code hash}'dan boshqa barcha maydonlar, kalit bo'yicha
 *       saralangan, {@code key=value} ko'rinishida, {@code \n} bilan birlashtirilgan;</li>
 *   <li>secret_key = HMAC_SHA256(key = "WebAppData", data = bot_token);</li>
 *   <li>hex(HMAC_SHA256(key = secret_key, data = data_check_string)) == hash.</li>
 * </ol>
 * Imzo faqat bot tokenini biladigan Telegram tomonidan qo'yiladi, shuning uchun
 * undagi {@code user.id}'ga ishonish mumkin. {@code auth_date} eskirgan bo'lsa rad etiladi.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TelegramInitDataValidator {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final byte[] WEB_APP_DATA_KEY = "WebAppData".getBytes(StandardCharsets.UTF_8);
    /** Telegram va server soati orasidagi kichik farqqa ruxsat (soniya) */
    private static final long CLOCK_SKEW_SECONDS = 60;

    private final TelegramConfig telegramConfig;
    private final ObjectMapper objectMapper;

    /**
     * initData'dan olingan, imzosi tasdiqlangan Telegram foydalanuvchisi.
     */
    public record TelegramWebAppUser(long id, String firstName, String lastName, String username) {
        public String displayName() {
            String name = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
            return name.isEmpty() ? (username != null ? username : String.valueOf(id)) : name;
        }
    }

    public TelegramWebAppUser validate(String initData) {
        if (initData == null || initData.isBlank()) {
            throw new BadRequestException("Telegram ma'lumotlari topilmadi. Ilovani bot orqali oching.");
        }

        String botToken = telegramConfig.getBot().getToken();
        if (botToken == null || botToken.isBlank()) {
            throw new BadRequestException("Telegram bot sozlanmagan");
        }

        Map<String, String> params = parse(initData);
        String hash = params.remove("hash");
        if (hash == null || hash.isBlank()) {
            throw new BadRequestException("Telegram ma'lumotlari yaroqsiz");
        }

        String dataCheckString = params.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("\n"));

        byte[] secretKey = hmacSha256(WEB_APP_DATA_KEY, botToken.getBytes(StandardCharsets.UTF_8));
        byte[] expected = hmacSha256(secretKey, dataCheckString.getBytes(StandardCharsets.UTF_8));

        byte[] provided;
        try {
            provided = HexFormat.of().parseHex(hash.toLowerCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Telegram ma'lumotlari yaroqsiz");
        }

        if (!MessageDigest.isEqual(expected, provided)) {
            log.warn("Telegram initData imzosi mos kelmadi");
            throw new BadRequestException("Telegram ma'lumotlari yaroqsiz");
        }

        long authDate;
        try {
            authDate = Long.parseLong(params.getOrDefault("auth_date", ""));
        } catch (NumberFormatException e) {
            throw new BadRequestException("Telegram ma'lumotlari yaroqsiz");
        }
        long now = Instant.now().getEpochSecond();
        long maxAge = telegramConfig.getBot().getInitDataMaxAgeSeconds();
        if (authDate > now + CLOCK_SKEW_SECONDS || now - authDate > maxAge) {
            throw new BadRequestException("Telegram sessiyasi eskirgan. Ilovani yopib, qayta oching.");
        }

        String userJson = params.get("user");
        if (userJson == null || userJson.isBlank()) {
            throw new BadRequestException("Telegram foydalanuvchisi aniqlanmadi");
        }

        try {
            JsonNode user = objectMapper.readTree(userJson);
            long id = user.path("id").asLong(0);
            if (id == 0) {
                throw new BadRequestException("Telegram foydalanuvchisi aniqlanmadi");
            }
            return new TelegramWebAppUser(
                    id,
                    textOrNull(user, "first_name"),
                    textOrNull(user, "last_name"),
                    textOrNull(user, "username")
            );
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Telegram foydalanuvchisi aniqlanmadi");
        }
    }

    private static Map<String, String> parse(String initData) {
        Map<String, String> params = new HashMap<>();
        for (String pair : initData.split("&")) {
            if (pair.isEmpty()) continue;
            int idx = pair.indexOf('=');
            String key = idx >= 0 ? pair.substring(0, idx) : pair;
            String value = idx >= 0 ? pair.substring(idx + 1) : "";
            params.put(
                    URLDecoder.decode(key, StandardCharsets.UTF_8),
                    URLDecoder.decode(value, StandardCharsets.UTF_8)
            );
        }
        return params;
    }

    private static byte[] hmacSha256(byte[] key, byte[] data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(key, HMAC_ALGORITHM));
            return mac.doFinal(data);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC-SHA256 hisoblab bo'lmadi", e);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v == null || v.isNull() ? null : v.asText();
    }
}
