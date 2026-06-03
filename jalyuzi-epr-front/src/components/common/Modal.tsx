import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// ModalPortal - Simple portal wrapper for existing modal content
// Responsive: mobile'da pastdan (bottom-sheet pozitsiya), lg+ da markazda.
// =============================================================================
interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ModalPortal({ isOpen, onClose, children }: ModalPortalProps) {
  // Handle escape key and body overflow
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
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

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-[2px] p-0 lg:items-center lg:p-4">
      {/* Backdrop - click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      {/* Modal content wrapper */}
      <div
        className="relative z-10 flex w-full justify-center lg:w-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// =============================================================================
// Modal - Full featured modal component
// Responsive: mobile'da bottom-sheet (pastdan, rounded-t-3xl), lg+ da dialog.
// =============================================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  /** Pastki sticky harakat paneli */
  footer?: ReactNode;
}

const maxWidthClasses = {
  sm: 'lg:max-w-sm',
  md: 'lg:max-w-md',
  lg: 'lg:max-w-lg',
  xl: 'lg:max-w-xl',
  '2xl': 'lg:max-w-2xl',
  '3xl': 'lg:max-w-3xl',
  '4xl': 'lg:max-w-4xl',
  '5xl': 'lg:max-w-5xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '3xl',
  showCloseButton = true,
  closeOnBackdrop = true,
  footer,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
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

  // Focus trap - focus modal when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-[2px] p-0 lg:items-center lg:p-4"
      onClick={handleBackdropClick}
    >
      {/* Modal content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={clsx(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-base-100 shadow-float',
          'rounded-t-3xl animate-sheet-up',
          'lg:max-h-[90vh] lg:rounded-2xl lg:animate-fade-up',
          maxWidthClasses[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle (vizual) */}
        <div className="flex justify-center pt-2.5 lg:hidden">
          <span className="h-1.5 w-11 rounded-full bg-base-content/15" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-base-300/60 px-5 py-4 lg:px-6">
            {title ? (
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold lg:text-xl">{title}</h3>
                {subtitle && <p className="mt-0.5 truncate text-sm text-base-content/55">{subtitle}</p>}
              </div>
            ) : (
              <span />
            )}
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

        {/* Body */}
        <div
          className={clsx(
            'flex-1 overflow-y-auto overscroll-contain px-5 py-5 lg:px-6',
            !footer && 'pb-[max(1.25rem,env(safe-area-inset-bottom))]'
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-base-300/60 bg-base-100 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6 lg:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
}
