package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstallerResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private String username;
    private Boolean active;

    // Statistika
    private Long activeOrdersCount;
    private Long completedOrdersCount;
    private BigDecimal totalCollectedAmount;
    private String currentOrderNumber;
}
