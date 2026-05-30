package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.dto.schema.AttributeOverride;
import uz.jalyuziepr.api.dto.schema.AttributeSchema;
import uz.jalyuziepr.api.entity.base.BaseEntity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * A node in the hierarchical "attribute family" tree.
 * <p>
 * Each node carries only its DELTA:
 * <ul>
 *   <li>{@link #attributeSchema} — groups and attributes FIRST declared on this node (own).</li>
 *   <li>{@link #overrides} — sparse property-level overrides applied to attributes inherited
 *       from ancestors.</li>
 * </ul>
 * The effective schema for a leaf is computed by {@code AttributeSchemaResolver} which merges
 * the root-to-leaf chain property-by-property (CSS-style cascade). Products are created against
 * a LEAF node (a node with no active children).
 */
@Entity
@Table(name = "attribute_families", indexes = {
        @Index(name = "idx_attribute_families_code", columnList = "code"),
        @Index(name = "idx_attribute_families_parent", columnList = "parent_id"),
        @Index(name = "idx_attribute_families_active", columnList = "is_active"),
        @Index(name = "idx_attribute_families_product_type", columnList = "product_type_id")
})
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeFamily extends BaseEntity implements Auditable {

    /**
     * Unique code (UPPER_SNAKE). Example: "BASE_PRODUCT", "ROLLER_BLIND".
     */
    @Column(nullable = false, unique = true, length = 80)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String icon;

    @Column(length = 20)
    private String color;

    /**
     * Parent node (self-reference). Null for roots.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private AttributeFamily parent;

    /**
     * Child nodes. No cascade — deletion is guarded in the service layer.
     */
    @OneToMany(mappedBy = "parent")
    @OrderBy("displayOrder ASC, id ASC")
    @Builder.Default
    private List<AttributeFamily> children = new ArrayList<>();

    /**
     * Optional link to the legacy {@link ProductType} (usually only on root nodes),
     * used to keep {@code Product.productTypeEntity} populated for back-compat.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_type_id")
    private ProductType productType;

    /**
     * Own delta: groups + attributes first declared on THIS node (JSONB).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attribute_schema", columnDefinition = "jsonb")
    @Builder.Default
    private AttributeSchema attributeSchema = new AttributeSchema();

    /**
     * Sparse property-level overrides applied to inherited attributes (JSONB).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "overrides", columnDefinition = "jsonb")
    @Builder.Default
    private List<AttributeOverride> overrides = new ArrayList<>();

    /**
     * Denormalized depth (root = 0). Used for cycle/depth guards and ordering.
     */
    @Column(name = "depth", nullable = false)
    @Builder.Default
    private Integer depth = 0;

    /**
     * Materialized path of ancestor ids, e.g. "/1/4/9/". Enables cheap ancestor
     * loading and cycle detection without recursive queries.
     */
    @Column(name = "path", length = 500)
    private String path;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // ============================================
    // Auditable
    // ============================================

    @Override
    public String getEntityName() {
        return "AttributeFamily";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("code", this.code);
        map.put("name", this.name);
        map.put("depth", this.depth);
        map.put("isSystem", this.isSystem);
        map.put("isActive", this.isActive);
        map.put("displayOrder", this.displayOrder);
        map.put("attributeSchema", this.attributeSchema);
        map.put("overrides", this.overrides);
        if (this.parent != null) {
            map.put("parentId", this.parent.getId());
        }
        if (this.productType != null) {
            map.put("productTypeId", this.productType.getId());
        }
        if (this.children != null) {
            map.put("childrenCount", this.children.size());
        }
        return map;
    }

    @Override
    public Set<String> getSensitiveFields() {
        return Set.of();
    }
}
