package uz.jalyuziepr.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.dto.schema.AttributeSchema;

/**
 * Request DTO for creating or updating a product type.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductTypeRequest {

    /**
     * Unique code for the product type (uppercase, underscores allowed).
     * Example: "FINISHED_PRODUCT", "MOTORIZED_BLIND"
     */
    @NotBlank(message = "Kod kiritilishi shart")
    @Size(max = 50, message = "Kod 50 belgidan oshmasligi kerak")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Kod faqat katta harflar, raqamlar va pastki chiziqdan iborat bo'lishi kerak")
    private String code;

    /**
     * Display name for the product type.
     */
    @NotBlank(message = "Nom kiritilishi shart")
    @Size(max = 100, message = "Nom 100 belgidan oshmasligi kerak")
    private String name;

    /**
     * Description of the product type.
     */
    @Size(max = 500, message = "Tavsif 500 belgidan oshmasligi kerak")
    private String description;

    /**
     * Icon name for the UI (Lucide React icon).
     */
    @Size(max = 50, message = "Ikonka nomi 50 belgidan oshmasligi kerak")
    private String icon;

    /**
     * Color theme for the UI badge.
     */
    @Size(max = 20, message = "Rang 20 belgidan oshmasligi kerak")
    private String color;

    /**
     * Display order in the product type selection UI.
     */
    private Integer displayOrder;

    /**
     * Default unit type for products of this type.
     */
    @Size(max = 20, message = "O'lchov birligi 20 belgidan oshmasligi kerak")
    private String defaultUnitType;

    /**
     * The attribute schema defining custom fields for this product type.
     */
    @Valid
    private AttributeSchema attributeSchema;
}
