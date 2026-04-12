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
public class InstallerStatsResponse {
    private Long totalInstallers;
    private Long activeInstallers;
    private Long busyNow;
    private Long completedToday;
    private Long completedThisMonth;
    private BigDecimal totalCollectedAmount;
}
