package uz.jalyuziepr.api.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentMethod {
    CASH("Naqd"),                 // Naqd pul
    CARD("Plastik karta"),        // Plastik karta
    TRANSFER("Bank o'tkazmasi"),  // Bank o'tkazmasi
    MIXED("Aralash"),             // Aralash to'lov
    DEBT("Qarzga");               // Qarzga (keyin to'lash)

    /** Standart ko'rsatiladigan nom (admin paneldan o'zgartirilishi mumkin — PaymentMethodSetting.label) */
    private final String defaultLabel;
}
