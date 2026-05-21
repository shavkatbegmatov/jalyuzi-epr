package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;
import uz.jalyuziepr.api.enums.PaymentScheduleStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Buyurtma uchun to'lov bo'lagi (installment).
 * Bir buyurtmada 1 yoki bir nechta to'lov rejasi bo'lishi mumkin.
 */
@Entity
@Table(name = "payment_schedules")
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSchedule extends BaseEntity implements Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @Column(name = "sequence_no", nullable = false)
    private Integer sequenceNo;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentScheduleStatus status = PaymentScheduleStatus.PENDING;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "paid_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private OrderPayment payment;

    @Column(name = "reminder_sent_at")
    private LocalDateTime reminderSentAt;

    @Column(length = 500)
    private String notes;

    @Override
    public String getEntityName() {
        return "PaymentSchedule";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("sequenceNo", sequenceNo);
        map.put("label", label);
        map.put("amount", amount);
        map.put("percentage", percentage);
        map.put("dueDate", dueDate);
        map.put("status", status);
        map.put("paidAmount", paidAmount);
        map.put("paidAt", paidAt);
        if (order != null) map.put("orderId", order.getId());
        if (payment != null) map.put("paymentId", payment.getId());
        return map;
    }

    @Override
    public Set<String> getSensitiveFields() {
        return Set.of();
    }
}
