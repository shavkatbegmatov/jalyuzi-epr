package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.entity.Customer;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.enums.OrderStatus;
import uz.jalyuziepr.api.enums.StaffNotificationType;
import uz.jalyuziepr.api.repository.OrderRepository;
import uz.jalyuziepr.api.repository.TelegramPhoneLinkRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * "O'lchovdan keyin" — zaklad follow-up / win-back avtomatizatsiyasi.
 * Narx tasdiqlangan, ammo zaklad to'lanmagan buyurtmalar uchun mijozga
 * (Telegram asosiy) eslatma yuboradi va menejerni xabardor qiladi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuoteFollowupService {

    private final OrderRepository orderRepository;
    private final TelegramPhoneLinkRepository telegramPhoneLinkRepository;
    private final OrderTrackingService orderTrackingService;
    private final StaffNotificationService staffNotificationService;

    @Value("${app.tracking.quote-followup-days:2}")
    private int followupDays;

    /**
     * Nomzodlarni topib, har biriga eslatma yuboradi. Yuborilgan vaqt belgilanadi
     * (kuniga bir martadan ko'p yuborilmaydi). Yuborilgan eslatmalar sonini qaytaradi.
     */
    @Transactional
    public int processFollowups() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(followupDays);
        List<Order> candidates =
                orderRepository.findQuoteFollowupCandidates(OrderStatus.NARX_TASDIQLANDI, cutoff);

        log.info("Quote follow-up: {} ta nomzod topildi (cutoff={})", candidates.size(), cutoff);

        int sent = 0;
        for (Order o : candidates) {
            try {
                Customer c = o.getCustomer();
                Long chatId = resolveChatId(c);
                String phone = c != null ? c.getPhone() : null;

                orderTrackingService.sendQuoteFollowup(
                        chatId, phone, o.getOrderNumber(), o.getId(), o.getTrackingCode());

                o.setQuoteFollowupSentAt(LocalDateTime.now());
                orderRepository.save(o);

                staffNotificationService.createGlobalNotification(
                        "Zaklad kutilmoqda",
                        o.getOrderNumber() + ": narx tasdiqlangan, zaklad hali yo'q — "
                                + "mijozga eslatma yuborildi",
                        StaffNotificationType.INFO, "ORDER", o.getId());

                sent++;
            } catch (Exception e) {
                log.warn("Quote follow-up failed for order {}: {}", o.getId(), e.getMessage());
            }
        }
        log.info("Quote follow-up: {} ta eslatma yuborildi", sent);
        return sent;
    }

    private Long resolveChatId(Customer c) {
        if (c == null) {
            return null;
        }
        if (c.getTelegramChatId() != null) {
            return c.getTelegramChatId();
        }
        if (c.getPhone() != null) {
            return telegramPhoneLinkRepository.findByPhone(c.getPhone())
                    .map(l -> l.getChatId())
                    .orElse(null);
        }
        return null;
    }
}
