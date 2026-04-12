package uz.jalyuziepr.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.enums.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.customer LEFT JOIN FETCH o.createdBy " +
            "LEFT JOIN FETCH o.manager LEFT JOIN FETCH o.installer WHERE o.id = :id")
    Optional<Order> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.customer LEFT JOIN FETCH o.createdBy " +
            "LEFT JOIN FETCH o.items LEFT JOIN FETCH o.payments LEFT JOIN FETCH o.statusHistory " +
            "LEFT JOIN FETCH o.manager LEFT JOIN FETCH o.measurer LEFT JOIN FETCH o.installer WHERE o.id = :id")
    Optional<Order> findByIdWithAllDetails(@Param("id") Long id);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status IN :statuses")
    Page<Order> findByStatusIn(@Param("statuses") List<OrderStatus> statuses, Pageable pageable);

    Page<Order> findByCustomerId(Long customerId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.installer.id = :installerId AND o.status IN :statuses")
    List<Order> findByInstallerIdAndStatusIn(@Param("installerId") Long installerId,
                                              @Param("statuses") List<OrderStatus> statuses);

    @Query("SELECT o FROM Order o WHERE o.installer.id = :installerId")
    Page<Order> findByInstallerId(@Param("installerId") Long installerId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :start AND :end")
    Page<Order> findByCreatedAtBetween(@Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE " +
            "(LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.customer.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.customer.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchOrders(@Param("search") String search, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:search IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR :search IS NULL OR LOWER(o.customer.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> findByFilters(@Param("status") OrderStatus status,
                               @Param("search") String search, Pageable pageable);

    @Query("SELECT MAX(CAST(SUBSTRING(o.orderNumber, LENGTH(:prefix) + 1) AS integer)) FROM Order o WHERE o.orderNumber LIKE CONCAT(:prefix, '%')")
    Integer findMaxOrderNumber(@Param("prefix") String prefix);

    long countByStatus(OrderStatus status);

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countByStatusGroup();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'YAKUNLANDI'")
    java.math.BigDecimal sumCompletedOrdersTotal();

    @Query("SELECT COALESCE(SUM(o.paidAmount), 0) FROM Order o WHERE o.status NOT IN ('BEKOR_QILINDI')")
    java.math.BigDecimal sumTotalPaid();

    @Query("SELECT COALESCE(SUM(o.remainingAmount), 0) FROM Order o WHERE o.status NOT IN ('BEKOR_QILINDI', 'YAKUNLANDI')")
    java.math.BigDecimal sumTotalRemaining();

    // ── Installer stats queries ──

    @Query("SELECT COUNT(o) FROM Order o WHERE o.installer.id = :installerId AND o.status IN :statuses")
    long countByInstallerIdAndStatusIn(@Param("installerId") Long installerId,
                                       @Param("statuses") List<OrderStatus> statuses);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.installer.id = :installerId AND o.status IN :statuses AND o.completedDate BETWEEN :start AND :end")
    long countByInstallerIdAndStatusInAndCompletedDateBetween(
            @Param("installerId") Long installerId,
            @Param("statuses") List<OrderStatus> statuses,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
        SELECT COUNT(o) FROM Order o
        WHERE o.status IN ('ORNATISHGA_TAYINLANDI', 'ORNATISH_JARAYONIDA')
        AND o.installer IS NOT NULL
        """)
    long countBusyInstallers();

    @Query("""
        SELECT COUNT(DISTINCT o.installer.id) FROM Order o
        WHERE o.status IN ('ORNATISHGA_TAYINLANDI', 'ORNATISH_JARAYONIDA')
        AND o.installer IS NOT NULL
        """)
    long countDistinctBusyInstallers();

    @Query("""
        SELECT COUNT(o) FROM Order o
        WHERE o.status IN ('ORNATISH_BAJARILDI', 'TOLOV_KUTILMOQDA', 'YAKUNLANDI', 'QARZGA_OTKAZILDI')
        AND o.installer IS NOT NULL
        AND o.completedDate BETWEEN :start AND :end
        """)
    long countCompletedInstallationsBetween(@Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.customer WHERE o.installer.id = :installerId ORDER BY o.createdAt DESC")
    Page<Order> findByInstallerIdWithCustomer(@Param("installerId") Long installerId, Pageable pageable);
}
