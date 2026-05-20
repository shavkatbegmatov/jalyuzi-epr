package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.ProductionStage;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionStageRepository extends JpaRepository<ProductionStage, Long> {

    List<ProductionStage> findAllByIsActiveTrueOrderBySequenceAsc();

    Optional<ProductionStage> findByCode(String code);

    Optional<ProductionStage> findFirstByIsActiveTrueOrderBySequenceAsc();
}
