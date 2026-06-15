package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.OrderEscalationResponse;
import uz.jalyuziepr.api.enums.EscalationReason;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.OrderEscalationService;

import java.util.List;
import java.util.Map;

/**
 * Dala o'rnatuvchi SOS / eskalatsiya endpointlari.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Order Escalations", description = "Dala o'rnatuvchi SOS / eskalatsiya")
public class EscalationController {

    private final OrderEscalationService escalationService;

    @PostMapping(value = "/v1/orders/{orderId}/escalations", consumes = "multipart/form-data")
    @RequiresPermission(PermissionCode.ORDERS_INSTALL)
    @Operation(summary = "Eskalatsiya yaratish", description = "O'rnatuvchi tezkor yordam so'rovi (ixtiyoriy foto bilan)")
    public ResponseEntity<ApiResponse<OrderEscalationResponse>> create(
            @PathVariable Long orderId,
            @RequestParam("reason") EscalationReason reason,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        OrderEscalationResponse resp = escalationService.create(orderId, reason, description, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tezkor yordam so'rovi yuborildi", resp));
    }

    @GetMapping("/v1/orders/{orderId}/escalations")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Buyurtma eskalatsiyalari", description = "Buyurtma bo'yicha barcha eskalatsiyalar")
    public ResponseEntity<ApiResponse<List<OrderEscalationResponse>>> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(escalationService.getByOrder(orderId)));
    }

    @GetMapping("/v1/escalations")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Ochiq eskalatsiyalar", description = "Hal qilinmagan eskalatsiyalar (menejer paneli)")
    public ResponseEntity<ApiResponse<List<OrderEscalationResponse>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(escalationService.getActive()));
    }

    @GetMapping("/v1/escalations/active-count")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Ochiq eskalatsiyalar soni", description = "Badge uchun")
    public ResponseEntity<ApiResponse<Map<String, Long>>> activeCount() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", escalationService.countActive())));
    }

    @PostMapping("/v1/escalations/{id}/resolve")
    @RequiresPermission(PermissionCode.ORDERS_UPDATE)
    @Operation(summary = "Eskalatsiyani hal qilish", description = "Menejer eskalatsiyani yopadi")
    public ResponseEntity<ApiResponse<OrderEscalationResponse>> resolve(
            @PathVariable Long id,
            @RequestParam(value = "note", required = false) String note) {
        return ResponseEntity.ok(ApiResponse.success("Eskalatsiya hal qilindi",
                escalationService.resolve(id, note)));
    }
}
