package uz.jalyuziepr.api.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Dala eskalatsiyasi (SOS) sabablari.
 */
@Getter
@RequiredArgsConstructor
public enum EscalationReason {
    WRONG_MEASUREMENT("Noto'g'ri o'lcham"),
    MISSING_PART("Qism yetishmayapti"),
    DEFECTIVE_ITEM("Nuqsonli mahsulot"),
    CUSTOMER_DISPUTE("Mijoz bilan nizo"),
    ACCESS_ISSUE("Kirishda muammo"),
    OTHER("Boshqa");

    private final String label;
}
