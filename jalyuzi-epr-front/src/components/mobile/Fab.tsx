import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// Fab — suzuvchi harakat tugmasi (Floating Action Button)
// Pastki-o'ngda, bottom-nav ustida. Mobile-only ishlatish tavsiya etiladi.
// =============================================================================
interface FabProps {
  icon: LucideIcon;
  /** Berilsa — kengaytirilgan FAB (ikona + matn) */
  label?: string;
  onClick: () => void;
  /** Rang varianti */
  variant?: 'primary' | 'secondary' | 'neutral';
  className?: string;
  'aria-label'?: string;
}

const variantClasses: Record<NonNullable<FabProps['variant']>, string> = {
  primary: 'bg-primary text-primary-content',
  secondary: 'bg-secondary text-secondary-content',
  neutral: 'bg-neutral text-neutral-content',
};

export function Fab({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  className,
  'aria-label': ariaLabel,
}: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      className={clsx(
        'fixed bottom-[calc(var(--bottom-nav-h)+1rem)] right-4 z-40 flex items-center gap-2 rounded-2xl shadow-float press-scale tap-transparent animate-rise-in lg:hidden',
        label ? 'h-14 px-5' : 'h-14 w-14 justify-center',
        variantClasses[variant],
        className
      )}
      style={{ bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 1rem)' }}
    >
      <Icon className="h-6 w-6 shrink-0" />
      {label && <span className="text-sm font-bold">{label}</span>}
    </button>
  );
}
