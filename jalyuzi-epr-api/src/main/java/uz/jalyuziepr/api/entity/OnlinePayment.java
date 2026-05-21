package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;
import uz.jalyuziepr.api.enums.OnlinePaymentProvider;
import uz.jalyuziepr.api.enums.OnlinePaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Click yoki Payme orqali kelgan onlayn to'lov.
 * Idempotency: (provider, provider_transaction_id) unique.
 */
@Entity
@Table(name = "online_payments")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnlinePayment extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OnlinePaymentProvider provider;

    @Column(name = "provider_transaction_id", nullable = false, length = 100)
    private String providerTransactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private PaymentSchedule schedule;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OnlinePaymentStatus status = OnlinePaymentStatus.PENDING;

    @Column(name = "raw_request", columnDefinition = "TEXT")
    @JsonIgnore
    private String rawRequest;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    @JsonIgnore
    private String rawResponse;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private OrderPayment payment;
}
