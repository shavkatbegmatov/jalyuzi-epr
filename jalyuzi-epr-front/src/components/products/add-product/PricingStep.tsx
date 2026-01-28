import { useState } from 'react';
import { Building2, Plus, X, ShoppingCart, Info } from 'lucide-react';
import clsx from 'clsx';
import { CurrencyInput } from '../../ui/CurrencyInput';
import { NumberInput } from '../../ui/NumberInput';
import { SupplierSelectModal } from './SupplierSelectModal';
import { ProfitMarginIndicator } from './ProfitMarginIndicator';
import { formatCurrency } from '../../../config/constants';
import type { Supplier, ProductType } from '../../../types';
import type { WizardState } from '../../../hooks/useAddProductWizard';

interface PricingStepProps {
  productTypeCode: ProductType | null;
  pricing: WizardState['pricing'];
  selectedSupplier: Supplier | null;
  createPurchase: boolean;
  purchaseQuantity: number;
  suppliers: Supplier[];
  suppliersLoading: boolean;
  errors: Record<string, string>;
  onUpdatePricing: <K extends keyof WizardState['pricing']>(
    field: K,
    value: WizardState['pricing'][K]
  ) => void;
  onSelectSupplier: (supplier: Supplier | null) => void;
  onToggleCreatePurchase: (value: boolean) => void;
  onSetPurchaseQuantity: (quantity: number) => void;
  calculatePurchaseTotal: () => number;
  disabled?: boolean;
}

export function PricingStep({
  productTypeCode,
  pricing,
  selectedSupplier,
  createPurchase,
  purchaseQuantity,
  suppliers,
  suppliersLoading,
  errors,
  onUpdatePricing,
  onSelectSupplier,
  onToggleCreatePurchase,
  onSetPurchaseQuantity,
  calculatePurchaseTotal,
  disabled = false,
}: PricingStepProps) {
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const isFinishedProduct = productTypeCode === 'FINISHED_PRODUCT';
  const isRawMaterial = productTypeCode === 'RAW_MATERIAL';

  const purchaseTotal = calculatePurchaseTotal();

  return (
    <div className="space-y-6">
      {/* Supplier Selection */}
      <div className="surface-soft rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
              Ta'minotchi (ixtiyoriy)
            </p>
            <p className="text-xs text-base-content/40 mt-1">
              Kelish narxini belgilash va xarid yaratish uchun
            </p>
          </div>
        </div>

        {selectedSupplier ? (
          <div className="flex items-center gap-4 p-4 bg-base-100 rounded-xl border border-base-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{selectedSupplier.name}</p>
              {selectedSupplier.contactPerson && (
                <p className="text-sm text-base-content/60">{selectedSupplier.contactPerson}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelectSupplier(null)}
              disabled={disabled}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSupplierModal(true)}
            disabled={disabled}
            className={clsx(
              'w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed',
              'border-base-300 hover:border-primary hover:bg-primary/5 transition-all',
              errors.supplier && 'border-error'
            )}
          >
            <Plus className="h-5 w-5" />
            <span>Ta'minotchi tanlash</span>
          </button>
        )}
        {errors.supplier && (
          <p className="text-sm text-error">{errors.supplier}</p>
        )}
      </div>

      {/* Pricing */}
      <div className="surface-soft rounded-xl p-4 sm:p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
          Narxlar
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Kelish narxi"
            value={pricing.purchasePrice ?? 0}
            onChange={(val) => onUpdatePricing('purchasePrice', val || undefined)}
            min={0}
            disabled={disabled}
            error={errors.purchasePrice}
          />
          <CurrencyInput
            label="Sotish narxi *"
            value={pricing.sellingPrice ?? 0}
            onChange={(val) => onUpdatePricing('sellingPrice', val)}
            min={0}
            disabled={disabled}
            error={errors.sellingPrice}
          />
        </div>

        {/* Additional price fields for finished products */}
        {isFinishedProduct && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Narx/m²"
              value={pricing.pricePerSquareMeter ?? 0}
              onChange={(val) => onUpdatePricing('pricePerSquareMeter', val || undefined)}
              min={0}
              disabled={disabled}
            />
            <CurrencyInput
              label="O'rnatish narxi"
              value={pricing.installationPrice ?? 0}
              onChange={(val) => onUpdatePricing('installationPrice', val || undefined)}
              min={0}
              disabled={disabled}
            />
          </div>
        )}

        {/* Profit margin indicator */}
        {(pricing.purchasePrice || 0) > 0 && pricing.sellingPrice > 0 && (
          <ProfitMarginIndicator
            purchasePrice={pricing.purchasePrice || 0}
            sellingPrice={pricing.sellingPrice}
          />
        )}
      </div>

      {/* Stock */}
      <div className="surface-soft rounded-xl p-4 sm:p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
          Zaxira
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label="Boshlang'ich miqdor"
            value={pricing.quantity ?? 0}
            onChange={(val) => onUpdatePricing('quantity', Number(val) || 0)}
            min={0}
            step={isRawMaterial ? 0.001 : 1}
            disabled={disabled}
          />
          <NumberInput
            label="Min zaxira darajasi"
            value={pricing.minStockLevel ?? 5}
            onChange={(val) => onUpdatePricing('minStockLevel', Number(val) || 0)}
            min={0}
            step={isRawMaterial ? 0.001 : 1}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Create Purchase Option */}
      {selectedSupplier && (
        <div
          className={clsx(
            'rounded-xl border-2 transition-all',
            createPurchase
              ? 'border-success bg-success/5'
              : 'border-base-200 bg-base-100'
          )}
        >
          {/* Toggle header */}
          <label className="flex items-center gap-4 p-4 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-success"
              checked={createPurchase}
              onChange={(e) => onToggleCreatePurchase(e.target.checked)}
              disabled={disabled}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-success" />
                <span className="font-semibold">Boshlang'ich zaxira uchun xarid yaratish</span>
              </div>
              <p className="text-sm text-base-content/60 mt-1">
                Mahsulot saqlanishi bilan birga xarid buyurtmasi yaratiladi
              </p>
            </div>
          </label>

          {/* Purchase details */}
          {createPurchase && (
            <div className="px-4 pb-4 space-y-4">
              <div className="h-px bg-base-200" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <NumberInput
                    label="Xarid miqdori"
                    value={purchaseQuantity}
                    onChange={(val) => onSetPurchaseQuantity(Number(val) || 0)}
                    min={1}
                    step={isRawMaterial ? 0.001 : 1}
                    disabled={disabled}
                  />
                  {errors.purchaseQuantity && (
                    <span className="label-text-alt text-error mt-1">{errors.purchaseQuantity}</span>
                  )}
                </div>
                <div className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                    Jami summa
                  </span>
                  <div className="input input-bordered flex items-center bg-base-200 font-semibold text-lg">
                    {formatCurrency(purchaseTotal)}
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 p-3 bg-info/10 rounded-lg text-sm">
                <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
                <p className="text-base-content/70">
                  Xarid to'lanmagan holda yaratiladi. Keyinchalik to'lovni amalga oshirishingiz mumkin.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Supplier Select Modal */}
      <SupplierSelectModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSelect={onSelectSupplier}
        suppliers={suppliers}
        selectedSupplierId={selectedSupplier?.id}
        loading={suppliersLoading}
      />
    </div>
  );
}
