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
public class PriceCalculationResponse {

    private Long productId;
    private String productName;

    // O'lcham (mm)
    private Integer width;
    private Integer height;

    // Hisoblangan qiymatlar
    private BigDecimal squareMeters;
    private BigDecimal productPrice;
    private BigDecimal installationPrice;
    private BigDecimal totalPrice;

    // Narx ma'lumotlari
    private BigDecimal pricePerSquareMeter;
    private BigDecimal basePrice;

    // Validatsiya
    private boolean validSize;
    private String validationMessage;
}
