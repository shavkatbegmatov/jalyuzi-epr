package uz.jalyuziepr.api.enums;

public enum WarrantyIssueType {
    MECHANISM("Mexanizm nosozligi"),
    FABRIC("Mato yoki tashqi ko'rinish"),
    MOTOR("Motor / elektronika"),
    INSTALLATION("O'rnatish xatosi"),
    OTHER("Boshqa");

    private final String displayName;

    WarrantyIssueType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
