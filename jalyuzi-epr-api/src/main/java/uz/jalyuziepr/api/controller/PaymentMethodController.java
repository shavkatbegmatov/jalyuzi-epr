package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.PaymentMethodSettingUpdateRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.PaymentMethodSettingResponse;
import uz.jalyuziepr.api.service.PaymentMethodService;

import java.util.List;

/**
 * To'lov usullari sozlamasi (admin).
 */
@RestController
@RequestMapping("/v1/payment-methods")
@RequiredArgsConstructor
@Tag(name = "Payment Methods", description = "To'lov usullari sozlamasi")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_VIEW')")
    @Operation(summary = "Get payment methods", description = "Barcha to'lov usullarini olish")
    public ResponseEntity<ApiResponse<List<PaymentMethodSettingResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(paymentMethodService.getAll()));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_UPDATE')")
    @Operation(summary = "Update payment methods", description = "To'lov usullarini yangilash")
    public ResponseEntity<ApiResponse<List<PaymentMethodSettingResponse>>> update(
            @Valid @RequestBody PaymentMethodSettingUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "To'lov usullari yangilandi", paymentMethodService.update(request)));
    }
}
