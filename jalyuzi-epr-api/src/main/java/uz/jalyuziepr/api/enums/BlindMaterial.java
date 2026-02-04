package uz.jalyuziepr.api.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BlindMaterial {
    FABRIC("Mato"),
    POLYESTER("Polyester"),
    ALUMINUM("Alyuminiy"),
    WOOD("Yog'och"),
    BAMBOO("Bambuk"),
    PVC("PVC"),
    BLACKOUT("Blackout"),
    DIMOUT("Dimout"),
    SCREEN("Screen"),
    FAUX_WOOD("Sun'iy yog'och");

    private final String displayName;
}
