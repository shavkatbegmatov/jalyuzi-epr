import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// BottomSheet — premium mobil pastki panel (drag-to-close, safe-area)
// Native-app his beruvchi, pastdan chiqadigan modal.
// =============================================================================
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Pastki yopishgan harakat paneli (masalan "Tasdiqlash" tugmasi) */
  footer?: ReactNode;
  showCloseButton?: boolean;
  showHandle?: boolean;
  /** Panel maksimal balandligi (default 92dvh) */
  maxHeight?: string;
  /** Tana (body) qismi class'i */
  bodyClassName?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showCloseButton = true,
  showHandle = true,
  maxHeight = '92dvh',
  bodyClassName,
}: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  // Escape tugmasi + body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Drag-to-close — faqat handle/header'dan boshlanadi (kontent scroll bilan to'qnashmaydi)
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dy = e.clientY - startYRef.current;
    if (dy > 0) setDragY(dy);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragY((current) => {
      if (current > 120) onClose();
      return 0;
    });
  }, [onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="surface-float relative flex w-full max-w-xl flex-col rounded-t-3xl animate-sheet-up will-change-transform"
        style={{
          maxHeight,
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: draggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle + header (drag zonasi) */}
        <div
          className="shrink-0 touch-none select-none rounded-t-3xl"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {showHandle && (
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1.5 w-11 rounded-full bg-base-content/15" />
            </div>
          )}

          {(title || showCloseButton) && (
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-2">
              <div className="min-w-0">
                {title && <h3 className="truncate text-lg font-bold">{title}</h3>}
                {subtitle && (
                  <p className="mt-0.5 truncate text-sm text-base-content/55">{subtitle}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-base-200 text-base-content/60 press-scale tap-transparent"
                  onClick={onClose}
                  aria-label="Yopish"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div
          className={clsx(
            'flex-1 overflow-y-auto overscroll-contain px-5',
            !footer && 'pb-[max(1.25rem,env(safe-area-inset-bottom))]',
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Footer (sticky harakat paneli) */}
        {footer && (
          <div className="shrink-0 border-t border-base-300/70 bg-base-100 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
