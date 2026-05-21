package uz.jalyuziepr.api.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import uz.jalyuziepr.api.service.PaymentScheduleService;

/**
 * Har kuni payment schedule uchun:
 *   - Muddati o'tgan bo'laklarni OVERDUE deb belgilash
 *   - Bugun due bo'lganlarga staff bildirishnomasi yuborish
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentScheduleReminderScheduler {

    private final PaymentScheduleService paymentScheduleService;

    /**
     * Har kuni ertalab 09:15 da ishga tushadi (DebtReminder dan keyin)
     */
    @Scheduled(cron = "0 15 9 * * *")
    public void checkOverduePaymentSchedules() {
        log.info("Starting payment schedule overdue check...");
        try {
            int marked = paymentScheduleService.markOverdueAndNotify();
            log.info("Payment schedule check completed. {} items marked overdue", marked);
        } catch (Exception e) {
            log.error("Payment schedule overdue check failed", e);
        }
    }
}
