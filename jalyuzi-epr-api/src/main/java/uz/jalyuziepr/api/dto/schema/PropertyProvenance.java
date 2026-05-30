package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Records where a single resolved property value came from during cascade merge.
 * Used only for read/UI ({@link ResolvedAttributeDefinition}); never persisted.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyProvenance implements Serializable {

    /**
     * The AttributeFamily node that supplied this property's effective value.
     */
    private Long sourceFamilyId;

    /**
     * Code of the source family node (for UI badges/tooltips).
     */
    private String sourceFamilyCode;

    /**
     * True if this property overrode an ancestor's value; false if first defined here.
     */
    private boolean overridden;
}
