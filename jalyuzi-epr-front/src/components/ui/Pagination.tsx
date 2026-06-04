import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';
import { Select } from './Select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  showInfo?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  showInfo = true,
  className,
}: PaginationProps) {
  // Calculate visible page numbers
  const getVisiblePages = () => {
    const delta = 1; // Pages to show on each side of current
    const pages: (number | 'ellipsis')[] = [];

    const left = Math.max(0, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    // Always show first page
    if (left > 0) {
      pages.push(0);
      if (left > 1) {
        pages.push('ellipsis');
      }
    }

    // Show middle pages
    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    // Always show last page
    if (right < totalPages - 1) {
      if (right < totalPages - 2) {
        pages.push('ellipsis');
      }
      pages.push(totalPages - 1);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Calculate showing range
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  if (totalPages <= 1 && !showInfo) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-2 border-t border-base-300/60 px-1 py-3 sm:px-4',
        className
      )}
    >
      {/* Left side - Info & Page size */}
      <div className="flex items-center gap-2 text-sm sm:gap-3">
        {showInfo && totalElements > 0 && (
          <div className="whitespace-nowrap text-base-content/60">
            <span className="font-medium text-base-content">{startItem}-{endItem}</span>
            <span className="hidden sm:inline">{' / '}
              <span className="font-medium text-base-content">{totalElements.toLocaleString()}</span>
              {' '}ta
            </span>
          </div>
        )}

        {showPageSize && onPageSizeChange && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="hidden text-xs text-base-content/50 sm:inline">Ko'rsatish:</span>
            <Select
              value={pageSize}
              onChange={(val) => onPageSizeChange(Number(val))}
              options={pageSizeOptions.map((size) => ({
                value: size,
                label: `${size} ta`,
              }))}
              className="w-24"
            />
          </div>
        )}
      </div>

      {/* Right side - Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page - desktop only */}
          <button
            className={clsx(
              'hidden btn btn-ghost btn-sm btn-square transition-all sm:inline-flex',
              currentPage === 0 && 'btn-disabled opacity-40'
            )}
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
            title="Birinchi sahifa"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Previous page */}
          <button
            className={clsx(
              'grid h-9 w-9 place-items-center rounded-xl bg-base-200 press-scale transition-all sm:btn sm:btn-ghost sm:btn-sm sm:btn-square sm:bg-transparent',
              currentPage === 0 && 'opacity-40'
            )}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            title="Oldingi sahifa"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Mobile: joriy sahifa */}
          <span className="px-2 text-sm font-semibold tabular-nums sm:hidden">
            {currentPage + 1} / {totalPages}
          </span>

          {/* Page numbers - desktop only */}
          <div className="mx-1 hidden items-center gap-0.5 sm:flex">
            {visiblePages.map((page, index) => (
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-base-content/40"
                >
                  •••
                </span>
              ) : (
                <button
                  key={page}
                  className={clsx(
                    'btn btn-sm min-w-[2.25rem] transition-all',
                    currentPage === page
                      ? 'btn-primary'
                      : 'btn-ghost hover:bg-base-200'
                  )}
                  onClick={() => onPageChange(page)}
                >
                  {page + 1}
                </button>
              )
            ))}
          </div>

          {/* Next page */}
          <button
            className={clsx(
              'grid h-9 w-9 place-items-center rounded-xl bg-base-200 press-scale transition-all sm:btn sm:btn-ghost sm:btn-sm sm:btn-square sm:bg-transparent',
              currentPage >= totalPages - 1 && 'opacity-40'
            )}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            title="Keyingi sahifa"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Last page - desktop only */}
          <button
            className={clsx(
              'hidden btn btn-ghost btn-sm btn-square transition-all sm:inline-flex',
              currentPage >= totalPages - 1 && 'btn-disabled opacity-40'
            )}
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            title="Oxirgi sahifa"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
