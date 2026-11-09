import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { ClipboardList, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCrossTabSync } from '../../hooks/useCrossTabSync';
import { TelegramBridge } from '../../components/telegram/TelegramBridge';
import { isTelegramMiniApp } from '../../telegram/telegramWebApp';

const isInstallerRootPath = (path: string) => path === '/installer' || path === '/installer/profile';

export default function InstallerLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  useCrossTabSync();
  // Telegram ichida sessiya tugasa — /tg orqali initData bilan avtomatik qayta kiriladi
  const inTelegram = isTelegramMiniApp();

  if (!isAuthenticated) {
    return <Navigate to={inTelegram ? '/tg' : '/login'} replace />;
  }

  // Agar boshqa tabda boshqa profilga kirilgan bo'lsa, to'g'ri panelga yo'naltirish
  if (user?.role && user.role !== 'INSTALLER') {
    if (user.role === 'MANAGER') return <Navigate to="/manager/" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-md mx-auto h-[100dvh] overflow-hidden bg-base-200 flex flex-col">
      <TelegramBridge isRootPath={isInstallerRootPath} />

      {/* Top Header */}
      <header className="app-safe-header bg-primary text-primary-content px-4 pb-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-bold">Jalyuzi O'rnatuvchi</h1>
          <p className="text-xs text-primary-content/70">{user?.fullName}</p>
        </div>
        {/* Telegram'da chiqish ma'nosiz (darhol avtomatik qayta kiriladi) — akkaunt profildan uziladi */}
        {!inTelegram && (
          <button
            className="btn btn-ghost btn-sm btn-circle text-primary-content"
            onClick={() => logout()}
            title="Chiqish"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="app-safe-bottom fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-base-100 border-t border-base-300 shadow-lg z-50">
        <div className="flex">
          <NavLink
            to="/installer"
            end
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-base-content/50 hover:text-base-content/80'
              }`
            }
          >
            <ClipboardList className="h-5 w-5" />
            <span>Buyurtmalar</span>
          </NavLink>
          <NavLink
            to="/installer/profile"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-base-content/50 hover:text-base-content/80'
              }`
            }
          >
            <User className="h-5 w-5" />
            <span>Profil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
