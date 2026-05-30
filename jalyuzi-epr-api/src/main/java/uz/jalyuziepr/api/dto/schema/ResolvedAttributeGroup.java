package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * An attribute group after cascade resolution, with provenance.
 * Read/UI only — never persisted.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolvedAttributeGroup implements Serializable {

    private String key;
    private String label;
    private Integer order;

    /**
     * Family node that last defined/overrode this group.
     */
    private Long ownerFamilyId;

    /**
     * True if a descendant overrode an ancestor's group definition.
     */
    private boolean overridden;
}
