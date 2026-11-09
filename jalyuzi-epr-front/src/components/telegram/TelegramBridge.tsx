import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTelegramWebApp, initTelegramWebApp } from '../../telegram/telegramWebApp';

interface TelegramBridgeProps {
  /** Pastki menyudagi asosiy sahifalar — ularda Telegram "Orqaga" tugmasi ko'rinmaydi */
  isRootPath: (pathname: string) => boolean;
}

function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

/** Tarix bo'lmasa (ilova to'g'ridan-to'g'ri ichki sahifada ochilgan) — bir daraja yuqoriga */
function parentPath(pathname: string): string {
  const normalized = normalizePath(pathname);
  const idx = normalized.lastIndexOf('/');
  return idx > 0 ? normalized.slice(0, idx) : '/';
}

/**
 * Telegram Mini App ichida ishlaganda Telegram'ning tizim tugmalarini ilova bilan bog'laydi:
 * ichki sahifalarda yuqoridagi "Orqaga" tugmasi ko'rsatiladi va router tarixiga ulanadi.
 * Telegram'dan tashqarida hech narsa qilmaydi.
 */
export function TelegramBridge({ isRootPath }: TelegramBridgeProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const webApp = getTelegramWebApp();

  useEffect(() => {
    if (webApp) initTelegramWebApp(webApp);
  }, [webApp]);

  useEffect(() => {
    if (!webApp || !webApp.isVersionAtLeast('6.1')) return;

    const pathname = normalizePath(location.pathname);
    if (isRootPath(pathname)) {
      webApp.BackButton.hide();
      return;
    }

    const hasHistory = location.key !== 'default';
    const onBack = () => {
      if (hasHistory) {
        navigate(-1);
      } else {
        navigate(parentPath(pathname), { replace: true });
      }
    };

    webApp.BackButton.onClick(onBack);
    webApp.BackButton.show();
    return () => {
      webApp.BackButton.offClick(onBack);
    };
  }, [webApp, location.pathname, location.key, isRootPath, navigate]);

  return null;
}
