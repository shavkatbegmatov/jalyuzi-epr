package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.PaymentScheduleRequest;
import uz.jalyuziepr.api.dto.response.PaymentScheduleResponse;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.entity.OrderPayment;
import uz.jalyuziepr.api.entity.PaymentSchedule;
import uz.jalyuziepr.api.enums.PaymentScheduleStatus;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.OrderPaymentRepository;
import uz.jalyuziepr.api.repository.OrderRepository;
import uz.jalyuziepr.api.repository.PaymentScheduleRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentScheduleService {

    private final PaymentScheduleRepository scheduleRepository;
    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final StaffNotificationService staffNotificationService;

    // ==================== READ ====================

    @Transactional(readOnly = true)
    public List<PaymentScheduleResponse> getByOrder(Long orderId) {
        return scheduleRepository.findByOrderIdOrderBySequenceNoAsc(orderId).stream()
                .map(PaymentScheduleResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentScheduleResponse> getDueOrOverdue() {
        return scheduleRepository.findDueOrOverdue(LocalDate.now()).stream()
                .map(PaymentScheduleResponse::from)
                .collect(Collectors.toList());
    }

    // ==================== CREATE ====================

    @Transactional
    public List<PaymentScheduleResponse> createBulk(Long orderId, List<PaymentScheduleRequest> requests) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("Kamida bitta to'lov bo'lagi kiritilishi shart");
        }

        // Mavjud schedule'lar bo'lsa, bekor qilamiz (avvalgi rejani bekor qilib, yangi rejaga o'tish)
        List<PaymentSchedule> existing = scheduleRepository.findByOrderIdOrderBySequenceNoAsc(orderId);
        for (PaymentSchedule e : existing) {
            if (e.getStatus().isOpen()) {
                e.setStatus(PaymentScheduleStatus.CANCELLED);
            }
        }

        // Yig'indini tekshirish (1 so'mlik xatolikni rad etamiz)
        BigDecimal sum = requests.stream()
                .map(PaymentScheduleRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal diff = sum.subtract(order.getTotalAmount()).abs();
        if (diff.compareTo(BigDecimal.ONE) > 0) {
            throw new BadRequestException("To'lov bo'laklari yig'indisi (" + sum +
                    ") buyurtma summasidan (" + order.getTotalAmount() + ") farq qiladi");
        }

        List<PaymentSchedule> saved = new ArrayList<>();
        for (PaymentScheduleRequest req : requests) {
            PaymentSchedule ps = PaymentSchedule.builder()
                    .order(order)
                    .sequenceNo(req.getSequenceNo())
                    .label(req.getLabel())
                    .percentage(req.getPercentage())
                    .amount(req.getAmount())
                    .dueDate(req.getDueDate())
                    .status(PaymentScheduleStatus.PENDING)
                    .notes(req.getNotes())
                    .build();
            saved.add(scheduleRepository.save(ps));
        }

        log.info("Created {} payment schedule items for order {}", saved.size(), order.getOrderNumber());
        return saved.stream().map(PaymentScheduleResponse::from).collect(Collectors.toList());
    }

    /**
     * Standart 50/30/20 reja yaratish (zaklad olinmagunigacha avtomatik).
     * Order ZAKLAD_QABUL bo'lganida OrderService chaqirishi mumkin.
     */
    @Transactional
    public List<PaymentScheduleResponse> createStandardPlan(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (scheduleRepository.countActiveByOrder(orderId) > 0) {
            log.info("Order {} allaqachon payment schedule'ga ega", orderId);
            return getByOrder(orderId);
        }

        BigDecimal total = order.getTotalAmount();
        BigDecimal deposit = total.multiply(BigDecimal.valueOf(0.50)).setScale(0, RoundingMode.HALF_UP);
        BigDecimal middle = total.multiply(BigDecimal.valueOf(0.30)).setScale(0, RoundingMode.HALF_UP);
        BigDecimal finalPay = total.subtract(deposit).subtract(middle); // qoldiq

        LocalDate today = LocalDate.now();
        LocalDate installation = order.getInstallationDate() != null
                ? order.getInstallationDate().toLocalDate()
                : today.plusDays(14);

        List<PaymentScheduleRequest> items = List.of(
                PaymentScheduleRequest.builder()
                        .sequenceNo(1).label("Zaklad (avans)")
                        .percentage(BigDecimal.valueOf(50)).amount(deposit)
                        .dueDate(today).build(),
                PaymentScheduleRequest.builder()
                        .sequenceNo(2).label("Tayyor bo'lganda")
                        .percentage(BigDecimal.valueOf(30)).amount(middle)
                        .dueDate(installation.minusDays(2)).build(),
                PaymentScheduleRequest.builder()
                        .sequenceNo(3).label("O'rnatish bajarilganda")
                        .percentage(BigDecimal.valueOf(20)).amount(finalPay)
                        .dueDate(installation).build()
        );

        return createBulk(orderId, items);
    }

    // ==================== PAYMENT ====================

    /**
     * To'lov qabul qilingach, schedule'ni yangilash.
     * OrderService.receiveDeposit / collectPayment chaqirgan paytda mos schedule topib yopiladi.
     */
    @Transactional
    public void applyPayment(Long orderId, OrderPayment payment) {
        BigDecimal remaining = payment.getAmount();
        List<PaymentSchedule> open = scheduleRepository.findByOrderIdOrderBySequenceNoAsc(orderId).stream()
                .filter(ps -> ps.getStatus().isOpen())
                .collect(Collectors.toList());

        for (PaymentSchedule ps : open) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal due = ps.getAmount().subtract(ps.getPaidAmount());
            BigDecimal applied = remaining.min(due);

            ps.setPaidAmount(ps.getPaidAmount().add(applied));
            remaining = remaining.subtract(applied);

            if (ps.getPaidAmount().compareTo(ps.getAmount()) >= 0) {
                ps.setStatus(PaymentScheduleStatus.PAID);
                ps.setPaidAt(LocalDateTime.now());
                ps.setPayment(payment);
            } else if (ps.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                ps.setStatus(PaymentScheduleStatus.PARTIAL);
            }
        }
    }

    // ==================== SCHEDULED JOBS ====================

    /**
     * Kunlik vazifa: muddati o'tgan schedule'larni OVERDUE deb belgilash va menejerga eslatma.
     * DebtReminderScheduler kabi @Scheduled bilan ishlatiladi.
     */
    @Transactional
    public int markOverdueAndNotify() {
        LocalDate today = LocalDate.now();
        int marked = scheduleRepository.markOverdueBefore(today);
        if (marked > 0) {
            log.info("Marked {} payment schedules as OVERDUE", marked);
        }

        // Bugun due bo'lganlarga eslatma
        List<PaymentSchedule> remindersDue = scheduleRepository.findRemindersDueOn(today);
        for (PaymentSchedule ps : remindersDue) {
            try {
                String customerName = ps.getOrder().getCustomer() != null
                        ? ps.getOrder().getCustomer().getFullName() : "—";
                staffNotificationService.notifyPaymentReceived(
                        customerName + " (" + ps.getLabel() + ")",
                        ps.getAmount().toPlainString(),
                        ps.getOrder().getId()
                );
                ps.setReminderSentAt(LocalDateTime.now());
            } catch (Exception e) {
                log.warn("Reminder send failed for payment schedule {}: {}", ps.getId(), e.getMessage());
            }
        }

        return marked;
    }

    // ==================== UPDATE / DELETE ====================

    @Transactional
    public void cancel(Long scheduleId, String reason) {
        PaymentSchedule ps = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentSchedule", "id", scheduleId));

        if (!ps.getStatus().isOpen()) {
            throw new BadRequestException("Faqat ochiq to'lov bo'lagini bekor qilish mumkin");
        }

        ps.setStatus(PaymentScheduleStatus.CANCELLED);
        ps.setNotes((ps.getNotes() == null ? "" : ps.getNotes() + " | ") + "Bekor qilish sababi: " + reason);
        scheduleRepository.save(ps);
    }
}
