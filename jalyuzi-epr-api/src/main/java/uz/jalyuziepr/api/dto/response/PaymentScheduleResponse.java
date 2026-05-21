package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.PaymentSchedule;
import uz.jalyuziepr.api.enums.PaymentScheduleStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentScheduleResponse {
    private Long id;
    private Long orderId;
    private Integer sequenceNo;
    private String label;
    private BigDecimal percentage;
    private BigDecimal amount;
    private LocalDate dueDate;
    private PaymentScheduleStatus status;
    private String statusDisplayName;
    private LocalDateTime paidAt;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private Long paymentId;
    private String notes;
    private Boolean overdue;
    private Integer daysUntilDue;

    public static PaymentScheduleResponse from(PaymentSchedule ps) {
        LocalDate today = LocalDate.now();
        boolean overdue = ps.getStatus().isOpen() && ps.getDueDate().isBefore(today);
        int daysUntilDue = (int) java.time.temporal.ChronoUnit.DAYS.between(today, ps.getDueDate());

        BigDecimal paid = ps.getPaidAmount() != null ? ps.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal remaining = ps.getAmount().subtract(paid).max(BigDecimal.ZERO);

        return PaymentScheduleResponse.builder()
                .id(ps.getId())
                .orderId(ps.getOrder() != null ? ps.getOrder().getId() : null)
                .sequenceNo(ps.getSequenceNo())
                .label(ps.getLabel())
                .percentage(ps.getPercentage())
                .amount(ps.getAmount())
                .dueDate(ps.getDueDate())
                .status(ps.getStatus())
                .statusDisplayName(ps.getStatus().getDisplayName())
                .paidAt(ps.getPaidAt())
                .paidAmount(paid)
                .remainingAmount(remaining)
                .paymentId(ps.getPayment() != null ? ps.getPayment().getId() : null)
                .notes(ps.getNotes())
                .overdue(overdue)
                .daysUntilDue(daysUntilDue)
                .build();
    }
}
