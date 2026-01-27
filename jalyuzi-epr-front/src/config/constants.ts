export const API_BASE_URL = '/api';

// ==================== TIMEZONE CONFIGURATION ====================
// Loyiha standarti: Asia/Tashkent (UTC+5)
export const TIMEZONE = 'Asia/Tashkent';

/**
 * Toshkent vaqtida bugungi sanani YYYY-MM-DD formatida qaytaradi
 * Backend API uchun ishlatiladi
 */
export const getTashkentToday = (): string => {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
};

/**
 * Toshkent vaqtida hozirgi Date obyektini qaytaradi
 */
export const getTashkentNow = (): Date => {
  const now = new Date();
  const tashkentTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  return tashkentTime;
};

/**
 * Date obyektini API uchun YYYY-MM-DD formatiga o'giradi (Toshkent TZ)
 */
export const formatDateForApi = (date: Date): string => {
  return date.toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
};

/**
 * Bugundan N kun oldingi sanani YYYY-MM-DD formatida qaytaradi
 */
export const getDateDaysAgo = (days: number): string => {
  const date = getTashkentNow();
  date.setDate(date.getDate() - days);
  return formatDateForApi(date);
};

/**
 * Bugundan N oy oldingi sanani YYYY-MM-DD formatida qaytaradi
 */
export const getDateMonthsAgo = (months: number): string => {
  const date = getTashkentNow();
  date.setMonth(date.getMonth() - months);
  return formatDateForApi(date);
};

/**
 * Bugundan N yil oldingi sanani YYYY-MM-DD formatida qaytaradi
 */
export const getDateYearsAgo = (years: number): string => {
  const date = getTashkentNow();
  date.setFullYear(date.getFullYear() - years);
  return formatDateForApi(date);
};

// Jalyuzi turlari
export const BLIND_TYPES = {
  ROLLER: { label: 'Roletka', value: 'ROLLER' },
  VERTICAL: { label: 'Vertikal', value: 'VERTICAL' },
  HORIZONTAL: { label: 'Gorizontal', value: 'HORIZONTAL' },
  ROMAN: { label: 'Rim pardasi', value: 'ROMAN' },
  CELLULAR: { label: 'Uyali', value: 'CELLULAR' },
  MOTORIZED: { label: 'Motorli', value: 'MOTORIZED' },
} as const;

// Jalyuzi materiallari
export const BLIND_MATERIALS = {
  ALUMINUM: { label: 'Alyuminiy', value: 'ALUMINUM' },
  WOOD: { label: "Yog'och", value: 'WOOD' },
  FABRIC: { label: 'Mato', value: 'FABRIC' },
  PVC: { label: 'PVC', value: 'PVC' },
  BAMBOO: { label: 'Bambuk', value: 'BAMBOO' },
} as const;

// Boshqaruv turlari
export const CONTROL_TYPES = {
  CHAIN: { label: 'Zanjirli', value: 'CHAIN' },
  CORD: { label: 'Ipli', value: 'CORD' },
  MOTORIZED: { label: 'Motorli', value: 'MOTORIZED' },
  REMOTE: { label: 'Pultli', value: 'REMOTE' },
  SMART: { label: 'Smart', value: 'SMART' },
} as const;

// Buyurtma turlari
export const ORDER_TYPES = {
  PRODUCT_SALE: { label: 'Mahsulot sotish', value: 'PRODUCT_SALE' },
  INSTALLATION: { label: "O'rnatish", value: 'INSTALLATION' },
  MEASUREMENT: { label: "O'lchov", value: 'MEASUREMENT' },
  CONSULTATION: { label: 'Konsultatsiya', value: 'CONSULTATION' },
} as const;

// O'rnatish statuslari
export const INSTALLATION_STATUSES = {
  PENDING: { label: 'Kutilmoqda', value: 'PENDING', color: 'badge-warning' },
  SCHEDULED: { label: 'Rejalashtirilgan', value: 'SCHEDULED', color: 'badge-info' },
  IN_PROGRESS: { label: 'Jarayonda', value: 'IN_PROGRESS', color: 'badge-primary' },
  COMPLETED: { label: 'Bajarildi', value: 'COMPLETED', color: 'badge-success' },
  CANCELLED: { label: 'Bekor qilindi', value: 'CANCELLED', color: 'badge-error' },
} as const;

// Universal mahsulot turlari
export const PRODUCT_TYPES = {
  FINISHED_PRODUCT: { label: 'Tayyor jalyuzi', value: 'FINISHED_PRODUCT' },
  RAW_MATERIAL: { label: 'Xomashyo', value: 'RAW_MATERIAL' },
  ACCESSORY: { label: 'Aksessuar', value: 'ACCESSORY' },
} as const;

// O'lchov birliklari
export const UNIT_TYPES = {
  PIECE: { label: 'Dona', value: 'PIECE' },
  METER: { label: 'Metr', value: 'METER' },
  SQUARE_METER: { label: 'm²', value: 'SQUARE_METER' },
  KILOGRAM: { label: 'kg', value: 'KILOGRAM' },
  ROLL: { label: 'Rulon', value: 'ROLL' },
} as const;

// Deprecated - eski tizim uchun
export const SEASONS = {
  SUMMER: { label: 'Yozgi', value: 'SUMMER' },
  WINTER: { label: 'Qishki', value: 'WINTER' },
  ALL_SEASON: { label: 'Universal', value: 'ALL_SEASON' },
} as const;

export const PAYMENT_METHODS = {
  CASH: { label: 'Naqd', value: 'CASH' },
  CARD: { label: 'Karta', value: 'CARD' },
  TRANSFER: { label: "O'tkazma", value: 'TRANSFER' },
  MIXED: { label: 'Aralash', value: 'MIXED' },
} as const;

export const PAYMENT_STATUSES = {
  PAID: { label: "To'langan", value: 'PAID' },
  PARTIAL: { label: 'Qisman', value: 'PARTIAL' },
  UNPAID: { label: "To'lanmagan", value: 'UNPAID' },
} as const;

export const SALE_STATUSES = {
  COMPLETED: { label: 'Yakunlangan', value: 'COMPLETED' },
  CANCELLED: { label: 'Bekor qilingan', value: 'CANCELLED' },
  REFUNDED: { label: 'Qaytarilgan', value: 'REFUNDED' },
} as const;

export const DEBT_STATUSES = {
  ACTIVE: { label: 'Faol', value: 'ACTIVE' },
  PAID: { label: "To'langan", value: 'PAID' },
  OVERDUE: { label: "Muddati o'tgan", value: 'OVERDUE' },
} as const;

export const MOVEMENT_TYPES = {
  IN: { label: 'Kirim', value: 'IN' },
  OUT: { label: 'Chiqim', value: 'OUT' },
  ADJUSTMENT: { label: 'Tuzatish', value: 'ADJUSTMENT' },
} as const;

export const REFERENCE_TYPES = {
  SALE: { label: 'Sotuv', value: 'SALE' },
  SALE_CANCEL: { label: 'Sotuv bekor', value: 'SALE_CANCEL' },
  PURCHASE: { label: 'Xarid', value: 'PURCHASE' },
  MANUAL: { label: 'Qo\'lda', value: 'MANUAL' },
  RETURN: { label: 'Qaytarish', value: 'RETURN' },
} as const;

export const CUSTOMER_TYPES = {
  INDIVIDUAL: { label: 'Jismoniy shaxs', value: 'INDIVIDUAL' },
  BUSINESS: { label: 'Yuridik shaxs', value: 'BUSINESS' },
} as const;

export const ROLES = {
  ADMIN: { label: 'Administrator', value: 'ADMIN' },
  MANAGER: { label: 'Menejer', value: 'MANAGER' },
  SELLER: { label: 'Sotuvchi', value: 'SELLER' },
} as const;

export const EMPLOYEE_STATUSES = {
  ACTIVE: { label: 'Faol', value: 'ACTIVE', color: 'badge-success' },
  ON_LEAVE: { label: "Ta'tilda", value: 'ON_LEAVE', color: 'badge-warning' },
  TERMINATED: { label: 'Ishdan chiqqan', value: 'TERMINATED', color: 'badge-error' },
} as const;

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " so'm";
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('uz-UZ').format(num);
};

// Sana formati: dd.mm.yyyy (masalan: 09.02.2026) - Toshkent TZ
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Sana va vaqt formati: dd.mm.yyyy HH:mm (masalan: 09.02.2026 14:30) - Toshkent TZ
export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('ru-RU', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Kvadrat metr hisoblash (mm dan m² ga)
export const calculateSquareMeters = (widthMm: number, heightMm: number): number => {
  return (widthMm * heightMm) / 1_000_000;
};

// Kvadrat metr formati
export const formatSquareMeters = (sqm: number): string => {
  return sqm.toFixed(2) + ' m²';
};

// O'lcham formati (mm)
export const formatDimensions = (widthMm: number, heightMm: number): string => {
  return `${widthMm} x ${heightMm} mm`;
};

// Vaqt formati (HH:mm)
export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '—';
  // Backend'dan "HH:mm:ss" yoki "HH:mm" formatida keladi
  return timeStr.substring(0, 5);
};
