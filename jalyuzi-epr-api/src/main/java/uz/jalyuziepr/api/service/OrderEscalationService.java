package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.jalyuziepr.api.dto.response.OrderEscalationResponse;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.entity.OrderEscalation;
import uz.jalyuziepr.api.enums.EscalationReason;
import uz.jalyuziepr.api.enums.EscalationStatus;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.enums.StaffNotificationType;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.OrderEscalationRepository;
import uz.jalyuziepr.api.repository.OrderRepository;
import uz.jalyuziepr.api.security.CustomUserDetails;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Dala o'rnatuvchi SOS / eskalatsiya tizimi.
 * O'rnatuvchi muammo haqida xabar beradi -> barcha menejerlarga real vaqtda
 * (WebSocket) ogohlantirish boradi -> menejer hal qiladi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEscalationService {

    private final OrderEscalationRepository escalationRepository;
    private final OrderRepository orderRepository;
    private final FileStorageService fileStorageService;
    private final StaffNotificationService staffNotificationService;

    /**
     * Eskalatsiya yaratish (o'rnatuvchi). Ixtiyoriy foto bilan.
     */
    @Transactional
    public OrderEscalationResponse create(Long orderId, EscalationReason reason,
                                          String description, MultipartFile photo) {
        if (reason == null) {
            throw new BadRequestException("Eskalatsiya sababi ko'rsatilmagan");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        CustomUserDetails me = currentUser();
        // Faqat ORDERS_INSTALL'ga ega o'rnatuvchi bo'lsa — buyurtma unga tayinlanган bo'lishi shart.
        // Menejer/admin (ORDERS_UPDATE) — istalgan buyurtma uchun eskalatsiya yarata oladi.
        if (me != null && !me.hasPermission(PermissionCode.ORDERS_UPDATE.getCode())) {
            if (order.getInstaller() == null || !order.getInstaller().getId().equals(me.getId())) {
                throw new AccessDeniedException("Bu buyurtma sizga tayinlanmagan");
            }
        }

        String photoUrl = null;
        if (photo != null && !photo.isEmpty()) {
            photoUrl = fileStorageService.saveImage(photo, "escalations/" + orderId);
        }

        OrderEscalation escalation = OrderEscalation.builder()
                .order(order)
                .reason(reason)
                .description(description != null && !description.isBlank() ? description.trim() : null)
                .photoUrl(photoUrl)
                .status(EscalationStatus.OPEN)
                .createdBy(me != null ? me.getId() : null)
                .createdByName(me != null ? me.getFullName() : null)
                .createdAt(LocalDateTime.now())
                .build();

        OrderEscalation saved = escalationRepository.save(escalation);
        log.info("Eskalatsiya yaratildi: order={}, reason={}, by={}", orderId, reason, saved.getCreatedByName());

        // Barcha menejerlarga real-time ogohlantirish (createGlobalNotification ichida WebSocket broadcast bor)
        String who = saved.getCreatedByName() != null ? saved.getCreatedByName() : "O'rnatuvchi";
        String msg = order.getOrderNumber() + ": " + reason.getLabel() + " — " + who;
        if (saved.getDescription() != null) {
            msg += " (" + saved.getDescription() + ")";
        }
        staffNotificationService.createGlobalNotification(
                "⚠️ Tezkor yordam so'rovi",
                msg,
                StaffNotificationType.WARNING,
                "ESCALATION",
                orderId);

        return OrderEscalationResponse.from(saved);
    }

    /**
     * Ochiq eskalatsiyalar (menejer paneli).
     */
    @Transactional(readOnly = true)
    public List<OrderEscalationResponse> getActive() {
        return escalationRepository.findByStatusOrderByCreatedAtDesc(EscalationStatus.OPEN).stream()
                .map(OrderEscalationResponse::from)
                .toList();
    }

    /**
     * Buyurtma bo'yicha barcha eskalatsiyalar.
     */
    @Transactional(readOnly = true)
    public List<OrderEscalationResponse> getByOrder(Long orderId) {
        return escalationRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(OrderEscalationResponse::from)
                .toList();
    }

    /**
     * Ochiq eskalatsiyalar soni (badge uchun).
     */
    @Transactional(readOnly = true)
    public long countActive() {
        return escalationRepository.countByStatus(EscalationStatus.OPEN);
    }

    /**
     * Eskalatsiyani hal qilish (menejer).
     */
    @Transactional
    public OrderEscalationResponse resolve(Long escalationId, String note) {
        OrderEscalation escalation = escalationRepository.findById(escalationId)
                .orElseThrow(() -> new ResourceNotFoundException("Eskalatsiya", "id", escalationId));
        if (escalation.getStatus() == EscalationStatus.RESOLVED) {
            throw new BadRequestException("Bu eskalatsiya allaqachon hal qilingan");
        }

        CustomUserDetails me = currentUser();
        escalation.setStatus(EscalationStatus.RESOLVED);
        escalation.setResolvedBy(me != null ? me.getId() : null);
        escalation.setResolvedByName(me != null ? me.getFullName() : null);
        escalation.setResolutionNote(note != null && !note.isBlank() ? note.trim() : null);
        escalation.setResolvedAt(LocalDateTime.now());

        OrderEscalation saved = escalationRepository.save(escalation);
        log.info("Eskalatsiya hal qilindi: id={}, by={}", escalationId, saved.getResolvedByName());
        return OrderEscalationResponse.from(saved);
    }

    private CustomUserDetails currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cud) {
            return cud;
        }
        return null;
    }
}
