package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Sparse override applied by an AttributeFamily node to an INHERITED attribute.
 * <p>
 * Only the changed properties are stored ({@code changedProps}), keyed by the
 * AttributeDefinition property name (e.g. "label", "required", "defaultValue",
 * "options", "validation"). A property that is not present is inherited from the
 * ancestor — this resolves the "null = inherit vs null = clear" ambiguity that a
 * full AttributeDefinition delta would have.
 * <p>
 * Stored as part of the JSONB {@code overrides} list on an AttributeFamily.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeOverride implements Serializable {

    /**
     * The key of the inherited attribute this override applies to.
     */
    private String key;

    /**
     * Only the properties that this node changes. Keys are AttributeDefinition
     * property names. {@code dataType} changes are rejected by the service layer.
     */
    @Builder.Default
    private Map<String, Object> changedProps = new LinkedHashMap<>();
}
