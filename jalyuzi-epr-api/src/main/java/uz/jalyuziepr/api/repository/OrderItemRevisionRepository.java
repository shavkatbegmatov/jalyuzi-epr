package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.jalyuziepr.api.entity.OrderItemRevision;
import uz.jalyuziepr.api.enums.RevisionStatus;

import java.util.List;

public interface OrderItemRevisionRepository extends JpaRepository<OrderItemRevision, Long> {

    List<OrderItemRevision> findByStatusOrderByCreatedAtDesc(RevisionStatus status);

    List<OrderItemRevision> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    long countByStatus(RevisionStatus status);
}
