package uz.jalyuziepr.api.dto.response;

import lombok.Builder;
import lombok.Data;
import uz.jalyuziepr.api.entity.OrderItemRevision;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Qayta o'lchov so'rovi javobi — menejer tasdig'i va buyurtma tafsiloti uchun.
 */
@Data
@Builder
public class OrderItemRevisionResponse {

    private Long id;
    private Long orderId;
    private String orderNumber;
    private Long orderItemId;
    private String productName;
    private String roomName;
    private Integer oldWidthMm;
    private Integer oldHeightMm;
    private BigDecimal oldTotalPrice;
    private Integer newWidthMm;
    private Integer newHeightMm;
    private BigDecimal newTotalPrice;
    private BigDecimal delta;
    private String status;
    private String note;
    private Long requestedBy;
    private String requestedByName;
    private LocalDateTime createdAt;
    private String decidedByName;
    private String decisionNote;
    private LocalDateTime decidedAt;

    public static OrderItemRevisionResponse from(OrderItemRevision r) {
        return OrderItemRevisionResponse.builder()
                .id(r.getId())
                .orderId(r.getOrderId())
                .orderNumber(r.getOrderNumber())
                .orderItemId(r.getOrderItemId())
                .productName(r.getProductName())
                .roomName(r.getRoomName())
                .oldWidthMm(r.getOldWidthMm())
                .oldHeightMm(r.getOldHeightMm())
                .oldTotalPrice(r.getOldTotalPrice())
                .newWidthMm(r.getNewWidthMm())
                .newHeightMm(r.getNewHeightMm())
                .newTotalPrice(r.getNewTotalPrice())
                .delta(r.getDelta())
                .status(r.getStatus() != null ? r.getStatus().name() : null)
                .note(r.getNote())
                .requestedBy(r.getRequestedBy())
                .requestedByName(r.getRequestedByName())
                .createdAt(r.getCreatedAt())
                .decidedByName(r.getDecidedByName())
                .decisionNote(r.getDecisionNote())
                .decidedAt(r.getDecidedAt())
                .build();
    }
}
