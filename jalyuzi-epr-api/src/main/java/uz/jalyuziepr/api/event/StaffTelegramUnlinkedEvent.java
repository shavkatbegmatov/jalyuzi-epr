package uz.jalyuziepr.api.event;

/**
 * Xodimning Telegram akkaunti ERP'dan uzildi. Bot tomoni (menyu tugmasini tiklash,
 * xabar) commit'dan keyin, alohida oqimda bajariladi.
 *
 * @param byAdmin true — administrator uzdi (masalan, telefon yo'qolganda); false — xodimning o'zi
 */
public record StaffTelegramUnlinkedEvent(Long telegramUserId, boolean byAdmin) {
}
