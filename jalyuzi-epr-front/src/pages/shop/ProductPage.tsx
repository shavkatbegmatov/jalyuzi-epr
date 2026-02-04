import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shopCatalogApi, type ShopProduct } from '../../api/shop.api';
import { PriceCalculator } from '../../components/shop/PriceCalculator';
import { formatCurrency } from '../../config/constants';

export function ShopProductPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await shopCatalogApi.getProduct(Number(id));
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-error mb-4">{error || 'Mahsulot topilmadi'}</p>
        <Link to="/shop/catalog" className="btn btn-primary">
          {t('shop.catalog')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li>
            <Link to="/shop">{t('nav.home')}</Link>
          </li>
          <li>
            <Link to="/shop/catalog">{t('shop.catalog')}</Link>
          </li>
          {product.categoryName && (
            <li>
              <Link to={`/shop/catalog?categoryId=${product.categoryId}`}>
                {product.categoryName}
              </Link>
            </li>
          )}
          <li>{product.name}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="bg-base-200 rounded-lg aspect-square flex items-center justify-center">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-32 w-32 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </div>

          {/* Gallery thumbnails */}
          {product.galleryImages && product.galleryImages.length > 0 && (
            <div className="flex gap-2 mt-4">
              {product.galleryImages.map((img, index) => (
                <div
                  key={index}
                  className="w-20 h-20 bg-base-200 rounded cursor-pointer"
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {product.blindTypeName && (
              <span className="badge badge-primary">{product.blindTypeName}</span>
            )}
            {product.materialName && (
              <span className="badge badge-secondary">{product.materialName}</span>
            )}
            {product.controlTypeName && (
              <span className="badge badge-accent">{product.controlTypeName}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Brand & Category */}
          <div className="flex gap-4 text-gray-500">
            {product.brandName && (
              <Link
                to={`/shop/catalog?brandId=${product.brandId}`}
                className="hover:text-primary"
              >
                {product.brandName}
              </Link>
            )}
            {product.categoryName && (
              <Link
                to={`/shop/catalog?categoryId=${product.categoryId}`}
                className="hover:text-primary"
              >
                {product.categoryName}
              </Link>
            )}
          </div>

          {/* Price */}
          <div className="text-2xl font-bold text-primary">
            {product.pricePerSquareMeter ? (
              <>
                {formatCurrency(product.pricePerSquareMeter)}
                <span className="text-lg font-normal text-gray-500"> / m²</span>
              </>
            ) : (
              formatCurrency(product.basePrice)
            )}
          </div>

          {/* Stock Status */}
          <div>
            {product.inStock ? (
              <span className="text-success font-semibold">✓ Mavjud</span>
            ) : (
              <span className="text-error font-semibold">
                {t('shop.product.outOfStock')}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-bold mb-2">{t('shop.product.details')}</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}

          {/* Specs */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {product.color && (
              <div>
                <span className="text-gray-500">Rang:</span>
                <span className="ml-2 font-semibold">{product.color}</span>
              </div>
            )}
            {product.collection && (
              <div>
                <span className="text-gray-500">Kolleksiya:</span>
                <span className="ml-2 font-semibold">{product.collection}</span>
              </div>
            )}
          </div>

          {/* Price Calculator */}
          <PriceCalculator product={product} />
        </div>
      </div>
    </div>
  );
}
