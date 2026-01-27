package uz.jalyuziepr.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.Product;
import uz.jalyuziepr.api.enums.BlindMaterial;
import uz.jalyuziepr.api.enums.BlindType;
import uz.jalyuziepr.api.enums.ControlType;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Product> findByActiveTrue();

    Page<Product> findByActiveTrue(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.brand.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchProducts(@Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM Product p " +
            "LEFT JOIN p.brand b " +
            "LEFT JOIN p.category c " +
            "WHERE p.active = true " +
            "AND (:brandId IS NULL OR b.id = :brandId) " +
            "AND (:categoryId IS NULL OR c.id = :categoryId) " +
            "AND (:blindType IS NULL OR p.blindType = :blindType) " +
            "AND (:material IS NULL OR p.material = :material) " +
            "AND (:controlType IS NULL OR p.controlType = :controlType) " +
            "AND (:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> findWithFilters(
            @Param("brandId") Long brandId,
            @Param("categoryId") Long categoryId,
            @Param("blindType") BlindType blindType,
            @Param("material") BlindMaterial material,
            @Param("controlType") ControlType controlType,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.quantity <= p.minStockLevel")
    List<Product> findLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true")
    long countActiveProducts();

    @Query("SELECT SUM(p.quantity) FROM Product p WHERE p.active = true")
    Long getTotalStock();

    List<Product> findByBrandIdAndActiveTrue(Long brandId);

    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);

    List<Product> findByBlindTypeAndActiveTrue(BlindType blindType);

    List<Product> findByMaterialAndActiveTrue(BlindMaterial material);

    List<Product> findByControlTypeAndActiveTrue(ControlType controlType);
}
