/**
 * Telegram Mini App (WebApp) bilan ishlash uchun yordamchilar.
 *
 * Skript (telegram-web-app.js) faqat Telegram ichida ochilganda index.html'dagi
 * kichik loader orqali yuklanadi — oddiy brauzer va APK'da yuklanmaydi.
 */

export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramBackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramWebAppUser; auth_date?: number; start_param?: string };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  isExpanded: boolean;
  BackButton: TelegramBackButton;
  ready(): void;
  expand(): void;
  close(): void;
  isVersionAtLeast(version: string): boolean;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  onEvent(event: string, cb: () => void): void;
  offEvent(event: string, cb: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

/** Telegram skripti sessionStorage'ga yozadigan ishga tushirish parametrlari kaliti */
const TG_INIT_PARAMS_KEY = '__telegram__initParams';

/**
 * Sahifa Telegram Mini App sifatida ochilganmi (skript yuklanmasdan oldin ham ishlaydi):
 * URL hash'dagi tgWebApp* parametrlari, /tg yo'li yoki oldingi ochilishdan qolgan sessionStorage.
 */
export function isTelegramLaunch(): boolean {
  try {
    if (/tgWebApp(Data|Platform|Version)=/.test(window.location.hash)) return true;
    const path = window.location.pathname;
    if (path === '/tg' || path.startsWith('/tg/')) return true;
    return !!window.sessionStorage.getItem(TG_INIT_PARAMS_KEY);
  } catch {
    return false;
  }
}

/** Haqiqiy Telegram muhitidagi WebApp (initData bo'sh bo'lmasa), aks holda null */
export function getTelegramWebApp(): TelegramWebApp | null {
  const webApp = window.Telegram?.WebApp;
  return webApp && webApp.initData ? webApp : null;
}

/** Ilova hozir Telegram Mini App ichida ishlayaptimi */
export function isTelegramMiniApp(): boolean {
  return getTelegramWebApp() !== null;
}

/**
 * Telegram skripti yuklanishini kutish. Telegram muhiti bo'lmasa yoki skript
 * belgilangan vaqtda yuklanmasa — null.
 */
export function waitForTelegramWebApp(timeoutMs = 4000): Promise<TelegramWebApp | null> {
  if (window.Telegram?.WebApp) return Promise.resolve(getTelegramWebApp());
  if (!isTelegramLaunch()) return Promise.resolve(null);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.Telegram?.WebApp) {
        window.clearInterval(timer);
        resolve(getTelegramWebApp());
      } else if (Date.now() - startedAt > timeoutMs) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 50);
  });
}

let initialized = false;

/**
 * Bir martalik sozlash: Telegram'ga tayyorligimizni bildirish, oynani to'liq ochish va
 * pastga surganda ilova yopilib ketmasligi uchun vertikal swipe'ni o'chirish.
 */
export function initTelegramWebApp(webApp: TelegramWebApp): void {
  if (initialized) return;
  initialized = true;
  try {
    webApp.ready();
    webApp.expand();
    if (webApp.isVersionAtLeast('7.7')) {
      webApp.disableVerticalSwipes?.();
    }
  } catch {
    // Eski Telegram versiyalarida ba'zi metodlar yo'q — e'tiborsiz qoldiramiz
  }
}

/** Telegram'ning joriy rang sxemasi (Mini App ichida), aks holda null */
export function getTelegramColorScheme(): 'light' | 'dark' | null {
  return getTelegramWebApp()?.colorScheme ?? null;
}
