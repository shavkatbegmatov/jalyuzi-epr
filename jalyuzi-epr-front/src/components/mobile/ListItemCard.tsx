import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// ListItemCard — bosiladigan ro'yxat element kartasi
// Manager order-card pattern'iga asoslangan. leading / title / trailing / footer.
// =============================================================================
interface ListItemCardProps {
  onClick?: () => void;
  /** Chap tomon — avatar yoki ikona */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** O'ng tomon — badge/qiymat. Berilmasa va onClick bo'lsa chevron ko'rsatiladi. */
  trailing?: ReactNode;
  /** Pastki qator (yuqori chiziq bilan ajratilgan) */
  footer?: ReactNode;
  /** Chevronni majburan ko'rsatish/yashirish */
  showChevron?: boolean;
  className?: string;
}

export function ListItemCard({
  onClick,
  leading,
  title,
  subtitle,
  trailing,
  footer,
  showChevron,
  className,
}: ListItemCardProps) {
  const interactive = !!onClick;
  const chevron = showChevron ?? (interactive && !trailing);

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={clsx(
        'surface-card p-3.5',
        interactive && 'cursor-pointer press-scale tap-transparent',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight">{title}</div>
          {subtitle && <div className="mt-0.5 text-[13px] text-base-content/55">{subtitle}</div>}
        </div>
        {trailing && <div className="shrink-0 text-right">{trailing}</div>}
        {chevron && <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-base-content/30" />}
      </div>
      {footer && (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-base-300/60 pt-2.5">
          {footer}
        </div>
      )}
    </div>
  );
}
