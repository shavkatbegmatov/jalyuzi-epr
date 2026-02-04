import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  shopCatalogApi,
  type ShopBlindType,
  type ShopMaterial,
  type ShopProduct,
  type ShopPriceCalculateResponse,
} from '../../api/shop.api';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency } from '../../config/constants';

const CONTROL_TYPES = [
  { code: 'CHAIN', name: 'Zanjirli', icon: '⛓️' },
  { code: 'CORD', name: 'Ipli', icon: '🧵' },
  { code: 'MOTORIZED', name: 'Motorli', icon: '🔌' },
  { code: 'REMOTE', name: 'Pultli', icon: '📱' },
  { code: 'SMART', name: 'Smart', icon: '🏠' },
];

export function BlindConfigurator() {
  const { t } = useTranslation();
  const { addToCart, setCartOpen } = useShopStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filter data
  const [blindTypes, setBlindTypes] = useState<ShopBlindType[]>([]);
  const [materials, setMaterials] = useState<ShopMaterial[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);

  // Selected values
  const [selectedBlindType, setSelectedBlindType] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(1500);
  const [selectedControl, setSelectedControl] = useState('CHAIN');
  const [quantity, setQuantity] = useState(1);
  const [withInstallation, setWithInstallation] = useState(true);

  // Price info
  const [priceInfo, setPriceInfo] = useState<ShopPriceCalculateResponse | null>(null);

  // Fetch blind types on mount
  useEffect(() => {
    const fetchBlindTypes = async () => {
      try {
        const types = await shopCatalogApi.getBlindTypes();
        setBlindTypes(types);
      } catch (error) {
        console.error('Error fetching blind types:', error);
      }
    };
    fetchBlindTypes();
  }, []);

  // Fetch materials when blind type selected
  useEffect(() => {
    if (!selectedBlindType) return;
    const fetchMaterials = async () => {
      try {
        const mats = await shopCatalogApi.getMaterials();
        setMaterials(mats);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };
    fetchMaterials();
  }, [selectedBlindType]);

  // Fetch products when material selected
  useEffect(() => {
    if (!selectedBlindType || !selectedMaterial) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const result = await shopCatalogApi.getProducts({
          blindTypes: [selectedBlindType],
          materials: [selectedMaterial],
          size: 50,
        });
        setProducts(result.content);
        if (result.content.length > 0) {
          setSelectedProduct(result.content[0]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedBlindType, selectedMaterial]);

  // Calculate price when dimensions change
  useEffect(() => {
    if (!selectedProduct || step < 6) return;
    const calculate = async () => {
      try {
        const result = await shopCatalogApi.calculatePrice({
          productId: selectedProduct.id,
          width,
          height,
          quantity,
          withInstallation,
        });
        setPriceInfo(result);
      } catch (error) {
        console.error('Error calculating price:', error);
      }
    };
    const debounce = setTimeout(calculate, 300);
    return () => clearTimeout(debounce);
  }, [selectedProduct, width, height, quantity, withInstallation, step]);

  const handleAddToCart = () => {
    if (!selectedProduct || !priceInfo) return;

    addToCart({
      product: selectedProduct,
      width,
      height,
      quantity,
      controlType: selectedControl,
      priceInfo,
    });

    toast.success(t('shop.product.addToCart') + '!');
    setCartOpen(true);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedBlindType;
      case 2:
        return !!selectedMaterial;
      case 3:
        return !!selectedProduct;
      case 4:
        return width >= 100 && height >= 100;
      case 5:
        return !!selectedControl;
      case 6:
        return priceInfo?.validDimensions;
      default:
        return false;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">{t('shop.configurator.title')}</h1>

      {/* Progress Steps */}
      <ul className="steps w-full mb-8">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <li key={s} className={`step ${step >= s ? 'step-primary' : ''}`}>
            {t(`shop.configurator.step${s}`)}
          </li>
        ))}
      </ul>

      <div className="max-w-3xl mx-auto">
        {/* Step 1: Blind Type */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4">{t('shop.configurator.selectType')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {blindTypes.map((type) => (
                <button
                  key={type.code}
                  className={`card bg-base-200 p-6 text-center hover:bg-base-300 transition-colors ${
                    selectedBlindType === type.code ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedBlindType(type.code)}
                >
                  <div className="text-4xl mb-2">🪟</div>
                  <h3 className="font-bold">{type.name}</h3>
                  <p className="text-sm text-gray-500">{type.productCount} mahsulot</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Material */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4">{t('shop.configurator.selectMaterial')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {materials.map((material) => (
                <button
                  key={material.code}
                  className={`card bg-base-200 p-6 text-center hover:bg-base-300 transition-colors ${
                    selectedMaterial === material.code ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedMaterial(material.code)}
                >
                  <h3 className="font-bold">{material.name}</h3>
                  <p className="text-sm text-gray-500 mt-2">{material.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Product/Color */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-4">{t('shop.configurator.selectColor')}</h2>
            {loading ? (
              <div className="flex justify-center py-10">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>Mos mahsulotlar topilmadi</p>
                <button onClick={() => setStep(1)} className="btn btn-ghost mt-4">
                  Boshidan boshlash
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((product) => (
                  <button
                    key={product.id}
                    className={`card bg-base-200 p-4 text-center hover:bg-base-300 transition-colors ${
                      selectedProduct?.id === product.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="h-20 bg-base-300 rounded mb-2 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full"
                          style={{ backgroundColor: product.color || '#ccc' }}
                        />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    {product.color && (
                      <p className="text-xs text-gray-500 mt-1">{product.color}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Dimensions */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold mb-4">{t('shop.configurator.enterDimensions')}</h2>
            <div className="card bg-base-200 p-6 max-w-md mx-auto">
              {selectedProduct && (
                <div className="text-sm text-gray-500 mb-4">
                  <p>
                    {t('shop.product.minSize')}: {selectedProduct.minWidth || 100} x{' '}
                    {selectedProduct.minHeight || 100} mm
                  </p>
                  <p>
                    {t('shop.product.maxSize')}: {selectedProduct.maxWidth || 5000} x{' '}
                    {selectedProduct.maxHeight || 5000} mm
                  </p>
                </div>
              )}

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">{t('shop.product.width')} (mm)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={selectedProduct?.minWidth || 100}
                  max={selectedProduct?.maxWidth || 5000}
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">{t('shop.product.height')} (mm)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min={selectedProduct?.minHeight || 100}
                  max={selectedProduct?.maxHeight || 5000}
                />
              </div>

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
            </div>
          </div>
        )}

        {/* Step 5: Control Type */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold mb-4">{t('shop.configurator.selectControl')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {CONTROL_TYPES.map((control) => (
                <button
                  key={control.code}
                  className={`card bg-base-200 p-6 text-center hover:bg-base-300 transition-colors ${
                    selectedControl === control.code ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedControl(control.code)}
                >
                  <div className="text-3xl mb-2">{control.icon}</div>
                  <h3 className="font-bold text-sm">{control.name}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Review Price */}
        {step === 6 && selectedProduct && (
          <div>
            <h2 className="text-xl font-bold mb-4">{t('shop.configurator.reviewPrice')}</h2>
            <div className="card bg-base-200 p-6 max-w-md mx-auto">
              {/* Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mahsulot:</span>
                  <span className="font-semibold">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">O'lcham:</span>
                  <span>
                    {width} x {height} mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Miqdor:</span>
                  <span>{quantity} dona</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Boshqaruv:</span>
                  <span>{CONTROL_TYPES.find((c) => c.code === selectedControl)?.name}</span>
                </div>
              </div>

              {/* Installation */}
              <div className="form-control mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={withInstallation}
                    onChange={(e) => setWithInstallation(e.target.checked)}
                  />
                  <span>
                    {t('shop.checkout.withInstallation')}
                    {selectedProduct.installationPrice && (
                      <span className="text-gray-500">
                        {' '}
                        (+{formatCurrency(selectedProduct.installationPrice)})
                      </span>
                    )}
                  </span>
                </label>
              </div>

              {/* Price */}
              {priceInfo && (
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
                  <div className="flex justify-between text-2xl font-bold pt-2 border-t">
                    <span>{t('shop.price.total')}:</span>
                    <span className="text-primary">{formatCurrency(priceInfo.grandTotal)}</span>
                  </div>
                  {!priceInfo.validDimensions && (
                    <div className="alert alert-error mt-4">
                      <span>{priceInfo.dimensionError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            className="btn btn-ghost"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            {t('shop.configurator.prev')}
          </button>

          {step < 6 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              {t('shop.configurator.next')}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={!priceInfo?.validDimensions}
            >
              {t('shop.product.addToCart')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
