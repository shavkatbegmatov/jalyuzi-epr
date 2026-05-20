package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionMaterialRequest {

    @NotNull(message = "Mahsulot ID kiritilishi shart")
    private Long productId;

    @DecimalMin(value = "0", message = "Rejalashtirilgan miqdor manfiy bo'la olmaydi")
    @Builder.Default
    private BigDecimal quantityPlanned = BigDecimal.ZERO;

    @DecimalMin(value = "0", message = "Sarflangan miqdor manfiy bo'la olmaydi")
    @Builder.Default
    private BigDecimal quantityUsed = BigDecimal.ZERO;

    @DecimalMin(value = "0", message = "Chiqindi miqdor manfiy bo'la olmaydi")
    @Builder.Default
    private BigDecimal quantityWasted = BigDecimal.ZERO;

    @Builder.Default
    private String unit = "METER";

    private BigDecimal unitCost;

    private String notes;
}
