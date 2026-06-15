package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.jalyuziepr.api.entity.OrderEscalation;
import uz.jalyuziepr.api.enums.EscalationStatus;

import java.util.List;

public interface OrderEscalationRepository extends JpaRepository<OrderEscalation, Long> {

    List<OrderEscalation> findByStatusOrderByCreatedAtDesc(EscalationStatus status);

    List<OrderEscalation> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    long countByStatus(EscalationStatus status);

    boolean existsByOrderIdAndStatus(Long orderId, EscalationStatus status);
}
