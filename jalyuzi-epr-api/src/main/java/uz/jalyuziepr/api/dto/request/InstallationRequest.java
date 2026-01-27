package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstallationRequest {

    @NotNull(message = "Sotuv ID kiritilishi shart")
    private Long saleId;

    @NotNull(message = "Texnik ID kiritilishi shart")
    private Long technicianId;

    @NotNull(message = "Rejalashtirilgan sana kiritilishi shart")
    private LocalDate scheduledDate;

    private LocalTime scheduledTimeStart;
    private LocalTime scheduledTimeEnd;

    @NotNull(message = "Manzil kiritilishi shart")
    @Size(max = 500, message = "Manzil 500 ta belgidan oshmasligi kerak")
    private String address;

    @Size(max = 20, message = "Telefon raqami 20 ta belgidan oshmasligi kerak")
    private String contactPhone;

    @Size(max = 500, message = "Kirish ko'rsatmalari 500 ta belgidan oshmasligi kerak")
    private String accessInstructions;

    @Size(max = 1000, message = "Eslatmalar 1000 ta belgidan oshmasligi kerak")
    private String notes;
}
