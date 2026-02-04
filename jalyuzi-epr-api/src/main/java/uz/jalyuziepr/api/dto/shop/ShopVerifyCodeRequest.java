package uz.jalyuziepr.api.dto.shop;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SMS kodni tasdiqlash uchun so'rov
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopVerifyCodeRequest {

    @NotBlank(message = "Telefon raqam kiritilishi shart")
    @Pattern(regexp = "^\\+998[0-9]{9}$", message = "Telefon raqam noto'g'ri formatda")
    private String phone;

    @NotBlank(message = "Tasdiqlash kodi kiritilishi shart")
    @Size(min = 6, max = 6, message = "Tasdiqlash kodi 6 ta raqamdan iborat bo'lishi kerak")
    private String code;
}
