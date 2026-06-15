package uz.jalyuziepr.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import uz.jalyuziepr.api.config.TelegramConfig;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Telegram bot bilan ishlovchi xizmat.
 * Xabar yuborish, webhook sozlash, va h.k.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramService {

    private final TelegramConfig telegramConfig;
    private final RestTemplate restTemplate = buildTimeoutRestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Timeout bilan RestTemplate — Telegram API javob bermasa, so'rov cheksiz
     * osilib qolmasligi (va chaqiruvchini bloklamasligi) uchun.
     */
    private static RestTemplate buildTimeoutRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(8_000);  // ulanish: 8s
        factory.setReadTimeout(15_000);    // o'qish: 15s
        RestTemplate rt = new RestTemplate(factory);
        // Multipart matn qismlari (caption) UTF-8'da kodlanishi uchun form-konverter
        // charset'ini UTF-8'ga sozlaymiz — emoji va o'zbekcha matn buzilmasligi kerak.
        for (HttpMessageConverter<?> conv : rt.getMessageConverters()) {
            if (conv instanceof FormHttpMessageConverter formConv) {
                formConv.setCharset(StandardCharsets.UTF_8);
            }
        }
        return rt;
    }

    @PostConstruct
    public void init() {
        if (isEnabled()) {
            log.info("Telegram bot yoqildi: @{}", telegramConfig.getBot().getUsername());
        } else {
            log.info("Telegram bot o'chirilgan (TELEGRAM_BOT_ENABLED=false)");
        }
    }

    public boolean isEnabled() {
        return telegramConfig.getBot().isEnabled()
                && telegramConfig.getBot().getToken() != null
                && !telegramConfig.getBot().getToken().isBlank();
    }

    public String getBotUsername() {
        return telegramConfig.getBot().getUsername();
    }

    /**
     * Deep link'ni yaratish: https://t.me/BOT_USERNAME?start=PAYLOAD
     */
    public String buildDeepLink(String payload) {
        String username = telegramConfig.getBot().getUsername();
        if (username == null || username.isBlank()) {
            return null;
        }
        return "https://t.me/" + username + "?start=" + payload;
    }

    /**
     * Matn xabarini yuborish
     */
    public boolean sendMessage(Long chatId, String text) {
        return sendMessage(chatId, text, null);
    }

    /**
     * Matn xabarini klaviatura bilan yuborish
     */
    public boolean sendMessage(Long chatId, String text, Map<String, Object> replyMarkup) {
        if (!isEnabled()) {
            log.warn("Telegram bot o'chirilgan. Xabar yuborilmadi: chatId={}, text={}", chatId, text);
            return false;
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("chat_id", chatId);
            body.put("text", text);
            body.put("parse_mode", "HTML");
            if (replyMarkup != null) {
                body.put("reply_markup", replyMarkup);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    apiUrl("sendMessage"),
                    request,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("Telegram xabari yuborildi: chatId={}", chatId);
                return true;
            } else {
                log.error("Telegram xabarini yuborishda xatolik: {} - {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("Telegram xabarini yuborishda xatolik: chatId={}, error={}", chatId, e.getMessage());
            return false;
        }
    }

    /**
     * Hujjat (PDF, rasm va h.k.) yuborish — multipart/form-data orqali.
     * Akt-kvitansiya, faktura kabi fayllarni mijozga yuborish uchun ishlatiladi.
     */
    public boolean sendDocument(Long chatId, byte[] content, String filename, String caption) {
        if (!isEnabled()) {
            log.warn("Telegram bot o'chirilgan. Hujjat yuborilmadi: chatId={}, file={}", chatId, filename);
            return false;
        }
        if (content == null || content.length == 0) {
            log.warn("Telegram hujjati bo'sh: chatId={}, file={}", chatId, filename);
            return false;
        }

        try {
            ByteArrayResource fileResource = new ByteArrayResource(content) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("chat_id", String.valueOf(chatId));
            body.add("document", fileResource);
            if (caption != null && !caption.isBlank()) {
                // Charset form-konverterda UTF-8'ga sozlangan (buildTimeoutRestTemplate),
                // shuning uchun caption'ni oddiy matn sifatida qo'shsak bo'ladi.
                body.add("caption", caption);
                body.add("parse_mode", "HTML");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    apiUrl("sendDocument"),
                    request,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Telegram hujjati yuborildi: chatId={}, file={}", chatId, filename);
                return true;
            } else {
                log.error("Telegram hujjatini yuborishda xatolik: {} - {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("Telegram hujjatini yuborishda xatolik: chatId={}, file={}, error={}", chatId, filename, e.getMessage());
            return false;
        }
    }

    /**
     * Bitta URL-havolali inline tugma (xabar ostida bosiladigan tugma).
     */
    public Map<String, Object> inlineUrlButton(String text, String url) {
        Map<String, Object> button = new HashMap<>();
        button.put("text", text);
        button.put("url", url);
        Map<String, Object> markup = new HashMap<>();
        markup.put("inline_keyboard", new Object[][]{{button}});
        return markup;
    }

    /**
     * Klaviaturani olib tashlash
     */
    public Map<String, Object> removeKeyboard() {
        Map<String, Object> markup = new HashMap<>();
        markup.put("remove_keyboard", true);
        return markup;
    }

    /**
     * Kontakt so'rash uchun maxsus klaviatura
     */
    public Map<String, Object> requestContactKeyboard(String buttonText) {
        Map<String, Object> button = new HashMap<>();
        button.put("text", buttonText);
        button.put("request_contact", true);

        Map<String, Object> markup = new HashMap<>();
        markup.put("keyboard", new Object[][]{{button}});
        markup.put("resize_keyboard", true);
        markup.put("one_time_keyboard", true);
        return markup;
    }

    /**
     * Webhook'ni Telegram'ga ro'yxatdan o'tkazish
     */
    public boolean setWebhook(String url) {
        if (!isEnabled()) {
            log.warn("Telegram bot o'chirilgan. Webhook o'rnatilmadi");
            return false;
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("url", url);
            body.put("allowed_updates", new String[]{"message", "callback_query"});
            if (telegramConfig.getBot().getWebhookSecret() != null
                    && !telegramConfig.getBot().getWebhookSecret().isBlank()) {
                body.put("secret_token", telegramConfig.getBot().getWebhookSecret());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    apiUrl("setWebhook"),
                    request,
                    String.class
            );

            JsonNode json = objectMapper.readTree(response.getBody());
            if (json.path("ok").asBoolean()) {
                log.info("Telegram webhook o'rnatildi: {}", url);
                return true;
            } else {
                log.error("Telegram webhook o'rnatishda xatolik: {}", response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("Telegram webhook o'rnatishda xatolik: {}", e.getMessage());
            return false;
        }
    }

    public String getWebhookSecret() {
        return telegramConfig.getBot().getWebhookSecret();
    }

    private String apiUrl(String method) {
        return telegramConfig.getBot().getApiUrl()
                + "/bot" + telegramConfig.getBot().getToken()
                + "/" + method;
    }
}
