package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import uz.jalyuziepr.api.enums.OrderPaymentType;
import uz.jalyuziepr.api.enums.PaymentMethod;

import java.math.BigDecimal;

@Data
public class OrderPaymentRequest {

    @NotNull(message = "To'lov turi tanlanishi shart")
    private OrderPaymentType paymentType;

    @NotNull(message = "Summa kiritilishi shart")
    @Positive(message = "Summa musbat bo'lishi kerak")
    private BigDecimal amount;

    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    private String notes;
}
