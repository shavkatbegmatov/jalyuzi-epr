package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.ProductionMaterial;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductionMaterialRepository extends JpaRepository<ProductionMaterial, Long> {

    List<ProductionMaterial> findByProductionOrderId(Long productionOrderId);

    @Query("SELECT COALESCE(SUM(m.totalCost), 0) FROM ProductionMaterial m WHERE m.productionOrder.id = :productionOrderId")
    BigDecimal sumTotalCostByProductionOrder(@Param("productionOrderId") Long productionOrderId);

    @Query("SELECT COALESCE(SUM(m.quantityWasted), 0) FROM ProductionMaterial m WHERE m.product.id = :productId")
    BigDecimal sumWastedByProduct(@Param("productId") Long productId);
}
