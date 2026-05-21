package uz.jalyuziepr.api.enums;

public enum ServiceVisitStatus {
    SCHEDULED("Belgilangan"),
    IN_PROGRESS("Jarayonda"),
    COMPLETED("Bajarildi"),
    CANCELLED("Bekor qilingan");

    private final String displayName;

    ServiceVisitStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
