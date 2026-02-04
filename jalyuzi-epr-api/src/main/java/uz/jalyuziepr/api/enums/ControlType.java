package uz.jalyuziepr.api.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ControlType {
    CHAIN("Zanjirli"),
    CORD("Ipli"),
    MOTORIZED("Motorli"),
    REMOTE("Pultli"),
    SMART("Smart");

    private final String displayName;
}
