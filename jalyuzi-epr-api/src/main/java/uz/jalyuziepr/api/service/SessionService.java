package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.websocket.SessionUpdateMessage;
import uz.jalyuziepr.api.entity.Session;
import uz.jalyuziepr.api.entity.User;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.SessionRepository;
import uz.jalyuziepr.api.util.UserAgentParser;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserAgentParser userAgentParser;
    private final NotificationDispatcher notificationDispatcher;

    // Constructor with @Lazy to break circular dependency
    public SessionService(
            SessionRepository sessionRepository,
            UserAgentParser userAgentParser,
            @Lazy NotificationDispatcher notificationDispatcher
    ) {
        this.sessionRepository = sessionRepository;
        this.userAgentParser = userAgentParser;
        this.notificationDispatcher = notificationDispatcher;
    }

    /**
     * Create a new session when user logs in
     */
    @Transactional
    public Session createSession(User user, String token, String refreshToken, String ipAddress, String userAgent, LocalDateTime expiresAt) {
        String tokenHash = hashToken(token);
        UserAgentParser.DeviceInfo deviceInfo = userAgentParser.parse(userAgent);

        Session session = Session.builder()
                .user(user)
                .tokenHash(tokenHash)
                .refreshTokenHash(refreshToken != null ? hashToken(refreshToken) : null)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .deviceType(deviceInfo.getDeviceType())
                .browser(deviceInfo.getBrowser())
                .os(deviceInfo.getOs())
                .expiresAt(expiresAt)
                .lastActivityAt(LocalDateTime.now())
                .isActive(true)
                .build();

        Session savedSession = sessionRepository.save(session);

        // Notify user's other devices about new session via WebSocket
        SessionUpdateMessage message = SessionUpdateMessage.sessionCreated(
            savedSession.getId(),
            user.getId(),
            "New login from " + deviceInfo.getDeviceType() + " - " + deviceInfo.getBrowser()
        );
        notificationDispatcher.notifySessionUpdate(user.getId(), message);

        log.info("Session {} created for user {} from {}", savedSession.getId(), user.getId(), ipAddress);

        return savedSession;
    }

    /**
     * Rotate an existing session in place when a staff token is refreshed.
     * Looks the session up by the OLD refresh token hash, then updates BOTH token
     * hashes and extends the expiry (sliding window). Falls back to creating a fresh
     * session for legacy rows (refresh_token_hash = NULL) or when the row is missing.
     * Refuses to refresh a revoked session so "log out all devices" stays effective.
     */
    @Transactional
    public Session rotateSession(User user, String oldRefreshToken, String newAccessToken,
                                 String newRefreshToken, String ipAddress, String userAgent,
                                 LocalDateTime expiresAt) {
        Optional<Session> existing = sessionRepository.findByRefreshTokenHash(hashToken(oldRefreshToken));

        if (existing.isEmpty()) {
            // Migratsiyadan oldingi NULL qator yoki yo'qolgan sessiya — yangisini yaratamiz.
            return createSession(user, newAccessToken, newRefreshToken, ipAddress, userAgent, expiresAt);
        }

        Session session = existing.get();
        if (Boolean.FALSE.equals(session.getIsActive())) {
            // Boshqa qurilmadan bekor qilingan — qayta tiklamaymiz, rad etamiz.
            throw new BadRequestException("Sessiya bekor qilingan, qaytadan tizimga kiring");
        }

        session.setTokenHash(hashToken(newAccessToken));
        session.setRefreshTokenHash(hashToken(newRefreshToken));
        session.setExpiresAt(expiresAt);
        session.setLastActivityAt(LocalDateTime.now());
        Session saved = sessionRepository.save(session);

        log.debug("Session {} rotated for user {}", saved.getId(), user.getId());
        return saved;
    }

    /**
     * Get all active sessions for a user
     */
    @Transactional(readOnly = true)
    public List<Session> getActiveSessions(Long userId) {
        return sessionRepository.findActiveSessionsByUserId(userId);
    }

    /**
     * Revoke a specific session
     */
    @Transactional
    public void revokeSession(Long sessionId, Long userId, String reason) {
        revokeSession(sessionId, userId, reason, true);
    }

    /**
     * Revoke a specific session with optional notification
     */
    @Transactional
    public void revokeSession(Long sessionId, Long userId, String reason, boolean sendNotification) {
        int updated = sessionRepository.revokeSession(
                sessionId,
                userId,
                LocalDateTime.now(),
                userId,
                reason
        );

        if (updated == 0) {
            throw new ResourceNotFoundException("Session", "id", sessionId);
        }

        log.info("Session {} revoked by user {}: {}", sessionId, userId, reason);

        // Notify user via WebSocket for real-time update (only if not self-logout)
        if (sendNotification) {
            SessionUpdateMessage message = SessionUpdateMessage.sessionRevoked(sessionId, userId, reason);
            notificationDispatcher.notifySessionUpdate(userId, message);
        }
    }

    /**
     * Revoke all sessions except current
     */
    @Transactional
    public int revokeAllSessionsExcept(Long userId, Long currentSessionId) {
        int count = sessionRepository.revokeAllSessionsExcept(
                userId,
                currentSessionId,
                LocalDateTime.now(),
                userId,
                "Logged out from all other devices"
        );

        log.info("Revoked {} sessions for user {}", count, userId);

        // Notify user via WebSocket for real-time update (multiple sessions revoked)
        if (count > 0) {
            SessionUpdateMessage message = SessionUpdateMessage.sessionRevoked(
                    null, // Multiple sessions, no single ID
                    userId,
                    "Logged out from all other devices (" + count + " sessions)"
            );
            notificationDispatcher.notifySessionUpdate(userId, message);
        }

        return count;
    }

    /**
     * Check if session is valid (exists and active)
     */
    @Transactional(readOnly = true)
    public boolean isSessionValid(String token) {
        String tokenHash = hashToken(token);
        return sessionRepository.findByTokenHash(tokenHash)
                .map(session -> session.getIsActive() && session.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    /**
     * Update last activity time for session
     */
    @Transactional
    public void updateLastActivity(String token) {
        String tokenHash = hashToken(token);
        sessionRepository.updateLastActivity(tokenHash, LocalDateTime.now());
    }

    /**
     * Get session by token
     */
    @Transactional(readOnly = true)
    public Optional<Session> getSessionByToken(String token) {
        String tokenHash = hashToken(token);
        return sessionRepository.findByTokenHash(tokenHash);
    }

    /**
     * Cleanup expired sessions (scheduled task)
     */
    @Transactional
    @Scheduled(cron = "0 0 2 * * *") // Daily at 2 AM
    public void cleanupExpiredSessions() {
        int deleted = sessionRepository.deleteExpiredSessions(LocalDateTime.now());
        log.info("Cleaned up {} expired sessions", deleted);
    }

    /**
     * Hash JWT token for storage
     */
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
