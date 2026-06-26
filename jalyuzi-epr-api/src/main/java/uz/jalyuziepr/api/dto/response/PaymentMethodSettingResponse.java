package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.PaymentMethodSetting;
import uz.jalyuziepr.api.enums.PaymentMethod;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodSettingResponse {
    private Long id;
    private PaymentMethod code;
    private String label;
    private Boolean enabled;
    private Boolean shopEnabled;
    private Integer sortOrder;

    public static PaymentMethodSettingResponse from(PaymentMethodSetting s) {
        return PaymentMethodSettingResponse.builder()
                .id(s.getId())
                .code(s.getCode())
                .label(s.getLabel())
                .enabled(s.getEnabled())
                .shopEnabled(s.getShopEnabled())
                .sortOrder(s.getSortOrder())
                .build();
    }
}
