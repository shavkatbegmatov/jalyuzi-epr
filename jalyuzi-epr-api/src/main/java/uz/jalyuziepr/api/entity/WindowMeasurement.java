package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "window_measurements")
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WindowMeasurement extends BaseEntity implements Auditable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "room_name", length = 100)
    private String roomName;

    @Column(name = "window_number")
    @Builder.Default
    private Integer windowNumber = 1;

    @Column(nullable = false)
    private Integer width;  // mm

    @Column(nullable = false)
    private Integer height;  // mm

    private Integer depth;  // mm

    @Column(name = "mount_type", length = 20)
    private String mountType;  // INSIDE, OUTSIDE

    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "measured_by")
    private Employee measuredBy;

    @Column(name = "measured_at", nullable = false)
    private LocalDateTime measuredAt;

    // ============================================
    // Auditable Interface Implementation
    // ============================================

    @Override
    public String getEntityName() {
        return "WindowMeasurement";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("roomName", this.roomName);
        map.put("windowNumber", this.windowNumber);
        map.put("width", this.width);
        map.put("height", this.height);
        map.put("depth", this.depth);
        map.put("mountType", this.mountType);
        map.put("notes", this.notes);
        map.put("measuredAt", this.measuredAt);

        if (this.customer != null) {
            map.put("customerId", this.customer.getId());
        }
        if (this.measuredBy != null) {
            map.put("measuredById", this.measuredBy.getId());
        }

        return map;
    }

    @Override
    public Set<String> getSensitiveFields() {
        return Set.of();
    }
}
