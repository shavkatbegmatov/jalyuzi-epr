package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.response.OrderItemRevisionResponse;
import uz.jalyuziepr.api.dto.response.RemeasureQuoteResponse;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.entity.OrderItem;
import uz.jalyuziepr.api.entity.OrderItemRevision;
import uz.jalyuziepr.api.entity.Product;
import uz.jalyuziepr.api.enums.OrderStatus;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.enums.RevisionStatus;
import uz.jalyuziepr.api.enums.StaffNotificationType;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.OrderItemRevisionRepository;
import uz.jalyuziepr.api.repository.OrderRepository;
import uz.jalyuziepr.api.security.CustomUserDetails;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/**
 * Joyida qayta o'lchov + narx qayta-hisoblash (menejer tasdig'i bilan).
 *  - O'rnatuvchi yangi o'lcham kiritadi -> onlik narx kotirovkasi (quote)
 *  - "Menejerga yuborish" -> PENDING revision + barcha menejerlarga real-time xabar
 *  - Menejer tasdiqlasa -> buyurtma mahsuloti o'lchami/narxi va buyurtma jamilari yangilanadi
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderItemRevisionService {

    private final OrderItemRevisionRepository revisionRepository;
    private final OrderRepository orderRepository;
    private final OrderPriceCalculationService priceService;
    private final StaffNotificationService staffNotificationService;

    private static final NumberFormat MONEY = NumberFormat.getInstance(new Locale("uz"));

    /**
     * Narx kotirovkasi (saqlanmaydi).
     */
    @Transactional(readOnly = true)
    public RemeasureQuoteResponse quote(Long orderId, Long itemId, Integer widthMm, Integer heightMm) {
        validateDimensions(widthMm, heightMm);
        Order order = loadOrder(orderId);
        assertRevisable(order);
        OrderItem item = findItem(order, itemId);
        authorizeInstaller(order, currentUser());
        return computeQuote(item, widthMm, heightMm);
    }

    /**
     * Qayta o'lchov so'rovini yaratish (menejer tasdig'iga yuborish).
     */
    @Transactional
    public OrderItemRevisionResponse requestRevision(Long orderId, Long itemId,
                                                     Integer widthMm, Integer heightMm, String note) {
        validateDimensions(widthMm, heightMm);
        Order order = loadOrder(orderId);
        assertRevisable(order);
        OrderItem item = findItem(order, itemId);
        CustomUserDetails me = currentUser();
        authorizeInstaller(order, me);

        RemeasureQuoteResponse q = computeQuote(item, widthMm, heightMm);

        OrderItemRevision rev = OrderItemRevision.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .orderItemId(item.getId())
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .roomName(item.getRoomName())
                .oldWidthMm(q.getOldWidthMm())
                .oldHeightMm(q.getOldHeightMm())
                .oldTotalPrice(q.getOldTotalPrice())
                .newWidthMm(q.getNewWidthMm())
                .newHeightMm(q.getNewHeightMm())
                .newTotalPrice(q.getNewTotalPrice())
                .delta(q.getDelta())
                .status(RevisionStatus.PENDING)
                .note(note != null && !note.isBlank() ? note.trim() : null)
                .requestedBy(me != null ? me.getId() : null)
                .requestedByName(me != null ? me.getFullName() : null)
                .createdAt(LocalDateTime.now())
                .build();

        OrderItemRevision saved = revisionRepository.save(rev);
        log.info("Qayta o'lchov so'rovi: order={}, item={}, delta={}", orderId, itemId, saved.getDelta());

        // Menejerlarga real-time xabar
        staffNotificationService.createGlobalNotification(
                "📐 Qayta o'lchov so'rovi",
                order.getOrderNumber() + ": " + saved.getProductName()
                        + " — " + formatDelta(saved.getDelta()),
                StaffNotificationType.WARNING,
                "REVISION",
                orderId);

        return OrderItemRevisionResponse.from(saved);
    }

    /**
     * Tasdiqlash — yangi o'lcham/narx buyurtmaga qo'llanadi va jamilar qayta hisoblanadi.
     */
    @Transactional
    public OrderItemRevisionResponse approve(Long revisionId, String note) {
        OrderItemRevision rev = revisionRepository.findById(revisionId)
                .orElseThrow(() -> new ResourceNotFoundException("Qayta o'lchov", "id", revisionId));
        if (rev.getStatus() != RevisionStatus.PENDING) {
            throw new BadRequestException("Bu so'rov allaqachon ko'rib chiqilgan");
        }

        Order order = loadOrder(rev.getOrderId());
        assertRevisable(order);
        OrderItem item = findItem(order, rev.getOrderItemId());

        // Yangi o'lchamni qo'llaymiz va mahsulot narxini qayta hisoblaymiz
        item.setWidthMm(rev.getNewWidthMm());
        item.setHeightMm(rev.getNewHeightMm());
        priceService.calculateItemPrice(item, item.getProduct());

        // Buyurtma jamilarini qayta hisoblash (OrderService.submitMeasurements bilan bir xil naqsh)
        var totals = priceService.calculateOrderTotals(
                order.getItems(), order.getDiscountAmount(), order.getDiscountPercent());
        order.setSubtotal(totals.subtotal());
        order.setTotalAmount(totals.totalAmount());
        order.setRemainingAmount(totals.totalAmount().subtract(order.getPaidAmount()));
        order.setCostTotal(totals.costTotal());
        orderRepository.save(order);

        CustomUserDetails me = currentUser();
        rev.setStatus(RevisionStatus.APPROVED);
        rev.setDecidedBy(me != null ? me.getId() : null);
        rev.setDecidedByName(me != null ? me.getFullName() : null);
        rev.setDecisionNote(note != null && !note.isBlank() ? note.trim() : null);
        rev.setDecidedAt(LocalDateTime.now());
        OrderItemRevision saved = revisionRepository.save(rev);

        notifyRequester(saved, "✅ Qayta o'lchov tasdiqlandi",
                saved.getOrderNumber() + ": yangi narx qabul qilindi (" + formatDelta(saved.getDelta()) + ")");

        log.info("Qayta o'lchov tasdiqlandi: id={}, order={}", revisionId, order.getId());
        return OrderItemRevisionResponse.from(saved);
    }

    /**
     * Rad etish.
     */
    @Transactional
    public OrderItemRevisionResponse reject(Long revisionId, String note) {
        OrderItemRevision rev = revisionRepository.findById(revisionId)
                .orElseThrow(() -> new ResourceNotFoundException("Qayta o'lchov", "id", revisionId));
        if (rev.getStatus() != RevisionStatus.PENDING) {
            throw new BadRequestException("Bu so'rov allaqachon ko'rib chiqilgan");
        }

        CustomUserDetails me = currentUser();
        rev.setStatus(RevisionStatus.REJECTED);
        rev.setDecidedBy(me != null ? me.getId() : null);
        rev.setDecidedByName(me != null ? me.getFullName() : null);
        rev.setDecisionNote(note != null && !note.isBlank() ? note.trim() : null);
        rev.setDecidedAt(LocalDateTime.now());
        OrderItemRevision saved = revisionRepository.save(rev);

        notifyRequester(saved, "❌ Qayta o'lchov rad etildi",
                saved.getOrderNumber() + ": qayta o'lchov so'rovi rad etildi"
                        + (saved.getDecisionNote() != null ? " — " + saved.getDecisionNote() : ""));

        log.info("Qayta o'lchov rad etildi: id={}", revisionId);
        return OrderItemRevisionResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderItemRevisionResponse> getPending() {
        return revisionRepository.findByStatusOrderByCreatedAtDesc(RevisionStatus.PENDING).stream()
                .map(OrderItemRevisionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderItemRevisionResponse> getByOrder(Long orderId) {
        return revisionRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(OrderItemRevisionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return revisionRepository.countByStatus(RevisionStatus.PENDING);
    }

    // ===== Yordamchilar =====

    private RemeasureQuoteResponse computeQuote(OrderItem item, Integer newWidth, Integer newHeight) {
        Product product = item.getProduct();
        OrderItem tmp = OrderItem.builder()
                .product(product)
                .quantity(item.getQuantity())
                .installationIncluded(item.getInstallationIncluded())
                .discount(item.getDiscount())
                .widthMm(newWidth)
                .heightMm(newHeight)
                .build();
        priceService.calculateItemPrice(tmp, product);

        BigDecimal oldTotal = item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO;
        BigDecimal newTotal = tmp.getTotalPrice() != null ? tmp.getTotalPrice() : BigDecimal.ZERO;
        return RemeasureQuoteResponse.builder()
                .oldWidthMm(item.getWidthMm())
                .oldHeightMm(item.getHeightMm())
                .oldTotalPrice(oldTotal)
                .newWidthMm(newWidth)
                .newHeightMm(newHeight)
                .newCalculatedSqm(tmp.getCalculatedSqm())
                .newUnitPrice(tmp.getUnitPrice())
                .newTotalPrice(newTotal)
                .delta(newTotal.subtract(oldTotal))
                .build();
    }

    private Order loadOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
    }

    private OrderItem findItem(Order order, Long itemId) {
        return order.getItems().stream()
                .filter(i -> i.getId() != null && i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", "id", itemId));
    }

    private void assertRevisable(Order order) {
        OrderStatus s = order.getStatus();
        if (s == null
                || s == OrderStatus.BEKOR_QILINDI
                || s.getOrder() > OrderStatus.ORNATISH_JARAYONIDA.getOrder()) {
            throw new BadRequestException("Bu bosqichda qayta o'lchov mumkin emas");
        }
    }

    private void authorizeInstaller(Order order, CustomUserDetails me) {
        if (me != null && !me.hasPermission(PermissionCode.ORDERS_UPDATE.getCode())) {
            if (order.getInstaller() == null || !order.getInstaller().getId().equals(me.getId())) {
                throw new AccessDeniedException("Bu buyurtma sizga tayinlanmagan");
            }
        }
    }

    private void validateDimensions(Integer widthMm, Integer heightMm) {
        if (widthMm == null || heightMm == null || widthMm <= 0 || heightMm <= 0) {
            throw new BadRequestException("O'lcham noto'g'ri (mm, musbat son bo'lishi kerak)");
        }
    }

    private void notifyRequester(OrderItemRevision rev, String title, String message) {
        if (rev.getRequestedBy() == null) {
            return;
        }
        try {
            staffNotificationService.createNotificationForUser(
                    rev.getRequestedBy(), title, message,
                    StaffNotificationType.INFO, "ORDER", rev.getOrderId());
        } catch (Exception e) {
            log.warn("Qayta o'lchov qarorini o'rnatuvchiga yuborib bo'lmadi: {}", e.getMessage());
        }
    }

    private String formatDelta(BigDecimal delta) {
        if (delta == null) {
            return "0 so'm";
        }
        String sign = delta.signum() > 0 ? "+" : (delta.signum() < 0 ? "−" : "");
        return sign + MONEY.format(delta.abs()) + " so'm";
    }

    private CustomUserDetails currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cud) {
            return cud;
        }
        return null;
    }
}
