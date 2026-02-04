package uz.jalyuziepr.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import uz.jalyuziepr.api.config.SmsConfig;
import uz.jalyuziepr.api.entity.SmsVerification;
import uz.jalyuziepr.api.repository.SmsVerificationRepository;

import java.time.LocalDateTime;
import java.util.Random;

/**
 * SMS xizmati (Eskiz.uz integratsiyasi)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsService {

    private final SmsConfig smsConfig;
    private final SmsVerificationRepository smsVerificationRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String cachedToken = null;
    private LocalDateTime tokenExpiresAt = null;

    /**
     * Tasdiqlash kodini yaratish va yuborish
     */
    @Transactional
    public void sendVerificationCode(String phone) {
        // Rate limiting: so'nggi 1 daqiqada yuborilgan kodlar
        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusSeconds(smsConfig.getVerification().getResendDelaySeconds());
        long recentCount = smsVerificationRepository.countRecentByPhone(phone, oneMinuteAgo);

        if (recentCount > 0) {
            throw new IllegalStateException("Iltimos, " + smsConfig.getVerification().getResendDelaySeconds() + " soniya kutib turing");
        }

        // Eski tasdiqlanmagan kodlarni o'chirish
        smsVerificationRepository.deleteByPhoneAndVerifiedFalse(phone);

        // Yangi kod yaratish
        String code = generateCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(smsConfig.getVerification().getExpirationMinutes());

        // Bazaga saqlash
        SmsVerification verification = SmsVerification.builder()
                .phone(phone)
                .code(code)
                .expiresAt(expiresAt)
                .build();
        smsVerificationRepository.save(verification);

        // SMS yuborish
        String message = "Jalyuzi do'konida tasdiqlash kodingiz: " + code + ". Kod "
                + smsConfig.getVerification().getExpirationMinutes() + " daqiqa amal qiladi.";

        sendSms(phone, message);

        log.info("Tasdiqlash kodi yuborildi: {} -> {}", phone, smsConfig.getEskiz().isEnabled() ? "SMS" : "LOG");
    }

    /**
     * Kodni tekshirish
     */
    @Transactional
    public boolean verifyCode(String phone, String code) {
        SmsVerification verification = smsVerificationRepository
                .findByPhoneAndCodeAndVerifiedFalse(phone, code)
                .orElse(null);

        if (verification == null) {
            // Noto'g'ri kod - urinishni hisoblash
            SmsVerification latestVerification = smsVerificationRepository
                    .findFirstByPhoneAndVerifiedFalseOrderByCreatedAtDesc(phone)
                    .orElse(null);

            if (latestVerification != null) {
                latestVerification.incrementAttempts();
                smsVerificationRepository.save(latestVerification);

                if (latestVerification.isMaxAttemptsReached()) {
                    throw new IllegalStateException("Maksimal urinishlar soni tugadi. Yangi kod so'rang");
                }
            }
            return false;
        }

        if (verification.isExpired()) {
            throw new IllegalStateException("Tasdiqlash kodi eskirgan. Yangi kod so'rang");
        }

        if (verification.isMaxAttemptsReached()) {
            throw new IllegalStateException("Maksimal urinishlar soni tugadi. Yangi kod so'rang");
        }

        // Tasdiqlash
        verification.setVerified(true);
        smsVerificationRepository.save(verification);

        log.info("Telefon tasdiqlandi: {}", phone);
        return true;
    }

    /**
     * Telefon tasdiqlanganligini tekshirish
     */
    public boolean isPhoneVerified(String phone, String code) {
        return smsVerificationRepository
                .findByPhoneAndCodeAndVerifiedFalse(phone, code)
                .filter(v -> !v.isExpired() && !v.isMaxAttemptsReached())
                .isPresent();
    }

    /**
     * SMS yuborish (Eskiz.uz API)
     */
    private void sendSms(String phone, String message) {
        if (!smsConfig.getEskiz().isEnabled()) {
            // Test rejimi - faqat log
            log.info("SMS (test rejimi): {} -> {}", phone, message);
            return;
        }

        try {
            String token = getAuthToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBearerAuth(token);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("mobile_phone", phone.replace("+", ""));
            body.add("message", message);
            body.add("from", "4546");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    smsConfig.getEskiz().getBaseUrl() + "/message/sms/send",
                    request,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("SMS yuborildi: {}", phone);
            } else {
                log.error("SMS yuborishda xatolik: {} - {}", phone, response.getBody());
            }
        } catch (Exception e) {
            log.error("SMS yuborishda xatolik: {}", e.getMessage());
            throw new RuntimeException("SMS yuborishda xatolik yuz berdi");
        }
    }

    /**
     * Eskiz.uz API token olish
     */
    private String getAuthToken() {
        // Keshdan olish
        if (cachedToken != null && tokenExpiresAt != null && LocalDateTime.now().isBefore(tokenExpiresAt)) {
            return cachedToken;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("email", smsConfig.getEskiz().getEmail());
            body.add("password", smsConfig.getEskiz().getPassword());

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    smsConfig.getEskiz().getBaseUrl() + "/auth/login",
                    request,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                cachedToken = jsonNode.path("data").path("token").asText();
                tokenExpiresAt = LocalDateTime.now().plusHours(23); // Token 24 soat amal qiladi
                return cachedToken;
            } else {
                throw new RuntimeException("Eskiz.uz autentifikatsiya xatosi");
            }
        } catch (Exception e) {
            log.error("Eskiz.uz token olishda xatolik: {}", e.getMessage());
            throw new RuntimeException("SMS xizmati ishlamayapti");
        }
    }

    /**
     * Tasodifiy kod yaratish
     */
    private String generateCode() {
        int length = smsConfig.getVerification().getCodeLength();
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < length; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    /**
     * Eskirgan kodlarni tozalash (har soatda)
     */
    @Scheduled(fixedRate = 3600000) // 1 soat
    @Transactional
    public void cleanupExpiredCodes() {
        smsVerificationRepository.deleteExpiredAndVerified(LocalDateTime.now());
        log.debug("Eskirgan SMS kodlar tozalandi");
    }
}
