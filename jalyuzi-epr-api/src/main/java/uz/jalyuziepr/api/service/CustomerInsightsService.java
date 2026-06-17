package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.response.CustomerRfmResponse;
import uz.jalyuziepr.api.repository.OrderRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * RFM (Recency / Frequency / Monetary) mijoz segmentatsiyasi.
 * Buyurtmalar agregatidan har mijozni segmentga ajratadi (egasi uchun analitika).
 * Read-only — hech narsa o'zgartirmaydi.
 */
@Service
@RequiredArgsConstructor
public class CustomerInsightsService {

    private final OrderRepository orderRepository;

    // Segment tartibi + o'zbekcha yorliqlar (ko'rsatish tartibi)
    private static final String[][] SEGMENTS = {
            {"CHAMPION", "Champion"},
            {"LOYAL", "Sodiq"},
            {"NEW", "Yangi"},
            {"AT_RISK", "Xavf ostida"},
            {"DORMANT", "Uxlab qolgan"},
            {"LOST", "Yo'qolgan"},
            {"REGULAR", "Oddiy"},
    };

    @Transactional(readOnly = true)
    public CustomerRfmResponse getRfmInsights() {
        LocalDateTime now = LocalDateTime.now();
        List<Object[]> rows = orderRepository.findCustomerOrderAggregates();

        List<CustomerRfmResponse.CustomerRfm> customers = new ArrayList<>();
        for (Object[] r : rows) {
            long orderCount = ((Number) r[3]).longValue();
            BigDecimal totalSpent = r[4] != null ? (BigDecimal) r[4] : BigDecimal.ZERO;
            LocalDateTime lastOrderAt = (LocalDateTime) r[5];
            Integer recencyDays = lastOrderAt != null
                    ? (int) ChronoUnit.DAYS.between(lastOrderAt, now)
                    : null;
            String segment = segmentOf(orderCount, recencyDays);

            customers.add(CustomerRfmResponse.CustomerRfm.builder()
                    .customerId(((Number) r[0]).longValue())
                    .name((String) r[1])
                    .phone((String) r[2])
                    .orderCount(orderCount)
                    .totalSpent(totalSpent)
                    .lastOrderAt(lastOrderAt)
                    .recencyDays(recencyDays)
                    .segment(segment)
                    .segmentLabel(labelOf(segment))
                    .build());
        }

        // Eng qimmatli mijozlar tepada
        customers.sort(Comparator.comparing(
                CustomerRfmResponse.CustomerRfm::getTotalSpent,
                Comparator.nullsLast(Comparator.reverseOrder())));

        // Segment xulosalari
        Map<String, long[]> count = new LinkedHashMap<>();
        Map<String, BigDecimal> money = new LinkedHashMap<>();
        for (String[] s : SEGMENTS) {
            count.put(s[0], new long[]{0});
            money.put(s[0], BigDecimal.ZERO);
        }
        for (CustomerRfmResponse.CustomerRfm c : customers) {
            count.get(c.getSegment())[0]++;
            money.put(c.getSegment(),
                    money.get(c.getSegment()).add(c.getTotalSpent() != null ? c.getTotalSpent() : BigDecimal.ZERO));
        }

        List<CustomerRfmResponse.SegmentSummary> segments = new ArrayList<>();
        for (String[] s : SEGMENTS) {
            segments.add(CustomerRfmResponse.SegmentSummary.builder()
                    .segment(s[0])
                    .label(s[1])
                    .count(count.get(s[0])[0])
                    .totalMonetary(money.get(s[0]))
                    .build());
        }

        return CustomerRfmResponse.builder().segments(segments).customers(customers).build();
    }

    private String segmentOf(long freq, Integer recencyDays) {
        int r = recencyDays != null ? recencyDays : Integer.MAX_VALUE;
        if (r > 365) return "LOST";
        if (r > 180) return freq >= 2 ? "AT_RISK" : "DORMANT";
        if (freq >= 2 && r <= 90) return "CHAMPION";
        if (freq >= 2) return "LOYAL";
        if (freq == 1 && r <= 90) return "NEW";
        return "REGULAR";
    }

    private String labelOf(String segment) {
        for (String[] s : SEGMENTS) {
            if (s[0].equals(segment)) return s[1];
        }
        return segment;
    }
}
