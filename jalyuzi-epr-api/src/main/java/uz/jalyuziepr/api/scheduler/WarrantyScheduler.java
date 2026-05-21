package uz.jalyuziepr.api.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import uz.jalyuziepr.api.entity.WarrantyClaim;
import uz.jalyuziepr.api.enums.StaffNotificationType;
import uz.jalyuziepr.api.enums.WarrantyClaimStatus;
import uz.jalyuziepr.api.repository.WarrantyClaimRepository;
import uz.jalyuziepr.api.service.StaffNotificationService;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Kafolat shikoyatlari uchun SLA monitoring:
 *   - 24 soat ichida hech kim ko'rmagan NEW shikoyatlarga eslatma
 *   - 3 kundan ortiq IN_PROGRESS shikoyatlarga eslatma
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WarrantyScheduler {

    private final WarrantyClaimRepository claimRepository;
    private final StaffNotificationService notificationService;

    /**
     * Har kuni ertalab 09:30 da ishga tushadi
     */
    @Scheduled(cron = "0 30 9 * * *")
    public void checkSlaBreach() {
        log.info("Starting warranty SLA check...");

        LocalDateTime now = LocalDateTime.now();
        List<WarrantyClaim> newClaims = claimRepository.findByStatus(
                WarrantyClaimStatus.NEW,
                org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        int notified = 0;
        for (WarrantyClaim claim : newClaims) {
            if (claim.getCreatedAt() == null) continue;
            long hoursOld = ChronoUnit.HOURS.between(claim.getCreatedAt(), now);
            if (hoursOld >= 24) {
                try {
                    notificationService.createGlobalNotification(
                            "Kafolat shikoyati e'tibordan tashqarida",
                            String.format("%s — %d soatdan ortiq vaqt NEW holatda turibdi: %s",
                                    claim.getClaimNumber(), hoursOld,
                                    claim.getIssueType().getDisplayName()),
                            StaffNotificationType.WARNING,
                            "WARRANTY", claim.getId());
                    notified++;
                } catch (Exception e) {
                    log.error("Failed to notify about NEW warranty SLA breach for claim {}", claim.getId(), e);
                }
            }
        }

        List<WarrantyClaim> inProgressClaims = claimRepository.findByStatus(
                WarrantyClaimStatus.IN_PROGRESS,
                org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        for (WarrantyClaim claim : inProgressClaims) {
            if (claim.getCreatedAt() == null) continue;
            long daysOld = ChronoUnit.DAYS.between(claim.getCreatedAt(), now);
            if (daysOld >= 3 && (claim.getVisits() == null || claim.getVisits().isEmpty())) {
                try {
                    notificationService.createGlobalNotification(
                            "Kafolat shikoyati 3 kundan beri jarayonda",
                            String.format("%s — %d kun jarayonda, tashrif belgilanmagan",
                                    claim.getClaimNumber(), daysOld),
                            StaffNotificationType.WARNING,
                            "WARRANTY", claim.getId());
                    notified++;
                } catch (Exception e) {
                    log.error("Failed to notify about IN_PROGRESS warranty for claim {}", claim.getId(), e);
                }
            }
        }

        log.info("Warranty SLA check completed. {} notifications sent", notified);
    }
}
