import { Check, Package, Blinds, Layers, Wrench } from 'lucide-react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ProductTypeEntity } from '../../../types';

// Icon mapping
const IconMap: Record<string, LucideIcon> = {
  Blinds,
  Layers,
  Wrench,
  Package,
};

// Color mapping
const colorMap: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
  primary: { border: 'border-primary', bg: 'from-primary/20 to-primary/5', icon: 'text-primary', badge: 'badge-primary' },
  secondary: { border: 'border-secondary', bg: 'from-secondary/20 to-secondary/5', icon: 'text-secondary', badge: 'badge-secondary' },
  accent: { border: 'border-accent', bg: 'from-accent/20 to-accent/5', icon: 'text-accent', badge: 'badge-accent' },
  info: { border: 'border-info', bg: 'from-info/20 to-info/5', icon: 'text-info', badge: 'badge-info' },
  success: { border: 'border-success', bg: 'from-success/20 to-success/5', icon: 'text-success', badge: 'badge-success' },
  warning: { border: 'border-warning', bg: 'from-warning/20 to-warning/5', icon: 'text-warning', badge: 'badge-warning' },
  error: { border: 'border-error', bg: 'from-error/20 to-error/5', icon: 'text-error', badge: 'badge-error' },
};

interface ProductTypeCardProps {
  productType: ProductTypeEntity;
  isSelected: boolean;
  onSelect: () => void;
}

export function ProductTypeCard({ productType, isSelected, onSelect }: ProductTypeCardProps) {
  const colors = colorMap[productType.color || 'primary'] || colorMap.primary;
  const Icon = IconMap[productType.icon || 'Package'] || Package;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'group relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        isSelected
          ? `${colors.border} bg-gradient-to-br ${colors.bg} shadow-lg`
          : 'border-base-300 hover:border-base-content/30 bg-base-100'
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className={clsx('p-1 rounded-full bg-base-100 shadow-md', colors.icon)}>
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Icon */}
      <div
        className={clsx(
          'p-4 rounded-2xl mb-4 transition-all duration-300',
          isSelected
            ? `bg-base-100 shadow-md ${colors.icon}`
            : 'bg-base-200 text-base-content/60 group-hover:bg-base-300'
        )}
      >
        <Icon className="h-10 w-10" />
      </div>

      {/* Name */}
      <h3
        className={clsx(
          'text-lg font-bold mb-2 transition-colors',
          isSelected ? 'text-base-content' : 'text-base-content/80'
        )}
      >
        {productType.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-base-content/60 text-center mb-4 line-clamp-2">
        {productType.description || productType.code}
      </p>

      {/* Product count */}
      {productType.productCount !== undefined && (
        <span className={clsx('badge badge-sm', isSelected ? colors.badge : 'badge-ghost')}>
          {productType.productCount} ta mahsulot
        </span>
      )}

      {/* Hover effect overlay */}
      <div
        className={clsx(
          'absolute inset-0 rounded-2xl transition-opacity duration-300',
          'bg-gradient-to-br opacity-0 group-hover:opacity-100',
          !isSelected && 'from-primary/5 to-transparent'
        )}
      />
    </button>
  );
}
