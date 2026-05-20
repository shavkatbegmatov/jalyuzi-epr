package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;
import uz.jalyuziepr.api.enums.ProductionStatus;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Sex uchun ishlab chiqarish buyurtmasi.
 * Bir Order'da bir nechta OrderItem bo'lishi mumkin, har biri uchun alohida ProductionOrder.
 */
@Entity
@Table(name = "production_orders")
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionOrder extends BaseEntity implements Auditable {

    @Column(name = "production_number", nullable = false, unique = true, length = 30)
    private String productionNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProductionStatus status = ProductionStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_stage_id")
    private ProductionStage currentStage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_worker_id")
    private User assignedWorker;

    @Column(nullable = false)
    @Builder.Default
    private Integer priority = 3;

    @Column
    private LocalDateTime deadline;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "defect_reason", length = 500)
    private String defectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "productionOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private Set<ProductionStageHistory> stageHistory = new LinkedHashSet<>();

    @OneToMany(mappedBy = "productionOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private Set<ProductionMaterial> materials = new LinkedHashSet<>();

    public void addStageHistory(ProductionStageHistory history) {
        stageHistory.add(history);
        history.setProductionOrder(this);
    }

    public void addMaterial(ProductionMaterial material) {
        materials.add(material);
        material.setProductionOrder(this);
    }

    // ============================================
    // Auditable
    // ============================================

    @Override
    public String getEntityName() {
        return "ProductionOrder";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("productionNumber", productionNumber);
        map.put("status", status);
        map.put("priority", priority);
        map.put("deadline", deadline);
        map.put("startedAt", startedAt);
        map.put("completedAt", completedAt);
        map.put("notes", notes);
        map.put("defectReason", defectReason);
        if (order != null) map.put("orderId", order.getId());
        if (orderItem != null) map.put("orderItemId", orderItem.getId());
        if (currentStage != null) map.put("currentStageId", currentStage.getId());
        if (assignedWorker != null) map.put("assignedWorkerId", assignedWorker.getId());
        return map;
    }

    @Override
    public Set<String> getSensitiveFields() {
        return Set.of();
    }
}
