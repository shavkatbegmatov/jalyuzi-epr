package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * Definition of a single attribute in the product type schema.
 * Used in JSONB serialization for attribute_schema column.
 *
 * Supported data types:
 * - text: Single-line text input
 * - number: Integer number input
 * - decimal: Decimal number input (with step)
 * - currency: Currency input (formatted)
 * - boolean: Checkbox/toggle
 * - date: Date picker
 * - select: Single-select dropdown
 * - multiselect: Multi-select dropdown/checkboxes
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeDefinition implements Serializable {

    /**
     * Unique key for the attribute (camelCase).
     * Example: "blindType", "minWidth", "pricePerSquareMeter"
     */
    private String key;

    /**
     * Display label for the attribute.
     * Example: "Jalyuzi turi", "Min kenglik", "Narx/m²"
     */
    private String label;

    /**
     * Data type of the attribute.
     * Values: text, number, decimal, currency, boolean, date, select, multiselect
     */
    private String dataType;

    /**
     * Group key this attribute belongs to.
     * References AttributeGroup.key
     */
    private String group;

    /**
     * Display order within the group.
     */
    @Builder.Default
    private Integer order = 0;

    /**
     * Unit of measurement (displayed after the label).
     * Example: "mm", "m", "kg", "UZS"
     */
    private String unit;

    /**
     * Placeholder text for the input field.
     */
    private String placeholder;

    /**
     * Help text shown below the input field.
     */
    private String helpText;

    /**
     * Default value for new products.
     */
    private Object defaultValue;

    /**
     * Whether the attribute is required.
     */
    @Builder.Default
    private Boolean required = false;

    /**
     * Whether the attribute is read-only.
     */
    @Builder.Default
    private Boolean readonly = false;

    /**
     * Whether the attribute is searchable in product listings.
     */
    @Builder.Default
    private Boolean searchable = false;

    /**
     * Whether the attribute is filterable in product listings.
     */
    @Builder.Default
    private Boolean filterable = false;

    /**
     * Whether the attribute is sortable in product listings.
     */
    @Builder.Default
    private Boolean sortable = false;

    /**
     * Options for SELECT/MULTISELECT data types.
     */
    private List<SelectOption> options;

    /**
     * Validation rules for the attribute.
     */
    private ValidationRules validation;
}
