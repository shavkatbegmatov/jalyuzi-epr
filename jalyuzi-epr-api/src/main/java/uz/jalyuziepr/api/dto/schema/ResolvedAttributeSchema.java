package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * The fully resolved (effective) attribute schema for a leaf AttributeFamily.
 * Produced by {@code AttributeSchemaResolver}; consumed by the product form and
 * the value validator. Read/UI only — never persisted.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolvedAttributeSchema implements Serializable {

    @Builder.Default
    private List<ResolvedAttributeGroup> groups = new ArrayList<>();

    @Builder.Default
    private List<ResolvedAttributeDefinition> attributes = new ArrayList<>();

    /**
     * The leaf family this schema was resolved for.
     */
    private Long leafFamilyId;

    /**
     * Root-to-leaf breadcrumb (for UI).
     */
    @Builder.Default
    private List<FamilyPathNode> resolutionPath = new ArrayList<>();

    /**
     * Find a resolved attribute by key, or null.
     */
    public ResolvedAttributeDefinition findAttribute(String key) {
        if (attributes == null) return null;
        return attributes.stream()
                .filter(a -> key.equals(a.getKey()))
                .findFirst()
                .orElse(null);
    }
}
