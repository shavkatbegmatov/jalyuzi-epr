package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.enums.PaymentMethod;
import uz.jalyuziepr.api.enums.PaymentStatus;
import uz.jalyuziepr.api.enums.SaleStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Buyurtma javobi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderResponse {
    private Long id;
    private String orderNumber;
    private LocalDateTime orderDate;

    // Holat
    private SaleStatus status;
    private String statusName;
    private PaymentStatus paymentStatus;
    private String paymentStatusName;

    // Buyurtma elementlari
    private List<ShopOrderItemResponse> items;

    // Summalar
    private BigDecimal subtotal;
    private BigDecimal installationTotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;

    // To'lov
    private PaymentMethod paymentMethod;
    private String paymentMethodName;

    // Yetkazib berish
    private String deliveryAddress;
    private boolean withInstallation;
    private LocalDateTime installationDate;
    private String installationNotes;

    private String notes;
    private LocalDateTime createdAt;
}
