package uz.jalyuziepr.api.dto.shop;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.enums.ControlType;

/**
 * Buyurtma elementi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderItemRequest {

    @NotNull(message = "Mahsulot ID kiritilishi shart")
    private Long productId;

    @NotNull(message = "Kenglik kiritilishi shart")
    @Min(value = 100, message = "Kenglik kamida 100mm bo'lishi kerak")
    @Max(value = 5000, message = "Kenglik 5000mm dan oshmasligi kerak")
    private Integer width; // mm

    @NotNull(message = "Balandlik kiritilishi shart")
    @Min(value = 100, message = "Balandlik kamida 100mm bo'lishi kerak")
    @Max(value = 5000, message = "Balandlik 5000mm dan oshmasligi kerak")
    private Integer height; // mm

    // Boshqaruv turi (o'zgartirilgan bo'lsa)
    private ControlType controlType;

    @NotNull(message = "Miqdor kiritilishi shart")
    @Min(value = 1, message = "Miqdor kamida 1 bo'lishi kerak")
    private Integer quantity;

    // Qo'shimcha izohlar
    @Size(max = 500, message = "Izoh 500 ta belgidan oshmasligi kerak")
    private String notes;
}
