package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Bir production order'da har bir bosqichdan o'tish tarixi (kim, qachondan-qachongacha bajardi).
 * Audit log uslubida — yangilanmaydi, faqat yoziladi.
 */
@Entity
@Table(name = "production_stage_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionStageHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_order_id", nullable = false)
    @JsonIgnore
    private ProductionOrder productionOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private ProductionStage stage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    private User worker;

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "defect_reason", length = 500)
    private String defectReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Avtomatik: bajarish vaqtini hisoblash (started_at → completed_at)
     */
    @PreUpdate
    public void recalcDuration() {
        if (startedAt != null && completedAt != null && durationMinutes == null) {
            durationMinutes = (int) java.time.Duration.between(startedAt, completedAt).toMinutes();
        }
    }
}
