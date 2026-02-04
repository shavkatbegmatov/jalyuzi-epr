package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.Product;
import uz.jalyuziepr.api.enums.BlindMaterial;
import uz.jalyuziepr.api.enums.BlindType;
import uz.jalyuziepr.api.enums.ControlType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Internet-do'kon uchun mahsulot DTO
 * Faqat mijozga ko'rinadigan ma'lumotlarni o'z ichiga oladi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopProductResponse {
    private Long id;
    private String sku;
    private String name;
    private String description;

    // Kategoriya va brend
    private Long brandId;
    private String brandName;
    private Long categoryId;
    private String categoryName;

    // Jalyuzi xususiyatlari
    private BlindType blindType;
    private String blindTypeName;
    private BlindMaterial material;
    private String materialName;
    private String color;
    private ControlType controlType;
    private String controlTypeName;

    // Mahsulot turi (yangi tizim)
    private Long productTypeId;
    private String productTypeCode;
    private String productTypeName;

    // Dinamik atributlar (shop uchun kerakli maydonlar)
    private Map<String, Object> attributes;

    // O'lcham cheklovlari (mm)
    private Integer minWidth;
    private Integer maxWidth;
    private Integer minHeight;
    private Integer maxHeight;

    // Narxlar
    private BigDecimal pricePerSquareMeter;
    private BigDecimal installationPrice;
    private BigDecimal basePrice; // Asosiy narx (sellingPrice)

    // Rasmlar
    private String imageUrl;
    private List<String> galleryImages;

    // Mavjudlik
    private boolean inStock;

    // Kolleksiya (agar mavjud bo'lsa)
    private String collection;

    public static ShopProductResponse from(Product product) {
        return ShopProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .description(product.getDescription())
                .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .blindType(product.getBlindType())
                .blindTypeName(product.getBlindType() != null ? product.getBlindType().getDisplayName() : null)
                .material(product.getMaterial())
                .materialName(product.getMaterial() != null ? product.getMaterial().getDisplayName() : null)
                .color(product.getColor())
                .controlType(product.getControlType())
                .controlTypeName(product.getControlType() != null ? product.getControlType().getDisplayName() : null)
                .productTypeId(product.getProductTypeEntity() != null ? product.getProductTypeEntity().getId() : null)
                .productTypeCode(product.getProductTypeEntity() != null ? product.getProductTypeEntity().getCode() : null)
                .productTypeName(product.getProductTypeEntity() != null ? product.getProductTypeEntity().getName() : null)
                .attributes(product.getCustomAttributes())
                .minWidth(product.getMinWidth())
                .maxWidth(product.getMaxWidth())
                .minHeight(product.getMinHeight())
                .maxHeight(product.getMaxHeight())
                .pricePerSquareMeter(product.getPricePerSquareMeter())
                .installationPrice(product.getInstallationPrice())
                .basePrice(product.getSellingPrice())
                .imageUrl(product.getImageUrl())
                .inStock(product.getQuantity() != null && product.getQuantity().compareTo(BigDecimal.ZERO) > 0)
                .collection(product.getCustomAttribute("collection"))
                .build();
    }
}
