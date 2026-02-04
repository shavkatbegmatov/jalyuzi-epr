package uz.jalyuziepr.api.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BlindType {
    ROLLER("Roletka"),
    VERTICAL("Vertikal jalyuzi"),
    HORIZONTAL("Gorizontal jalyuzi"),
    ROMAN("Rim pardasi"),
    ZEBRA("Zebra"),
    DAY_NIGHT("Kun-Tun"),
    PLEATED("Plisse"),
    CELLULAR("Uyali"),
    MOTORIZED("Motorli"),
    SHUTTERS("Shutterlar");

    private final String displayName;
}
