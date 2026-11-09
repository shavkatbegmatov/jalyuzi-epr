package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Xodimlar Mini App'i haqida ommaviy ma'lumot (profil sahifasidagi "Telegram" kartasi uchun).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelegramStaffInfoResponse {
    private boolean enabled;
    private String botUsername;
    /** Botni xodim rejimida ochadigan havola: https://t.me/BOT?start=xodim */
    private String startLink;
    private String webAppUrl;
}
