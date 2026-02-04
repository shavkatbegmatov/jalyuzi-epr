package uz.jalyuziepr.api.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * SMS konfiguratsiyasi (Eskiz.uz)
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "sms")
public class SmsConfig {

    private Eskiz eskiz = new Eskiz();
    private Verification verification = new Verification();

    @Data
    public static class Eskiz {
        private String baseUrl = "https://notify.eskiz.uz/api";
        private String email;
        private String password;
        private boolean enabled = false;
    }

    @Data
    public static class Verification {
        private int codeLength = 6;
        private int expirationMinutes = 5;
        private int maxAttempts = 3;
        private int resendDelaySeconds = 60;
    }
}
