package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.ChangePasswordRequest;
import uz.jalyuziepr.api.dto.request.LoginRequest;
import uz.jalyuziepr.api.dto.request.TelegramWebAppAuthRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.JwtResponse;
import uz.jalyuziepr.api.dto.response.TelegramLoginResponse;
import uz.jalyuziepr.api.dto.response.TelegramStaffInfoResponse;
import uz.jalyuziepr.api.dto.response.UserResponse;
import uz.jalyuziepr.api.entity.Session;
import uz.jalyuziepr.api.security.CustomUserDetails;
import uz.jalyuziepr.api.service.AuthService;
import uz.jalyuziepr.api.service.SessionService;
import uz.jalyuziepr.api.service.TelegramStaffAuthService;
import uz.jalyuziepr.api.service.UserService;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Autentifikatsiya API")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final SessionService sessionService;
    private final TelegramStaffAuthService telegramStaffAuthService;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Foydalanuvchi tizimga kirish")
    public ResponseEntity<ApiResponse<JwtResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        JwtResponse response = authService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Muvaffaqiyatli kirish", response));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh Token", description = "Token yangilash")
    public ResponseEntity<ApiResponse<JwtResponse>> refreshToken(
            @RequestParam String refreshToken,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        JwtResponse response = authService.refreshToken(refreshToken, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Current User", description = "Joriy foydalanuvchi ma'lumotlari")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Tizimdan chiqish va joriy sessionni bekor qilish")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestHeader("Authorization") String authHeader
    ) {
        String currentToken = authHeader.substring(7); // Remove "Bearer "

        // Find and revoke current session
        Session currentSession = sessionService.getSessionByToken(currentToken).orElse(null);

        if (currentSession != null) {
            // Revoke session WITH notification to update other devices' session lists
            // Frontend handles intentional logout flag to prevent showing error message to the user
            sessionService.revokeSession(
                currentSession.getId(),
                userDetails.getUser().getId(),
                "User logged out",
                true  // Send notification so other devices can refresh their session lists
            );
        }

        return ResponseEntity.ok(ApiResponse.success("Muvaffaqiyatli chiqish"));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change Password", description = "Parolni o'zgartirish")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        // Validate password confirmation
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Yangi parol va tasdiqlash mos kelmadi"));
        }

        userService.changePassword(
                userDetails.getId(),
                request.getCurrentPassword(),
                request.getNewPassword()
        );

        return ResponseEntity.ok(ApiResponse.success("Parol muvaffaqiyatli o'zgartirildi"));
    }

    // ==================== TELEGRAM MINI APP (XODIMLAR) ====================

    @GetMapping("/telegram/info")
    @Operation(summary = "Telegram Mini App ma'lumoti", description = "Bot yoqilganligi, username va xodim havolasi")
    public ResponseEntity<ApiResponse<TelegramStaffInfoResponse>> telegramInfo() {
        return ResponseEntity.ok(ApiResponse.success(telegramStaffAuthService.info()));
    }

    @PostMapping("/telegram")
    @Operation(summary = "Telegram orqali kirish",
            description = "Mini App initData imzosini tekshiradi; Telegram akkaunt ulangan bo'lsa tokenlar qaytaradi")
    public ResponseEntity<ApiResponse<TelegramLoginResponse>> telegramLogin(
            @Valid @RequestBody TelegramWebAppAuthRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        TelegramLoginResponse response = telegramStaffAuthService.login(request.getInitData(), ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/telegram/link")
    @Operation(summary = "Telegram akkauntni ulash", description = "Joriy xodimga Mini App'dagi Telegram akkauntni ulash")
    public ResponseEntity<ApiResponse<UserResponse>> telegramLink(
            @Valid @RequestBody TelegramWebAppAuthRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        requireStaff(userDetails);
        UserResponse response = telegramStaffAuthService.link(userDetails.getId(), request.getInitData());
        return ResponseEntity.ok(ApiResponse.success("Telegram akkaunt ulandi", response));
    }

    @DeleteMapping("/telegram/link")
    @Operation(summary = "Telegram akkauntni uzish", description = "Joriy xodimdan Telegram akkauntni uzish")
    public ResponseEntity<ApiResponse<UserResponse>> telegramUnlink(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        requireStaff(userDetails);
        UserResponse response = telegramStaffAuthService.unlink(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Telegram akkaunt uzildi", response));
    }

    /**
     * /v1/auth/** permitAll — shuning uchun autentifikatsiyani shu yerda tekshiramiz.
     * Mijoz tokeni bilan kelgan so'rovda principal CustomUserDetails bo'lmaydi (null).
     */
    private void requireStaff(CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new AuthenticationCredentialsNotFoundException("Tizimga kirish talab qilinadi");
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
