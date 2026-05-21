package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.entity.*;
import uz.jalyuziepr.api.enums.OnlinePaymentProvider;
import uz.jalyuziepr.api.enums.OnlinePaymentStatus;
import uz.jalyuziepr.api.enums.OrderPaymentType;
import uz.jalyuziepr.api.enums.PaymentMethod;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.repository.*;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Click va Payme webhook'larini qayta ishlash xizmati.
 *
 * Hozircha skelet: real integratsiya uchun signature validation,
 * Click PREPARE/COMPLETE state machine, Payme JSON-RPC method handler'lari
 * to'liq amalga oshirilishi kerak. Lekin idempotency, schema va asosiy
 * flow tayyor — qaysi merchant kabineti sozlangach darrov to'g'rilash mumkin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OnlinePaymentService {

    private final OnlinePaymentRepository onlinePaymentRepository;
    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final PaymentScheduleService paymentScheduleService;

    @Value("${payment.click.secret-key:}")
    private String clickSecretKey;

    @Value("${payment.click.service-id:}")
    private String clickServiceId;

    @Value("${payment.payme.key:}")
    private String paymeKey;

    // ==================== CLICK ====================

    @Transactional
    public Map<String, Object> handleClickWebhook(Map<String, Object> payload) {
        String action = String.valueOf(payload.get("action"));
        String clickTransId = String.valueOf(payload.get("click_trans_id"));
        String merchantTransId = String.valueOf(payload.get("merchant_trans_id"));

        // Signature validation: Click MD5 protocol
        if (!validateClickSignature(payload, action)) {
            log.warn("Click signature validation failed for trans {}", clickTransId);
            Map<String, Object> error = new HashMap<>();
            error.put("error", -1);
            error.put("error_note", "SIGN CHECK FAILED!");
            return error;
        }

        // Idempotency: agar bu transaction allaqachon qayta ishlanmagan bo'lsa
        boolean exists = onlinePaymentRepository.existsByProviderAndProviderTransactionId(
                OnlinePaymentProvider.CLICK, clickTransId);

        Order order = parseOrderFromMerchantTransId(merchantTransId);
        BigDecimal amount = new BigDecimal(String.valueOf(payload.get("amount")));

        if (!exists) {
            OnlinePayment record = OnlinePayment.builder()
                    .provider(OnlinePaymentProvider.CLICK)
                    .providerTransactionId(clickTransId)
                    .order(order)
                    .amount(amount)
                    .status(OnlinePaymentStatus.PENDING)
                    .rawRequest(payload.toString())
                    .build();
            onlinePaymentRepository.save(record);
        }

        Map<String, Object> response = new HashMap<>();
        if ("0".equals(action)) {
            // PREPARE
            response.put("click_trans_id", clickTransId);
            response.put("merchant_trans_id", merchantTransId);
            response.put("merchant_prepare_id", clickTransId);
            response.put("error", 0);
            response.put("error_note", "Success");
        } else if ("1".equals(action)) {
            // COMPLETE
            completeOnlinePayment(OnlinePaymentProvider.CLICK, clickTransId, order, amount);
            response.put("click_trans_id", clickTransId);
            response.put("merchant_trans_id", merchantTransId);
            response.put("merchant_confirm_id", clickTransId);
            response.put("error", 0);
            response.put("error_note", "Success");
        } else {
            response.put("error", -3);
            response.put("error_note", "Action not found");
        }
        return response;
    }

    // ==================== PAYME ====================

    @Transactional
    public Map<String, Object> handlePaymeWebhook(String authHeader, Map<String, Object> payload) {
        if (!validatePaymeAuth(authHeader)) {
            log.warn("Payme auth validation failed");
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("code", -32504);
            errorBody.put("message", Map.of("uz", "Auth xato", "ru", "Auth ошибка", "en", "Auth failed"));
            Map<String, Object> errorResp = new HashMap<>();
            errorResp.put("jsonrpc", "2.0");
            errorResp.put("id", payload.get("id"));
            errorResp.put("error", errorBody);
            return errorResp;
        }
        String method = String.valueOf(payload.get("method"));
        @SuppressWarnings("unchecked")
        Map<String, Object> params = (Map<String, Object>) payload.get("params");

        Map<String, Object> result = new HashMap<>();
        switch (method) {
            case "CheckPerformTransaction" -> result.put("allow", true);
            case "CreateTransaction" -> {
                String txId = String.valueOf(params.get("id"));
                BigDecimal amount = new BigDecimal(String.valueOf(params.get("amount")));
                // Payme summa tiyin, biz so'mga aylantiramiz
                BigDecimal amountSom = amount.divide(BigDecimal.valueOf(100));

                String accountStr = params.get("account") != null ? params.get("account").toString() : "";
                Order order = parseOrderFromAccount(accountStr);

                if (!onlinePaymentRepository.existsByProviderAndProviderTransactionId(
                        OnlinePaymentProvider.PAYME, txId)) {
                    OnlinePayment record = OnlinePayment.builder()
                            .provider(OnlinePaymentProvider.PAYME)
                            .providerTransactionId(txId)
                            .order(order)
                            .amount(amountSom)
                            .status(OnlinePaymentStatus.PENDING)
                            .rawRequest(payload.toString())
                            .build();
                    onlinePaymentRepository.save(record);
                }

                result.put("create_time", System.currentTimeMillis());
                result.put("transaction", txId);
                result.put("state", 1);
            }
            case "PerformTransaction" -> {
                String txId = String.valueOf(params.get("id"));
                OnlinePayment record = onlinePaymentRepository
                        .findByProviderAndProviderTransactionId(OnlinePaymentProvider.PAYME, txId)
                        .orElseThrow(() -> new BadRequestException("Transaction not found"));

                completeOnlinePayment(OnlinePaymentProvider.PAYME, txId, record.getOrder(), record.getAmount());
                result.put("perform_time", System.currentTimeMillis());
                result.put("transaction", txId);
                result.put("state", 2);
            }
            case "CancelTransaction" -> {
                String txId = String.valueOf(params.get("id"));
                onlinePaymentRepository
                        .findByProviderAndProviderTransactionId(OnlinePaymentProvider.PAYME, txId)
                        .ifPresent(r -> {
                            r.setStatus(OnlinePaymentStatus.CANCELLED);
                            onlinePaymentRepository.save(r);
                        });
                result.put("cancel_time", System.currentTimeMillis());
                result.put("transaction", txId);
                result.put("state", -1);
            }
            default -> throw new BadRequestException("Unknown method: " + method);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("jsonrpc", "2.0");
        response.put("id", payload.get("id"));
        response.put("result", result);
        return response;
    }

    // ==================== SHARED ====================

    @Transactional
    protected void completeOnlinePayment(OnlinePaymentProvider provider, String txId, Order order, BigDecimal amount) {
        if (order == null) {
            log.warn("Online payment {} for unknown order — skipping order_payments creation", txId);
            return;
        }

        OnlinePayment record = onlinePaymentRepository
                .findByProviderAndProviderTransactionId(provider, txId)
                .orElseThrow(() -> new BadRequestException("Online payment not found"));

        if (record.getStatus() == OnlinePaymentStatus.COMPLETED) {
            log.info("Online payment {} already completed — idempotent return", txId);
            return;
        }

        // OrderPayment yaratish va schedule yangilash
        OrderPayment payment = OrderPayment.builder()
                .order(order)
                .paymentType(OrderPaymentType.PARTIAL_PAYMENT)
                .amount(amount)
                .paymentMethod(PaymentMethod.TRANSFER)
                .isConfirmed(true)
                .notes(provider.name() + " orqali onlayn to'lov: " + txId)
                .build();
        orderPaymentRepository.save(payment);

        record.setStatus(OnlinePaymentStatus.COMPLETED);
        record.setCompletedAt(LocalDateTime.now());
        record.setPayment(payment);
        onlinePaymentRepository.save(record);

        // Order paid_amount yangilash
        BigDecimal newPaid = (order.getPaidAmount() != null ? order.getPaidAmount() : BigDecimal.ZERO).add(amount);
        order.setPaidAmount(newPaid);
        order.setRemainingAmount(order.getTotalAmount().subtract(newPaid).max(BigDecimal.ZERO));
        orderRepository.save(order);

        // Schedule yangilash
        try {
            paymentScheduleService.applyPayment(order.getId(), payment);
        } catch (Exception e) {
            log.warn("Schedule apply failed for online payment: {}", e.getMessage());
        }

        log.info("{} online payment completed: {} {} for order {}",
                provider, txId, amount, order.getOrderNumber());
    }

    // ==================== SECURITY ====================

    /**
     * Click signature validation.
     * PREPARE  (action=0): MD5(click_trans_id + service_id + SECRET + merchant_trans_id + amount + action + sign_time)
     * COMPLETE (action=1): MD5(click_trans_id + service_id + SECRET + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
     */
    private boolean validateClickSignature(Map<String, Object> payload, String action) {
        if (clickSecretKey == null || clickSecretKey.isBlank()) {
            log.warn("Click secret key not configured — webhook accepted without signature check");
            return true;
        }

        Object received = payload.get("sign_string");
        if (received == null) {
            return false;
        }

        StringBuilder sb = new StringBuilder();
        sb.append(payload.get("click_trans_id"));
        sb.append(payload.getOrDefault("service_id", clickServiceId));
        sb.append(clickSecretKey);
        sb.append(payload.get("merchant_trans_id"));
        if ("1".equals(action)) {
            sb.append(payload.getOrDefault("merchant_prepare_id", ""));
        }
        sb.append(payload.get("amount"));
        sb.append(action);
        sb.append(payload.get("sign_time"));

        return md5(sb.toString()).equalsIgnoreCase(String.valueOf(received));
    }

    /**
     * Payme Basic Auth: Authorization: Basic base64("Paycom:" + key)
     * yoki "merchant_id:key" (eski hujjatlar)
     */
    private boolean validatePaymeAuth(String authHeader) {
        if (paymeKey == null || paymeKey.isBlank()) {
            log.warn("Payme key not configured — webhook accepted without auth check");
            return true;
        }
        if (authHeader == null || !authHeader.startsWith("Basic ")) {
            return false;
        }
        try {
            String token = authHeader.substring(6).trim();
            String decoded = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
            int colonIdx = decoded.indexOf(':');
            if (colonIdx < 0) return false;
            return paymeKey.equals(decoded.substring(colonIdx + 1));
        } catch (Exception e) {
            log.warn("Payme auth decode failed: {}", e.getMessage());
            return false;
        }
    }

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("MD5 failed", e);
        }
    }

    private Order parseOrderFromMerchantTransId(String merchantTransId) {
        // Format: "ORDER-{id}" yoki shunchaki "{id}"
        if (merchantTransId == null) return null;
        try {
            String idStr = merchantTransId.replace("ORDER-", "").trim();
            Long id = Long.parseLong(idStr);
            return orderRepository.findById(id).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Order parseOrderFromAccount(String accountStr) {
        // Payme account format: ko'pincha {"order_id": "..."} yoki order ID number
        return parseOrderFromMerchantTransId(accountStr);
    }
}
