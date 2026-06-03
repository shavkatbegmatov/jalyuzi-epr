import { useCallback, useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// FilterChipBar — gorizontal scroll qiluvchi filter chiplari
// Chet fade effektlari + aktiv chipni avtomatik ko'rinishga keltirish.
// (ManagerOrdersPage pattern'idan ajratilgan, qayta ishlatiluvchi).
// =============================================================================
export interface FilterChip {
  key: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  /** Aktiv holatdagi maxsus rang class'lari (default: primary) */
  activeClassName?: string;
}

interface FilterChipBarProps {
  chips: FilterChip[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export function FilterChipBar({ chips, value, onChange, className }: FilterChipBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setFadeLeft(el.scrollLeft > 8);
    setFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, chips.length]);

  useEffect(() => {
    activeChipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [value]);

  return (
    <div className={clsx('relative', className)}>
      {fadeLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-base-100 to-transparent" />
      )}
      {fadeRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-base-100 to-transparent" />
      )}

      <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-none py-0.5">
        {chips.map((chip) => {
          const isActive = value === chip.key;
          const Icon = chip.icon;
          return (
            <button
              key={chip.key}
              ref={isActive ? activeChipRef : undefined}
              onClick={() => onChange(chip.key)}
              className={clsx(
                'flex min-h-[40px] shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold tap-transparent transition-all duration-200',
                isActive
                  ? chip.activeClassName || 'bg-primary text-primary-content shadow-card'
                  : 'border border-base-300/70 bg-base-100 text-base-content/65 active:scale-95'
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span>{chip.label}</span>
              {chip.count !== undefined && chip.count > 0 && (
                <span
                  className={clsx(
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                    isActive ? 'bg-white/25' : 'bg-base-200 text-base-content/55'
                  )}
                >
                  {chip.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
