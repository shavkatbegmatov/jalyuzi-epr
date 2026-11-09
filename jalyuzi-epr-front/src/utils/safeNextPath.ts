/** Kirgandan keyin qaytarib bo'lmaydigan yo'llar (tsikl yoki ma'nosiz) */
const BLOCKED_PREFIXES = ['/tg', '/login'];

/**
 * `next` parametrini xavfsiz ichki yo'lga aylantiradi (ochiq redirect'ning oldini olish).
 *
 * Faqat shu saytning o'z yo'llari qabul qilinadi: `/` bilan boshlanishi shart, `//` yoki
 * `/\` (protokolsiz tashqi URL) va boshqarish belgilari rad etiladi, URL tahlilidan
 * keyin origin o'zgarmagan bo'lishi kerak. Aks holda null.
 */
export function getSafeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 512) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  // Teskari slesh va boshqarish belgilari — brauzerlar ularni turlicha talqin qiladi
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code < 0x20 || code === 0x7f || code === 0x5c /* \ */) return null;
  }

  let url: URL;
  try {
    url = new URL(raw, window.location.origin);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;

  const path = url.pathname;
  if (BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return null;
  }
  return path + url.search;
}
