package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.OrderPayment;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderPaymentRepository extends JpaRepository<OrderPayment, Long> {
    List<OrderPayment> findByOrderId(Long orderId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM OrderPayment p WHERE p.collectedBy.id = :userId")
    BigDecimal sumCollectedByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM OrderPayment p WHERE p.collectedBy.id IS NOT NULL")
    BigDecimal sumTotalCollectedByInstallers();
}
