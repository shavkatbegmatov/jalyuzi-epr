package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import uz.jalyuziepr.api.enums.OrderStatus;

@Data
public class OrderRevertRequest {

    @NotNull(message = "Maqsad status tanlanishi shart")
    private OrderStatus targetStatus;

    @NotBlank(message = "Sabab kiritilishi shart")
    private String reason;
}
