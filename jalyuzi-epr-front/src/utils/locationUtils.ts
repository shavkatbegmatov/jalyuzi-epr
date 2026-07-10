// Geolokatsiya bilan ishlash uchun yordamchilar

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Default xarita markazi — Toshkent (geolokatsiya olinmasa) */
export const DEFAULT_MAP_CENTER: GeoPoint = { lat: 41.311081, lng: 69.240562 };

/** Koordinatalarni odam o'qiydigan ko'rinishda formatlash */
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** Google Maps'da ochish havolasi (Android/iOS'da native ilovaga o'tadi) */
export function googleMapsUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

/** Yandex Maps'da ochish havolasi */
export function yandexMapsUrl(lat: number, lng: number): string {
  return `https://yandex.uz/maps/?pt=${lng},${lat}&z=17&l=map`;
}

/**
 * Telegram "share" havolasi — Telegram ochilib, foydalanuvchi istalgan
 * chatni (o'lchovchi, o'rnatuvchi, haydovchi...) tanlab yuboradi.
 */
export function telegramShareLocationUrl(lat: number, lng: number, text: string): string {
  const url = googleMapsUrl(lat, lng);
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Joriy joylashuvni olish (brauzer geolokatsiyasi).
 * Muvaffaqiyatsiz bo'lsa null qaytaradi — chaqiruvchi default markazni ishlatadi.
 */
export function getCurrentPosition(timeoutMs = 10000): Promise<GeoPoint | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
    );
  });
}
