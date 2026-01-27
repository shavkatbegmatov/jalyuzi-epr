package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Group for organizing attributes in the product form.
 * Used in JSONB serialization for attribute_schema column.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeGroup implements Serializable {

    /**
     * Unique key for the group.
     * Example: "dimensions", "pricing", "blind_properties"
     */
    private String key;

    /**
     * Display label for the group.
     * Example: "O'lchamlar", "Narxlar", "Jalyuzi xususiyatlari"
     */
    private String label;

    /**
     * Display order of the group in the form.
     */
    @Builder.Default
    private Integer order = 0;
}
