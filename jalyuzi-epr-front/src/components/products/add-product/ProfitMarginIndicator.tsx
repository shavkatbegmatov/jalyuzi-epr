import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import { formatCurrency } from '../../../config/constants';

interface ProfitMarginIndicatorProps {
  purchasePrice: number;
  sellingPrice: number;
}

export function ProfitMarginIndicator({ purchasePrice, sellingPrice }: ProfitMarginIndicatorProps) {
  // Calculate profit
  const hasValidPrices = purchasePrice > 0 && sellingPrice > 0;
  const profitAmount = hasValidPrices ? sellingPrice - purchasePrice : 0;
  const profitPercent = hasValidPrices ? (profitAmount / purchasePrice) * 100 : 0;

  // Determine color and status
  const isPositive = profitAmount > 0;
  const isNegative = profitAmount < 0;
  const isNeutral = profitAmount === 0;

  // Progress bar width (capped at 100%)
  const progressWidth = Math.min(Math.abs(profitPercent), 100);

  // Get status color
  const getStatusColor = () => {
    if (!hasValidPrices) return 'text-base-content/50';
    if (isNegative) return 'text-error';
    if (profitPercent < 10) return 'text-warning';
    if (profitPercent < 20) return 'text-info';
    return 'text-success';
  };

  const getProgressColor = () => {
    if (!hasValidPrices) return 'bg-base-300';
    if (isNegative) return 'bg-error';
    if (profitPercent < 10) return 'bg-warning';
    if (profitPercent < 20) return 'bg-info';
    return 'bg-success';
  };

  const getIcon = () => {
    if (!hasValidPrices || isNeutral) return <Minus className="h-4 w-4" />;
    if (isPositive) return <TrendingUp className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="surface-soft rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
          Foyda marjasi
        </span>
        <span className={clsx('flex items-center gap-1', getStatusColor())}>
          {getIcon()}
          <span className="font-bold">
            {hasValidPrices ? `${profitPercent.toFixed(1)}%` : '—'}
          </span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-base-300 rounded-full overflow-hidden mb-3">
        <div
          className={clsx(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            getProgressColor()
          )}
          style={{ width: `${progressWidth}%` }}
        />
        {/* Markers */}
        <div className="absolute inset-y-0 left-1/4 w-px bg-base-content/10" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-base-content/10" />
        <div className="absolute inset-y-0 left-3/4 w-px bg-base-content/10" />
      </div>

      {/* Values */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-base-content/50">Foyda: </span>
          <span className={clsx('font-semibold', getStatusColor())}>
            {hasValidPrices ? formatCurrency(profitAmount) : '—'}
          </span>
        </div>
        <div className="text-xs text-base-content/40">
          {profitPercent >= 20 && 'Yaxshi'}
          {profitPercent >= 10 && profitPercent < 20 && "O'rtacha"}
          {profitPercent > 0 && profitPercent < 10 && 'Past'}
          {profitPercent <= 0 && hasValidPrices && 'Zarar'}
        </div>
      </div>

      {/* Hint */}
      {hasValidPrices && profitPercent < 10 && (
        <p className="text-xs text-warning mt-2">
          Foyda marjasi 10% dan past. Narxlarni qayta ko'rib chiqing.
        </p>
      )}
    </div>
  );
}
