package uz.jalyuziepr.api.enums;

public enum WarrantyClaimStatus {
    NEW("Yangi"),
    IN_PROGRESS("Jarayonda"),
    WAITING_PARTS("Ehtiyot qism kutilmoqda"),
    RESOLVED("Hal qilindi"),
    CLOSED("Yopilgan"),
    REJECTED("Rad etilgan");

    private final String displayName;

    WarrantyClaimStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isTerminal() {
        return this == CLOSED || this == REJECTED;
    }
}
