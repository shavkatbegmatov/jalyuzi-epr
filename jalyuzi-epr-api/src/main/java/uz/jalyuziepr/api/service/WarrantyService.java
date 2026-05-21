package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.ServiceVisitRequest;
import uz.jalyuziepr.api.dto.request.WarrantyClaimRequest;
import uz.jalyuziepr.api.dto.response.WarrantyClaimResponse;
import uz.jalyuziepr.api.entity.*;
import uz.jalyuziepr.api.enums.ServiceVisitStatus;
import uz.jalyuziepr.api.enums.WarrantyClaimStatus;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.*;
import uz.jalyuziepr.api.security.CustomUserDetails;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarrantyService {

    private final WarrantyClaimRepository claimRepository;
    private final ServiceVisitRepository visitRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final StaffNotificationService staffNotificationService;

    // ==================== QUERIES ====================

    @Transactional(readOnly = true)
    public Page<WarrantyClaimResponse> list(WarrantyClaimStatus status, Pageable pageable) {
        Page<WarrantyClaim> page = (status != null)
                ? claimRepository.findByStatus(status, pageable)
                : claimRepository.findAll(pageable);
        return page.map(WarrantyClaimResponse::from);
    }

    @Transactional(readOnly = true)
    public WarrantyClaimResponse getById(Long id) {
        WarrantyClaim c = claimRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim", "id", id));
        return WarrantyClaimResponse.fromDetailed(c);
    }

    @Transactional(readOnly = true)
    public List<WarrantyClaimResponse> getByOrderId(Long orderId) {
        return claimRepository.findByOrderId(orderId).stream()
                .map(WarrantyClaimResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<WarrantyClaimResponse> getByCustomerId(Long customerId, Pageable pageable) {
        return claimRepository.findByCustomerId(customerId, pageable).map(WarrantyClaimResponse::from);
    }

    /**
     * Mijoz portali uchun: faqat o'ziga tegishli claim'ni qaytaradi (ownership tekshiruvi bilan).
     */
    @Transactional(readOnly = true)
    public WarrantyClaimResponse getByIdForCustomer(Long claimId, Long customerId) {
        WarrantyClaim c = claimRepository.findByIdWithDetails(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim", "id", claimId));
        if (c.getCustomer() == null || !c.getCustomer().getId().equals(customerId)) {
            throw new ResourceNotFoundException("Warranty claim", "id", claimId);
        }
        return WarrantyClaimResponse.fromDetailed(c);
    }

    /**
     * Mijoz portali uchun: shikoyat yaratish. Faqat o'ziga tegishli buyurtmaga qoldira oladi.
     */
    @Transactional
    public WarrantyClaimResponse createForCustomer(WarrantyClaimRequest req, Long customerId) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));

        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("Bu buyurtma sizga tegishli emas");
        }

        // Faqat o'rnatish bajarilgan / yakuniy holatdagi buyurtmalar uchun
        if (order.getStatus() != uz.jalyuziepr.api.enums.OrderStatus.ORNATISH_BAJARILDI
                && order.getStatus() != uz.jalyuziepr.api.enums.OrderStatus.YAKUNLANDI
                && order.getStatus() != uz.jalyuziepr.api.enums.OrderStatus.TOLOV_KUTILMOQDA) {
            throw new BadRequestException("Faqat o'rnatish bajarilgan buyurtmalar uchun shikoyat qoldira olasiz");
        }

        return create(req);
    }

    // ==================== CREATE ====================

    @Transactional
    public WarrantyClaimResponse create(WarrantyClaimRequest req) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));

        if (order.getCustomer() == null) {
            throw new BadRequestException("Buyurtmaga mijoz biriktirilmagan");
        }

        WarrantyClaim claim = WarrantyClaim.builder()
                .claimNumber(generateClaimNumber())
                .order(order)
                .customer(order.getCustomer())
                .issueType(req.getIssueType())
                .issueDescription(req.getIssueDescription())
                .photos(req.getPhotos() != null ? req.getPhotos() : List.of())
                .status(WarrantyClaimStatus.NEW)
                .priority(req.getPriority() != null ? req.getPriority() : 3)
                .submittedBy(getCurrentUserOrNull())
                .build();

        claim = claimRepository.save(claim);
        log.info("WarrantyClaim created: {} for order {}", claim.getClaimNumber(), order.getOrderNumber());

        try {
            staffNotificationService.createGlobalNotification(
                    "Yangi kafolat shikoyati",
                    String.format("%s — %s: %s",
                            claim.getClaimNumber(),
                            order.getCustomer().getFullName(),
                            claim.getIssueType().getDisplayName()),
                    uz.jalyuziepr.api.enums.StaffNotificationType.WARNING,
                    "WARRANTY", claim.getId());
        } catch (Exception e) {
            log.warn("Failed to notify staff about warranty claim: {}", e.getMessage());
        }

        return WarrantyClaimResponse.from(claim);
    }

    // ==================== UPDATE ====================

    @Transactional
    public WarrantyClaimResponse changeStatus(Long claimId, WarrantyClaimStatus newStatus, String resolution) {
        WarrantyClaim claim = claimRepository.findByIdWithDetails(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim", "id", claimId));

        if (claim.getStatus().isTerminal() && newStatus != claim.getStatus()) {
            throw new BadRequestException("Yopilgan shikoyatni o'zgartirib bo'lmaydi");
        }

        claim.setStatus(newStatus);
        if (resolution != null) {
            claim.setResolution(resolution);
        }
        LocalDateTime now = LocalDateTime.now();
        if (newStatus == WarrantyClaimStatus.RESOLVED) {
            claim.setResolvedAt(now);
        } else if (newStatus == WarrantyClaimStatus.CLOSED || newStatus == WarrantyClaimStatus.REJECTED) {
            claim.setClosedAt(now);
            if (claim.getResolvedAt() == null && newStatus == WarrantyClaimStatus.CLOSED) {
                claim.setResolvedAt(now);
            }
        }
        claim = claimRepository.save(claim);
        return WarrantyClaimResponse.from(claim);
    }

    @Transactional
    public WarrantyClaimResponse assignTo(Long claimId, Long userId) {
        WarrantyClaim claim = claimRepository.findByIdWithDetails(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim", "id", claimId));

        if (userId == null) {
            claim.setAssignedTo(null);
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            claim.setAssignedTo(user);
            if (claim.getStatus() == WarrantyClaimStatus.NEW) {
                claim.setStatus(WarrantyClaimStatus.IN_PROGRESS);
            }
        }

        claim = claimRepository.save(claim);
        return WarrantyClaimResponse.from(claim);
    }

    @Transactional
    public WarrantyClaimResponse setWarrantyCoverage(Long claimId, boolean covered, BigDecimal cost) {
        WarrantyClaim claim = claimRepository.findByIdWithDetails(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim", "id", claimId));
        claim.setIsWarrantyCovered(covered);
        claim.setCostToCustomer(covered ? BigDecimal.ZERO : (cost != null ? cost : BigDecimal.ZERO));
        return WarrantyClaimResponse.from(claimRepository.save(claim));
    }

    // ==================== SERVICE VISITS ====================

    @Transactional
    public WarrantyClaimResponse scheduleVisit(Long claimId, ServiceVisitRequest req) {
        WarrantyClaim claim = claimRepository.findByIdWithDetails(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim", "id", claimId));

        User technician = null;
        if (req.getTechnicianId() != null) {
            technician = userRepository.findById(req.getTechnicianId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", req.getTechnicianId()));
        }

        ServiceVisit visit = ServiceVisit.builder()
                .claim(claim)
                .technician(technician)
                .scheduledDate(req.getScheduledDate())
                .scheduledTime(req.getScheduledTime())
                .visitNotes(req.getVisitNotes())
                .status(ServiceVisitStatus.SCHEDULED)
                .build();

        visitRepository.save(visit);

        if (claim.getStatus() == WarrantyClaimStatus.NEW) {
            claim.setStatus(WarrantyClaimStatus.IN_PROGRESS);
            claimRepository.save(claim);
        }

        return WarrantyClaimResponse.fromDetailed(
                claimRepository.findByIdWithDetails(claimId).orElseThrow()
        );
    }

    @Transactional
    public WarrantyClaimResponse completeVisit(Long visitId, String actionTaken) {
        ServiceVisit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Service visit", "id", visitId));

        visit.setStatus(ServiceVisitStatus.COMPLETED);
        visit.setCompletedAt(LocalDateTime.now());
        visit.setActionTaken(actionTaken);
        visitRepository.save(visit);

        return WarrantyClaimResponse.fromDetailed(
                claimRepository.findByIdWithDetails(visit.getClaim().getId()).orElseThrow()
        );
    }

    // ==================== HELPERS ====================

    private String generateClaimNumber() {
        String prefix = "CLM-";
        long count = claimRepository.count();
        String candidate;
        do {
            count++;
            candidate = prefix + String.format("%05d", count);
        } while (claimRepository.countByClaimNumberPrefix(candidate) > 0);
        return candidate;
    }

    private User getCurrentUserOrNull() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof CustomUserDetails ud)) return null;
        return userRepository.findById(ud.getId()).orElse(null);
    }
}
