package uz.jalyuziepr.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import uz.jalyuziepr.api.enums.PaymentMethod;

import java.util.List;

/**
 * To'lov usullari sozlamasini ommaviy (bulk) yangilash so'rovi.
 */
@Data
public class PaymentMethodSettingUpdateRequest {

    @NotEmpty(message = "Kamida bitta to'lov usuli bo'lishi kerak")
    @Valid
    private List<Item> methods;

    @Data
    public static class Item {
        @NotNull(message = "Kod ko'rsatilishi shart")
        private PaymentMethod code;

        @NotNull(message = "Nom ko'rsatilishi shart")
        @Size(min = 1, max = 50, message = "Nom 1–50 belgidan iborat bo'lishi kerak")
        private String label;

        @NotNull
        private Boolean enabled;

        @NotNull
        private Boolean shopEnabled;

        @NotNull
        private Integer sortOrder;
    }
}
