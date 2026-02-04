package uz.jalyuziepr.api.dto.shop;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.enums.PaymentMethod;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Buyurtma yaratish uchun so'rov
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderRequest {

    @NotEmpty(message = "Mahsulotlar ro'yxati bo'sh bo'lmasligi kerak")
    @Valid
    private List<ShopOrderItemRequest> items;

    // Mijoz ma'lumotlari (autentifikatsiya qilinmagan bo'lsa)
    @Size(max = 100, message = "Ism 100 ta belgidan oshmasligi kerak")
    private String customerName;

    @Pattern(regexp = "^\\+998[0-9]{9}$", message = "Telefon raqam noto'g'ri formatda")
    private String customerPhone;

    // Yetkazib berish manzili
    @NotBlank(message = "Yetkazib berish manzili kiritilishi shart")
    @Size(max = 500, message = "Manzil 500 ta belgidan oshmasligi kerak")
    private String deliveryAddress;

    // O'rnatish xizmati
    @Builder.Default
    private boolean withInstallation = true;

    private LocalDateTime preferredInstallationDate;

    @Size(max = 1000, message = "Izoh 1000 ta belgidan oshmasligi kerak")
    private String installationNotes;

    // To'lov usuli
    @NotNull(message = "To'lov usuli tanlanishi shart")
    private PaymentMethod paymentMethod;

    @Size(max = 500, message = "Izoh 500 ta belgidan oshmasligi kerak")
    private String notes;
}
