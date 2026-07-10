package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Buyurtma o'rnatish joyining geolokatsiyasini belgilash/o'zgartirish so'rovi.
 */
@Data
public class OrderLocationRequest {

    @NotNull(message = "Kenglik (latitude) kiritilishi shart")
    @DecimalMin(value = "-90", message = "Kenglik noto'g'ri")
    @DecimalMax(value = "90", message = "Kenglik noto'g'ri")
    private BigDecimal locationLat;

    @NotNull(message = "Uzunlik (longitude) kiritilishi shart")
    @DecimalMin(value = "-180", message = "Uzunlik noto'g'ri")
    @DecimalMax(value = "180", message = "Uzunlik noto'g'ri")
    private BigDecimal locationLng;
}
