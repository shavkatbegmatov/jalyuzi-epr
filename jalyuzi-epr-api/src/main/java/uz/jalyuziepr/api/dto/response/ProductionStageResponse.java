package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.ProductionStage;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionStageResponse {
    private Long id;
    private String code;
    private String name;
    private Integer sequence;
    private String color;
    private Integer estimatedMinutes;
    private Boolean requiresQa;
    private Boolean isActive;

    public static ProductionStageResponse from(ProductionStage s) {
        if (s == null) return null;
        return ProductionStageResponse.builder()
                .id(s.getId())
                .code(s.getCode())
                .name(s.getName())
                .sequence(s.getSequence())
                .color(s.getColor())
                .estimatedMinutes(s.getEstimatedMinutes())
                .requiresQa(s.getRequiresQa())
                .isActive(s.getIsActive())
                .build();
    }
}
