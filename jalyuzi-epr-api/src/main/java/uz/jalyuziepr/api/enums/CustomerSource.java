package uz.jalyuziepr.api.enums;

/**
 * Mijoz qayerdan kelganligini ko'rsatadi (marketing kanali).
 * Marketing kanallari samaradorligini tahlil qilish uchun ishlatiladi.
 */
public enum CustomerSource {
    INSTAGRAM,      // Instagram
    TELEGRAM,       // Telegram (kanal yoki bot)
    REFERRAL,       // Tanish/do'st tavsiyasi
    ADVERTISEMENT,  // Reklama (TV, radio, billboard, OLX)
    WEBSITE,        // Veb sayt / Google qidiruv
    WALK_IN,        // Do'konga o'zi keldi
    OTHER           // Boshqa
}
