package uz.jalyuziepr.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.service.TelegramBotService;
import uz.jalyuziepr.api.service.TelegramService;

@Slf4j
@RestController
@RequestMapping("/v1/telegram")
@RequiredArgsConstructor
@Tag(name = "Telegram Bot", description = "Telegram bot webhook endpoint'lari")
public class TelegramBotController {

    private static final String TG_SECRET_HEADER = "X-Telegram-Bot-Api-Secret-Token";

    private final TelegramService telegramService;
    private final TelegramBotService telegramBotService;

    /**
     * Telegram webhook endpoint.
     * Telegram serveridan kelgan Update'larni qabul qiladi.
     */
    @PostMapping("/webhook")
    @Operation(summary = "Telegram webhook", description = "Telegram serveri tomonidan chaqiriladi")
    public ResponseEntity<Void> webhook(
            @RequestBody JsonNode update,
            @RequestHeader(value = TG_SECRET_HEADER, required = false) String secretToken
    ) {
        // Secret token tekshirish (agar sozlangan bo'lsa)
        String expectedSecret = telegramService.getWebhookSecret();
        if (expectedSecret != null && !expectedSecret.isBlank()) {
            if (!expectedSecret.equals(secretToken)) {
                log.warn("Telegram webhook: noto'g'ri secret token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }

        try {
            telegramBotService.handleUpdate(update);
        } catch (Exception e) {
            // Telegram 200 OK qaytarilishini kutadi, aks holda qayta-qayta yuboradi
            log.error("Telegram update'ni qayta ishlashda xatolik: {}", e.getMessage(), e);
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Webhook'ni Telegram'ga ro'yxatdan o'tkazish (admin uchun qulaylik)
     * GET /v1/telegram/register-webhook?url=https://kanjaltib.uz/api/v1/telegram/webhook
     */
    @PostMapping("/register-webhook")
    @Operation(summary = "Webhook'ni ro'yxatdan o'tkazish")
    public ResponseEntity<String> registerWebhook(@RequestParam String url) {
        boolean ok = telegramService.setWebhook(url);
        return ok
                ? ResponseEntity.ok("Webhook o'rnatildi: " + url)
                : ResponseEntity.internalServerError().body("Webhook o'rnatishda xatolik");
    }
}
