package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.OrderItem;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private String roomName;
    private Integer widthMm;
    private Integer heightMm;
    private Integer depthMm;
    private BigDecimal calculatedSqm;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal installationPrice;
    private BigDecimal discount;
    private BigDecimal totalPrice;
    private BigDecimal costPrice;
    private Boolean installationIncluded;

    public static OrderItemResponse from(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .productSku(item.getProduct() != null ? item.getProduct().getSku() : null)
                .roomName(item.getRoomName())
                .widthMm(item.getWidthMm())
                .heightMm(item.getHeightMm())
                .depthMm(item.getDepthMm())
                .calculatedSqm(item.getCalculatedSqm())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .installationPrice(item.getInstallationPrice())
                .discount(item.getDiscount())
                .totalPrice(item.getTotalPrice())
                .costPrice(item.getCostPrice())
                .installationIncluded(item.getInstallationIncluded())
                .build();
    }
}
