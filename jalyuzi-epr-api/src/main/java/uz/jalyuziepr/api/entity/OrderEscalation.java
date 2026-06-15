package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import uz.jalyuziepr.api.enums.EscalationReason;
import uz.jalyuziepr.api.enums.EscalationStatus;

import java.time.LocalDateTime;

/**
 * Dala o'rnatuvchi eskalatsiyasi (SOS) — buyurtma bo'yicha tezkor yordam so'rovi.
 * Buyurtma statusiga ta'sir qilmaydigan alohida overlay yozuv.
 */
@Entity
@Table(name = "order_escalations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderEscalation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EscalationReason reason;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EscalationStatus status = EscalationStatus.OPEN;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_by_name", length = 150)
    private String createdByName;

    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(name = "resolved_by_name", length = 150)
    private String resolvedByName;

    @Column(name = "resolution_note", columnDefinition = "text")
    private String resolutionNote;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
