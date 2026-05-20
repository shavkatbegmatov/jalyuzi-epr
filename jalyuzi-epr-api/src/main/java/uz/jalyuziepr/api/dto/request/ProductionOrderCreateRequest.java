package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionOrderCreateRequest {

    @NotNull(message = "Order ID kiritilishi shart")
    private Long orderId;

    // Agar berilmasa, har bir orderItem uchun alohida production order yaratiladi
    private Long orderItemId;

    @Min(value = 1, message = "Prioritet 1-5 oralig'ida bo'lishi kerak")
    @Builder.Default
    private Integer priority = 3;

    private LocalDateTime deadline;

    private Long assignedWorkerId;

    private String notes;
}
