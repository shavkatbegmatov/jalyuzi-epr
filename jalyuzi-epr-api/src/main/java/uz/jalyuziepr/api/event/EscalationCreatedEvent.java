package uz.jalyuziepr.api.event;

/**
 * Yangi SOS (eskalatsiya) yaratildi — menejerlarga Telegram orqali xabar beriladi.
 *
 * <p>Tranzaksiya ichida e'lon qilinadi; xabar commit'dan keyin, alohida oqimda
 * yuboriladi. Faqat oddiy qiymatlar (snapshot) saqlanadi.
 *
 * @param createdById SOS yuborgan xodim (users.id) — unga o'zining SOS'i qaytib yuborilmaydi
 */
public record EscalationCreatedEvent(
        Long escalationId,
        Long orderId,
        String orderNumber,
        String reasonLabel,
        String description,
        Long createdById,
        String createdByName,
        String customerName,
        String address
) {
}
