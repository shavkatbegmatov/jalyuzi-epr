package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionStatsResponse {

    // Umumiy ko'rsatkichlar (oxirgi 30 kun)
    private long totalOrdersInProgress;
    private long totalCompletedLast30Days;
    private long totalCancelledLast30Days;
    private long overdueOrders;
    private Double averageCompletionDays;

    // Bosqich bo'yicha taqsimot
    private List<StageDistributionItem> stageDistribution;

    // Ishchi unumdorligi
    private List<WorkerKpiItem> workerKpi;

    // Brak/Defect statistikasi
    private List<DefectReasonItem> defectReasons;
    private Double defectRatePercent;

    // Material chiqindi
    private BigDecimal totalMaterialCost;
    private BigDecimal totalMaterialWasted;
    private Double wastePercent;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StageDistributionItem {
        private Long stageId;
        private String stageName;
        private String stageColor;
        private Integer sequence;
        private long count;
        private Double averageMinutes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkerKpiItem {
        private Long workerId;
        private String workerName;
        private long completedOrders;
        private long activeOrders;
        private Long totalMinutes;
        private Double averageMinutesPerOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DefectReasonItem {
        private String reason;
        private long count;
    }
}
