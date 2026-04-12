package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.InstallerCreateRequest;
import uz.jalyuziepr.api.dto.request.InstallerUpdateRequest;
import uz.jalyuziepr.api.dto.response.*;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.InstallerService;

@RestController
@RequestMapping("/v1/installers")
@RequiredArgsConstructor
@Tag(name = "Installers", description = "O'rnatuvchilar API")
public class InstallerController {

    private final InstallerService installerService;

    @GetMapping
    @RequiresPermission(PermissionCode.INSTALLERS_VIEW)
    @Operation(summary = "Get all installers", description = "Barcha o'rnatuvchilarni olish")
    public ResponseEntity<ApiResponse<PagedResponse<InstallerResponse>>> getAll(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<InstallerResponse> installers = installerService.getAll(search, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(installers)));
    }

    @GetMapping("/stats")
    @RequiresPermission(PermissionCode.INSTALLERS_VIEW)
    @Operation(summary = "Get installer stats", description = "O'rnatuvchilar statistikasi")
    public ResponseEntity<ApiResponse<InstallerStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(installerService.getStats()));
    }

    @GetMapping("/{id}")
    @RequiresPermission(PermissionCode.INSTALLERS_VIEW)
    @Operation(summary = "Get installer by ID", description = "O'rnatuvchi tafsilotlari")
    public ResponseEntity<ApiResponse<InstallerDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(installerService.getById(id)));
    }

    @GetMapping("/{id}/orders")
    @RequiresPermission(PermissionCode.INSTALLERS_VIEW)
    @Operation(summary = "Get installer orders", description = "O'rnatuvchi buyurtmalari")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getOrders(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<OrderResponse> orders = installerService.getOrders(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(orders)));
    }

    @PostMapping
    @RequiresPermission(PermissionCode.INSTALLERS_CREATE)
    @Operation(summary = "Create installer", description = "Yangi o'rnatuvchi yaratish")
    public ResponseEntity<ApiResponse<InstallerResponse>> create(
            @Valid @RequestBody InstallerCreateRequest request) {
        InstallerResponse installer = installerService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("O'rnatuvchi yaratildi", installer));
    }

    @PutMapping("/{id}")
    @RequiresPermission(PermissionCode.INSTALLERS_UPDATE)
    @Operation(summary = "Update installer", description = "O'rnatuvchini yangilash")
    public ResponseEntity<ApiResponse<InstallerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody InstallerUpdateRequest request) {
        InstallerResponse installer = installerService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("O'rnatuvchi yangilandi", installer));
    }

    @PatchMapping("/{id}/toggle-active")
    @RequiresPermission(PermissionCode.INSTALLERS_TOGGLE)
    @Operation(summary = "Toggle installer active status", description = "O'rnatuvchini faollashtirish/o'chirish")
    public ResponseEntity<ApiResponse<InstallerResponse>> toggleActive(@PathVariable Long id) {
        InstallerResponse installer = installerService.toggleActive(id);
        String message = installer.getActive() ? "O'rnatuvchi faollashtirildi" : "O'rnatuvchi o'chirildi";
        return ResponseEntity.ok(ApiResponse.success(message, installer));
    }
}
