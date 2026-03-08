package uz.jalyuziepr.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderCreateRequest {

    @NotNull(message = "Mijoz tanlanishi shart")
    private Long customerId;

    private String installationAddress;

    private String notes;

    private BigDecimal discountAmount;
    private BigDecimal discountPercent;

    @NotEmpty(message = "Kamida bitta mahsulot bo'lishi kerak")
    @Valid
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        @NotNull(message = "Mahsulot tanlanishi shart")
        private Long productId;

        private String roomName;
        private Integer widthMm;
        private Integer heightMm;
        private Integer depthMm;
        private Integer quantity = 1;
        private BigDecimal customPrice;
        private BigDecimal discount;
        private Boolean installationIncluded = false;
    }
}
