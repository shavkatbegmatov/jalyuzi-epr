import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// MobilePageHeader — sticky mobil sahifa sarlavhasi (back, title, actions)
// Faqat mobile'da ko'rinadi (lg:hidden) — desktop o'z Header'ini ishlatadi.
// =============================================================================
interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  /** Back tugmasi: true → navigate(-1), funksiya → maxsus handler */
  back?: boolean | (() => void);
  /** O'ng tomondagi harakatlar (tugmalar, ikonalar) */
  actions?: ReactNode;
  /** Sarlavha ostida qo'shimcha qator (chip bar, qidiruv) */
  children?: ReactNode;
  className?: string;
}

export function MobilePageHeader({
  title,
  subtitle,
  back,
  actions,
  children,
  className,
}: MobilePageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof back === 'function') back();
    else navigate(-1);
  };

  return (
    <header
      className={clsx(
        'safe-area-top sticky top-0 z-30 -mx-4 mb-3 border-b border-base-300/60 bg-base-100/85 px-4 pb-3 pt-3 backdrop-blur-xl lg:hidden',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={handleBack}
            aria-label="Orqaga"
            className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-base-content/70 press-scale tap-transparent active:bg-base-200"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="truncate text-[13px] text-base-content/55">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}
