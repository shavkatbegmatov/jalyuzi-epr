package uz.jalyuziepr.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.ProductionOrder;
import uz.jalyuziepr.api.enums.ProductionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, Long> {

    @Query("SELECT po FROM ProductionOrder po " +
            "LEFT JOIN FETCH po.order o " +
            "LEFT JOIN FETCH o.customer " +
            "LEFT JOIN FETCH po.orderItem oi " +
            "LEFT JOIN FETCH oi.product " +
            "LEFT JOIN FETCH po.currentStage " +
            "LEFT JOIN FETCH po.assignedWorker " +
            "WHERE po.id = :id")
    Optional<ProductionOrder> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT po FROM ProductionOrder po " +
            "LEFT JOIN FETCH po.order o " +
            "LEFT JOIN FETCH o.customer " +
            "LEFT JOIN FETCH po.orderItem oi " +
            "LEFT JOIN FETCH oi.product " +
            "LEFT JOIN FETCH po.currentStage " +
            "LEFT JOIN FETCH po.assignedWorker " +
            "WHERE po.status <> 'CANCELLED' AND po.status <> 'COMPLETED' " +
            "ORDER BY po.priority DESC, po.deadline ASC NULLS LAST")
    List<ProductionOrder> findActiveBoard();

    Page<ProductionOrder> findByStatus(ProductionStatus status, Pageable pageable);

    Page<ProductionOrder> findByCurrentStageId(Long stageId, Pageable pageable);

    List<ProductionOrder> findByOrderId(Long orderId);

    @Query("SELECT COUNT(po) FROM ProductionOrder po WHERE po.assignedWorker.id = :workerId AND po.status = 'IN_PROGRESS'")
    long countActiveByWorker(@Param("workerId") Long workerId);

    @Query("SELECT COUNT(po) FROM ProductionOrder po WHERE po.currentStage.id = :stageId AND po.status NOT IN ('COMPLETED', 'CANCELLED')")
    long countActiveByStage(@Param("stageId") Long stageId);

    @Query("SELECT COUNT(po) FROM ProductionOrder po " +
            "WHERE po.status = 'COMPLETED' AND po.completedAt BETWEEN :start AND :end")
    long countCompletedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT po FROM ProductionOrder po WHERE po.deadline < :now AND po.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<ProductionOrder> findOverdue(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(po) FROM ProductionOrder po WHERE po.productionNumber LIKE :prefix")
    long countByProductionNumberPrefix(@Param("prefix") String prefix);
}
