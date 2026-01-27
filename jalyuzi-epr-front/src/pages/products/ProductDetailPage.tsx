import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Tag,
  DollarSign,
  Warehouse,
  Ruler,
  Palette,
  Settings2,
  AlertCircle,
  FileText,
  Wrench,
  Square,
} from 'lucide-react';
import clsx from 'clsx';
import { productsApi } from '../../api/products.api';
import { formatCurrency, BLIND_TYPES, BLIND_MATERIALS, CONTROL_TYPES } from '../../config/constants';
import type { Product } from '../../types';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    try {
      const data = await productsApi.getById(Number(id));
      setProduct(data);
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  // Blind type label helper
  const getBlindTypeLabel = (type?: string) => {
    if (!type) return '—';
    return BLIND_TYPES[type as keyof typeof BLIND_TYPES]?.label || type;
  };

  // Material label helper
  const getMaterialLabel = (material?: string) => {
    if (!material) return '—';
    return BLIND_MATERIALS[material as keyof typeof BLIND_MATERIALS]?.label || material;
  };

  // Control type label helper
  const getControlTypeLabel = (control?: string) => {
    if (!control) return '—';
    return CONTROL_TYPES[control as keyof typeof CONTROL_TYPES]?.label || control;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-error mb-4" />
        <h2 className="text-xl font-semibold">Mahsulot topilmadi</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/products')}>
          Orqaga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="section-title flex items-center gap-2">
              <Package className="h-6 w-6" />
              {product.name}
            </h1>
            <p className="section-subtitle font-mono">{product.sku}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={clsx('badge', product.active ? 'badge-success' : 'badge-error')}>
            {product.active ? 'Faol' : 'Nofaol'}
          </span>
          {product.lowStock && (
            <span className="badge badge-warning">Kam qoldi</span>
          )}
          {product.blindType && (
            <span className="badge badge-primary">
              {getBlindTypeLabel(product.blindType)}
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Brand</p>
              <p className="font-semibold">{product.brandName || '—'}</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-info/10 p-2.5">
              <Package className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Kategoriya</p>
              <p className="font-semibold">{product.categoryName || '—'}</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2.5">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Narx/m²</p>
              <p className="font-semibold">
                {product.pricePerSquareMeter
                  ? formatCurrency(product.pricePerSquareMeter)
                  : formatCurrency(product.sellingPrice)}
              </p>
            </div>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2.5">
              <Warehouse className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Ombor qoldig'i</p>
              <p className={clsx(
                'font-semibold',
                product.lowStock ? 'text-error' : 'text-success'
              )}>
                {product.quantity} dona
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Technical Specifications */}
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4">
            Jalyuzi xususiyatlari
          </h3>
          <div className="space-y-4">
            {/* Blind Type */}
            {product.blindType && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-base-200 p-2">
                  <Square className="h-4 w-4 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Jalyuzi turi</p>
                  <p className="font-semibold">{getBlindTypeLabel(product.blindType)}</p>
                </div>
              </div>
            )}

            {/* Material */}
            {product.material && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-base-200 p-2">
                  <Package className="h-4 w-4 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Material</p>
                  <p className="font-semibold">{getMaterialLabel(product.material)}</p>
                </div>
              </div>
            )}

            {/* Color */}
            {product.color && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-base-200 p-2">
                  <Palette className="h-4 w-4 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Rang</p>
                  <p className="font-semibold">{product.color}</p>
                </div>
              </div>
            )}

            {/* Control Type */}
            {product.controlType && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-base-200 p-2">
                  <Settings2 className="h-4 w-4 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Boshqaruv turi</p>
                  <p className="font-semibold">{getControlTypeLabel(product.controlType)}</p>
                </div>
              </div>
            )}

            {/* Size Range */}
            {(product.minWidth || product.maxWidth || product.minHeight || product.maxHeight) && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-base-200 p-2">
                  <Ruler className="h-4 w-4 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">O'lcham diapazoni</p>
                  <div className="font-semibold text-sm">
                    <p>Eni: {product.minWidth || 0} - {product.maxWidth || 0} mm</p>
                    <p>Bo'yi: {product.minHeight || 0} - {product.maxHeight || 0} mm</p>
                  </div>
                </div>
              </div>
            )}

            {/* Show placeholder if no specs */}
            {!product.blindType && !product.material && !product.color && !product.controlType && (
              <p className="text-base-content/50 text-center py-4">
                Texnik xususiyatlar mavjud emas
              </p>
            )}
          </div>
        </div>

        {/* Price & Stock Info */}
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4">
            Narx va ombor
          </h3>
          <div className="space-y-4">
            {/* Price per m² */}
            {product.pricePerSquareMeter !== undefined && (
              <div className="flex items-center justify-between py-2 border-b border-base-200">
                <span className="text-base-content/70">Narx/m²</span>
                <span className="font-semibold text-success">{formatCurrency(product.pricePerSquareMeter)}</span>
              </div>
            )}

            {/* Base Price */}
            <div className="flex items-center justify-between py-2 border-b border-base-200">
              <span className="text-base-content/70">Asosiy narx</span>
              <span className="font-semibold">{formatCurrency(product.sellingPrice)}</span>
            </div>

            {/* Installation Price */}
            {product.installationPrice !== undefined && product.installationPrice > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-base-200">
                <span className="text-base-content/70 flex items-center gap-1">
                  <Wrench className="h-4 w-4" />
                  O'rnatish narxi
                </span>
                <span className="font-semibold text-info">{formatCurrency(product.installationPrice)}</span>
              </div>
            )}

            {/* Purchase Price */}
            {product.purchasePrice !== undefined && (
              <div className="flex items-center justify-between py-2 border-b border-base-200">
                <span className="text-base-content/70">Xarid narxi</span>
                <span className="font-semibold">{formatCurrency(product.purchasePrice)}</span>
              </div>
            )}

            {/* Current Stock */}
            <div className="flex items-center justify-between py-2 border-b border-base-200">
              <span className="text-base-content/70">Joriy zaxira</span>
              <span className={clsx(
                'font-semibold',
                product.lowStock ? 'text-error' : ''
              )}>
                {product.quantity} dona
              </span>
            </div>

            {/* Min Stock Level */}
            <div className="flex items-center justify-between py-2">
              <span className="text-base-content/70">Minimal daraja</span>
              <span className="font-semibold">{product.minStockLevel} dona</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tavsif
          </h3>
          <p className="text-base-content/80 whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-start">
        <button className="btn btn-ghost" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4" />
          Mahsulotlar ro'yxatiga qaytish
        </button>
      </div>
    </div>
  );
}
