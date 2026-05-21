package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.ProductionMaterialRequest;
import uz.jalyuziepr.api.dto.request.ProductionOrderCreateRequest;
import uz.jalyuziepr.api.dto.request.ProductionStageMoveRequest;
import uz.jalyuziepr.api.dto.response.ProductionOrderResponse;
import uz.jalyuziepr.api.dto.response.ProductionStageResponse;
import uz.jalyuziepr.api.dto.response.ProductionStatsResponse;
import uz.jalyuziepr.api.repository.ProductionStageHistoryRepository;
import uz.jalyuziepr.api.entity.*;
import uz.jalyuziepr.api.enums.ProductionStatus;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.*;
import uz.jalyuziepr.api.security.CustomUserDetails;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Ishlab chiqarish moduli xizmati.
 *
 * Asosiy oqim:
 *   Order ZAKLAD_QABUL_QILINDI bo'lganda — autoCreateForOrder() chaqirilib,
 *   har bir OrderItem uchun alohida ProductionOrder ochiladi.
 *   Sex menejeri esa stage'ni kanban orqali harakatlantiradi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionService {

    private final ProductionOrderRepository productionOrderRepository;
    private final ProductionStageRepository stageRepository;
    private final ProductionStageHistoryRepository stageHistoryRepository;
    private final ProductionMaterialRepository materialRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StaffNotificationService staffNotificationService;

    // ==================== STAGE CATALOG ====================

    @Transactional(readOnly = true)
    public List<ProductionStageResponse> getAllActiveStages() {
        return stageRepository.findAllByIsActiveTrueOrderBySequenceAsc().stream()
                .map(ProductionStageResponse::from)
                .collect(Collectors.toList());
    }

    // ==================== KANBAN BOARD ====================

    /**
     * Kanban board — barcha faol production orderlarni stage bo'yicha tartiblangan.
     * Frontend: stage_id bo'yicha guruhlab kolonna qiladi.
     */
    @Transactional(readOnly = true)
    public List<ProductionOrderResponse> getKanbanBoard() {
        return productionOrderRepository.findActiveBoard().stream()
                .map(ProductionOrderResponse::from)
                .collect(Collectors.toList());
    }

    // ==================== PRODUCTION ORDER CRUD ====================

    @Transactional(readOnly = true)
    public ProductionOrderResponse getById(Long id) {
        ProductionOrder po = productionOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Production order", "id", id));
        return ProductionOrderResponse.fromDetailed(po);
    }

    @Transactional(readOnly = true)
    public Page<ProductionOrderResponse> getByStatus(ProductionStatus status, Pageable pageable) {
        return productionOrderRepository.findByStatus(status, pageable)
                .map(ProductionOrderResponse::from);
    }

    @Transactional
    public ProductionOrderResponse create(ProductionOrderCreateRequest req) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));

        OrderItem orderItem = null;
        if (req.getOrderItemId() != null) {
            orderItem = orderItemRepository.findById(req.getOrderItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("OrderItem", "id", req.getOrderItemId()));
        }

        User worker = null;
        if (req.getAssignedWorkerId() != null) {
            worker = userRepository.findById(req.getAssignedWorkerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", req.getAssignedWorkerId()));
        }

        ProductionStage firstStage = stageRepository.findFirstByIsActiveTrueOrderBySequenceAsc()
                .orElseThrow(() -> new BadRequestException("Faol bosqichlar yo'q. Avval production_stages jadvalini sozlang."));

        ProductionOrder po = ProductionOrder.builder()
                .productionNumber(generateProductionNumber())
                .order(order)
                .orderItem(orderItem)
                .status(ProductionStatus.PENDING)
                .currentStage(firstStage)
                .assignedWorker(worker)
                .priority(req.getPriority() != null ? req.getPriority() : 3)
                .deadline(req.getDeadline())
                .notes(req.getNotes())
                .createdBy(getCurrentUser())
                .build();

        po = productionOrderRepository.save(po);

        log.info("ProductionOrder created: {} for order {}", po.getProductionNumber(), order.getOrderNumber());
        return ProductionOrderResponse.from(po);
    }

    /**
     * Order ZAKLAD_QABUL_QILINDI bo'lganda OrderService tomonidan chaqiriladi.
     * Order'dagi har bir item uchun alohida production order yaratiladi.
     */
    @Transactional
    public List<ProductionOrderResponse> autoCreateForOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Allaqachon yaratilgan bo'lsa, yana yaratmaymiz
        List<ProductionOrder> existing = productionOrderRepository.findByOrderId(orderId);
        if (!existing.isEmpty()) {
            log.info("ProductionOrders already exist for order {}: {} items", orderId, existing.size());
            return existing.stream().map(ProductionOrderResponse::from).collect(Collectors.toList());
        }

        ProductionStage firstStage = stageRepository.findFirstByIsActiveTrueOrderBySequenceAsc()
                .orElseThrow(() -> new BadRequestException("Faol bosqichlar yo'q. Avval production_stages jadvalini sozlang."));

        User currentUser = getCurrentUserOrNull();
        List<ProductionOrder> created = new ArrayList<>();

        if (order.getItems() == null || order.getItems().isEmpty()) {
            // Item yo'q bo'lsa, butun order uchun bitta production order
            ProductionOrder po = buildAutoOrder(order, null, firstStage, currentUser);
            created.add(productionOrderRepository.save(po));
        } else {
            for (OrderItem item : order.getItems()) {
                ProductionOrder po = buildAutoOrder(order, item, firstStage, currentUser);
                created.add(productionOrderRepository.save(po));
            }
        }

        // Sex menejerlariga bildirishnoma
        try {
            staffNotificationService.notifyNewProductionOrder(order.getOrderNumber(), created.size());
        } catch (Exception e) {
            log.warn("Failed to send production notification: {}", e.getMessage());
        }

        log.info("Auto-created {} production orders for order {}", created.size(), order.getOrderNumber());
        return created.stream().map(ProductionOrderResponse::from).collect(Collectors.toList());
    }

    private ProductionOrder buildAutoOrder(Order order, OrderItem item, ProductionStage stage, User createdBy) {
        return ProductionOrder.builder()
                .productionNumber(generateProductionNumber())
                .order(order)
                .orderItem(item)
                .status(ProductionStatus.PENDING)
                .currentStage(stage)
                .priority(3)
                .deadline(order.getInstallationDate() != null
                        ? order.getInstallationDate().minusDays(2)
                        : null)
                .createdBy(createdBy)
                .build();
    }

    // ==================== STAGE MOVES ====================

    /**
     * Production order'ni boshqa bosqichga ko'chirish (Kanban drag-drop).
     * Avtomatik:
     *   - Avvalgi stage history yopiladi (completed_at = now)
     *   - Yangi stage history boshlandi
     *   - Production order statusi yangilanadi (PENDING → IN_PROGRESS)
     *   - Oxirgi bosqichga yetganda — COMPLETED
     */
    @Transactional
    public ProductionOrderResponse moveToStage(Long productionOrderId, ProductionStageMoveRequest req) {
        ProductionOrder po = productionOrderRepository.findByIdWithDetails(productionOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order", "id", productionOrderId));

        if (po.getStatus().isTerminal()) {
            throw new BadRequestException("Yakunlangan production orderni harakatlantirib bo'lmaydi");
        }

        ProductionStage newStage = stageRepository.findById(req.getStageId())
                .orElseThrow(() -> new ResourceNotFoundException("Stage", "id", req.getStageId()));

        if (!newStage.getIsActive()) {
            throw new BadRequestException("Faol emas bo'lgan bosqichga ko'chirib bo'lmaydi");
        }

        LocalDateTime now = LocalDateTime.now();
        User currentUser = getCurrentUserOrNull();

        // 1) Avvalgi ochiq stage history'ni yopish
        stageHistoryRepository.findOpenStages(po.getId()).forEach(h -> {
            h.setCompletedAt(now);
            if (h.getStartedAt() != null) {
                h.setDurationMinutes((int) java.time.Duration.between(h.getStartedAt(), now).toMinutes());
            }
        });

        // 2) Brakka uchragan bo'lsa
        if (req.getDefectReason() != null && !req.getDefectReason().isBlank()) {
            po.setDefectReason(req.getDefectReason());
        }

        // 3) Yangi stage tarixini ochish
        ProductionStageHistory newHistory = ProductionStageHistory.builder()
                .productionOrder(po)
                .stage(newStage)
                .worker(currentUser)
                .startedAt(now)
                .notes(req.getNotes())
                .build();
        stageHistoryRepository.save(newHistory);

        // 4) Production orderni yangilash
        po.setCurrentStage(newStage);
        if (po.getStartedAt() == null) {
            po.setStartedAt(now);
        }
        if (po.getStatus() == ProductionStatus.PENDING) {
            po.setStatus(ProductionStatus.IN_PROGRESS);
        }

        // 5) Oxirgi bosqichmi? — completed
        List<ProductionStage> all = stageRepository.findAllByIsActiveTrueOrderBySequenceAsc();
        if (!all.isEmpty() && all.get(all.size() - 1).getId().equals(newStage.getId())) {
            po.setStatus(ProductionStatus.COMPLETED);
            po.setCompletedAt(now);
        }

        po = productionOrderRepository.save(po);
        log.info("ProductionOrder {} moved to stage {}", po.getProductionNumber(), newStage.getName());
        return ProductionOrderResponse.fromDetailed(po);
    }

    @Transactional
    public ProductionOrderResponse assignWorker(Long productionOrderId, Long workerId) {
        ProductionOrder po = productionOrderRepository.findByIdWithDetails(productionOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order", "id", productionOrderId));

        if (workerId == null) {
            po.setAssignedWorker(null);
        } else {
            User worker = userRepository.findById(workerId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", workerId));
            po.setAssignedWorker(worker);
        }

        po = productionOrderRepository.save(po);
        return ProductionOrderResponse.from(po);
    }

    @Transactional
    public ProductionOrderResponse setStatus(Long productionOrderId, ProductionStatus newStatus, String reason) {
        ProductionOrder po = productionOrderRepository.findByIdWithDetails(productionOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order", "id", productionOrderId));

        if (po.getStatus().isTerminal() && newStatus != po.getStatus()) {
            throw new BadRequestException("Yakunlangan production orderni o'zgartirib bo'lmaydi");
        }

        po.setStatus(newStatus);
        if (newStatus == ProductionStatus.COMPLETED) {
            po.setCompletedAt(LocalDateTime.now());
        }
        if (newStatus == ProductionStatus.CANCELLED || newStatus == ProductionStatus.ON_HOLD) {
            po.setDefectReason(reason);
        }

        po = productionOrderRepository.save(po);
        return ProductionOrderResponse.from(po);
    }

    // ==================== MATERIALS ====================

    @Transactional
    public ProductionOrderResponse addMaterial(Long productionOrderId, ProductionMaterialRequest req) {
        ProductionOrder po = productionOrderRepository.findByIdWithDetails(productionOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order", "id", productionOrderId));

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", req.getProductId()));

        BigDecimal unitCost = req.getUnitCost() != null
                ? req.getUnitCost()
                : (product.getPurchasePrice() != null ? product.getPurchasePrice() : BigDecimal.ZERO);

        BigDecimal totalUsed = nz(req.getQuantityUsed()).add(nz(req.getQuantityWasted()));
        BigDecimal totalCost = unitCost.multiply(totalUsed);

        ProductionMaterial material = ProductionMaterial.builder()
                .productionOrder(po)
                .product(product)
                .quantityPlanned(nz(req.getQuantityPlanned()))
                .quantityUsed(nz(req.getQuantityUsed()))
                .quantityWasted(nz(req.getQuantityWasted()))
                .unit(req.getUnit() != null ? req.getUnit() : "METER")
                .unitCost(unitCost)
                .totalCost(totalCost)
                .notes(req.getNotes())
                .recordedBy(getCurrentUserOrNull())
                .build();

        materialRepository.save(material);
        return ProductionOrderResponse.fromDetailed(
                productionOrderRepository.findByIdWithDetails(productionOrderId).orElseThrow()
        );
    }

    // ==================== STATS (Sprint 6.3) ====================

    @Transactional(readOnly = true)
    public ProductionStatsResponse getStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);

        long inProgress = productionOrderRepository.countActiveByStage(0L) >= 0
                ? productionOrderRepository.findActiveBoard().size() : 0;
        long completed = productionOrderRepository.countCompletedBetween(thirtyDaysAgo, now);
        long cancelled = productionOrderRepository.countCancelledBetween(thirtyDaysAgo, now);
        long overdue = productionOrderRepository.countOverdue(now);
        Double avgDays = productionOrderRepository.averageCompletionDays(thirtyDaysAgo, now);

        List<ProductionStatsResponse.StageDistributionItem> stageDist =
                productionOrderRepository.stageDistribution().stream()
                        .map(row -> ProductionStatsResponse.StageDistributionItem.builder()
                                .stageId(((Number) row[0]).longValue())
                                .stageName((String) row[1])
                                .stageColor((String) row[2])
                                .sequence(((Number) row[3]).intValue())
                                .count(((Number) row[4]).longValue())
                                .build())
                        .collect(Collectors.toList());

        List<ProductionStatsResponse.WorkerKpiItem> workerKpi =
                productionOrderRepository.workerKpiRaw().stream()
                        .map(row -> ProductionStatsResponse.WorkerKpiItem.builder()
                                .workerId(((Number) row[0]).longValue())
                                .workerName((String) row[1])
                                .completedOrders(((Number) row[2]).longValue())
                                .activeOrders(((Number) row[3]).longValue())
                                .build())
                        .collect(Collectors.toList());

        // Worker totalMinutes va average ni stage history dan to'ldirish
        for (ProductionStatsResponse.WorkerKpiItem w : workerKpi) {
            Long mins = stageHistoryRepository.sumWorkerMinutes(w.getWorkerId(), thirtyDaysAgo, now);
            w.setTotalMinutes(mins);
            if (w.getCompletedOrders() > 0 && mins != null) {
                w.setAverageMinutesPerOrder((double) mins / w.getCompletedOrders());
            }
        }

        List<ProductionStatsResponse.DefectReasonItem> defects =
                productionOrderRepository.defectReasons(thirtyDaysAgo, now).stream()
                        .map(row -> ProductionStatsResponse.DefectReasonItem.builder()
                                .reason((String) row[0])
                                .count(((Number) row[1]).longValue())
                                .build())
                        .collect(Collectors.toList());

        long totalLast30 = completed + cancelled + productionOrderRepository.findActiveBoard().size();
        long withDefects = productionOrderRepository.countWithDefects(thirtyDaysAgo, now);
        double defectRate = totalLast30 > 0 ? (withDefects * 100.0 / totalLast30) : 0.0;

        BigDecimal totalMaterialCost = materialRepository.sumAllTotalCost();
        BigDecimal totalWasted = materialRepository.sumWastedCost();
        double wastePercent = totalMaterialCost.compareTo(BigDecimal.ZERO) > 0
                ? totalWasted.multiply(BigDecimal.valueOf(100))
                        .divide(totalMaterialCost, 2, java.math.RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        return ProductionStatsResponse.builder()
                .totalOrdersInProgress(inProgress)
                .totalCompletedLast30Days(completed)
                .totalCancelledLast30Days(cancelled)
                .overdueOrders(overdue)
                .averageCompletionDays(avgDays)
                .stageDistribution(stageDist)
                .workerKpi(workerKpi)
                .defectReasons(defects)
                .defectRatePercent(defectRate)
                .totalMaterialCost(totalMaterialCost)
                .totalMaterialWasted(totalWasted)
                .wastePercent(wastePercent)
                .build();
    }

    // ==================== HELPERS ====================

    private String generateProductionNumber() {
        String prefix = "PROD-";
        long count = productionOrderRepository.count();
        String candidate;
        do {
            count++;
            candidate = prefix + String.format("%05d", count);
        } while (productionOrderRepository.countByProductionNumberPrefix(candidate) > 0);
        return candidate;
    }

    private User getCurrentUser() {
        CustomUserDetails ud = getUserDetailsOrNull();
        if (ud == null) {
            throw new BadRequestException("Auth user not found in security context");
        }
        return userRepository.findById(ud.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", ud.getId()));
    }

    private User getCurrentUserOrNull() {
        CustomUserDetails ud = getUserDetailsOrNull();
        if (ud == null) return null;
        return userRepository.findById(ud.getId()).orElse(null);
    }

    private CustomUserDetails getUserDetailsOrNull() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof CustomUserDetails ? (CustomUserDetails) principal : null;
    }

    private BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
