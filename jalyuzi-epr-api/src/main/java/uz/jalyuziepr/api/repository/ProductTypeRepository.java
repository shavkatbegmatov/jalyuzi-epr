package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.ProductType;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductTypeRepository extends JpaRepository<ProductType, Long> {

    /**
     * Find all active product types ordered by display order.
     */
    List<ProductType> findByIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * Find all product types (including inactive) ordered by display order.
     */
    List<ProductType> findAllByOrderByDisplayOrderAsc();

    /**
     * Find product type by code.
     */
    Optional<ProductType> findByCode(String code);

    /**
     * Check if a product type with given code exists.
     */
    boolean existsByCode(String code);

    /**
     * Count products using this product type.
     */
    @Query("SELECT COUNT(p) FROM Product p WHERE p.productTypeEntity.id = :productTypeId")
    long countProductsByProductTypeId(Long productTypeId);
}
