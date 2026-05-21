package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.service.OnlinePaymentService;

import java.util.HashMap;
import java.util.Map;

/**
 * Click va Payme to'lov tizimlari webhook'lari.
 *
 * MUHIM: Endpoint'lar deploy qilingach Click/Payme merchant kabinetida
 * sozlanishi kerak. Merchant kalitlari yo'q ekan, webhook'lar 503 qaytaradi
 * (provider'lar buni "vaqtincha o'chirilgan" deb tushunadi va keyinroq qayta yuboradi).
 *
 * To'liq integratsiya uchun zaruriy env variables:
 *   CLICK_MERCHANT_ID, CLICK_SERVICE_ID, CLICK_SECRET_KEY
 *   PAYME_MERCHANT_ID, PAYME_KEY
 */
@RestController
@RequestMapping("/v1/webhooks/payment")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Webhooks", description = "Click va Payme to'lov webhook'lari")
public class PaymentWebhookController {

    private final OnlinePaymentService onlinePaymentService;

    @Value("${payment.click.enabled:false}")
    private boolean clickEnabled;

    @Value("${payment.payme.enabled:false}")
    private boolean paymeEnabled;

    /**
     * Click webhook: PREPARE va COMPLETE bosqichlari.
     * Real format: https://docs.click.uz/click-api-shop-protocol/
     */
    @PostMapping("/click")
    @Operation(summary = "Click webhook (Prepare/Complete)")
    public ResponseEntity<Map<String, Object>> clickWebhook(@RequestBody Map<String, Object> payload) {
        log.info("Click webhook received: {}", payload);

        if (!clickEnabled) {
            log.warn("Click is not enabled (CLICK_* env vars missing)");
            return ResponseEntity.status(503).body(Map.of(
                    "error", -9,
                    "error_note", "Service temporarily unavailable"
            ));
        }

        try {
            Map<String, Object> response = onlinePaymentService.handleClickWebhook(payload);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Click webhook failed", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", -9);
            error.put("error_note", e.getMessage());
            return ResponseEntity.ok(error);
        }
    }

    /**
     * Payme webhook: CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction.
     * Real format: https://developer.help.paycom.uz/protokol-merchant-api/
     */
    @PostMapping("/payme")
    @Operation(summary = "Payme webhook (JSON-RPC)")
    public ResponseEntity<Map<String, Object>> paymeWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> payload) {
        log.info("Payme webhook received: method={}", payload.get("method"));

        if (!paymeEnabled) {
            log.warn("Payme is not enabled (PAYME_* env vars missing)");
            return ResponseEntity.ok(jsonRpcError(payload, -32504, "Service unavailable"));
        }

        try {
            Map<String, Object> response = onlinePaymentService.handlePaymeWebhook(authHeader, payload);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Payme webhook failed", e);
            return ResponseEntity.ok(jsonRpcError(payload, -32400, e.getMessage()));
        }
    }

    private Map<String, Object> jsonRpcError(Map<String, Object> req, int code, String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("code", code);
        error.put("message", Map.of("uz", message, "ru", message, "en", message));
        Map<String, Object> response = new HashMap<>();
        response.put("jsonrpc", "2.0");
        response.put("id", req.get("id"));
        response.put("error", error);
        return response;
    }
}
