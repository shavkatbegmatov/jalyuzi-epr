package uz.jalyuziepr.api.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import uz.jalyuziepr.api.service.QuoteFollowupService;

/**
 * "O'lchovdan keyin" — har kuni narx tasdiqlangan, zaklad to'lanmagan
 * buyurtmalar uchun mijozga eslatma yuboradi.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class QuoteFollowupScheduler {

    private final QuoteFollowupService quoteFollowupService;

    /** Har kuni soat 10:00 da */
    @Scheduled(cron = "0 0 10 * * *")
    public void run() {
        log.info("Quote follow-up scheduler ishga tushdi...");
        try {
            int sent = quoteFollowupService.processFollowups();
            log.info("Quote follow-up scheduler tugadi: {} ta eslatma", sent);
        } catch (Exception e) {
            log.error("Quote follow-up scheduler xatosi: {}", e.getMessage(), e);
        }
    }
}
