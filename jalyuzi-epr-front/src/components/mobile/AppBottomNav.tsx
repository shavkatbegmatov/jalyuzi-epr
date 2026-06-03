import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// AppBottomNav — yagona premium pastki navigatsiya (barcha panellar uchun)
// Aktiv pill indikatori, badge, safe-area. Mobile-only (lg:hidden).
// =============================================================================
export interface AppBottomNavItem {
  /** Marshrut. onClick berilsa ixtiyoriy. */
  path?: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  badge?: number;
  /** path o'rniga maxsus harakat (masalan "Ko'proq" → sidebar) */
  onClick?: () => void;
}

interface AppBottomNavProps {
  items: AppBottomNavItem[];
  className?: string;
}

const baseItem =
  'group relative flex flex-1 flex-col items-center justify-center gap-1 pt-2.5 pb-1 text-[11px] font-semibold tap-transparent';

function ItemInner({ item, active }: { item: AppBottomNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <>
      <span
        className={clsx(
          'relative grid h-9 w-12 place-items-center rounded-full transition-all duration-200',
          active ? 'bg-primary/12 text-primary' : 'text-base-content/45 group-active:bg-base-200'
        )}
      >
        <Icon className={clsx('h-[22px] w-[22px] transition-transform', active && 'scale-105')} />
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </span>
      <span className={clsx('transition-colors', active ? 'text-primary' : 'text-base-content/55')}>
        {item.label}
      </span>
    </>
  );
}

export function AppBottomNav({ items, className }: AppBottomNavProps) {
  return (
    <nav
      className={clsx(
        'fixed inset-x-0 bottom-0 z-40 border-t border-base-300/70 bg-base-100/95 shadow-nav backdrop-blur-xl lg:hidden',
        className
      )}
    >
      <div className="mx-auto flex max-w-xl items-stretch px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) =>
          item.path ? (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.end}
              className={baseItem}
              onClick={item.onClick}
            >
              {({ isActive }) => <ItemInner item={item} active={isActive} />}
            </NavLink>
          ) : (
            <button key={item.label} type="button" onClick={item.onClick} className={baseItem}>
              <ItemInner item={item} active={false} />
            </button>
          )
        )}
      </div>
    </nav>
  );
}
