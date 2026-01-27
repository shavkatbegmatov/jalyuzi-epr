package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Complete schema for a product type's attributes.
 * Stored as JSONB in the product_types.attribute_schema column.
 *
 * This schema defines:
 * - Groups: Sections to organize attributes in the form
 * - Attributes: Individual fields with their properties, validation rules, and UI hints
 *
 * Example:
 * <pre>
 * {
 *   "groups": [
 *     {"key": "dimensions", "label": "O'lchamlar", "order": 1}
 *   ],
 *   "attributes": [
 *     {
 *       "key": "minWidth",
 *       "label": "Min kenglik",
 *       "dataType": "number",
 *       "group": "dimensions",
 *       "unit": "mm",
 *       "validation": {"min": 100, "max": 5000}
 *     }
 *   ]
 * }
 * </pre>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeSchema implements Serializable {

    /**
     * Groups for organizing attributes in the form.
     */
    @Builder.Default
    private List<AttributeGroup> groups = new ArrayList<>();

    /**
     * List of attribute definitions.
     */
    @Builder.Default
    private List<AttributeDefinition> attributes = new ArrayList<>();

    /**
     * Find an attribute definition by key.
     *
     * @param key the attribute key
     * @return the attribute definition, or null if not found
     */
    public AttributeDefinition findAttribute(String key) {
        if (attributes == null) return null;
        return attributes.stream()
                .filter(attr -> attr.getKey().equals(key))
                .findFirst()
                .orElse(null);
    }

    /**
     * Get all required attribute keys.
     *
     * @return list of required attribute keys
     */
    public List<String> getRequiredAttributeKeys() {
        if (attributes == null) return List.of();
        return attributes.stream()
                .filter(attr -> Boolean.TRUE.equals(attr.getRequired()))
                .map(AttributeDefinition::getKey)
                .toList();
    }
}
