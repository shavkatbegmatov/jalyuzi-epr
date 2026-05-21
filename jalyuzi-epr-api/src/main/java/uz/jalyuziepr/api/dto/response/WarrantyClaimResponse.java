package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.WarrantyClaim;
import uz.jalyuziepr.api.enums.WarrantyClaimStatus;
import uz.jalyuziepr.api.enums.WarrantyIssueType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyClaimResponse {
    private Long id;
    private String claimNumber;

    private Long orderId;
    private String orderNumber;

    private Long customerId;
    private String customerName;
    private String customerPhone;

    private WarrantyIssueType issueType;
    private String issueTypeDisplayName;
    private String issueDescription;
    private List<String> photos;

    private WarrantyClaimStatus status;
    private String statusDisplayName;
    private Integer priority;

    private Long assignedToId;
    private String assignedToName;

    private String resolution;
    private Boolean isWarrantyCovered;
    private BigDecimal costToCustomer;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private String submittedByName;

    private List<ServiceVisitResponse> visits;

    public static WarrantyClaimResponse from(WarrantyClaim c) {
        return WarrantyClaimResponse.builder()
                .id(c.getId())
                .claimNumber(c.getClaimNumber())
                .orderId(c.getOrder() != null ? c.getOrder().getId() : null)
                .orderNumber(c.getOrder() != null ? c.getOrder().getOrderNumber() : null)
                .customerId(c.getCustomer() != null ? c.getCustomer().getId() : null)
                .customerName(c.getCustomer() != null ? c.getCustomer().getFullName() : null)
                .customerPhone(c.getCustomer() != null ? c.getCustomer().getPhone() : null)
                .issueType(c.getIssueType())
                .issueTypeDisplayName(c.getIssueType().getDisplayName())
                .issueDescription(c.getIssueDescription())
                .photos(c.getPhotos())
                .status(c.getStatus())
                .statusDisplayName(c.getStatus().getDisplayName())
                .priority(c.getPriority())
                .assignedToId(c.getAssignedTo() != null ? c.getAssignedTo().getId() : null)
                .assignedToName(c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : null)
                .resolution(c.getResolution())
                .isWarrantyCovered(c.getIsWarrantyCovered())
                .costToCustomer(c.getCostToCustomer())
                .createdAt(c.getCreatedAt())
                .resolvedAt(c.getResolvedAt())
                .closedAt(c.getClosedAt())
                .submittedByName(c.getSubmittedBy() != null ? c.getSubmittedBy().getFullName() : null)
                .build();
    }

    public static WarrantyClaimResponse fromDetailed(WarrantyClaim c) {
        WarrantyClaimResponse base = from(c);
        if (c.getVisits() != null) {
            base.setVisits(c.getVisits().stream()
                    .map(ServiceVisitResponse::from)
                    .collect(Collectors.toList()));
        }
        return base;
    }
}
