package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderAssignRequest {

    @NotNull(message = "Xodim tanlanishi shart")
    private Long assigneeId;

    private LocalDateTime scheduledDate;

    private String notes;
}
