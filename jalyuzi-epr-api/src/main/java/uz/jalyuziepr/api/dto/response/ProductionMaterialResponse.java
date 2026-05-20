package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.ProductionMaterial;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionMaterialResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private BigDecimal quantityPlanned;
    private BigDecimal quantityUsed;
    private BigDecimal quantityWasted;
    private String unit;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String notes;
    private String recordedByName;

    public static ProductionMaterialResponse from(ProductionMaterial m) {
        return ProductionMaterialResponse.builder()
                .id(m.getId())
                .productId(m.getProduct() != null ? m.getProduct().getId() : null)
                .productName(m.getProduct() != null ? m.getProduct().getName() : null)
                .productSku(m.getProduct() != null ? m.getProduct().getSku() : null)
                .quantityPlanned(m.getQuantityPlanned())
                .quantityUsed(m.getQuantityUsed())
                .quantityWasted(m.getQuantityWasted())
                .unit(m.getUnit())
                .unitCost(m.getUnitCost())
                .totalCost(m.getTotalCost())
                .notes(m.getNotes())
                .recordedByName(m.getRecordedBy() != null ? m.getRecordedBy().getFullName() : null)
                .build();
    }
}
