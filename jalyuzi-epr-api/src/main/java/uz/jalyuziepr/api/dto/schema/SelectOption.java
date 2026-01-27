package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Option for SELECT/MULTISELECT attribute types.
 * Used in JSONB serialization for attribute_schema column.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SelectOption implements Serializable {

    /**
     * The value stored in the database.
     * Example: "ROLLER", "VERTICAL", "HORIZONTAL"
     */
    private String value;

    /**
     * The display label shown in the UI.
     * Example: "Roletka", "Vertikal jalyuzi", "Gorizontal jalyuzi"
     */
    private String label;
}
