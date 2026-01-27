package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;
import uz.jalyuziepr.api.enums.InstallationStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "installations")
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Installation extends BaseEntity implements Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private Employee technician;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time_start")
    private LocalTime scheduledTimeStart;

    @Column(name = "scheduled_time_end")
    private LocalTime scheduledTimeEnd;

    @Column(name = "actual_date")
    private LocalDate actualDate;

    @Column(name = "actual_time_start")
    private LocalTime actualTimeStart;

    @Column(name = "actual_time_end")
    private LocalTime actualTimeEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private InstallationStatus status = InstallationStatus.SCHEDULED;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "access_instructions", length = 500)
    private String accessInstructions;

    @Column(length = 1000)
    private String notes;

    @Column(name = "completion_notes", length = 1000)
    private String completionNotes;

    @Column(name = "customer_signature", columnDefinition = "TEXT")
    private String customerSignature;

    @Column(name = "photos_before", columnDefinition = "TEXT")
    private String photosBefore;

    @Column(name = "photos_after", columnDefinition = "TEXT")
    private String photosAfter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // ============================================
    // Auditable Interface Implementation
    // ============================================

    @Override
    public String getEntityName() {
        return "Installation";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("scheduledDate", this.scheduledDate);
        map.put("scheduledTimeStart", this.scheduledTimeStart);
        map.put("scheduledTimeEnd", this.scheduledTimeEnd);
        map.put("actualDate", this.actualDate);
        map.put("actualTimeStart", this.actualTimeStart);
        map.put("actualTimeEnd", this.actualTimeEnd);
        map.put("status", this.status);
        map.put("address", this.address);
        map.put("contactPhone", this.contactPhone);
        map.put("accessInstructions", this.accessInstructions);
        map.put("notes", this.notes);
        map.put("completionNotes", this.completionNotes);

        if (this.sale != null) {
            map.put("saleId", this.sale.getId());
        }
        if (this.technician != null) {
            map.put("technicianId", this.technician.getId());
        }
        if (this.createdBy != null) {
            map.put("createdById", this.createdBy.getId());
        }

        return map;
    }

    @Override
    public Set<String> getSensitiveFields() {
        return Set.of();
    }
}
