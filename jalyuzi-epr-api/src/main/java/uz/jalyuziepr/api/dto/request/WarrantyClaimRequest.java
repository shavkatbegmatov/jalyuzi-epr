package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.enums.WarrantyIssueType;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyClaimRequest {

    @NotNull(message = "Buyurtma ID kiritilishi shart")
    private Long orderId;

    @NotNull
    private WarrantyIssueType issueType;

    @NotBlank(message = "Muammo ta'rifi kiritilishi shart")
    private String issueDescription;

    private List<String> photos;

    @Builder.Default
    private Integer priority = 3;
}
