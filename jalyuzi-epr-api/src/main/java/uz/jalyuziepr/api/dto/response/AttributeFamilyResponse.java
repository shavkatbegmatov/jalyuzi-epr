package uz.jalyuziepr.api.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.dto.schema.AttributeOverride;
import uz.jalyuziepr.api.dto.schema.AttributeSchema;
import uz.jalyuziepr.api.entity.AttributeFamily;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for an attribute family node. Children/leaf/productCount are
 * populated by the service (tree assembled in-memory to avoid N+1).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttributeFamilyResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String icon;
    private String color;
    private Long parentId;
    private String parentName;
    private Long productTypeId;
    private String productTypeCode;
    private String productTypeName;
    private Integer depth;
    private Boolean isSystem;
    private Boolean isActive;
    private Integer displayOrder;

    /** Computed: true when the node has no active children. */
    private Boolean leaf;

    /** Number of products on this node (set on single fetch). */
    private Long productCount;

    private AttributeSchema attributeSchema;
    private List<AttributeOverride> overrides;

    private List<AttributeFamilyResponse> children;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Map scalar fields. Children/leaf/productCount are set by the service.
     */
    public static AttributeFamilyResponse from(AttributeFamily e) {
        AttributeFamilyResponse.AttributeFamilyResponseBuilder b = AttributeFamilyResponse.builder()
                .id(e.getId())
                .code(e.getCode())
                .name(e.getName())
                .description(e.getDescription())
                .icon(e.getIcon())
                .color(e.getColor())
                .depth(e.getDepth())
                .isSystem(e.getIsSystem())
                .isActive(e.getIsActive())
                .displayOrder(e.getDisplayOrder())
                .attributeSchema(e.getAttributeSchema())
                .overrides(e.getOverrides())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt());

        if (e.getParent() != null) {
            b.parentId(e.getParent().getId());
            b.parentName(e.getParent().getName());
        }
        if (e.getProductType() != null) {
            b.productTypeId(e.getProductType().getId());
            b.productTypeCode(e.getProductType().getCode());
            b.productTypeName(e.getProductType().getName());
        }
        return b.build();
    }
}
