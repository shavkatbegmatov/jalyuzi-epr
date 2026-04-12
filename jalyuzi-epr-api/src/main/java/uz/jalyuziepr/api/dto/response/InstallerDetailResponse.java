package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstallerDetailResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private String username;
    private Boolean active;
    private LocalDateTime createdAt;

    // Statistika
    private Long activeOrdersCount;
    private Long completedOrdersCount;
    private BigDecimal totalCollectedAmount;
    private String currentOrderNumber;

    // Kengaytirilgan statistika
    private Long completedThisMonth;
    private Long completedLastMonth;
    private Double avgCompletionHours;
}
