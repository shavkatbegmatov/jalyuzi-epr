package uz.jalyuziepr.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.WarrantyClaim;
import uz.jalyuziepr.api.enums.WarrantyClaimStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarrantyClaimRepository extends JpaRepository<WarrantyClaim, Long> {

    @Query("SELECT c FROM WarrantyClaim c " +
            "LEFT JOIN FETCH c.order " +
            "LEFT JOIN FETCH c.customer " +
            "LEFT JOIN FETCH c.assignedTo " +
            "WHERE c.id = :id")
    Optional<WarrantyClaim> findByIdWithDetails(@Param("id") Long id);

    Page<WarrantyClaim> findByStatus(WarrantyClaimStatus status, Pageable pageable);

    Page<WarrantyClaim> findByCustomerId(Long customerId, Pageable pageable);

    List<WarrantyClaim> findByOrderId(Long orderId);

    @Query("SELECT COUNT(c) FROM WarrantyClaim c WHERE c.claimNumber LIKE :prefix")
    long countByClaimNumberPrefix(@Param("prefix") String prefix);

    @Query("SELECT COUNT(c) FROM WarrantyClaim c WHERE c.status = :status")
    long countByStatus(@Param("status") WarrantyClaimStatus status);
}
