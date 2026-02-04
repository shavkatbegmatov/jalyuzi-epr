package uz.jalyuziepr.api.dto.shop;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Mijoz ro'yxatdan o'tishi uchun so'rov
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopRegisterRequest {

    @NotBlank(message = "Telefon raqam kiritilishi shart")
    @Pattern(regexp = "^\\+998[0-9]{9}$", message = "Telefon raqam noto'g'ri formatda")
    private String phone;

    @NotBlank(message = "Tasdiqlash kodi kiritilishi shart")
    @Size(min = 6, max = 6, message = "Tasdiqlash kodi 6 ta raqamdan iborat bo'lishi kerak")
    private String code;

    @NotBlank(message = "To'liq ism kiritilishi shart")
    @Size(min = 2, max = 150, message = "To'liq ism 2 dan 150 ta belgigacha bo'lishi kerak")
    private String fullName;

    @Size(max = 500, message = "Manzil 500 ta belgidan oshmasligi kerak")
    private String address;
}
