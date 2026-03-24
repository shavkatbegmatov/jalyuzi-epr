import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  MoreHorizontal,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { PermissionCode } from '../../hooks/usePermission';
import clsx from 'clsx';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission: string;
  end?: boolean;
}

// Mobile bottom nav uchun asosiy 4 ta element
const bottomNavItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Asosiy', permission: PermissionCode.DASHBOARD_VIEW, end: true },
  { path: '/orders', icon: ClipboardList, label: 'Buyurtmalar', permission: PermissionCode.ORDERS_VIEW },
  { path: '/pos', icon: ShoppingCart, label: 'Kassa', permission: PermissionCode.SALES_CREATE },
  { path: '/products', icon: Package, label: 'Mahsulotlar', permission: PermissionCode.PRODUCTS_VIEW },
];

export function MobileBottomNav() {
  const permissions = useAuthStore((state) => state.permissions);
  const { toggleSidebar } = useUIStore();

  // Faqat ruxsat berilgan itemlarni ko'rsatamiz (max 4 ta)
  const visibleItems = bottomNavItems
    .filter((item) => permissions.has(item.permission))
    .slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-base-300 bg-base-100/95 backdrop-blur-md lg:hidden safe-area-bottom">
      <div className="flex items-stretch">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-base-content/50 active:text-base-content/80'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* "Ko'proq" tugmasi — sidebar ochadi */}
        <button
          onClick={toggleSidebar}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium text-base-content/50 transition-colors active:text-base-content/80"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>Ko'proq</span>
        </button>
      </div>
    </nav>
  );
}
