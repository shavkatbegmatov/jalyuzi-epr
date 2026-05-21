package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;
import uz.jalyuziepr.api.enums.ServiceVisitStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "service_visits")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceVisit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    @JsonIgnore
    private WarrantyClaim claim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User technician;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time")
    private LocalTime scheduledTime;

    @Column(name = "actual_arrived_at")
    private LocalDateTime actualArrivedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "visit_notes", columnDefinition = "TEXT")
    private String visitNotes;

    @Column(name = "action_taken", columnDefinition = "TEXT")
    private String actionTaken;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parts_used", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> partsUsed = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "photos_before", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> photosBefore = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "photos_after", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> photosAfter = new ArrayList<>();

    @Column(name = "customer_signature", columnDefinition = "TEXT")
    private String customerSignature;

    @Column(name = "customer_rating")
    private Integer customerRating;

    @Column(name = "customer_feedback", columnDefinition = "TEXT")
    private String customerFeedback;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ServiceVisitStatus status = ServiceVisitStatus.SCHEDULED;
}
