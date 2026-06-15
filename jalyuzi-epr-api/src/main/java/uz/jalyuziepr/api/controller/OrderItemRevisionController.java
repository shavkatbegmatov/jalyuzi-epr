package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.RemeasureRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.OrderItemRevisionResponse;
import uz.jalyuziepr.api.dto.response.RemeasureQuoteResponse;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.OrderItemRevisionService;

import java.util.List;
import java.util.Map;

/**
 * Joyida qayta o'lchov (re-measure) endpointlari.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Order Item Revisions", description = "Joyida qayta o'lchov + narx qayta-hisoblash")
public class OrderItemRevisionController {

    private final OrderItemRevisionService revisionService;

    @PostMapping("/v1/orders/{orderId}/items/{itemId}/remeasure-quote")
    @RequiresPermission(PermissionCode.ORDERS_INSTALL)
    @Operation(summary = "Qayta o'lchov narx kotirovkasi", description = "Yangi o'lchamga narxni onlik hisoblaydi (saqlamaydi)")
    public ResponseEntity<ApiResponse<RemeasureQuoteResponse>> quote(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestBody RemeasureRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                revisionService.quote(orderId, itemId, request.getWidthMm(), request.getHeightMm())));
    }

    @PostMapping("/v1/orders/{orderId}/items/{itemId}/remeasure")
    @RequiresPermission(PermissionCode.ORDERS_INSTALL)
    @Operation(summary = "Qayta o'lchov so'rovi", description = "Menejer tasdig'iga yuborish")
    public ResponseEntity<ApiResponse<OrderItemRevisionResponse>> request(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestBody RemeasureRequest request) {
        OrderItemRevisionResponse resp = revisionService.requestRevision(
                orderId, itemId, request.getWidthMm(), request.getHeightMm(), request.getNote());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Qayta o'lchov so'rovi menejerga yuborildi", resp));
    }

    @GetMapping("/v1/orders/{orderId}/revisions")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Buyurtma qayta o'lchovlari")
    public ResponseEntity<ApiResponse<List<OrderItemRevisionResponse>>> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(revisionService.getByOrder(orderId)));
    }

    @GetMapping("/v1/order-revisions")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Kutilayotgan qayta o'lchovlar", description = "Menejer tasdig'ini kutayotgan so'rovlar")
    public ResponseEntity<ApiResponse<List<OrderItemRevisionResponse>>> getPending() {
        return ResponseEntity.ok(ApiResponse.success(revisionService.getPending()));
    }

    @GetMapping("/v1/order-revisions/pending-count")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Kutilayotgan qayta o'lchovlar soni")
    public ResponseEntity<ApiResponse<Map<String, Long>>> pendingCount() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", revisionService.countPending())));
    }

    @PostMapping("/v1/order-revisions/{id}/approve")
    @RequiresPermission(PermissionCode.ORDERS_UPDATE)
    @Operation(summary = "Qayta o'lchovni tasdiqlash")
    public ResponseEntity<ApiResponse<OrderItemRevisionResponse>> approve(
            @PathVariable Long id,
            @RequestParam(value = "note", required = false) String note) {
        return ResponseEntity.ok(ApiResponse.success("Tasdiqlandi", revisionService.approve(id, note)));
    }

    @PostMapping("/v1/order-revisions/{id}/reject")
    @RequiresPermission(PermissionCode.ORDERS_UPDATE)
    @Operation(summary = "Qayta o'lchovni rad etish")
    public ResponseEntity<ApiResponse<OrderItemRevisionResponse>> reject(
            @PathVariable Long id,
            @RequestParam(value = "note", required = false) String note) {
        return ResponseEntity.ok(ApiResponse.success("Rad etildi", revisionService.reject(id, note)));
    }
}
