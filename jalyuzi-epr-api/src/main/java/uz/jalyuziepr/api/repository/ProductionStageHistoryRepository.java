package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.ProductionStageHistory;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductionStageHistoryRepository extends JpaRepository<ProductionStageHistory, Long> {

    List<ProductionStageHistory> findByProductionOrderIdOrderByStartedAtAsc(Long productionOrderId);

    @Query("SELECT h FROM ProductionStageHistory h " +
            "WHERE h.productionOrder.id = :productionOrderId " +
            "AND h.completedAt IS NULL " +
            "ORDER BY h.startedAt DESC")
    List<ProductionStageHistory> findOpenStages(@Param("productionOrderId") Long productionOrderId);

    @Query("SELECT COALESCE(SUM(h.durationMinutes), 0) FROM ProductionStageHistory h " +
            "WHERE h.worker.id = :workerId " +
            "AND h.startedAt BETWEEN :start AND :end")
    Long sumWorkerMinutes(@Param("workerId") Long workerId,
                          @Param("start") LocalDateTime start,
                          @Param("end") LocalDateTime end);
}
