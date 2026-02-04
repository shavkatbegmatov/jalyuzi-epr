package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Narx hisoblash natijasi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPriceCalculateResponse {

    // Kiritilgan o'lchamlar
    private Integer width;
    private Integer height;
    private BigDecimal squareMeters;

    // Narxlar
    private BigDecimal productPrice;      // Mahsulot narxi
    private BigDecimal installationPrice; // O'rnatish narxi
    private BigDecimal unitTotal;         // Bir dona jami

    // Miqdor bo'yicha
    private Integer quantity;
    private BigDecimal subtotal;          // Mahsulotlar jami
    private BigDecimal installationTotal; // O'rnatish jami
    private BigDecimal grandTotal;        // Umumiy jami

    // Qo'shimcha ma'lumotlar
    private String productName;
    private String blindTypeName;
    private String materialName;
    private String controlTypeName;

    // O'lcham validatsiyasi
    private boolean validDimensions;
    private String dimensionError;
}
