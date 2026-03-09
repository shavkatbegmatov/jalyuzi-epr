import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ManagerLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-base-200 flex flex-col">
      {/* Top Header */}
      <header className="bg-warning text-warning-content px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-bold">Jalyuzi Menejer</h1>
          <p className="text-xs text-warning-content/70">{user?.fullName}</p>
        </div>
        <button
          className="btn btn-ghost btn-sm btn-circle text-warning-content"
          onClick={() => logout()}
          title="Chiqish"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-base-100 border-t border-base-300 shadow-lg z-50">
        <div className="flex">
          <NavLink
            to="/manager"
            end
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-warning'
                  : 'text-base-content/50 hover:text-base-content/80'
              }`
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/manager/orders"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-warning'
                  : 'text-base-content/50 hover:text-base-content/80'
              }`
            }
          >
            <ClipboardList className="h-5 w-5" />
            <span>Buyurtmalar</span>
          </NavLink>
          <NavLink
            to="/manager/profile"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-warning'
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
