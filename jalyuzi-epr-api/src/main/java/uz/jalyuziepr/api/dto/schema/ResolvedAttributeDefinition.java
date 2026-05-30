package uz.jalyuziepr.api.dto.schema;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * An attribute definition AFTER property-level cascade resolution (root -> leaf).
 * <p>
 * Extends {@link AttributeDefinition} so the JSON contract carries every base
 * field plus provenance metadata. This type is read/UI only and is NEVER
 * persisted to JSONB (the {@code attribute_schema}/{@code overrides} columns only
 * ever store plain {@link AttributeDefinition}/{@link AttributeOverride}).
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class ResolvedAttributeDefinition extends AttributeDefinition {

    /** OWN | INHERITED | OVERRIDDEN */
    public static final String ORIGIN_OWN = "OWN";
    public static final String ORIGIN_INHERITED = "INHERITED";
    public static final String ORIGIN_OVERRIDDEN = "OVERRIDDEN";

    /**
     * Family node where this attribute key was first declared.
     */
    private Long ownerFamilyId;

    /**
     * Origin relative to the LEAF being resolved: OWN (declared on the leaf),
     * INHERITED (from an ancestor, unchanged below), OVERRIDDEN (inherited but a
     * descendant changed one or more properties).
     */
    private String origin;

    /**
     * Per-property provenance, keyed by AttributeDefinition property name (and
     * dotted keys for nested validation, e.g. "validation.min").
     */
    private Map<String, PropertyProvenance> propertyProvenance = new LinkedHashMap<>();
}
