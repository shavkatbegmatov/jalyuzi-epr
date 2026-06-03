import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// EmptyState — bo'sh holat (ikona, sarlavha, tavsif, CTA)
// =============================================================================
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-base-200 text-base-content/35">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <p className="text-base font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-base-content/55">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
