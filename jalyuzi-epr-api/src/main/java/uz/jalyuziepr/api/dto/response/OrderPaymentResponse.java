package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.OrderPayment;
import uz.jalyuziepr.api.enums.OrderPaymentType;
import uz.jalyuziepr.api.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPaymentResponse {
    private Long id;
    private OrderPaymentType paymentType;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String collectedByName;
    private String confirmedByName;
    private Boolean isConfirmed;
    private String notes;
    private LocalDateTime createdAt;

    public static OrderPaymentResponse from(OrderPayment payment) {
        return OrderPaymentResponse.builder()
                .id(payment.getId())
                .paymentType(payment.getPaymentType())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .collectedByName(payment.getCollectedBy() != null ? payment.getCollectedBy().getFullName() : null)
                .confirmedByName(payment.getConfirmedBy() != null ? payment.getConfirmedBy().getFullName() : null)
                .isConfirmed(payment.getIsConfirmed())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
