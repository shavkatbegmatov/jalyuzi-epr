package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import uz.jalyuziepr.api.entity.base.BaseEntity;

import java.math.BigDecimal;

/**
 * Bir production order uchun rejalashtirilgan va sarflangan materiallar.
 * quantity_planned — rejalashtirilgan
 * quantity_used    — haqiqatda sarflangan
 * quantity_wasted  — chiqindi/brak
 */
@Entity
@Table(name = "production_materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionMaterial extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_order_id", nullable = false)
    @JsonIgnore
    private ProductionOrder productionOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity_planned", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantityPlanned = BigDecimal.ZERO;

    @Column(name = "quantity_used", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantityUsed = BigDecimal.ZERO;

    @Column(name = "quantity_wasted", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantityWasted = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String unit = "METER";

    @Column(name = "unit_cost", precision = 15, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "total_cost", precision = 15, scale = 2)
    private BigDecimal totalCost;

    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;
}
