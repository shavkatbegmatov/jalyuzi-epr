package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.dto.schema.AttributeSchema;
import uz.jalyuziepr.api.entity.ProductType;

import java.time.LocalDateTime;

/**
 * Response DTO for product type.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductTypeResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String icon;
    private String color;
    private Boolean isSystem;
    private Boolean isActive;
    private Integer displayOrder;
    private String defaultUnitType;
    private AttributeSchema attributeSchema;
    private Long productCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Convert entity to response DTO.
     */
    public static ProductTypeResponse from(ProductType entity) {
        return ProductTypeResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .icon(entity.getIcon())
                .color(entity.getColor())
                .isSystem(entity.getIsSystem())
                .isActive(entity.getIsActive())
                .displayOrder(entity.getDisplayOrder())
                .defaultUnitType(entity.getDefaultUnitType())
                .attributeSchema(entity.getAttributeSchema())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Convert entity to response DTO with product count.
     */
    public static ProductTypeResponse from(ProductType entity, Long productCount) {
        ProductTypeResponse response = from(entity);
        response.setProductCount(productCount);
        return response;
    }
}
