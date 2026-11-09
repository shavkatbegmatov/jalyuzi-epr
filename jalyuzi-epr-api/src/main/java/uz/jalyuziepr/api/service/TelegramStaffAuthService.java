package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import uz.jalyuziepr.api.dto.response.TelegramLoginResponse;
import uz.jalyuziepr.api.dto.response.TelegramStaffInfoResponse;
import uz.jalyuziepr.api.dto.response.UserResponse;
import uz.jalyuziepr.api.entity.User;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.UserRepository;
import uz.jalyuziepr.api.security.TelegramInitDataValidator;
import uz.jalyuziepr.api.security.TelegramInitDataValidator.TelegramWebAppUser;

import java.time.LocalDateTime;

/**
 * Xodimlar Telegram Mini App'i: initData orqali avtomatik kirish va
 * Telegram akkauntni xodimga ulash/uzish.
 *
 * <p>Ulash faqat parol bilan kirgan (JWT'li) xodim tomonidan, o'zi uchun
 * bajariladi — shu sababli Telegram akkaunt egasi va xodim bir shaxs ekani
 * kafolatlanadi. Keyingi kirishlar initData imzosiga tayanadi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramStaffAuthService {

    private static final String MENU_BUTTON_TEXT = "Ilova";

    private final TelegramInitDataValidator initDataValidator;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final TelegramService telegramService;

    public TelegramStaffInfoResponse info() {
        boolean enabled = telegramService.isEnabled();
        return TelegramStaffInfoResponse.builder()
                .enabled(enabled)
                .botUsername(telegramService.getBotUsername())
                .startLink(enabled ? telegramService.buildDeepLink(TelegramService.STAFF_START_PAYLOAD) : null)
                .webAppUrl(enabled ? telegramService.getWebAppUrl() : null)
                .build();
    }

    /**
     * initData bo'yicha kirish. Telegram akkaunt hech kimga ulanmagan bo'lsa
     * {@code linked = false} qaytadi (xato emas).
     */
    public TelegramLoginResponse login(String initData, String ipAddress, String userAgent) {
        TelegramWebAppUser tgUser = initDataValidator.validate(initData);

        User linkedUser = userRepository.findByTelegramUserId(tgUser.id()).orElse(null);
        if (linkedUser == null) {
            return TelegramLoginResponse.builder()
                    .linked(false)
                    .telegramName(tgUser.displayName())
                    .build();
        }

        User user = userRepository.findByIdWithRolesAndPermissions(linkedUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Foydalanuvchi", "id", linkedUser.getId()));

        log.info("Telegram Mini App orqali kirish: user={}, telegramId={}", user.getUsername(), tgUser.id());

        return TelegramLoginResponse.builder()
                .linked(true)
                .auth(authService.loginWithTelegram(user, ipAddress, userAgent))
                .telegramName(tgUser.displayName())
                .build();
    }

    /**
     * Joriy (parol bilan kirgan) xodimga initData'dagi Telegram akkauntni ulash.
     */
    public UserResponse link(Long userId, String initData) {
        TelegramWebAppUser tgUser = initDataValidator.validate(initData);

        userRepository.findByTelegramUserId(tgUser.id())
                .filter(other -> !other.getId().equals(userId))
                .ifPresent(other -> {
                    throw new BadRequestException(
                            "Bu Telegram akkaunt boshqa xodimga ulangan. Avval o'sha xodim profilidan uzilishi kerak.");
                });

        User user = userRepository.findByIdWithRolesAndPermissions(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Foydalanuvchi", "id", userId));

        Long previousTelegramId = user.getTelegramUserId();
        user.setTelegramUserId(tgUser.id());
        user.setTelegramUsername(tgUser.username());
        user.setTelegramLinkedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Telegram akkaunt ulandi: user={}, telegramId={}", user.getUsername(), tgUser.id());

        // Bot tomoni — best-effort (xatolik ulanishni bekor qilmaydi)
        if (previousTelegramId != null && !previousTelegramId.equals(tgUser.id())) {
            telegramService.resetChatMenuButton(previousTelegramId);
        }
        telegramService.setChatMenuWebApp(tgUser.id(), MENU_BUTTON_TEXT, telegramService.getWebAppUrl());
        telegramService.sendMessage(tgUser.id(),
                "✅ <b>" + escapeHtml(user.getFullName()) + "</b>, Telegram akkauntingiz ERP'ga ulandi.\n\n"
                        + "Endi ilovani pastdagi <b>" + MENU_BUTTON_TEXT + "</b> tugmasi orqali login va parolsiz ochasiz.");

        return UserResponse.from(user);
    }

    /**
     * Joriy xodimdan Telegram akkauntni uzish.
     */
    public UserResponse unlink(Long userId) {
        User user = userRepository.findByIdWithRolesAndPermissions(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Foydalanuvchi", "id", userId));

        Long telegramId = user.getTelegramUserId();
        if (telegramId == null) {
            return UserResponse.from(user);
        }

        user.setTelegramUserId(null);
        user.setTelegramUsername(null);
        user.setTelegramLinkedAt(null);
        userRepository.save(user);

        log.info("Telegram akkaunt uzildi: user={}, telegramId={}", user.getUsername(), telegramId);

        telegramService.resetChatMenuButton(telegramId);
        telegramService.sendMessage(telegramId,
                "Telegram akkauntingiz ERP'dan uzildi. Qayta ulash uchun ilovani oching va login qiling.");

        return UserResponse.from(user);
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
