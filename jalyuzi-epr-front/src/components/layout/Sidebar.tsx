import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Warehouse,
  TruckIcon,
  ShoppingBag,
  BarChart3,
  Bell,
  Settings,
  X,
  UserCog,
  Shield,
  ShieldCheck,
  FileText,
  Wrench,
  Layers,
  ClipboardList,
  HardHat,
  Factory,
  Wallet,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { PermissionCode } from '../../hooks/usePermission';
import clsx from 'clsx';

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
  permission: string;
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

// Menyu mantiqiy guruhlarga ajratilgan — har bir guruh biznes domeniga mos keladi
const menuGroups: MenuGroup[] = [
  {
    id: 'overview',
    label: 'Umumiy',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard', permission: PermissionCode.DASHBOARD_VIEW },
    ],
  },
  {
    id: 'sales',
    label: 'Savdo',
    items: [
      { path: '/pos', icon: ShoppingCart, label: 'Kassa (POS)', permission: PermissionCode.SALES_CREATE },
      { path: '/sales', icon: CreditCard, label: 'Sotuvlar', permission: PermissionCode.SALES_VIEW },
      { path: '/orders', icon: ClipboardList, label: 'Buyurtmalar', permission: PermissionCode.ORDERS_VIEW },
      { path: '/installations', icon: Wrench, label: "O'rnatishlar", permission: PermissionCode.SALES_VIEW },
      { path: '/warranty', icon: ShieldCheck, label: 'Kafolat shikoyatlari', permission: PermissionCode.WARRANTY_VIEW },
    ],
  },
  {
    id: 'production',
    label: 'Ishlab chiqarish',
    items: [
      { path: '/production', icon: Factory, label: 'Ishlab chiqarish', permission: PermissionCode.PRODUCTION_VIEW },
      { path: '/installers', icon: HardHat, label: "O'rnatuvchilar", permission: PermissionCode.INSTALLERS_VIEW },
    ],
  },
  {
    id: 'crm',
    label: 'Mijozlar',
    items: [
      { path: '/customers', icon: Users, label: 'Mijozlar', permission: PermissionCode.CUSTOMERS_VIEW },
      { path: '/debts', icon: Wallet, label: 'Qarzlar', permission: PermissionCode.DEBTS_VIEW },
    ],
  },
  {
    id: 'inventory',
    label: 'Ombor va mahsulotlar',
    items: [
      { path: '/products', icon: Package, label: 'Mahsulotlar', permission: PermissionCode.PRODUCTS_VIEW },
      { path: '/product-types', icon: Layers, label: 'Mahsulot turlari', permission: PermissionCode.PRODUCT_TYPES_VIEW },
      { path: '/warehouse', icon: Warehouse, label: 'Ombor', permission: PermissionCode.WAREHOUSE_VIEW },
      { path: '/suppliers', icon: TruckIcon, label: "Ta'minotchilar", permission: PermissionCode.SUPPLIERS_VIEW },
      { path: '/purchases', icon: ShoppingBag, label: 'Xaridlar', permission: PermissionCode.PURCHASES_VIEW },
    ],
  },
  {
    id: 'analytics',
    label: 'Tahlil',
    items: [
      { path: '/reports', icon: BarChart3, label: 'Hisobotlar', permission: PermissionCode.REPORTS_VIEW_SALES },
      { path: '/notifications', icon: Bell, label: 'Bildirishnomalar', permission: PermissionCode.NOTIFICATIONS_VIEW },
    ],
  },
  {
    id: 'admin',
    label: 'Administratsiya',
    items: [
      { path: '/employees', icon: UserCog, label: 'Xodimlar', permission: PermissionCode.EMPLOYEES_VIEW },
      { path: '/roles', icon: Shield, label: 'Rollar', permission: PermissionCode.ROLES_VIEW },
      { path: '/audit-logs', icon: FileText, label: 'Audit loglar', permission: PermissionCode.SETTINGS_VIEW },
      { path: '/settings', icon: Settings, label: 'Sozlamalar', permission: PermissionCode.SETTINGS_VIEW },
    ],
  },
];

const OPEN_GROUPS_KEY = 'sidebar-open-groups';

export function Sidebar() {
  // Use Zustand selector to subscribe to permissions specifically
  const permissions = useAuthStore((state) => state.permissions);
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const location = useLocation();

  // Akkordeon holati — qaysi guruhlar yopilgan (localStorage'da saqlanadi)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(OPEN_GROUPS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return {};
  });

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const currentlyOpen = prev[id] !== false;
      const next = { ...prev, [id]: !currentlyOpen };
      try {
        localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Faqat ruxsati bor menyu elementlari bo'lgan guruhlarni ko'rsatamiz
  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => permissions.has(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const isItemActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Joriy sahifa qaysi guruhda bo'lsa, o'sha guruh har doim ochiq turadi
  const groupHasActive = (group: MenuGroup) => group.items.some((item) => isItemActive(item.path));

  const isGroupOpen = (group: MenuGroup) => openGroups[group.id] !== false || groupHasActive(group);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="button"
          aria-label="Menyuni yopish"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-base-100/95 backdrop-blur lg:sticky lg:translate-x-0',
          'border-r border-base-200 shadow-[var(--shadow-soft)]',
          'transition-[width,transform] duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="relative flex h-16 shrink-0 items-center justify-between overflow-hidden border-b border-base-200 px-4">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10" />
          <Link
            to="/"
            className={clsx(
              'relative flex items-center gap-3 transition-opacity hover:opacity-80',
              sidebarCollapsed && 'lg:w-full lg:justify-center'
            )}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary shadow-sm">
              <span className="text-base font-bold">J</span>
            </div>
            <div className={clsx('min-w-0', sidebarCollapsed && 'lg:hidden')}>
              <h1 className="truncate text-base font-bold leading-tight">Jalyuzi ERP</h1>
              <p className="truncate text-[11px] text-base-content/60">ERP boshqaruv paneli</p>
            </div>
          </Link>
          <button
            className="btn btn-ghost btn-sm relative lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin" aria-label="Asosiy navigatsiya">
          <ul className="flex flex-col gap-1">
            {visibleGroups.map((group, groupIndex) => {
              const open = isGroupOpen(group);
              return (
                <li key={group.id}>
                  {/* Group header — to'liq rejimda tugma, yig'ilgan rejimda ajratuvchi chiziq */}
                  {sidebarCollapsed ? (
                    groupIndex > 0 && <div className="mx-2 my-2 hidden border-t border-base-200/80 lg:block" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="group flex w-full items-center justify-between rounded-lg px-3 pb-1.5 pt-3 text-left transition-colors hover:text-base-content/80"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-base-content/40">
                        {group.label}
                      </span>
                      <ChevronDown
                        className={clsx(
                          'h-3.5 w-3.5 text-base-content/30 transition-transform duration-200 group-hover:text-base-content/50',
                          !open && '-rotate-90'
                        )}
                      />
                    </button>
                  )}

                  {/* Group items */}
                  {(sidebarCollapsed || open) && (
                    <ul className="stagger-children flex flex-col gap-1 pb-1">
                      {group.items.map((item, index) => {
                        const active = isItemActive(item.path);
                        return (
                          <li key={item.path} style={{ '--i': index } as CSSProperties}>
                            <NavLink
                              to={item.path}
                              end={item.path === '/'}
                              title={sidebarCollapsed ? item.label : undefined}
                              className={clsx(
                                'group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition',
                                sidebarCollapsed ? 'px-3 lg:justify-center lg:px-0' : 'px-3',
                                active
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-base-content/70 hover:bg-base-200/70 hover:text-base-content'
                              )}
                              onClick={() => setSidebarOpen(false)}
                            >
                              {/* Active left accent */}
                              <span
                                className={clsx(
                                  'absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
                                  active && !sidebarCollapsed ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span
                                className={clsx(
                                  'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition',
                                  active
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-base-200/70 text-base-content/50 group-hover:text-primary'
                                )}
                              >
                                <item.icon className="h-5 w-5" />
                              </span>
                              <span className={clsx('truncate', sidebarCollapsed && 'lg:hidden')}>
                                {item.label}
                              </span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse toggle — faqat desktop */}
        <div className="hidden shrink-0 border-t border-base-200 p-3 lg:block">
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            title={sidebarCollapsed ? 'Menyuni yoyish' : "Menyuni yig'ish"}
            className={clsx(
              'group flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-base-content/60 transition hover:bg-base-200/70 hover:text-base-content',
              sidebarCollapsed ? 'justify-center px-0' : 'px-3'
            )}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-base-200/70 text-base-content/50 group-hover:text-primary">
              {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </span>
            {!sidebarCollapsed && <span>Menyuni yig'ish</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
