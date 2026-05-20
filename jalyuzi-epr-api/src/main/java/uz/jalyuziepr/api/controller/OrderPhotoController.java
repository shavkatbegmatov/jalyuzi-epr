package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.OrderPhotoService;
import uz.jalyuziepr.api.enums.PermissionCode;

import java.util.List;
import java.util.Map;

/**
 * Buyurtma fotosurat boshqaruvi: yuklash, ko'rish, o'chirish.
 * Foto turlari: measurement (o'lchovda), before (o'rnatish oldidan), after (o'rnatish keyin)
 */
@RestController
@RequestMapping("/v1/orders/{orderId}/photos")
@RequiredArgsConstructor
@Tag(name = "Order Photos", description = "Buyurtma fotosurat dalillari")
public class OrderPhotoController {

    private final OrderPhotoService photoService;

    public enum PhotoType { MEASUREMENT, BEFORE, AFTER }

    @GetMapping
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Buyurtmaga tegishli barcha fotolar (3 ta turdagi)")
    public ResponseEntity<ApiResponse<Map<String, List<String>>>> listAll(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(photoService.getAllPhotos(orderId)));
    }

    @PostMapping(value = "/{type}", consumes = "multipart/form-data")
    @RequiresPermission(PermissionCode.ORDERS_UPDATE)
    @Operation(summary = "Fotosurat yuklash (measurement/before/after)")
    public ResponseEntity<ApiResponse<List<String>>> upload(
            @PathVariable Long orderId,
            @PathVariable PhotoType type,
            @RequestParam("file") MultipartFile file) {
        List<String> urls = photoService.uploadPhoto(orderId, type, file);
        return ResponseEntity.ok(ApiResponse.success(urls));
    }

    @DeleteMapping("/{type}")
    @RequiresPermission(PermissionCode.ORDERS_UPDATE)
    @Operation(summary = "Fotosurat o'chirish (URL'i bilan)")
    public ResponseEntity<ApiResponse<List<String>>> delete(
            @PathVariable Long orderId,
            @PathVariable PhotoType type,
            @RequestParam("url") String url) {
        List<String> urls = photoService.deletePhoto(orderId, type, url);
        return ResponseEntity.ok(ApiResponse.success(urls));
    }

    @PostMapping("/signature")
    @RequiresPermission(PermissionCode.ORDERS_INSTALL)
    @Operation(summary = "Mijoz imzosini saqlash (base64 PNG)")
    public ResponseEntity<ApiResponse<String>> saveSignature(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body) {
        String signature = photoService.saveSignature(orderId, body.get("signature"));
        return ResponseEntity.ok(ApiResponse.success(signature));
    }
}
