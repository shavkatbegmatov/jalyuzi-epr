package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.dto.schema.AttributeSchema;
import uz.jalyuziepr.api.entity.base.BaseEntity;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Entity representing a product type with its attribute schema.
 * <p>
 * Product types define the structure and attributes available for products.
 * Each type has a JSONB schema that describes the custom attributes,
 * their data types, validation rules, and UI hints.
 * <p>
 * System types (isSystem=true) are created during migration and cannot be deleted.
 * Custom types can be created by admins to support new product categories.
 */
@Entity
@Table(name = "product_types", indexes = {
        @Index(name = "idx_product_types_code", columnList = "code"),
        @Index(name = "idx_product_types_active", columnList = "is_active")
})
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductType extends BaseEntity implements Auditable {

    /**
     * Unique code for the product type.
     * Used in API and for programmatic access.
     * Example: "FINISHED_PRODUCT", "RAW_MATERIAL", "MOTORIZED_BLIND"
     */
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /**
     * Display name for the product type.
     * Example: "Tayyor Jalyuzi", "Xomashyo"
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Description of the product type.
     */
    @Column(length = 500)
    private String description;

    /**
     * Icon name for the UI (Lucide React icon).
     * Example: "Blinds", "Layers", "Wrench"
     */
    @Column(length = 50)
    private String icon;

    /**
     * Color theme for the UI badge.
     * Values: "primary", "secondary", "accent", "info", "success", "warning", "error"
     */
    @Column(length = 20)
    private String color;

    /**
     * Whether this is a system-defined type (cannot be deleted).
     */
    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    /**
     * Whether this type is active and available for new products.
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Display order in the product type selection UI.
     */
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * Default unit type for products of this type.
     * Example: "PIECE", "METER", "SQUARE_METER"
     */
    @Column(name = "default_unit_type", length = 20)
    private String defaultUnitType;

    /**
     * The attribute schema defining custom fields for this product type.
     * Stored as JSONB in PostgreSQL.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attribute_schema", columnDefinition = "jsonb")
    @Builder.Default
    private AttributeSchema attributeSchema = new AttributeSchema();

    /**
     * User who created this product type.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // ============================================
    // Auditable Interface Implementation
    // ============================================

    @Override
    public String getEntityName() {
        return "ProductType";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("code", this.code);
        map.put("name", this.name);
        map.put("description", this.description);
        map.put("icon", this.icon);
        map.put("color", this.color);
        map.put("isSystem", this.isSystem);
        map.put("isActive", this.isActive);
        map.put("displayOrder", this.displayOrder);
        map.put("defaultUnitType", this.defaultUnitType);
        map.put("attributeSchema", this.attributeSchema);

        if (this.createdBy != null) {
            map.put("createdById", this.createdBy.getId());
        }

        return map;
    }

    @Override
    public Set<String> getSensitiveFields() {
        return Set.of(); // No sensitive fields
    }
}
