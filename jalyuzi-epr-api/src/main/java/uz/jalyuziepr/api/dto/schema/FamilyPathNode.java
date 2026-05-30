package uz.jalyuziepr.api.dto.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * One node in the root-to-leaf resolution path (breadcrumb) of an effective schema.
 * Read/UI only.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyPathNode implements Serializable {
    private Long id;
    private String code;
    private String name;
}
