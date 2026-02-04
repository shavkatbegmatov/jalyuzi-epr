package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.enums.BlindMaterial;

/**
 * Material javobi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopMaterialResponse {
    private String code;
    private String name;
    private String description;
    private Long productCount;

    public static ShopMaterialResponse from(BlindMaterial material) {
        return ShopMaterialResponse.builder()
                .code(material.name())
                .name(material.getDisplayName())
                .description(getDescription(material))
                .build();
    }

    public static ShopMaterialResponse from(BlindMaterial material, Long productCount) {
        return ShopMaterialResponse.builder()
                .code(material.name())
                .name(material.getDisplayName())
                .description(getDescription(material))
                .productCount(productCount)
                .build();
    }

    private static String getDescription(BlindMaterial material) {
        return switch (material) {
            case FABRIC -> "Mato - yumshoq va tabiiy ko'rinish";
            case POLYESTER -> "Polyester - chidamli va oson tozalash";
            case ALUMINUM -> "Alyuminiy - zamonaviy va mustahkam";
            case WOOD -> "Yog'och - tabiiy va issiq ko'rinish";
            case BAMBOO -> "Bambuk - ekologik toza va chiroyli";
            case PVC -> "PVC - iqtisodiy va amaliy";
            case BLACKOUT -> "Blackout - to'liq qorong'ulik uchun";
            case DIMOUT -> "Dimout - yorug'likni kamaytirish uchun";
            case SCREEN -> "Screen - quyosh nurini filtrlash uchun";
            case FAUX_WOOD -> "Sun'iy yog'och - yog'och ko'rinishi, PVC chidamliligi";
        };
    }
}
