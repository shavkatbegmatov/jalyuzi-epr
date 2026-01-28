import { Loader2, AlertCircle } from 'lucide-react';
import type { ProductTypeEntity } from '../../../types';
import { ProductTypeCard } from './ProductTypeCard';

interface ProductTypeStepProps {
  productTypes: ProductTypeEntity[];
  selectedProductTypeId: number | null;
  onSelect: (productType: ProductTypeEntity) => void;
  loading: boolean;
  error?: string;
}

export function ProductTypeStep({
  productTypes,
  selectedProductTypeId,
  onSelect,
  loading,
  error,
}: ProductTypeStepProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-base-content/60">Mahsulot turlari yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-error mb-4" />
        <p className="text-error font-medium mb-2">Xatolik yuz berdi</p>
        <p className="text-base-content/60">{error}</p>
      </div>
    );
  }

  if (productTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-warning mb-4" />
        <p className="text-warning font-medium mb-2">Mahsulot turlari topilmadi</p>
        <p className="text-base-content/60">
          Avval mahsulot turlarini yarating yoki administratorga murojaat qiling.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Mahsulot turini tanlang</h2>
        <p className="text-base-content/60">
          Qo'shmoqchi bo'lgan mahsulotingiz qaysi turga mansub?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {productTypes.map((productType) => (
          <ProductTypeCard
            key={productType.id}
            productType={productType}
            isSelected={selectedProductTypeId === productType.id}
            onSelect={() => onSelect(productType)}
          />
        ))}
      </div>

      {!selectedProductTypeId && (
        <p className="text-center text-sm text-base-content/50">
          Davom etish uchun mahsulot turini tanlang
        </p>
      )}
    </div>
  );
}
