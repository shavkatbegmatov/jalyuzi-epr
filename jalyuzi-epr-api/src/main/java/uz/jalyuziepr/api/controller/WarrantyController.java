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
import uz.jalyuziepr.api.dto.request.ServiceVisitRequest;
import uz.jalyuziepr.api.dto.request.WarrantyClaimRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.WarrantyClaimResponse;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.enums.WarrantyClaimStatus;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.WarrantyService;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/v1/warranty/claims")
@RequiredArgsConstructor
@Tag(name = "Warranty", description = "Kafolat shikoyatlari va xizmat tashriflari")
public class WarrantyController {

    private final WarrantyService warrantyService;

    @GetMapping
    @RequiresPermission(PermissionCode.WARRANTY_VIEW)
    @Operation(summary = "Shikoyatlar ro'yxati")
    public ResponseEntity<ApiResponse<Page<WarrantyClaimResponse>>> list(
            @RequestParam(required = false) WarrantyClaimStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(warrantyService.list(status, pageable)));
    }

    @GetMapping("/{id}")
    @RequiresPermission(PermissionCode.WARRANTY_VIEW)
    @Operation(summary = "Shikoyat tafsilotlari")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(warrantyService.getById(id)));
    }

    @PostMapping
    @RequiresPermission(PermissionCode.WARRANTY_CREATE)
    @Operation(summary = "Yangi shikoyat yaratish")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> create(
            @Valid @RequestBody WarrantyClaimRequest req) {
        return ResponseEntity.ok(ApiResponse.success(warrantyService.create(req)));
    }

    @PostMapping("/{id}/status")
    @RequiresPermission(PermissionCode.WARRANTY_MANAGE)
    @Operation(summary = "Status o'zgartirish")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> changeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        WarrantyClaimStatus newStatus = WarrantyClaimStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.success(
                warrantyService.changeStatus(id, newStatus, body.get("resolution"))
        ));
    }

    @PostMapping("/{id}/assign")
    @RequiresPermission(PermissionCode.WARRANTY_MANAGE)
    @Operation(summary = "Xodimga biriktirish")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> assign(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(ApiResponse.success(
                warrantyService.assignTo(id, body.get("userId"))
        ));
    }

    @PostMapping("/{id}/coverage")
    @RequiresPermission(PermissionCode.WARRANTY_MANAGE)
    @Operation(summary = "Kafolat ostida yoki to'lov belgilash")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> setCoverage(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        boolean covered = Boolean.TRUE.equals(body.get("covered"));
        BigDecimal cost = body.get("cost") != null
                ? new BigDecimal(body.get("cost").toString())
                : null;
        return ResponseEntity.ok(ApiResponse.success(
                warrantyService.setWarrantyCoverage(id, covered, cost)
        ));
    }

    @PostMapping("/{id}/visits")
    @RequiresPermission(PermissionCode.WARRANTY_RESOLVE)
    @Operation(summary = "Xizmat tashrifini belgilash")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> scheduleVisit(
            @PathVariable Long id,
            @Valid @RequestBody ServiceVisitRequest req) {
        return ResponseEntity.ok(ApiResponse.success(warrantyService.scheduleVisit(id, req)));
    }

    @PostMapping("/visits/{visitId}/complete")
    @RequiresPermission(PermissionCode.WARRANTY_RESOLVE)
    @Operation(summary = "Tashrifni yopish")
    public ResponseEntity<ApiResponse<WarrantyClaimResponse>> completeVisit(
            @PathVariable Long visitId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(
                warrantyService.completeVisit(visitId, body.get("actionTaken"))
        ));
    }
}
