package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "sale_items")
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleItem extends BaseEntity implements Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "total_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPrice;

    // Maxsus o'lcham maydonlari (jalyuzi uchun)
    @Column(name = "custom_width")
    private Integer customWidth;  // mm

    @Column(name = "custom_height")
    private Integer customHeight;  // mm

    @Column(name = "calculated_sqm", precision = 10, scale = 4)
    private BigDecimal calculatedSqm;

    @Column(name = "calculated_price", precision = 15, scale = 2)
    private BigDecimal calculatedPrice;

    @Column(name = "installation_included")
    @Builder.Default
    private Boolean installationIncluded = false;

    // ============================================
    // Auditable Interface Implementation
    // ============================================

    @Override
    public String getEntityName() {
        return "SaleItem";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("quantity", this.quantity);
        map.put("unitPrice", this.unitPrice);
        map.put("discount", this.discount);
        map.put("totalPrice", this.totalPrice);
        map.put("customWidth", this.customWidth);
        map.put("customHeight", this.customHeight);
        map.put("calculatedSqm", this.calculatedSqm);
        map.put("calculatedPrice", this.calculatedPrice);
        map.put("installationIncluded", this.installationIncluded);

        // Avoid lazy loading
        if (this.sale != null) {
            map.put("saleId", this.sale.getId());
        }
        if (this.product != null) {
            map.put("productId", this.product.getId());
        }

        return map;
    }

    @Override
    public Set<String> getSensitiveFields() {
        return Set.of(); // No sensitive fields
    }
}
