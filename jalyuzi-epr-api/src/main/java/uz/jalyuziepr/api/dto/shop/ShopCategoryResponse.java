package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.Category;

/**
 * Kategoriya javobi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopCategoryResponse {
    private Long id;
    private String name;
    private String description;
    private Long productCount;

    public static ShopCategoryResponse from(Category category) {
        return ShopCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }

    public static ShopCategoryResponse from(Category category, Long productCount) {
        return ShopCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .productCount(productCount)
                .build();
    }
}
