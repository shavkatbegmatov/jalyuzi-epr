package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Telegram Mini App orqali kirish natijasi.
 * {@code linked = false} bo'lsa, Telegram akkaunt hali hech bir xodimga ulanmagan —
 * frontend bir martalik login/parol formasini ko'rsatadi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelegramLoginResponse {
    private boolean linked;
    /** linked = true bo'lsa — oddiy login javobi (tokenlar, rollar, ruxsatlar) */
    private JwtResponse auth;
    /** Telegram'dagi ism (ulanmagan holatda salomlashish uchun) */
    private String telegramName;
}
