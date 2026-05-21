package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;
import uz.jalyuziepr.api.enums.WarrantyClaimStatus;
import uz.jalyuziepr.api.enums.WarrantyIssueType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "warranty_claims")
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarrantyClaim extends BaseEntity implements Auditable {

    @Column(name = "claim_number", nullable = false, unique = true, length = 30)
    private String claimNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false, length = 30)
    private WarrantyIssueType issueType;

    @Column(name = "issue_description", nullable = false, columnDefinition = "TEXT")
    private String issueDescription;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> photos = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WarrantyClaimStatus status = WarrantyClaimStatus.NEW;

    @Column(nullable = false)
    @Builder.Default
    private Integer priority = 3;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "is_warranty_covered")
    private Boolean isWarrantyCovered;

    @Column(name = "cost_to_customer", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal costToCustomer = BigDecimal.ZERO;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private Set<ServiceVisit> visits = new LinkedHashSet<>();

    public void addVisit(ServiceVisit visit) {
        visits.add(visit);
        visit.setClaim(this);
    }

    @Override
    public String getEntityName() {
        return "WarrantyClaim";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("claimNumber", claimNumber);
        map.put("issueType", issueType);
        map.put("status", status);
        map.put("priority", priority);
        map.put("isWarrantyCovered", isWarrantyCovered);
        map.put("costToCustomer", costToCustomer);
        map.put("resolvedAt", resolvedAt);
        map.put("closedAt", closedAt);
        if (order != null) map.put("orderId", order.getId());
        if (customer != null) map.put("customerId", customer.getId());
        if (assignedTo != null) map.put("assignedToId", assignedTo.getId());
        return map;
    }

    @Override
    public Set<String> getSensitiveFields() {
        return Set.of();
    }
}
