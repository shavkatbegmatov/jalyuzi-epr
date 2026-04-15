package uz.jalyuziepr.api.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Telegram bot konfiguratsiyasi
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "telegram")
public class TelegramConfig {

    private Bot bot = new Bot();

    @Data
    public static class Bot {
        /** Bot tokeni (BotFather'dan) */
        private String token;

        /** Bot username'i, `@` belgisisiz (masalan: jalyuzi_erp_bot) */
        private String username;

        /** Bot yoqilganmi */
        private boolean enabled = false;

        /** API asosiy URL */
        private String apiUrl = "https://api.telegram.org";

        /** Webhook qabul qiluvchi public URL (masalan: https://kanjaltib.uz/api/v1/telegram/webhook) */
        private String webhookUrl;

        /** Webhook secret token (header orqali yuboriladi, so'rovni tekshirish uchun) */
        private String webhookSecret;
    }
}
