package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.NotNull;
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
public class ServiceVisitRequest {

    @NotNull
    private LocalDate scheduledDate;

    private LocalTime scheduledTime;

    private Long technicianId;

    private String visitNotes;
}
