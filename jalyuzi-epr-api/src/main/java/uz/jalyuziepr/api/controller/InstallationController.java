package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.InstallationRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.InstallationResponse;
import uz.jalyuziepr.api.dto.response.PagedResponse;
import uz.jalyuziepr.api.enums.InstallationStatus;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.InstallationService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/v1/installations")
@RequiredArgsConstructor
@Tag(name = "Installations", description = "O'rnatishlar API")
public class InstallationController {

    private final InstallationService installationService;

    @GetMapping
    @Operation(summary = "Get all installations", description = "Barcha o'rnatishlarni olish")
    @RequiresPermission(PermissionCode.SALES_VIEW)
    public ResponseEntity<ApiResponse<PagedResponse<InstallationResponse>>> getAllInstallations(
            @RequestParam(required = false) Long technicianId,
            @RequestParam(required = false) InstallationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<InstallationResponse> installations = installationService.getInstallationsWithFilters(
                technicianId, status, startDate, endDate, pageable);

        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(installations)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get installation by ID", description = "ID bo'yicha o'rnatishni olish")
    @RequiresPermission(PermissionCode.SALES_VIEW)
    public ResponseEntity<ApiResponse<InstallationResponse>> getInstallationById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(installationService.getInstallationById(id)));
    }

    @GetMapping("/sale/{saleId}")
    @Operation(summary = "Get installations by sale", description = "Sotuv bo'yicha o'rnatishlarni olish")
    @RequiresPermission(PermissionCode.SALES_VIEW)
    public ResponseEntity<ApiResponse<List<InstallationResponse>>> getInstallationsBySale(@PathVariable Long saleId) {
        return ResponseEntity.ok(ApiResponse.success(installationService.getInstallationsBySaleId(saleId)));
    }

    @GetMapping("/technician/{technicianId}")
    @Operation(summary = "Get technician installations", description = "Texnik o'rnatishlarini olish")
    @RequiresPermission(PermissionCode.SALES_VIEW)
    public ResponseEntity<ApiResponse<List<InstallationResponse>>> getTechnicianInstallations(
            @PathVariable Long technicianId) {
        return ResponseEntity.ok(ApiResponse.success(installationService.getInstallationsByTechnician(technicianId)));
    }

    @GetMapping("/date/{date}")
    @Operation(summary = "Get installations by date", description = "Sana bo'yicha o'rnatishlarni olish")
    @RequiresPermission(PermissionCode.SALES_VIEW)
    public ResponseEntity<ApiResponse<List<InstallationResponse>>> getInstallationsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(installationService.getInstallationsByDate(date)));
    }

    @GetMapping("/schedule")
    @Operation(summary = "Get installation schedule", description = "O'rnatish jadvalini olish")
    @RequiresPermission(PermissionCode.SALES_VIEW)
    public ResponseEntity<ApiResponse<List<InstallationResponse>>> getSchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long technicianId) {

        List<InstallationResponse> schedule;
        if (technicianId != null) {
            schedule = installationService.getTechnicianSchedule(technicianId, startDate, endDate);
        } else {
            schedule = installationService.getInstallationsByDateRange(startDate, endDate);
        }
        return ResponseEntity.ok(ApiResponse.success(schedule));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming installations", description = "Yaqinlashayotgan o'rnatishlarni olish")
    @RequiresPermission(PermissionCode.SALES_VIEW)
    public ResponseEntity<ApiResponse<List<InstallationResponse>>> getUpcomingInstallations() {
        return ResponseEntity.ok(ApiResponse.success(installationService.getUpcomingInstallations()));
    }

    @PostMapping
    @Operation(summary = "Create installation", description = "Yangi o'rnatish yaratish")
    @RequiresPermission(PermissionCode.SALES_CREATE)
    public ResponseEntity<ApiResponse<InstallationResponse>> createInstallation(
            @Valid @RequestBody InstallationRequest request) {
        InstallationResponse installation = installationService.createInstallation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("O'rnatish yaratildi", installation));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update installation", description = "O'rnatishni yangilash")
    @RequiresPermission(PermissionCode.SALES_UPDATE)
    public ResponseEntity<ApiResponse<InstallationResponse>> updateInstallation(
            @PathVariable Long id,
            @Valid @RequestBody InstallationRequest request) {
        InstallationResponse installation = installationService.updateInstallation(id, request);
        return ResponseEntity.ok(ApiResponse.success("O'rnatish yangilandi", installation));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update installation status", description = "O'rnatish statusini yangilash")
    @RequiresPermission(PermissionCode.SALES_UPDATE)
    public ResponseEntity<ApiResponse<InstallationResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam InstallationStatus status) {
        InstallationResponse installation = installationService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Status yangilandi", installation));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Complete installation", description = "O'rnatishni yakunlash")
    @RequiresPermission(PermissionCode.SALES_UPDATE)
    public ResponseEntity<ApiResponse<InstallationResponse>> completeInstallation(
            @PathVariable Long id,
            @RequestParam(required = false) String completionNotes,
            @RequestParam(required = false) String customerSignature) {
        InstallationResponse installation = installationService.completeInstallation(id, completionNotes, customerSignature);
        return ResponseEntity.ok(ApiResponse.success("O'rnatish yakunlandi", installation));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel installation", description = "O'rnatishni bekor qilish")
    @RequiresPermission(PermissionCode.SALES_UPDATE)
    public ResponseEntity<ApiResponse<Void>> cancelInstallation(
            @PathVariable Long id,
            @RequestParam String reason) {
        installationService.cancelInstallation(id, reason);
        return ResponseEntity.ok(ApiResponse.success("O'rnatish bekor qilindi"));
    }
}
