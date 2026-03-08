package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private OrderStatus status;
    private String statusDisplayName;

    // Mijoz
    private Long customerId;
    private String customerName;
    private String customerPhone;

    // Manzil
    private String installationAddress;

    // Tayinlangan xodimlar
    private Long managerId;
    private String managerName;
    private Long measurerId;
    private String measurerName;
    private Long installerId;
    private String installerName;

    // Moliyaviy
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal discountPercent;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private BigDecimal costTotal;

    // Bog'lanishlar
    private Long saleId;
    private Long debtId;

    // Sanalar
    private LocalDateTime measurementDate;
    private LocalDateTime productionStartDate;
    private LocalDateTime productionEndDate;
    private LocalDateTime installationDate;
    private LocalDateTime completedDate;
    private LocalDateTime createdAt;

    private String notes;
    private String createdByName;

    // Related data
    private List<OrderItemResponse> items;
    private List<OrderPaymentResponse> payments;
    private List<OrderStatusHistoryResponse> statusHistory;

    public static OrderResponse from(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .statusDisplayName(order.getStatus().getDisplayName())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : null)
                .customerPhone(order.getCustomer() != null ? order.getCustomer().getPhone() : null)
                .installationAddress(order.getInstallationAddress())
                .managerId(order.getManager() != null ? order.getManager().getId() : null)
                .managerName(order.getManager() != null ? order.getManager().getFullName() : null)
                .measurerId(order.getMeasurer() != null ? order.getMeasurer().getId() : null)
                .measurerName(order.getMeasurer() != null ? order.getMeasurer().getFullName() : null)
                .installerId(order.getInstaller() != null ? order.getInstaller().getId() : null)
                .installerName(order.getInstaller() != null ? order.getInstaller().getFullName() : null)
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .discountPercent(order.getDiscountPercent())
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .remainingAmount(order.getRemainingAmount())
                .costTotal(order.getCostTotal())
                .saleId(order.getSale() != null ? order.getSale().getId() : null)
                .debtId(order.getDebt() != null ? order.getDebt().getId() : null)
                .measurementDate(order.getMeasurementDate())
                .productionStartDate(order.getProductionStartDate())
                .productionEndDate(order.getProductionEndDate())
                .installationDate(order.getInstallationDate())
                .completedDate(order.getCompletedDate())
                .createdAt(order.getCreatedAt())
                .notes(order.getNotes())
                .createdByName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
                .items(order.getItems() != null ?
                        order.getItems().stream().map(OrderItemResponse::from).collect(Collectors.toList()) : null)
                .payments(order.getPayments() != null ?
                        order.getPayments().stream().map(OrderPaymentResponse::from).collect(Collectors.toList()) : null)
                .statusHistory(order.getStatusHistory() != null ?
                        order.getStatusHistory().stream().map(OrderStatusHistoryResponse::from).collect(Collectors.toList()) : null)
                .build();
    }

    /**
     * Lightweight version for list views
     */
    public static OrderResponse fromList(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .statusDisplayName(order.getStatus().getDisplayName())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : null)
                .customerPhone(order.getCustomer() != null ? order.getCustomer().getPhone() : null)
                .installationAddress(order.getInstallationAddress())
                .installerName(order.getInstaller() != null ? order.getInstaller().getFullName() : null)
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .remainingAmount(order.getRemainingAmount())
                .installationDate(order.getInstallationDate())
                .createdAt(order.getCreatedAt())
                .createdByName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
                .build();
    }
}
