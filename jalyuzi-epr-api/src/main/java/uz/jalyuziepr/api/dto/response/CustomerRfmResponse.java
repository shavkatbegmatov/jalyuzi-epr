package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * RFM (Recency / Frequency / Monetary) mijoz segmentatsiyasi natijasi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRfmResponse {

    private List<SegmentSummary> segments;
    private List<CustomerRfm> customers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SegmentSummary {
        private String segment;       // CHAMPION, LOYAL, ...
        private String label;         // o'zbekcha
        private long count;
        private BigDecimal totalMonetary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerRfm {
        private Long customerId;
        private String name;
        private String phone;
        private long orderCount;        // Frequency
        private BigDecimal totalSpent;   // Monetary
        private LocalDateTime lastOrderAt;
        private Integer recencyDays;     // Recency
        private String segment;
        private String segmentLabel;
    }
}
