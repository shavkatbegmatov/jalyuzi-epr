package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.enums.BlindMaterial;
import uz.jalyuziepr.api.enums.BlindType;
import uz.jalyuziepr.api.enums.ControlType;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "SKU kiritilishi shart")
    @Size(max = 50, message = "SKU 50 ta belgidan oshmasligi kerak")
    private String sku;

    @NotBlank(message = "Nomi kiritilishi shart")
    @Size(max = 200, message = "Nomi 200 ta belgidan oshmasligi kerak")
    private String name;

    private Long brandId;
    private Long categoryId;

    // Jalyuzi xususiyatlari
    private BlindType blindType;
    private BlindMaterial material;

    @Size(max = 50, message = "Rang 50 ta belgidan oshmasligi kerak")
    private String color;

    private ControlType controlType;

    // O'lcham cheklovlari (mm)
    @Min(value = 100, message = "Minimal kenglik kamida 100 mm bo'lishi kerak")
    private Integer minWidth;

    @Max(value = 5000, message = "Maksimal kenglik 5000 mm dan oshmasligi kerak")
    private Integer maxWidth;

    @Min(value = 100, message = "Minimal balandlik kamida 100 mm bo'lishi kerak")
    private Integer minHeight;

    @Max(value = 5000, message = "Maksimal balandlik 5000 mm dan oshmasligi kerak")
    private Integer maxHeight;

    // Narxlar
    @DecimalMin(value = "0", message = "Sotib olish narxi manfiy bo'lmasligi kerak")
    private BigDecimal purchasePrice;

    @NotNull(message = "Sotish narxi kiritilishi shart")
    @DecimalMin(value = "0.01", message = "Sotish narxi musbat bo'lishi kerak")
    private BigDecimal sellingPrice;

    @DecimalMin(value = "0", message = "Kvadrat metr narxi manfiy bo'lmasligi kerak")
    private BigDecimal pricePerSquareMeter;

    @DecimalMin(value = "0", message = "O'rnatish narxi manfiy bo'lmasligi kerak")
    private BigDecimal installationPrice;

    @Min(value = 0, message = "Miqdor manfiy bo'lmasligi kerak")
    @Builder.Default
    private Integer quantity = 0;

    @Min(value = 0, message = "Minimal zaxira manfiy bo'lmasligi kerak")
    @Builder.Default
    private Integer minStockLevel = 5;

    private String description;
    private String imageUrl;
}
