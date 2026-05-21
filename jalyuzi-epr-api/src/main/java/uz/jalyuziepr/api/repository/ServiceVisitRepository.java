package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.ServiceVisit;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ServiceVisitRepository extends JpaRepository<ServiceVisit, Long> {

    List<ServiceVisit> findByClaimIdOrderByScheduledDateAsc(Long claimId);

    List<ServiceVisit> findByTechnicianIdAndScheduledDate(Long technicianId, LocalDate scheduledDate);
}
