package uz.jalyuziepr.api.enums;

public enum PaymentScheduleStatus {
    PENDING("Kutilmoqda"),
    PARTIAL("Qisman to'langan"),
    PAID("To'langan"),
    OVERDUE("Muddati o'tgan"),
    CANCELLED("Bekor qilingan");

    private final String displayName;

    PaymentScheduleStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isOpen() {
        return this == PENDING || this == PARTIAL || this == OVERDUE;
    }
}
