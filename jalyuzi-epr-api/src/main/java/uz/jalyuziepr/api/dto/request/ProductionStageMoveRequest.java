package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Production order'ni boshqa bosqichga ko'chirish so'rovi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionStageMoveRequest {

    @NotNull(message = "Yangi bosqich ID kiritilishi shart")
    private Long stageId;

    private String notes;

    // QA bosqichida brak topilsa, sababini yozish uchun
    private String defectReason;
}
