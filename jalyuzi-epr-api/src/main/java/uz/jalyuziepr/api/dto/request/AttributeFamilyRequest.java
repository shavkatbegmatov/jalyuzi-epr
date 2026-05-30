package uz.jalyuziepr.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.dto.schema.AttributeOverride;
import uz.jalyuziepr.api.dto.schema.AttributeSchema;

import java.util.List;

/**
 * Request DTO for creating/updating an attribute family node.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeFamilyRequest {

    @NotBlank(message = "Kod kiritilishi shart")
    @Size(max = 80, message = "Kod 80 belgidan oshmasligi kerak")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Kod faqat katta harflar, raqamlar va pastki chiziqdan iborat bo'lishi kerak")
    private String code;

    @NotBlank(message = "Nom kiritilishi shart")
    @Size(max = 120, message = "Nom 120 belgidan oshmasligi kerak")
    private String name;

    @Size(max = 500, message = "Tavsif 500 belgidan oshmasligi kerak")
    private String description;

    @Size(max = 50)
    private String icon;

    @Size(max = 20)
    private String color;

    /**
     * Parent node id; null for a root.
     */
    private Long parentId;

    /**
     * Optional link to the legacy ProductType (typically only on roots).
     */
    private Long productTypeId;

    private Integer displayOrder;

    /**
     * Own delta — groups + attributes first declared on this node.
     */
    @Valid
    private AttributeSchema attributeSchema;

    /**
     * Sparse property-level overrides applied to inherited attributes.
     */
    private List<AttributeOverride> overrides;
}
