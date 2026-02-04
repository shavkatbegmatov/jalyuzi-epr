import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { ShopProduct, ShopPriceCalculateResponse } from '../../api/shop.api';
import { shopCatalogApi } from '../../api/shop.api';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency } from '../../config/constants';

interface PriceCalculatorProps {
  product: ShopProduct;
}

export function PriceCalculator({ product }: PriceCalculatorProps) {
  const { t } = useTranslation();
  const { addToCart } = useShopStore();

  const [width, setWidth] = useState<number>(product.minWidth || 500);
  const [height, setHeight] = useState<number>(product.minHeight || 500);
  const [quantity, setQuantity] = useState<number>(1);
  const [withInstallation, setWithInstallation] = useState(true);
  const [priceInfo, setPriceInfo] = useState<ShopPriceCalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Narxni hisoblash
  useEffect(() => {
    const calculatePrice = async () => {
      if (!width || !height) return;

      setLoading(true);
      setError(null);

      try {
        const result = await shopCatalogApi.calculatePrice({
          productId: product.id,
          width,
          height,
          quantity,
          withInstallation,
        });
        setPriceInfo(result);
        if (!result.validDimensions) {
          setError(result.dimensionError);
        }
      } catch (err) {
        console.error('Price calculation error:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(calculatePrice, 300);
    return () => clearTimeout(debounce);
  }, [width, height, quantity, withInstallation, product.id, t]);

  const handleAddToCart = () => {
    if (!priceInfo || !priceInfo.validDimensions) {
      toast.error(error || t('common.error'));
      return;
    }

    addToCart({
      product,
      width,
      height,
      quantity,
      priceInfo,
    });

    toast.success(t('shop.product.addToCart') + '!');
  };

  return (
    <div className="card bg-base-200 p-6 space-y-4">
      <h3 className="font-bold text-lg">{t('shop.product.dimensions')}</h3>

      {/* O'lcham cheklovlari */}
      {(product.minWidth || product.maxWidth) && (
        <div className="text-sm text-gray-500">
          <span>{t('shop.product.minSize')}: {product.minWidth || 100} x {product.minHeight || 100} {t('shop.product.mm')}</span>
          <br />
          <span>{t('shop.product.maxSize')}: {product.maxWidth || 5000} x {product.maxHeight || 5000} {t('shop.product.mm')}</span>
        </div>
      )}

      {/* Kenglik */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('shop.product.width')} ({t('shop.product.mm')})</span>
        </label>
        <input
          type="number"
          className={`input input-bordered ${error && !priceInfo?.validDimensions ? 'input-error' : ''}`}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          min={product.minWidth || 100}
          max={product.maxWidth || 5000}
        />
      </div>

      {/* Balandlik */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('shop.product.height')} ({t('shop.product.mm')})</span>
        </label>
        <input
          type="number"
          className={`input input-bordered ${error && !priceInfo?.validDimensions ? 'input-error' : ''}`}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          min={product.minHeight || 100}
          max={product.maxHeight || 5000}
        />
      </div>

      {/* Miqdor */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('shop.product.quantity')}</span>
        </label>
        <input
          type="number"
          className="input input-bordered"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          min={1}
        />
      </div>

      {/* O'rnatish */}
      {product.installationPrice && (
        <div className="form-control">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={withInstallation}
              onChange={(e) => setWithInstallation(e.target.checked)}
            />
            <span>{t('shop.checkout.withInstallation')} (+{formatCurrency(product.installationPrice)})</span>
          </label>
        </div>
      )}

      {/* Xatolik */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Narx */}
      {priceInfo && priceInfo.validDimensions && (
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between">
            <span>{t('shop.price.productPrice')}:</span>
            <span>{formatCurrency(priceInfo.subtotal)}</span>
          </div>
          {withInstallation && priceInfo.installationTotal > 0 && (
            <div className="flex justify-between">
              <span>{t('shop.price.installationPrice')}:</span>
              <span>{formatCurrency(priceInfo.installationTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>{t('shop.price.total')}:</span>
            <span className="text-primary">{formatCurrency(priceInfo.grandTotal)}</span>
          </div>
          <div className="text-sm text-gray-500">
            {priceInfo.squareMeters.toFixed(2)} m² × {quantity} {t('shop.cart.items')}
          </div>
        </div>
      )}

      {/* Savatga qo'shish */}
      <button
        className="btn btn-primary w-full"
        onClick={handleAddToCart}
        disabled={loading || !priceInfo?.validDimensions || !product.inStock}
      >
        {loading && <span className="loading loading-spinner loading-sm"></span>}
        {product.inStock ? t('shop.product.addToCart') : t('shop.product.outOfStock')}
      </button>
    </div>
  );
}
