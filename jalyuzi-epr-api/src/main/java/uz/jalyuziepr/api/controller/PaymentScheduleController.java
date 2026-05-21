package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.PaymentScheduleRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.PaymentScheduleResponse;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.PaymentScheduleService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/orders/{orderId}/payment-schedules")
@RequiredArgsConstructor
@Tag(name = "Payment Schedules", description = "Buyurtma to'lov bo'laklari (installments)")
public class PaymentScheduleController {

    private final PaymentScheduleService scheduleService;

    @GetMapping
    @RequiresPermission(PermissionCode.PAYMENT_SCHEDULE_VIEW)
    @Operation(summary = "Buyurtma uchun to'lov rejasini olish")
    public ResponseEntity<ApiResponse<List<PaymentScheduleResponse>>> list(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.getByOrder(orderId)));
    }

    @PostMapping
    @RequiresPermission(PermissionCode.PAYMENT_SCHEDULE_MANAGE)
    @Operation(summary = "Buyurtma uchun maxsus to'lov rejasini yaratish (bulk)")
    public ResponseEntity<ApiResponse<List<PaymentScheduleResponse>>> createBulk(
            @PathVariable Long orderId,
            @Valid @RequestBody PaymentScheduleRequest.BulkRequest body) {
        return ResponseEntity.ok(ApiResponse.success(
                scheduleService.createBulk(orderId, body.getItems())
        ));
    }

    @PostMapping("/standard")
    @RequiresPermission(PermissionCode.PAYMENT_SCHEDULE_MANAGE)
    @Operation(summary = "Standart 50/30/20 reja yaratish")
    public ResponseEntity<ApiResponse<List<PaymentScheduleResponse>>> createStandard(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.createStandardPlan(orderId)));
    }

    @PostMapping("/{scheduleId}/cancel")
    @RequiresPermission(PermissionCode.PAYMENT_SCHEDULE_MANAGE)
    @Operation(summary = "Bo'lakni bekor qilish")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @PathVariable Long orderId,
            @PathVariable Long scheduleId,
            @RequestBody Map<String, String> body) {
        scheduleService.cancel(scheduleId, body.getOrDefault("reason", ""));
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
