package uz.jalyuziepr.api.dto.response;

import lombok.Builder;
import lombok.Data;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.entity.OrderEscalation;

import java.time.LocalDateTime;

/**
 * Eskalatsiya (SOS) javobi — menejer paneli va buyurtma tafsiloti uchun.
 */
@Data
@Builder
public class OrderEscalationResponse {

    private Long id;
    private Long orderId;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private String installationAddress;
    private String reason;       // enum nomi (frontend filtrlash uchun)
    private String reasonLabel;  // o'zbekcha yorliq
    private String description;
    private String photoUrl;
    private String status;       // OPEN | RESOLVED
    private Long createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private String resolvedByName;
    private String resolutionNote;
    private LocalDateTime resolvedAt;

    public static OrderEscalationResponse from(OrderEscalation e) {
        Order o = e.getOrder();
        boolean hasCustomer = o != null && o.getCustomer() != null;
        return OrderEscalationResponse.builder()
                .id(e.getId())
                .orderId(o != null ? o.getId() : null)
                .orderNumber(o != null ? o.getOrderNumber() : null)
                .customerName(hasCustomer ? o.getCustomer().getFullName() : null)
                .customerPhone(hasCustomer ? o.getCustomer().getPhone() : null)
                .installationAddress(o != null ? o.getInstallationAddress() : null)
                .reason(e.getReason() != null ? e.getReason().name() : null)
                .reasonLabel(e.getReason() != null ? e.getReason().getLabel() : null)
                .description(e.getDescription())
                .photoUrl(e.getPhotoUrl())
                .status(e.getStatus() != null ? e.getStatus().name() : null)
                .createdBy(e.getCreatedBy())
                .createdByName(e.getCreatedByName())
                .createdAt(e.getCreatedAt())
                .resolvedByName(e.getResolvedByName())
                .resolutionNote(e.getResolutionNote())
                .resolvedAt(e.getResolvedAt())
                .build();
    }
}
