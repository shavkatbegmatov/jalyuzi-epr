package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentScheduleRequest {

    @NotNull
    private Integer sequenceNo;

    @NotBlank
    private String label;

    private BigDecimal percentage;

    @NotNull
    @DecimalMin(value = "0.01", message = "Summa 0 dan katta bo'lishi shart")
    private BigDecimal amount;

    @NotNull
    private LocalDate dueDate;

    private String notes;

    /**
     * Bir vaqtning o'zida bir nechta plan yaratish uchun.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkRequest {
        @NotNull
        private List<PaymentScheduleRequest> items;
    }
}
