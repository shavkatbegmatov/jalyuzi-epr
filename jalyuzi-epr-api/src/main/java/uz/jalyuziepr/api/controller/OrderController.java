package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.*;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.OrderResponse;
import uz.jalyuziepr.api.dto.response.OrderStatsResponse;
import uz.jalyuziepr.api.dto.response.PagedResponse;
import uz.jalyuziepr.api.enums.OrderStatus;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.CustomUserDetails;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.OrderService;

import java.util.List;

@RestController
@RequestMapping("/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Buyurtmalar boshqaruvi API")
public class OrderController {

    private final OrderService orderService;

    // ==================== QUERY ====================

    @GetMapping
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Barcha buyurtmalar", description = "Buyurtmalar ro'yxatini olish")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<OrderResponse> orders = orderService.getAllOrders(status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(orders)));
    }

    @GetMapping("/{id}")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Buyurtma tafsiloti", description = "ID bo'yicha buyurtmani olish")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderById(id)));
    }

    @GetMapping("/stats")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Buyurtma statistikasi", description = "Buyurtmalar umumiy statistikasi")
    public ResponseEntity<ApiResponse<OrderStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getStats()));
    }

    @GetMapping("/installer/my")
    @RequiresPermission(PermissionCode.ORDERS_INSTALL)
    @Operation(summary = "O'rnatuvchi buyurtmalari", description = "Joriy o'rnatuvchiga tayinlangan buyurtmalar")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getInstallerOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getInstallerOrders(userDetails.getId())));
    }

    // ==================== LIFECYCLE ====================

    @PostMapping
    @RequiresPermission(PermissionCode.ORDERS_CREATE)
    @Operation(summary = "Buyurtma yaratish", description = "Yangi buyurtma yaratish")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody OrderCreateRequest request) {
        OrderResponse order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Buyurtma muvaffaqiyatli yaratildi", order));
    }

    @PostMapping("/{id}/assign-measurer")
    @RequiresPermission(PermissionCode.ORDERS_ASSIGN)
    @Operation(summary = "O'lchov tayinlash", description = "O'lchovchi tayinlash")
    public ResponseEntity<ApiResponse<OrderResponse>> assignMeasurer(
            @PathVariable Long id, @Valid @RequestBody OrderAssignRequest request) {
        return ResponseEntity.ok(ApiResponse.success("O'lchovchi tayinlandi",
                orderService.assignMeasurer(id, request)));
    }

    @PostMapping("/{id}/measurements")
    @RequiresPermission(PermissionCode.ORDERS_MEASURE)
    @Operation(summary = "O'lchov kiritish", description = "O'lchov natijalarini kiritish")
    public ResponseEntity<ApiResponse<OrderResponse>> submitMeasurements(
            @PathVariable Long id, @Valid @RequestBody OrderMeasurementRequest request) {
        return ResponseEntity.ok(ApiResponse.success("O'lchov natijalari kiritildi",
                orderService.submitMeasurements(id, request)));
    }

    @PostMapping("/{id}/confirm-price")
    @RequiresPermission(PermissionCode.ORDERS_UPDATE)
    @Operation(summary = "Narx tasdiqlash", description = "Buyurtma narxini tasdiqlash")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmPrice(
            @PathVariable Long id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success("Narx tasdiqlandi",
                orderService.confirmPrice(id, notes)));
    }

    @PostMapping("/{id}/deposit")
    @RequiresPermission(PermissionCode.ORDERS_COLLECT_PAYMENT)
    @Operation(summary = "Zaklad qabul qilish", description = "Garov olish")
    public ResponseEntity<ApiResponse<OrderResponse>> receiveDeposit(
            @PathVariable Long id, @Valid @RequestBody OrderPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Zaklad qabul qilindi",
                orderService.receiveDeposit(id, request)));
    }

    @PostMapping("/{id}/start-production")
    @RequiresPermission(PermissionCode.ORDERS_PRODUCE)
    @Operation(summary = "Ishlab chiqarishni boshlash", description = "Ishlab chiqarish jarayonini boshlash")
    public ResponseEntity<ApiResponse<OrderResponse>> startProduction(
            @PathVariable Long id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success("Ishlab chiqarish boshlandi",
                orderService.startProduction(id, notes)));
    }

    @PostMapping("/{id}/complete-production")
    @RequiresPermission(PermissionCode.ORDERS_PRODUCE)
    @Operation(summary = "Ishlab chiqarishni yakunlash", description = "Mahsulot tayyor")
    public ResponseEntity<ApiResponse<OrderResponse>> completeProduction(
            @PathVariable Long id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success("Ishlab chiqarish yakunlandi",
                orderService.completeProduction(id, notes)));
    }

    @PostMapping("/{id}/assign-installer")
    @RequiresPermission(PermissionCode.ORDERS_ASSIGN)
    @Operation(summary = "O'rnatuvchi tayinlash", description = "O'rnatuvchi tayinlash")
    public ResponseEntity<ApiResponse<OrderResponse>> assignInstaller(
            @PathVariable Long id, @Valid @RequestBody OrderAssignRequest request) {
        return ResponseEntity.ok(ApiResponse.success("O'rnatuvchi tayinlandi",
                orderService.assignInstaller(id, request)));
    }

    @PostMapping("/{id}/start-installation")
    @RequiresPermission(PermissionCode.ORDERS_INSTALL)
    @Operation(summary = "O'rnatishni boshlash", description = "O'rnatish jarayonini boshlash")
    public ResponseEntity<ApiResponse<OrderResponse>> startInstallation(
            @PathVariable Long id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success("O'rnatish boshlandi",
                orderService.startInstallation(id, notes)));
    }

    @PostMapping("/{id}/complete-installation")
    @RequiresPermission(PermissionCode.ORDERS_INSTALL)
    @Operation(summary = "O'rnatishni yakunlash", description = "O'rnatish bajarildi")
    public ResponseEntity<ApiResponse<OrderResponse>> completeInstallation(
            @PathVariable Long id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success("O'rnatish bajarildi",
                orderService.completeInstallation(id, notes)));
    }

    @PostMapping("/{id}/collect-payment")
    @RequiresPermission(PermissionCode.ORDERS_COLLECT_PAYMENT)
    @Operation(summary = "To'lov yig'ish", description = "Mijozdan to'lov qabul qilish")
    public ResponseEntity<ApiResponse<OrderResponse>> collectPayment(
            @PathVariable Long id, @Valid @RequestBody OrderPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("To'lov qabul qilindi",
                orderService.collectPayment(id, request)));
    }

    @PostMapping("/payments/{paymentId}/confirm")
    @RequiresPermission(PermissionCode.ORDERS_CONFIRM_PAYMENT)
    @Operation(summary = "To'lovni tasdiqlash", description = "Yig'ilgan to'lovni tasdiqlash")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmPayment(@PathVariable Long paymentId) {
        return ResponseEntity.ok(ApiResponse.success("To'lov tasdiqlandi",
                orderService.confirmPayment(paymentId)));
    }

    @PostMapping("/{id}/finalize")
    @RequiresPermission(PermissionCode.ORDERS_UPDATE)
    @Operation(summary = "Buyurtmani yakunlash", description = "Buyurtmani yakunlash va sotuvga o'tkazish")
    public ResponseEntity<ApiResponse<OrderResponse>> finalizeOrder(
            @PathVariable Long id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success("Buyurtma yakunlandi",
                orderService.finalizeOrder(id, notes)));
    }

    @PostMapping("/{id}/transfer-to-debt")
    @RequiresPermission(PermissionCode.ORDERS_UPDATE)
    @Operation(summary = "Qarzga o'tkazish", description = "Buyurtmani qarzga o'tkazish")
    public ResponseEntity<ApiResponse<OrderResponse>> transferToDebt(
            @PathVariable Long id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success("Buyurtma qarzga o'tkazildi",
                orderService.transferToDebt(id, notes)));
    }

    @PostMapping("/{id}/cancel")
    @RequiresPermission(PermissionCode.ORDERS_UPDATE)
    @Operation(summary = "Buyurtmani bekor qilish", description = "Buyurtmani bekor qilish")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id, @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(ApiResponse.success("Buyurtma bekor qilindi",
                orderService.cancelOrder(id, notes)));
    }
}
