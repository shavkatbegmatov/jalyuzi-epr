package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Telegram Mini App'dan kelgan xom initData ({@code Telegram.WebApp.initData}).
 */
@Data
public class TelegramWebAppAuthRequest {

    @NotBlank(message = "initData bo'sh bo'lmasligi kerak")
    @Size(max = 8192, message = "initData juda uzun")
    private String initData;
}
