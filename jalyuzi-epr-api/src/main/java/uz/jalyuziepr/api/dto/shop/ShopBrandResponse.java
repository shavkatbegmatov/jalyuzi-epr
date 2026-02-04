package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.Brand;

/**
 * Brend javobi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopBrandResponse {
    private Long id;
    private String name;
    private String description;
    private String logoUrl;
    private Long productCount;

    public static ShopBrandResponse from(Brand brand) {
        return ShopBrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .description(brand.getDescription())
                .build();
    }

    public static ShopBrandResponse from(Brand brand, Long productCount) {
        return ShopBrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .description(brand.getDescription())
                .productCount(productCount)
                .build();
    }
}
