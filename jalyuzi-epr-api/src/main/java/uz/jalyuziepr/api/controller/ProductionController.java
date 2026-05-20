package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.dto.request.ProductionMaterialRequest;
import uz.jalyuziepr.api.dto.request.ProductionOrderCreateRequest;
import uz.jalyuziepr.api.dto.request.ProductionStageMoveRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.ProductionOrderResponse;
import uz.jalyuziepr.api.dto.response.ProductionStageResponse;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.enums.ProductionStatus;
import uz.jalyuziepr.api.service.ProductionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/production")
@RequiredArgsConstructor
@Tag(name = "Production", description = "Ishlab chiqarish moduli")
public class ProductionController {

    private final ProductionService productionService;

    // ==================== STAGE CATALOG ====================

    @GetMapping("/stages")
    @RequiresPermission(PermissionCode.PRODUCTION_VIEW)
    @Operation(summary = "Faol bosqichlar ro'yxati")
    public ResponseEntity<ApiResponse<List<ProductionStageResponse>>> getStages() {
        return ResponseEntity.ok(ApiResponse.success(productionService.getAllActiveStages()));
    }

    // ==================== KANBAN BOARD ====================

    @GetMapping("/board")
    @RequiresPermission(PermissionCode.PRODUCTION_VIEW)
    @Operation(summary = "Kanban: barcha faol production orderlar")
    public ResponseEntity<ApiResponse<List<ProductionOrderResponse>>> getBoard() {
        return ResponseEntity.ok(ApiResponse.success(productionService.getKanbanBoard()));
    }

    // ==================== PRODUCTION ORDERS ====================

    @GetMapping("/orders")
    @RequiresPermission(PermissionCode.PRODUCTION_VIEW)
    @Operation(summary = "Production orderlar ro'yxati (status filter)")
    public ResponseEntity<ApiResponse<Page<ProductionOrderResponse>>> list(
            @RequestParam(required = false) ProductionStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<ProductionOrderResponse> result = status != null
                ? productionService.getByStatus(status, pageable)
                : Page.empty(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/orders/{id}")
    @RequiresPermission(PermissionCode.PRODUCTION_VIEW)
    @Operation(summary = "Production order tafsilotlari")
    public ResponseEntity<ApiResponse<ProductionOrderResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productionService.getById(id)));
    }

    @PostMapping("/orders")
    @RequiresPermission(PermissionCode.PRODUCTION_MANAGE)
    @Operation(summary = "Yangi production order yaratish")
    public ResponseEntity<ApiResponse<ProductionOrderResponse>> create(
            @Valid @RequestBody ProductionOrderCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.success(productionService.create(req)));
    }

    @PostMapping("/orders/{id}/move")
    @RequiresPermission(PermissionCode.PRODUCTION_MANAGE)
    @Operation(summary = "Production order'ni boshqa bosqichga ko'chirish (kanban drag)")
    public ResponseEntity<ApiResponse<ProductionOrderResponse>> moveToStage(
            @PathVariable Long id,
            @Valid @RequestBody ProductionStageMoveRequest req) {
        return ResponseEntity.ok(ApiResponse.success(productionService.moveToStage(id, req)));
    }

    @PostMapping("/orders/{id}/assign")
    @RequiresPermission(PermissionCode.PRODUCTION_ASSIGN)
    @Operation(summary = "Ishchini biriktirish")
    public ResponseEntity<ApiResponse<ProductionOrderResponse>> assignWorker(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(ApiResponse.success(
                productionService.assignWorker(id, body.get("workerId"))
        ));
    }

    @PostMapping("/orders/{id}/status")
    @RequiresPermission(PermissionCode.PRODUCTION_MANAGE)
    @Operation(summary = "Statusni o'zgartirish (ON_HOLD, CANCELLED)")
    public ResponseEntity<ApiResponse<ProductionOrderResponse>> setStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        ProductionStatus newStatus = ProductionStatus.valueOf(body.get("status"));
        String reason = body.get("reason");
        return ResponseEntity.ok(ApiResponse.success(
                productionService.setStatus(id, newStatus, reason)
        ));
    }

    // ==================== MATERIALS ====================

    @PostMapping("/orders/{id}/materials")
    @RequiresPermission(PermissionCode.PRODUCTION_MATERIAL)
    @Operation(summary = "Sarflangan material qo'shish")
    public ResponseEntity<ApiResponse<ProductionOrderResponse>> addMaterial(
            @PathVariable Long id,
            @Valid @RequestBody ProductionMaterialRequest req) {
        return ResponseEntity.ok(ApiResponse.success(productionService.addMaterial(id, req)));
    }
}
