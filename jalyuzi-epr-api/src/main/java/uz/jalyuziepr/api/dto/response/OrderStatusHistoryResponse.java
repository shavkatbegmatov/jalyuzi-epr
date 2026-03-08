package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.OrderStatusHistory;
import uz.jalyuziepr.api.enums.OrderStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryResponse {
    private Long id;
    private OrderStatus fromStatus;
    private String fromStatusDisplayName;
    private OrderStatus toStatus;
    private String toStatusDisplayName;
    private String changedByName;
    private String notes;
    private LocalDateTime createdAt;

    public static OrderStatusHistoryResponse from(OrderStatusHistory history) {
        return OrderStatusHistoryResponse.builder()
                .id(history.getId())
                .fromStatus(history.getFromStatus())
                .fromStatusDisplayName(history.getFromStatus() != null ? history.getFromStatus().getDisplayName() : null)
                .toStatus(history.getToStatus())
                .toStatusDisplayName(history.getToStatus().getDisplayName())
                .changedByName(history.getChangedBy() != null ? history.getChangedBy().getFullName() : null)
                .notes(history.getNotes())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
