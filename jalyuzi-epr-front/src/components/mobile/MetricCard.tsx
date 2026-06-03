import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// MetricCard — premium KPI / statistika kartasi
// Responsive: mobile'da ixcham (ikona tepada), lg+ da to'liq (ikona o'ngda).
// =============================================================================
export type MetricColor = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: MetricColor;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

const iconColorMap: Record<MetricColor, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  secondary: 'bg-secondary/10 text-secondary',
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
  onClick,
  className,
  style,
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      style={style}
      className={clsx(
        'surface-card group relative overflow-hidden p-4 text-left transition duration-200 lg:p-5',
        onClick && 'press-scale tap-transparent lg:hover:-translate-y-0.5 lg:hover:shadow-float',
        className
      )}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        {/* Ikona — mobile'da tepada, desktop'da o'ngda */}
        <div
          className={clsx(
            'order-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl lg:order-2 lg:h-12 lg:w-12 lg:rounded-2xl',
            iconColorMap[color]
          )}
        >
          <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
        </div>

        {/* Matn */}
        <div className="order-2 min-w-0 flex-1 lg:order-1">
          <p className="text-[13px] font-medium text-base-content/55 lg:text-sm">{title}</p>
          <p className="mt-1 truncate text-xl font-bold tracking-tight lg:mt-2 lg:text-3xl">{value}</p>
          {trend !== undefined && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 lg:mt-3">
              <span
                className={clsx(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                  isPositive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                )}
              >
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && <span className="text-xs text-base-content/45">{trendLabel}</span>}
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
