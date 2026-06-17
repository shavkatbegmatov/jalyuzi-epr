package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.ProductionOrder;
import uz.jalyuziepr.api.enums.ProductionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionOrderResponse {
    private Long id;
    private String productionNumber;
    private ProductionStatus status;
    private String statusDisplayName;

    // Order va Customer ma'lumotlari
    private Long orderId;
    private String orderNumber;
    private String customerName;
    private String customerPhone;

    // Item ma'lumotlari (qaysi mahsulot ishlanyapti)
    private Long orderItemId;
    private String productName;
    private String roomName;
    private Integer widthMm;
    private Integer heightMm;

    // Bosqich
    private Long currentStageId;
    private String currentStageName;
    private String currentStageColor;
    private Integer currentStageSequence;

    // Tayinlangan ishchi
    private Long assignedWorkerId;
    private String assignedWorkerName;

    // Vaqtlar
    private Integer priority;
    private LocalDateTime deadline;
    private LocalDateTime startedAt;
    private LocalDateTime currentStageEnteredAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    private String notes;
    private String defectReason;
    private String createdByName;

    // Detal javobda (single fetch)
    private List<ProductionStageHistoryResponse> stageHistory;
    private List<ProductionMaterialResponse> materials;

    public static ProductionOrderResponse from(ProductionOrder po) {
        return ProductionOrderResponse.builder()
                .id(po.getId())
                .productionNumber(po.getProductionNumber())
                .status(po.getStatus())
                .statusDisplayName(po.getStatus().getDisplayName())
                .orderId(po.getOrder() != null ? po.getOrder().getId() : null)
                .orderNumber(po.getOrder() != null ? po.getOrder().getOrderNumber() : null)
                .customerName(po.getOrder() != null && po.getOrder().getCustomer() != null
                        ? po.getOrder().getCustomer().getFullName() : null)
                .customerPhone(po.getOrder() != null && po.getOrder().getCustomer() != null
                        ? po.getOrder().getCustomer().getPhone() : null)
                .orderItemId(po.getOrderItem() != null ? po.getOrderItem().getId() : null)
                .productName(po.getOrderItem() != null && po.getOrderItem().getProduct() != null
                        ? po.getOrderItem().getProduct().getName() : null)
                .roomName(po.getOrderItem() != null ? po.getOrderItem().getRoomName() : null)
                .widthMm(po.getOrderItem() != null ? po.getOrderItem().getWidthMm() : null)
                .heightMm(po.getOrderItem() != null ? po.getOrderItem().getHeightMm() : null)
                .currentStageId(po.getCurrentStage() != null ? po.getCurrentStage().getId() : null)
                .currentStageName(po.getCurrentStage() != null ? po.getCurrentStage().getName() : null)
                .currentStageColor(po.getCurrentStage() != null ? po.getCurrentStage().getColor() : null)
                .currentStageSequence(po.getCurrentStage() != null ? po.getCurrentStage().getSequence() : null)
                .assignedWorkerId(po.getAssignedWorker() != null ? po.getAssignedWorker().getId() : null)
                .assignedWorkerName(po.getAssignedWorker() != null ? po.getAssignedWorker().getFullName() : null)
                .priority(po.getPriority())
                .deadline(po.getDeadline())
                .startedAt(po.getStartedAt())
                .currentStageEnteredAt(po.getCurrentStageEnteredAt())
                .completedAt(po.getCompletedAt())
                .createdAt(po.getCreatedAt())
                .notes(po.getNotes())
                .defectReason(po.getDefectReason())
                .createdByName(po.getCreatedBy() != null ? po.getCreatedBy().getFullName() : null)
                .build();
    }

    /**
     * To'liq versiya — barcha tarix va materiallar bilan
     */
    public static ProductionOrderResponse fromDetailed(ProductionOrder po) {
        ProductionOrderResponse base = from(po);
        if (po.getStageHistory() != null) {
            base.setStageHistory(po.getStageHistory().stream()
                    .map(ProductionStageHistoryResponse::from)
                    .collect(Collectors.toList()));
        }
        if (po.getMaterials() != null) {
            base.setMaterials(po.getMaterials().stream()
                    .map(ProductionMaterialResponse::from)
                    .collect(Collectors.toList()));
        }
        return base;
    }
}
