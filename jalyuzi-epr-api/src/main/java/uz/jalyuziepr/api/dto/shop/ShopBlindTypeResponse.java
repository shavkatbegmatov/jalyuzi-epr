package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.enums.BlindType;

/**
 * Jalyuzi turi javobi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopBlindTypeResponse {
    private String code;
    private String name;
    private String description;
    private String imageUrl;
    private Long productCount;

    public static ShopBlindTypeResponse from(BlindType blindType) {
        return ShopBlindTypeResponse.builder()
                .code(blindType.name())
                .name(blindType.getDisplayName())
                .description(getDescription(blindType))
                .build();
    }

    public static ShopBlindTypeResponse from(BlindType blindType, Long productCount) {
        return ShopBlindTypeResponse.builder()
                .code(blindType.name())
                .name(blindType.getDisplayName())
                .description(getDescription(blindType))
                .productCount(productCount)
                .build();
    }

    private static String getDescription(BlindType type) {
        return switch (type) {
            case ROLLER -> "Klassik roletka - oson boshqarish va zamonaviy dizayn";
            case VERTICAL -> "Vertikal jalyuzi - ofis va katta derazalar uchun ideal";
            case HORIZONTAL -> "Gorizontal jalyuzi - universal yechim";
            case ROMAN -> "Rim pardasi - zarafatli va klassik ko'rinish";
            case ZEBRA -> "Zebra - yorug'likni nazorat qilish uchun mukammal";
            case DAY_NIGHT -> "Kun-Tun - ikki funksiya bir mahsulotda";
            case PLEATED -> "Plisse - nozik va elegant";
            case CELLULAR -> "Uyali - issiqlik va tovushni izolyatsiya qiladi";
            case MOTORIZED -> "Motorli - qulay va zamonaviy";
            case SHUTTERS -> "Shutterlar - klassik va chidamli";
        };
    }
}
