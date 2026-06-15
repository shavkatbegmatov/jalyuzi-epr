package uz.jalyuziepr.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Qayta o'lchov narx kotirovkasi (saqlanmaydi — faqat onlik ko'rsatish uchun).
 */
@Data
@Builder
public class RemeasureQuoteResponse {
    private Integer oldWidthMm;
    private Integer oldHeightMm;
    private BigDecimal oldTotalPrice;
    private Integer newWidthMm;
    private Integer newHeightMm;
    private BigDecimal newCalculatedSqm;
    private BigDecimal newUnitPrice;
    private BigDecimal newTotalPrice;
    private BigDecimal delta; // newTotalPrice - oldTotalPrice (+ qimmatlashdi, - arzonlashdi)
}
