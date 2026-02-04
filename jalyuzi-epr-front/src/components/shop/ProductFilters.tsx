import { useTranslation } from 'react-i18next';
import type { ShopBlindType, ShopMaterial, ShopCategory, ShopBrand, ShopProductFilter } from '../../api/shop.api';

interface ProductFiltersProps {
  filters: ShopProductFilter;
  onChange: (filters: Partial<ShopProductFilter>) => void;
  blindTypes: ShopBlindType[];
  materials: ShopMaterial[];
  categories: ShopCategory[];
  brands: ShopBrand[];
  onClear: () => void;
}

export function ProductFilters({
  filters,
  onChange,
  blindTypes,
  materials,
  categories,
  brands,
  onClear,
}: ProductFiltersProps) {
  const { t } = useTranslation();

  const handleBlindTypeChange = (code: string, checked: boolean) => {
    const current = filters.blindTypes || [];
    const updated = checked
      ? [...current, code]
      : current.filter((c) => c !== code);
    onChange({ blindTypes: updated.length > 0 ? updated : undefined });
  };

  const handleMaterialChange = (code: string, checked: boolean) => {
    const current = filters.materials || [];
    const updated = checked
      ? [...current, code]
      : current.filter((c) => c !== code);
    onChange({ materials: updated.length > 0 ? updated : undefined });
  };

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">{t('shop.filters')}</h3>
        <button onClick={onClear} className="btn btn-ghost btn-sm text-error">
          {t('shop.clearFilters')}
        </button>
      </div>

      {/* Search */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('shop.search')}</span>
        </label>
        <input
          type="text"
          placeholder={t('shop.searchPlaceholder')}
          className="input input-bordered w-full"
          value={filters.search || ''}
          onChange={(e) => onChange({ search: e.target.value || undefined })}
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('shop.categories')}</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={filters.categoryId || ''}
            onChange={(e) =>
              onChange({ categoryId: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">{t('common.all')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.productCount})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('shop.brands')}</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={filters.brandId || ''}
            onChange={(e) =>
              onChange({ brandId: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">{t('common.all')}</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name} ({brand.productCount})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Blind Types */}
      {blindTypes.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('shop.blindTypes')}</span>
          </label>
          <div className="space-y-2">
            {blindTypes.map((type) => (
              <label key={type.code} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={filters.blindTypes?.includes(type.code) || false}
                  onChange={(e) => handleBlindTypeChange(type.code, e.target.checked)}
                />
                <span className="text-sm">
                  {type.name} ({type.productCount})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Materials */}
      {materials.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('shop.materials')}</span>
          </label>
          <div className="space-y-2">
            {materials.map((material) => (
              <label key={material.code} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={filters.materials?.includes(material.code) || false}
                  onChange={(e) => handleMaterialChange(material.code, e.target.checked)}
                />
                <span className="text-sm">
                  {material.name} ({material.productCount})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Sort */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('shop.sortBy')}</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={`${filters.sortBy || 'newest'}-${filters.sortDirection || 'desc'}`}
          onChange={(e) => {
            const [sortBy, sortDirection] = e.target.value.split('-') as [
              'price' | 'name' | 'newest',
              'asc' | 'desc'
            ];
            onChange({ sortBy, sortDirection });
          }}
        >
          <option value="newest-desc">{t('shop.sortNewest')}</option>
          <option value="price-asc">{t('shop.sortPriceAsc')}</option>
          <option value="price-desc">{t('shop.sortPriceDesc')}</option>
          <option value="name-asc">{t('shop.sortName')}</option>
        </select>
      </div>

      {/* In Stock Only */}
      <div className="form-control">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={filters.inStockOnly || false}
            onChange={(e) => onChange({ inStockOnly: e.target.checked })}
          />
          <span>{t('shop.inStockOnly')}</span>
        </label>
      </div>
    </div>
  );
}
