package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.enums.ControlType;

import java.math.BigDecimal;

/**
 * Buyurtma elementi javobi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;

    // Jalyuzi xususiyatlari
    private String blindTypeName;
    private String materialName;
    private String color;
    private ControlType controlType;
    private String controlTypeName;

    // O'lchamlar
    private Integer width;
    private Integer height;
    private BigDecimal squareMeters;

    // Narxlar
    private BigDecimal unitPrice;
    private BigDecimal installationPrice;
    private Integer quantity;
    private BigDecimal totalPrice;

    private String notes;
    private String imageUrl;
}
