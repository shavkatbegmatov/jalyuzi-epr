package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.ProductionStageHistory;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionStageHistoryResponse {
    private Long id;
    private Long stageId;
    private String stageName;
    private String stageColor;
    private Long workerId;
    private String workerName;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer durationMinutes;
    private String notes;
    private String defectReason;

    public static ProductionStageHistoryResponse from(ProductionStageHistory h) {
        return ProductionStageHistoryResponse.builder()
                .id(h.getId())
                .stageId(h.getStage() != null ? h.getStage().getId() : null)
                .stageName(h.getStage() != null ? h.getStage().getName() : null)
                .stageColor(h.getStage() != null ? h.getStage().getColor() : null)
                .workerId(h.getWorker() != null ? h.getWorker().getId() : null)
                .workerName(h.getWorker() != null ? h.getWorker().getFullName() : null)
                .startedAt(h.getStartedAt())
                .completedAt(h.getCompletedAt())
                .durationMinutes(h.getDurationMinutes())
                .notes(h.getNotes())
                .defectReason(h.getDefectReason())
                .build();
    }
}
