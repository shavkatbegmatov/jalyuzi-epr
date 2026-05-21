package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.ServiceVisit;
import uz.jalyuziepr.api.enums.ServiceVisitStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceVisitResponse {
    private Long id;
    private Long claimId;
    private Long technicianId;
    private String technicianName;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private LocalDateTime actualArrivedAt;
    private LocalDateTime completedAt;
    private String visitNotes;
    private String actionTaken;
    private List<String> partsUsed;
    private List<String> photosBefore;
    private List<String> photosAfter;
    private Integer customerRating;
    private String customerFeedback;
    private ServiceVisitStatus status;
    private String statusDisplayName;

    public static ServiceVisitResponse from(ServiceVisit v) {
        return ServiceVisitResponse.builder()
                .id(v.getId())
                .claimId(v.getClaim() != null ? v.getClaim().getId() : null)
                .technicianId(v.getTechnician() != null ? v.getTechnician().getId() : null)
                .technicianName(v.getTechnician() != null ? v.getTechnician().getFullName() : null)
                .scheduledDate(v.getScheduledDate())
                .scheduledTime(v.getScheduledTime())
                .actualArrivedAt(v.getActualArrivedAt())
                .completedAt(v.getCompletedAt())
                .visitNotes(v.getVisitNotes())
                .actionTaken(v.getActionTaken())
                .partsUsed(v.getPartsUsed())
                .photosBefore(v.getPhotosBefore())
                .photosAfter(v.getPhotosAfter())
                .customerRating(v.getCustomerRating())
                .customerFeedback(v.getCustomerFeedback())
                .status(v.getStatus())
                .statusDisplayName(v.getStatus().getDisplayName())
                .build();
    }
}
