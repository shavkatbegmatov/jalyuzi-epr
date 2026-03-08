package uz.jalyuziepr.api.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OrderStatus {
    YANGI("Yangi", 1),
    OLCHOV_KUTILMOQDA("O'lchov kutilmoqda", 2),
    OLCHOV_BAJARILDI("O'lchov bajarildi", 3),
    NARX_TASDIQLANDI("Narx tasdiqlandi", 4),
    ZAKLAD_QABUL_QILINDI("Zaklad qabul qilindi", 5),
    ISHLAB_CHIQARISHDA("Ishlab chiqarishda", 6),
    TAYYOR("Tayyor", 7),
    ORNATISHGA_TAYINLANDI("O'rnatishga tayinlandi", 8),
    ORNATISH_JARAYONIDA("O'rnatish jarayonida", 9),
    ORNATISH_BAJARILDI("O'rnatish bajarildi", 10),
    TOLOV_KUTILMOQDA("To'lov kutilmoqda", 11),
    YAKUNLANDI("Yakunlandi", 12),
    QARZGA_OTKAZILDI("Qarzga o'tkazildi", 13),
    BEKOR_QILINDI("Bekor qilindi", 14);

    private final String displayName;
    private final int order;

    /**
     * Berilgan statusdan keyingi ruxsat etilgan statuslarni tekshirish
     */
    public boolean canTransitionTo(OrderStatus target) {
        if (target == BEKOR_QILINDI) {
            return this != YAKUNLANDI && this != QARZGA_OTKAZILDI && this != BEKOR_QILINDI;
        }

        return switch (this) {
            case YANGI -> target == OLCHOV_KUTILMOQDA;
            case OLCHOV_KUTILMOQDA -> target == OLCHOV_BAJARILDI;
            case OLCHOV_BAJARILDI -> target == NARX_TASDIQLANDI;
            case NARX_TASDIQLANDI -> target == ZAKLAD_QABUL_QILINDI;
            case ZAKLAD_QABUL_QILINDI -> target == ISHLAB_CHIQARISHDA;
            case ISHLAB_CHIQARISHDA -> target == TAYYOR;
            case TAYYOR -> target == ORNATISHGA_TAYINLANDI;
            case ORNATISHGA_TAYINLANDI -> target == ORNATISH_JARAYONIDA;
            case ORNATISH_JARAYONIDA -> target == ORNATISH_BAJARILDI;
            case ORNATISH_BAJARILDI -> target == TOLOV_KUTILMOQDA;
            case TOLOV_KUTILMOQDA -> target == YAKUNLANDI || target == QARZGA_OTKAZILDI;
            default -> false;
        };
    }
}
