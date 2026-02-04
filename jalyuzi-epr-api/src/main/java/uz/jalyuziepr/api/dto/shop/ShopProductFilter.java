package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.enums.BlindMaterial;
import uz.jalyuziepr.api.enums.BlindType;
import uz.jalyuziepr.api.enums.ControlType;

import java.math.BigDecimal;
import java.util.List;

/**
 * Katalog uchun filtrlash parametrlari
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopProductFilter {
    // Asosiy filtrlar
    private String search;
    private Long categoryId;
    private Long brandId;

    // Jalyuzi turlari bo'yicha filter
    private List<BlindType> blindTypes;

    // Material bo'yicha filter
    private List<BlindMaterial> materials;

    // Boshqaruv turi bo'yicha filter
    private List<ControlType> controlTypes;

    // Rang bo'yicha filter
    private List<String> colors;

    // Narx oralig'i
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    // O'lcham bo'yicha filter (mm)
    private Integer width;
    private Integer height;

    // Kolleksiya
    private String collection;

    // Mahsulot turi
    private Long productTypeId;
    private String productTypeCode;

    // Faqat mavjud mahsulotlar
    @Builder.Default
    private boolean inStockOnly = false;

    // Saralash
    private String sortBy; // price, name, newest
    private String sortDirection; // asc, desc
}
