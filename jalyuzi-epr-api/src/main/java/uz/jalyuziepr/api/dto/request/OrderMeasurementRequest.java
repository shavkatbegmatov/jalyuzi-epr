package uz.jalyuziepr.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderMeasurementRequest {

    @NotEmpty(message = "Kamida bitta o'lchov bo'lishi kerak")
    @Valid
    private List<MeasurementItem> items;

    private String notes;

    @Data
    public static class MeasurementItem {
        private Long itemId;
        private Long productId;
        private String roomName;
        private Integer widthMm;
        private Integer heightMm;
        private Integer depthMm;
        private Integer quantity;
        private BigDecimal customPrice;
        private Boolean installationIncluded;
    }
}
