package uz.jalyuziepr.api.event;

import java.time.LocalDateTime;

/**
 * Xodim (o'lchuvchi yoki o'rnatuvchi) buyurtmaga tayinlandi.
 *
 * <p>Tranzaksiya ichida e'lon qilinadi; Telegram bildirishnomasi commit'dan keyin,
 * alohida oqimda yuboriladi ({@code StaffTelegramNotificationService}). Shu sababli
 * hodisada entity emas, faqat oddiy qiymatlar (snapshot) saqlanadi.
 *
 * @param userId xodimning login hisobi (users.id)
 */
public record StaffOrderAssignedEvent(
        Long userId,
        Kind kind,
        Long orderId,
        String orderNumber,
        String customerName,
        String customerPhone,
        String address,
        LocalDateTime scheduledDate
) {
    public enum Kind {
        MEASUREMENT,
        INSTALLATION
    }
}
