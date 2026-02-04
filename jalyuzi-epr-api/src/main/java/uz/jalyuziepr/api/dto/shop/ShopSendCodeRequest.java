package uz.jalyuziepr.api.dto.shop;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SMS kod yuborish uchun so'rov
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopSendCodeRequest {

    @NotBlank(message = "Telefon raqam kiritilishi shart")
    @Pattern(regexp = "^\\+998[0-9]{9}$", message = "Telefon raqam noto'g'ri formatda. Format: +998901234567")
    private String phone;
}
