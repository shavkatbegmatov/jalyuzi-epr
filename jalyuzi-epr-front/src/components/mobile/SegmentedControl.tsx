import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// SegmentedControl — iOS uslubidagi segment almashtirgich (tab o'rniga)
// =============================================================================
export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = true,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={clsx(
        'inline-flex gap-1 rounded-2xl border border-base-300/60 bg-base-200/70 p-1',
        fullWidth && 'flex w-full',
        className
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'flex items-center justify-center gap-1.5 rounded-xl font-semibold tap-transparent transition-all duration-200',
              fullWidth && 'flex-1',
              size === 'sm' ? 'h-9 px-3 text-[13px]' : 'h-11 px-4 text-sm',
              isActive
                ? 'bg-base-100 text-base-content shadow-card'
                : 'text-base-content/55 active:scale-[0.97]'
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span className="truncate">{opt.label}</span>
            {opt.count !== undefined && opt.count > 0 && (
              <span
                className={clsx(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                  isActive ? 'bg-primary/12 text-primary' : 'bg-base-300/70 text-base-content/55'
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
