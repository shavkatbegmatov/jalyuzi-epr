import { useState, useEffect } from 'react';
import { X, Search, Building2, Phone, Mail, Check } from 'lucide-react';
import clsx from 'clsx';
import { ModalPortal } from '../../common/Modal';
import { formatCurrency } from '../../../config/constants';
import type { Supplier } from '../../../types';

interface SupplierSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (supplier: Supplier) => void;
  suppliers: Supplier[];
  selectedSupplierId?: number;
  loading?: boolean;
}

export function SupplierSelectModal({
  isOpen,
  onClose,
  onSelect,
  suppliers,
  selectedSupplierId,
  loading = false,
}: SupplierSelectModalProps) {
  const [search, setSearch] = useState('');

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Filter suppliers by search
  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchLower = search.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.contactPerson?.toLowerCase().includes(searchLower) ||
      supplier.phone?.includes(search)
    );
  });

  const handleSelect = (supplier: Supplier) => {
    onSelect(supplier);
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-xl bg-base-100 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-base-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Ta'minotchi tanlash</h3>
              <p className="text-sm text-base-content/60">
                Mahsulot xaridi uchun ta'minotchini tanlang
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
            <input
              type="text"
              className="input input-bordered w-full pl-10"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Suppliers list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-base-content/50">
              <Building2 className="h-12 w-12 mb-3" />
              <p className="font-medium">Ta'minotchilar topilmadi</p>
              <p className="text-sm">Qidiruv so'zini o'zgartiring</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSuppliers.map((supplier) => {
                const isSelected = supplier.id === selectedSupplierId;

                return (
                  <button
                    key={supplier.id}
                    type="button"
                    onClick={() => handleSelect(supplier)}
                    className={clsx(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                      'hover:shadow-md hover:scale-[1.01]',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-base-200 hover:border-base-300'
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={clsx(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        isSelected ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60'
                      )}
                    >
                      <Building2 className="h-6 w-6" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{supplier.name}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/60 mt-1">
                        {supplier.contactPerson && (
                          <span>{supplier.contactPerson}</span>
                        )}
                        {supplier.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </span>
                        )}
                        {supplier.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Balance/Debt indicator */}
                    <div className="text-right">
                      {supplier.hasDebt ? (
                        <span className="badge badge-error badge-sm">
                          Qarz: {formatCurrency(Math.abs(supplier.balance))}
                        </span>
                      ) : (
                        <span className="badge badge-success badge-sm">
                          Faol
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-base-200">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
