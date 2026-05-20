package uz.jalyuziepr.api.enums;

/**
 * Ishlab chiqarish buyurtmasi (ProductionOrder) holatlari.
 * Order'ning umumiy holatidan farqli — bu sexdagi konkret ishni kuzatadi.
 */
public enum ProductionStatus {
    PENDING("Kutilmoqda"),           // Hali boshlanmagan
    IN_PROGRESS("Jarayonda"),        // Sex ishlamoqda
    ON_HOLD("To'xtatilgan"),         // Vaqtincha to'xtagan (material yo'q, brak va h.k.)
    COMPLETED("Bajarildi"),          // Barcha bosqichlar tugadi
    CANCELLED("Bekor qilindi");      // Buyurtma bekor qilindi

    private final String displayName;

    ProductionStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED;
    }
}
