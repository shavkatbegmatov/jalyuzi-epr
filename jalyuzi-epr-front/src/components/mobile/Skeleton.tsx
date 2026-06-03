import clsx from 'clsx';

// =============================================================================
// Skeleton — yuklash holatlari uchun premium skeleton bloklari
// DaisyUI `skeleton` ustiga izchil radius/o'lcham presetlari.
// =============================================================================
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton rounded-xl', className)} />;
}

/** Bir nechta matn qatori skeletoni */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={clsx('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/** Ro'yxat element kartasi skeletoni */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('surface-card p-3.5', className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="mt-3 flex justify-between border-t border-base-300/60 pt-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

/** Bir nechta skeleton kartalar ro'yxati */
export function SkeletonList({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2.5', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
