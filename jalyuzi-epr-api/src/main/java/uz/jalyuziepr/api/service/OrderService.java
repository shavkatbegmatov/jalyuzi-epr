package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.*;
import uz.jalyuziepr.api.dto.response.OrderResponse;
import uz.jalyuziepr.api.dto.response.OrderStatsResponse;
import uz.jalyuziepr.api.entity.*;
import uz.jalyuziepr.api.enums.*;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.*;
import uz.jalyuziepr.api.security.CustomUserDetails;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DebtRepository debtRepository;
    private final SaleRepository saleRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StaffNotificationService staffNotificationService;
    private final NotificationService customerNotificationService;
    private final OrderPriceCalculationService priceService;
    private final SettingsService settingsService;

    // ==================== QUERY ====================

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(OrderStatus status, String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return orderRepository.searchOrders(search.trim(), pageable).map(OrderResponse::fromList);
        }
        if (status != null) {
            return orderRepository.findByStatus(status, pageable).map(OrderResponse::fromList);
        }
        return orderRepository.findAll(pageable).map(OrderResponse::fromList);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findByIdWithAllDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Buyurtma", "id", id));
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getCustomerOrders(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerId(customerId, pageable).map(OrderResponse::fromList);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getInstallerOrders(Long installerId) {
        List<OrderStatus> activeStatuses = List.of(
                OrderStatus.ORNATISHGA_TAYINLANDI,
                OrderStatus.ORNATISH_JARAYONIDA,
                OrderStatus.ORNATISH_BAJARILDI,
                OrderStatus.TOLOV_KUTILMOQDA
        );
        return orderRepository.findByInstallerIdAndStatusIn(installerId, activeStatuses).stream()
                .map(OrderResponse::fromList)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderStatsResponse getStats() {
        List<Object[]> statusCounts = orderRepository.countByStatusGroup();
        Map<String, Long> statusMap = new HashMap<>();
        long total = 0, completed = 0, cancelled = 0, active = 0;

        for (Object[] row : statusCounts) {
            OrderStatus s = (OrderStatus) row[0];
            long count = (long) row[1];
            statusMap.put(s.name(), count);
            total += count;
            if (s == OrderStatus.YAKUNLANDI || s == OrderStatus.QARZGA_OTKAZILDI) completed += count;
            else if (s == OrderStatus.BEKOR_QILINDI) cancelled += count;
            else active += count;
        }

        return OrderStatsResponse.builder()
                .totalOrders(total)
                .activeOrders(active)
                .completedOrders(completed)
                .cancelledOrders(cancelled)
                .totalRevenue(orderRepository.sumCompletedOrdersTotal())
                .totalPaid(orderRepository.sumTotalPaid())
                .totalRemaining(orderRepository.sumTotalRemaining())
                .statusCounts(statusMap)
                .build();
    }

    // ==================== LIFECYCLE ====================

    @Transactional
    public OrderResponse createOrder(OrderCreateRequest request) {
        User currentUser = getCurrentUser();

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Mijoz", "id", request.getCustomerId()));

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .customer(customer)
                .status(OrderStatus.YANGI)
                .installationAddress(request.getInstallationAddress() != null ?
                        request.getInstallationAddress() : customer.getAddress())
                .manager(currentUser)
                .notes(request.getNotes())
                .createdBy(currentUser)
                .build();

        // Add items and calculate prices
        for (OrderCreateRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", itemReq.getProductId()));

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .roomName(itemReq.getRoomName())
                    .widthMm(itemReq.getWidthMm())
                    .heightMm(itemReq.getHeightMm())
                    .depthMm(itemReq.getDepthMm())
                    .quantity(itemReq.getQuantity() != null ? itemReq.getQuantity() : 1)
                    .installationIncluded(itemReq.getInstallationIncluded())
                    .discount(itemReq.getDiscount())
                    .unitPrice(itemReq.getCustomPrice())
                    .build();

            priceService.calculateItemPrice(item, product);
            order.addItem(item);
        }

        // Calculate order totals
        var totals = priceService.calculateOrderTotals(
                order.getItems(), request.getDiscountAmount(), request.getDiscountPercent());

        order.setSubtotal(totals.subtotal());
        order.setDiscountAmount(totals.discountAmount());
        order.setDiscountPercent(request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO);
        order.setTotalAmount(totals.totalAmount());
        order.setRemainingAmount(totals.totalAmount());
        order.setCostTotal(totals.costTotal());

        // Status history
        addStatusHistory(order, null, OrderStatus.YANGI, currentUser, "Buyurtma yaratildi");

        Order saved = orderRepository.save(order);

        // Notification
        staffNotificationService.notifyNewOrder(
                saved.getOrderNumber(), customer.getFullName(), saved.getId());

        log.info("Order created: {} for customer: {}", saved.getOrderNumber(), customer.getFullName());
        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse assignMeasurer(Long orderId, OrderAssignRequest request) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.OLCHOV_KUTILMOQDA);
        User currentUser = getCurrentUser();

        Employee measurer = employeeRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Xodim", "id", request.getAssigneeId()));

        order.setMeasurer(measurer);
        order.setMeasurementDate(request.getScheduledDate());
        changeStatus(order, OrderStatus.OLCHOV_KUTILMOQDA, currentUser, request.getNotes());

        Order saved = orderRepository.save(order);

        // Notify measurer's linked user
        staffNotificationService.createGlobalNotification(
                "O'lchov tayinlandi",
                String.format("Buyurtma %s uchun o'lchov tayinlandi. Texnik: %s",
                        order.getOrderNumber(), measurer.getFullName()),
                StaffNotificationType.ORDER, "ORDER", saved.getId());

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse submitMeasurements(Long orderId, OrderMeasurementRequest request) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.OLCHOV_BAJARILDI);
        User currentUser = getCurrentUser();

        // Clear existing items and replace with measured ones
        order.getItems().clear();

        for (OrderMeasurementRequest.MeasurementItem mItem : request.getItems()) {
            Product product = productRepository.findById(mItem.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", mItem.getProductId()));

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .roomName(mItem.getRoomName())
                    .widthMm(mItem.getWidthMm())
                    .heightMm(mItem.getHeightMm())
                    .depthMm(mItem.getDepthMm())
                    .quantity(mItem.getQuantity() != null ? mItem.getQuantity() : 1)
                    .installationIncluded(mItem.getInstallationIncluded())
                    .unitPrice(mItem.getCustomPrice())
                    .build();

            priceService.calculateItemPrice(item, product);
            order.addItem(item);
        }

        // Recalculate totals
        var totals = priceService.calculateOrderTotals(
                order.getItems(), order.getDiscountAmount(), order.getDiscountPercent());

        order.setSubtotal(totals.subtotal());
        order.setTotalAmount(totals.totalAmount());
        order.setRemainingAmount(totals.totalAmount().subtract(order.getPaidAmount()));
        order.setCostTotal(totals.costTotal());

        changeStatus(order, OrderStatus.OLCHOV_BAJARILDI, currentUser, request.getNotes());

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse confirmPrice(Long orderId, String notes) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.NARX_TASDIQLANDI);
        User currentUser = getCurrentUser();

        changeStatus(order, OrderStatus.NARX_TASDIQLANDI, currentUser, notes);
        Order saved = orderRepository.save(order);

        // Notify customer
        if (order.getCustomer() != null && Boolean.TRUE.equals(order.getCustomer().getPortalEnabled())) {
            String metadata = String.format("{\"orderId\": %d}", saved.getId());
            customerNotificationService.sendOrderUpdate(
                    order.getCustomer().getId(),
                    order.getOrderNumber(),
                    String.format("%,.0f", order.getTotalAmount()),
                    metadata
            );
        }

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse receiveDeposit(Long orderId, OrderPaymentRequest request) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.ZAKLAD_QABUL_QILINDI);
        User currentUser = getCurrentUser();

        OrderPayment payment = createPayment(order, request, currentUser);
        order.addPayment(payment);
        updatePaidAmount(order);

        changeStatus(order, OrderStatus.ZAKLAD_QABUL_QILINDI, currentUser, request.getNotes());

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse startProduction(Long orderId, String notes) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.ISHLAB_CHIQARISHDA);
        User currentUser = getCurrentUser();

        order.setProductionStartDate(LocalDateTime.now());

        // Reduce stock for materials
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            BigDecimal previousStock = product.getQuantity();
            BigDecimal needed = BigDecimal.valueOf(item.getQuantity());

            if (previousStock.compareTo(needed) < 0) {
                log.warn("Insufficient stock for product {} (need {}, have {})",
                        product.getName(), needed, previousStock);
            }

            BigDecimal newStock = previousStock.subtract(needed);
            product.setQuantity(newStock);
            productRepository.save(product);

            StockMovement movement = StockMovement.builder()
                    .product(product)
                    .movementType(MovementType.OUT)
                    .quantity(-item.getQuantity())
                    .previousStock(previousStock.intValue())
                    .newStock(newStock.intValue())
                    .referenceType("ORDER")
                    .referenceId(order.getId())
                    .notes("Buyurtma ishlab chiqarish: " + order.getOrderNumber())
                    .createdBy(currentUser)
                    .build();
            stockMovementRepository.save(movement);

            if (newStock.compareTo(BigDecimal.ZERO) > 0 && newStock.compareTo(new BigDecimal("5")) <= 0) {
                staffNotificationService.notifyLowStock(product.getName(), newStock.intValue(), product.getId());
            }
        }

        changeStatus(order, OrderStatus.ISHLAB_CHIQARISHDA, currentUser, notes);

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse completeProduction(Long orderId, String notes) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.TAYYOR);
        User currentUser = getCurrentUser();

        order.setProductionEndDate(LocalDateTime.now());
        changeStatus(order, OrderStatus.TAYYOR, currentUser, notes);

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse assignInstaller(Long orderId, OrderAssignRequest request) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.ORNATISHGA_TAYINLANDI);
        User currentUser = getCurrentUser();

        User installer = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Foydalanuvchi", "id", request.getAssigneeId()));

        order.setInstaller(installer);
        order.setInstallationDate(request.getScheduledDate());
        changeStatus(order, OrderStatus.ORNATISHGA_TAYINLANDI, currentUser, request.getNotes());

        Order saved = orderRepository.save(order);

        // Notify installer
        staffNotificationService.createNotificationForUser(
                installer.getId(),
                "O'rnatish tayinlandi",
                String.format("Buyurtma %s o'rnatish uchun tayinlandi. Manzil: %s",
                        order.getOrderNumber(), order.getInstallationAddress()),
                StaffNotificationType.ORDER, "ORDER", saved.getId());

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse startInstallation(Long orderId, String notes) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.ORNATISH_JARAYONIDA);
        User currentUser = getCurrentUser();

        changeStatus(order, OrderStatus.ORNATISH_JARAYONIDA, currentUser, notes);

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse completeInstallation(Long orderId, String notes) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.ORNATISH_BAJARILDI);
        User currentUser = getCurrentUser();

        changeStatus(order, OrderStatus.ORNATISH_BAJARILDI, currentUser, notes);
        Order saved = orderRepository.save(order);

        // Notify manager
        staffNotificationService.createGlobalNotification(
                "O'rnatish bajarildi",
                String.format("Buyurtma %s o'rnatish muvaffaqiyatli bajarildi",
                        order.getOrderNumber()),
                StaffNotificationType.SUCCESS, "ORDER", saved.getId());

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse collectPayment(Long orderId, OrderPaymentRequest request) {
        Order order = getOrderEntity(orderId);
        // Allow payment collection at ORNATISH_BAJARILDI or TOLOV_KUTILMOQDA
        if (order.getStatus() != OrderStatus.ORNATISH_BAJARILDI &&
                order.getStatus() != OrderStatus.TOLOV_KUTILMOQDA) {
            throw new BadRequestException("Bu holatda to'lov qabul qilib bo'lmaydi");
        }
        User currentUser = getCurrentUser();

        OrderPayment payment = createPayment(order, request, currentUser);
        order.addPayment(payment);
        updatePaidAmount(order);

        // If at ORNATISH_BAJARILDI, transition to TOLOV_KUTILMOQDA
        if (order.getStatus() == OrderStatus.ORNATISH_BAJARILDI) {
            changeStatus(order, OrderStatus.TOLOV_KUTILMOQDA, currentUser, request.getNotes());
        }

        Order saved = orderRepository.save(order);

        // Notify manager about collected payment
        staffNotificationService.createGlobalNotification(
                "To'lov qabul qilindi",
                String.format("Buyurtma %s uchun %,.0f so'm to'lov qabul qilindi",
                        order.getOrderNumber(), request.getAmount()),
                StaffNotificationType.PAYMENT, "ORDER", saved.getId());

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse confirmPayment(Long paymentId) {
        OrderPayment payment = orderPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("To'lov", "id", paymentId));

        if (Boolean.TRUE.equals(payment.getIsConfirmed())) {
            throw new BadRequestException("Bu to'lov allaqachon tasdiqlangan");
        }

        User currentUser = getCurrentUser();
        payment.setIsConfirmed(true);
        payment.setConfirmedBy(currentUser);
        orderPaymentRepository.save(payment);

        return OrderResponse.from(orderRepository.findByIdWithAllDetails(payment.getOrder().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Buyurtma topilmadi")));
    }

    @Transactional
    public OrderResponse finalizeOrder(Long orderId, String notes) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.YAKUNLANDI);
        User currentUser = getCurrentUser();

        order.setCompletedDate(LocalDateTime.now());
        changeStatus(order, OrderStatus.YAKUNLANDI, currentUser, notes);

        // Generate Sale record
        Sale sale = createSaleFromOrder(order, currentUser);
        order.setSale(sale);

        Order saved = orderRepository.save(order);

        // Notify customer
        if (order.getCustomer() != null && Boolean.TRUE.equals(order.getCustomer().getPortalEnabled())) {
            String metadata = String.format("{\"orderId\": %d}", saved.getId());
            customerNotificationService.sendOrderCompleted(
                    order.getCustomer().getId(),
                    order.getOrderNumber(),
                    metadata
            );
        }

        log.info("Order finalized: {}", order.getOrderNumber());
        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse transferToDebt(Long orderId, String notes) {
        Order order = getOrderEntity(orderId);
        validateTransition(order, OrderStatus.QARZGA_OTKAZILDI);
        User currentUser = getCurrentUser();

        order.setCompletedDate(LocalDateTime.now());

        // Generate Sale record
        Sale sale = createSaleFromOrder(order, currentUser);
        order.setSale(sale);

        // Create Debt record for remaining amount
        if (order.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0) {
            int dueDays = settingsService.getDebtDueDays();
            Debt debt = Debt.builder()
                    .customer(order.getCustomer())
                    .sale(sale)
                    .originalAmount(order.getRemainingAmount())
                    .remainingAmount(order.getRemainingAmount())
                    .dueDate(LocalDate.now().plusDays(dueDays))
                    .status(DebtStatus.ACTIVE)
                    .notes("Buyurtma: " + order.getOrderNumber())
                    .build();
            Debt savedDebt = debtRepository.save(debt);
            order.setDebt(savedDebt);

            // Update customer balance
            Customer customer = order.getCustomer();
            customer.setBalance(customer.getBalance().subtract(order.getRemainingAmount()));
            customerRepository.save(customer);
        }

        changeStatus(order, OrderStatus.QARZGA_OTKAZILDI, currentUser, notes);

        Order saved = orderRepository.save(order);
        log.info("Order transferred to debt: {}", order.getOrderNumber());
        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, String notes) {
        Order order = getOrderEntity(orderId);
        if (order.getStatus() == OrderStatus.YAKUNLANDI || order.getStatus() == OrderStatus.QARZGA_OTKAZILDI ||
                order.getStatus() == OrderStatus.BEKOR_QILINDI) {
            throw new BadRequestException("Bu buyurtmani bekor qilib bo'lmaydi");
        }
        User currentUser = getCurrentUser();

        // If production started, restore stock
        if (order.getStatus().getOrder() >= OrderStatus.ISHLAB_CHIQARISHDA.getOrder()) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                BigDecimal previousStock = product.getQuantity();
                BigDecimal newStock = previousStock.add(BigDecimal.valueOf(item.getQuantity()));
                product.setQuantity(newStock);
                productRepository.save(product);

                StockMovement movement = StockMovement.builder()
                        .product(product)
                        .movementType(MovementType.IN)
                        .quantity(item.getQuantity())
                        .previousStock(previousStock.intValue())
                        .newStock(newStock.intValue())
                        .referenceType("ORDER_CANCEL")
                        .referenceId(order.getId())
                        .notes("Buyurtma bekor qilindi: " + order.getOrderNumber())
                        .createdBy(currentUser)
                        .build();
                stockMovementRepository.save(movement);
            }
        }

        changeStatus(order, OrderStatus.BEKOR_QILINDI, currentUser, notes);

        return OrderResponse.from(orderRepository.save(order));
    }

    // ==================== HELPERS ====================

    private Order getOrderEntity(Long orderId) {
        return orderRepository.findByIdWithAllDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyurtma", "id", orderId));
    }

    private void validateTransition(Order order, OrderStatus target) {
        if (!order.getStatus().canTransitionTo(target)) {
            throw new BadRequestException(
                    String.format("'%s' holatidan '%s' holatiga o'tib bo'lmaydi",
                            order.getStatus().getDisplayName(), target.getDisplayName()));
        }
    }

    private void changeStatus(Order order, OrderStatus newStatus, User changedBy, String notes) {
        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        addStatusHistory(order, oldStatus, newStatus, changedBy, notes);
    }

    private void addStatusHistory(Order order, OrderStatus from, OrderStatus to, User changedBy, String notes) {
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(changedBy)
                .notes(notes)
                .build();
        order.addStatusHistory(history);
    }

    private OrderPayment createPayment(Order order, OrderPaymentRequest request, User collector) {
        return OrderPayment.builder()
                .order(order)
                .paymentType(request.getPaymentType())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .collectedBy(collector)
                .isConfirmed(false)
                .notes(request.getNotes())
                .build();
    }

    private void updatePaidAmount(Order order) {
        BigDecimal totalPaid = order.getPayments().stream()
                .map(OrderPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setPaidAmount(totalPaid);
        order.setRemainingAmount(order.getTotalAmount().subtract(totalPaid).max(BigDecimal.ZERO));
    }

    private Sale createSaleFromOrder(Order order, User currentUser) {
        Sale sale = Sale.builder()
                .invoiceNumber(generateInvoiceNumber())
                .customer(order.getCustomer())
                .saleDate(LocalDateTime.now())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .discountPercent(order.getDiscountPercent())
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .debtAmount(order.getRemainingAmount())
                .paymentMethod(PaymentMethod.CASH)
                .paymentStatus(order.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0 ?
                        PaymentStatus.PAID : PaymentStatus.PARTIAL)
                .status(SaleStatus.COMPLETED)
                .notes("Buyurtma: " + order.getOrderNumber())
                .orderType(OrderType.INSTALLATION)
                .installationAddress(order.getInstallationAddress())
                .createdBy(currentUser)
                .build();

        // Add sale items
        for (OrderItem orderItem : order.getItems()) {
            SaleItem saleItem = SaleItem.builder()
                    .product(orderItem.getProduct())
                    .quantity(orderItem.getQuantity())
                    .unitPrice(orderItem.getUnitPrice())
                    .discount(orderItem.getDiscount())
                    .totalPrice(orderItem.getTotalPrice())
                    .customWidth(orderItem.getWidthMm())
                    .customHeight(orderItem.getHeightMm())
                    .calculatedSqm(orderItem.getCalculatedSqm())
                    .calculatedPrice(orderItem.getUnitPrice())
                    .installationIncluded(orderItem.getInstallationIncluded())
                    .build();
            sale.addItem(saleItem);
        }

        return saleRepository.save(sale);
    }

    private String generateOrderNumber() {
        String prefix = "ORD" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer maxNumber = orderRepository.findMaxOrderNumber(prefix);
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return prefix + String.format("%04d", nextNumber);
    }

    private String generateInvoiceNumber() {
        String prefix = "INV" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer maxNumber = saleRepository.findMaxInvoiceNumber(prefix);
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return prefix + String.format("%04d", nextNumber);
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Foydalanuvchi", "id", userDetails.getId()));
    }
}
