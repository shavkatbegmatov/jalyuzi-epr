package uz.jalyuziepr.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.Installation;
import uz.jalyuziepr.api.enums.InstallationStatus;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InstallationRepository extends JpaRepository<Installation, Long> {

    List<Installation> findBySaleId(Long saleId);

    List<Installation> findByTechnicianId(Long technicianId);

    List<Installation> findByScheduledDate(LocalDate date);

    List<Installation> findByTechnicianIdAndScheduledDate(Long technicianId, LocalDate date);

    List<Installation> findByStatus(InstallationStatus status);

    @Query("SELECT i FROM Installation i " +
            "WHERE (:technicianId IS NULL OR i.technician.id = :technicianId) " +
            "AND (:status IS NULL OR i.status = :status) " +
            "AND (:startDate IS NULL OR i.scheduledDate >= :startDate) " +
            "AND (:endDate IS NULL OR i.scheduledDate <= :endDate)")
    Page<Installation> findWithFilters(
            @Param("technicianId") Long technicianId,
            @Param("status") InstallationStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    @Query("SELECT i FROM Installation i " +
            "WHERE i.scheduledDate BETWEEN :startDate AND :endDate " +
            "ORDER BY i.scheduledDate, i.scheduledTimeStart")
    List<Installation> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT i FROM Installation i " +
            "WHERE i.technician.id = :technicianId " +
            "AND i.scheduledDate BETWEEN :startDate AND :endDate " +
            "ORDER BY i.scheduledDate, i.scheduledTimeStart")
    List<Installation> findByTechnicianAndDateRange(
            @Param("technicianId") Long technicianId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COUNT(i) FROM Installation i " +
            "WHERE i.technician.id = :technicianId " +
            "AND i.scheduledDate = :date " +
            "AND i.status NOT IN ('CANCELLED', 'COMPLETED')")
    int countTechnicianInstallationsForDate(
            @Param("technicianId") Long technicianId,
            @Param("date") LocalDate date
    );

    @Query("SELECT COUNT(i) FROM Installation i WHERE i.status = :status")
    long countByStatus(@Param("status") InstallationStatus status);

    @Query("SELECT i FROM Installation i " +
            "WHERE i.status IN ('PENDING', 'SCHEDULED') " +
            "AND i.scheduledDate <= :date " +
            "ORDER BY i.scheduledDate")
    List<Installation> findUpcomingInstallations(@Param("date") LocalDate date);
}
