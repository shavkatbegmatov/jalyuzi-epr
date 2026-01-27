package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;
import uz.jalyuziepr.api.enums.BlindMaterial;
import uz.jalyuziepr.api.enums.BlindType;
import uz.jalyuziepr.api.enums.ControlType;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "products")
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity implements Auditable {

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    // Jalyuzi xususiyatlari
    @Enumerated(EnumType.STRING)
    @Column(name = "blind_type", length = 20)
    private BlindType blindType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private BlindMaterial material;

    @Column(length = 50)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "control_type", length = 20)
    private ControlType controlType;

    // O'lcham cheklovlari (mm)
    @Column(name = "min_width")
    private Integer minWidth;

    @Column(name = "max_width")
    private Integer maxWidth;

    @Column(name = "min_height")
    private Integer minHeight;

    @Column(name = "max_height")
    private Integer maxHeight;

    // Kvadrat metr narxi
    @Column(name = "price_per_sqm", precision = 15, scale = 2)
    private BigDecimal pricePerSquareMeter;

    // O'rnatish narxi
    @Column(name = "installation_price", precision = 15, scale = 2)
    private BigDecimal installationPrice;

    @Column(name = "purchase_price", precision = 15, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "selling_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal sellingPrice;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(name = "min_stock_level")
    @Builder.Default
    private Integer minStockLevel = 5;

    @Column(length = 1000)
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // Helper method: o'lcham diapazoni string
    public String getSizeRangeString() {
        if (minWidth != null && maxWidth != null && minHeight != null && maxHeight != null) {
            return String.format("%d-%d x %d-%d mm", minWidth, maxWidth, minHeight, maxHeight);
        }
        return null;
    }

    // Helper method: narx hisoblash (m² bo'yicha)
    public BigDecimal calculatePrice(int widthMm, int heightMm) {
        if (pricePerSquareMeter != null) {
            BigDecimal sqm = BigDecimal.valueOf(widthMm)
                    .multiply(BigDecimal.valueOf(heightMm))
                    .divide(BigDecimal.valueOf(1_000_000), 4, java.math.RoundingMode.HALF_UP);
            return pricePerSquareMeter.multiply(sqm).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return sellingPrice;
    }

    // ============================================
    // Auditable Interface Implementation
    // ============================================

    @Override
    public String getEntityName() {
        return "Product";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("sku", this.sku);
        map.put("name", this.name);
        map.put("blindType", this.blindType);
        map.put("material", this.material);
        map.put("color", this.color);
        map.put("controlType", this.controlType);
        map.put("minWidth", this.minWidth);
        map.put("maxWidth", this.maxWidth);
        map.put("minHeight", this.minHeight);
        map.put("maxHeight", this.maxHeight);
        map.put("pricePerSquareMeter", this.pricePerSquareMeter);
        map.put("installationPrice", this.installationPrice);
        map.put("purchasePrice", this.purchasePrice);
        map.put("sellingPrice", this.sellingPrice);
        map.put("quantity", this.quantity);
        map.put("minStockLevel", this.minStockLevel);
        map.put("description", this.description);
        map.put("imageUrl", this.imageUrl);
        map.put("active", this.active);

        // Avoid lazy loading
        if (this.brand != null) {
            map.put("brandId", this.brand.getId());
        }
        if (this.category != null) {
            map.put("categoryId", this.category.getId());
        }
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
