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
public class DashboardStatsResponse {
    private long todaySalesCount;
    private BigDecimal todayRevenue;
    private BigDecimal totalRevenue;
    private long totalProducts;
    private Long totalStock;
    private long lowStockCount;
    private long totalCustomers;
    private BigDecimal totalDebt;

    // Bugungi ish kuni statistikasi (Order tizimi V27)
    private long todayOrdersCount;          // Bugun yaratilgan buyurtmalar
    private long todayMeasurementsCount;    // Bugun o'lchov o'tkazilgan
    private long todayInstallationsCount;   // Bugun o'rnatish bajarilgan
    private long todayPaymentsCount;        // Bugun qabul qilingan to'lovlar soni
    private BigDecimal todayPaymentsCollected; // Bugun yig'ilgan to'lovlar yig'indisi
}
