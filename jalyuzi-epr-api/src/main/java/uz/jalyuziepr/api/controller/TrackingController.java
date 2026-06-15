package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.OrderTrackingResponse;
import uz.jalyuziepr.api.service.OrderTrackingService;

/**
 * "Jalyuzimni kuzat" — ommaviy buyurtma kuzatuvi.
 * Auth TALAB QILINMAYDI (SecurityConfig'da /v1/track/** permitAll).
 * Kod taxmin qilib bo'lmaydigan maxfiy kalit vazifasini bajaradi; faqat
 * mijozga ko'rsatish xavfsiz bo'lgan maydonlar qaytariladi (OrderTrackingResponse).
 */
@RestController
@RequestMapping("/v1/track")
@RequiredArgsConstructor
@Tag(name = "Order Tracking", description = "Ommaviy buyurtma kuzatuvi (auth'siz)")
public class TrackingController {

    private final OrderTrackingService trackingService;

    @GetMapping("/{code}")
    @Operation(summary = "Buyurtmani kuzatish", description = "Kuzatuv kodi bo'yicha buyurtma holatini olish")
    public ResponseEntity<ApiResponse<OrderTrackingResponse>> track(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(trackingService.getByCode(code)));
    }
}
