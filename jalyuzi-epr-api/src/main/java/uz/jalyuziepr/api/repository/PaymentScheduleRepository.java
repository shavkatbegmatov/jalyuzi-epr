package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.PaymentSchedule;
import uz.jalyuziepr.api.enums.PaymentScheduleStatus;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentScheduleRepository extends JpaRepository<PaymentSchedule, Long> {

    List<PaymentSchedule> findByOrderIdOrderBySequenceNoAsc(Long orderId);

    @Query("SELECT ps FROM PaymentSchedule ps " +
            "LEFT JOIN FETCH ps.order o " +
            "LEFT JOIN FETCH o.customer " +
            "WHERE ps.status IN ('PENDING', 'PARTIAL') AND ps.dueDate <= :asOf " +
            "ORDER BY ps.dueDate ASC")
    List<PaymentSchedule> findDueOrOverdue(@Param("asOf") LocalDate asOf);

    @Query("SELECT ps FROM PaymentSchedule ps " +
            "LEFT JOIN FETCH ps.order o " +
            "LEFT JOIN FETCH o.customer " +
            "WHERE ps.status = 'PENDING' AND ps.dueDate = :date AND ps.reminderSentAt IS NULL")
    List<PaymentSchedule> findRemindersDueOn(@Param("date") LocalDate date);

    @Modifying
    @Query("UPDATE PaymentSchedule ps SET ps.status = 'OVERDUE' " +
            "WHERE ps.status IN ('PENDING', 'PARTIAL') AND ps.dueDate < :today")
    int markOverdueBefore(@Param("today") LocalDate today);

    @Query("SELECT COUNT(ps) FROM PaymentSchedule ps WHERE ps.order.id = :orderId AND ps.status <> 'CANCELLED'")
    long countActiveByOrder(@Param("orderId") Long orderId);

    @Query("SELECT ps FROM PaymentSchedule ps WHERE ps.order.id = :orderId AND ps.status = :status")
    List<PaymentSchedule> findByOrderAndStatus(@Param("orderId") Long orderId,
                                                @Param("status") PaymentScheduleStatus status);
}
