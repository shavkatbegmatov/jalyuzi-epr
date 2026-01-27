package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Validation rules for a product type attribute.
 * Used in JSONB serialization for attribute_schema column.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationRules implements Serializable {

    /**
     * Whether the field is required.
     */
    private Boolean required;

    /**
     * Minimum value for NUMBER/DECIMAL types.
     */
    private Double min;

    /**
     * Maximum value for NUMBER/DECIMAL types.
     */
    private Double max;

    /**
     * Minimum length for TEXT type.
     */
    private Integer minLength;

    /**
     * Maximum length for TEXT type.
     */
    private Integer maxLength;

    /**
     * Regex pattern for TEXT type validation.
     */
    private String pattern;

    /**
     * Custom validation error message.
     */
    private String message;
}
