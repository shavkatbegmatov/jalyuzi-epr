package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.AttributeFamily;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttributeFamilyRepository extends JpaRepository<AttributeFamily, Long> {

    /**
     * All active families ordered for in-memory tree assembly (root first).
     */
    List<AttributeFamily> findByIsActiveTrueOrderByDepthAscDisplayOrderAscIdAsc();

    /**
     * Active root nodes.
     */
    List<AttributeFamily> findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAscIdAsc();

    /**
     * Active direct children of a node.
     */
    List<AttributeFamily> findByParentIdAndIsActiveTrueOrderByDisplayOrderAscIdAsc(Long parentId);

    Optional<AttributeFamily> findByCode(String code);

    boolean existsByCode(String code);

    /**
     * Count active children — a node with 0 is a LEAF.
     */
    long countByParentIdAndIsActiveTrue(Long parentId);

    /**
     * Descendants by materialized path prefix (for move/path rewrite).
     */
    List<AttributeFamily> findByPathStartingWith(String pathPrefix);

    /**
     * Products created against this family node.
     */
    @Query("SELECT COUNT(p) FROM Product p WHERE p.attributeFamily.id = :familyId")
    long countProductsByAttributeFamilyId(Long familyId);

    /**
     * Whether a node is a leaf (no active children).
     */
    default boolean isLeaf(Long familyId) {
        return countByParentIdAndIsActiveTrue(familyId) == 0;
    }
}
