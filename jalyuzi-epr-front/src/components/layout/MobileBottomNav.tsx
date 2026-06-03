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
import { AppBottomNav, type AppBottomNavItem } from '../mobile';

interface NavConfig {
  path: string;
  icon: AppBottomNavItem['icon'];
  label: string;
  permission: string;
  end?: boolean;
}

// Mobile bottom nav uchun asosiy 4 ta element
const bottomNavItems: NavConfig[] = [
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

  const items: AppBottomNavItem[] = [
    ...visibleItems.map(({ path, icon, label, end }) => ({ path, icon, label, end })),
    // "Ko'proq" — to'liq menyuni (sidebar) ochadi
    { icon: MoreHorizontal, label: "Ko'proq", onClick: toggleSidebar },
  ];

  return <AppBottomNav items={items} />;
}
