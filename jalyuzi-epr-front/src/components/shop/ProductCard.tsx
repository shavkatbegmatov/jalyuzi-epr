import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ShopProduct } from '../../api/shop.api';
import { formatCurrency } from '../../config/constants';

interface ProductCardProps {
  product: ShopProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();

  return (
    <Link to={`/shop/product/${product.id}`} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
      {/* Image */}
      <figure className="h-48 bg-base-200">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16"
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
          </div>
        )}
      </figure>

      <div className="card-body p-4">
        {/* Badges */}
        <div className="flex gap-1 flex-wrap">
          {product.blindTypeName && (
            <span className="badge badge-primary badge-sm">{product.blindTypeName}</span>
          )}
          {product.materialName && (
            <span className="badge badge-secondary badge-sm">{product.materialName}</span>
          )}
        </div>

        {/* Title */}
        <h2 className="card-title text-base line-clamp-2">{product.name}</h2>

        {/* Brand & Category */}
        <div className="text-sm text-gray-500">
          {product.brandName && <span>{product.brandName}</span>}
          {product.brandName && product.categoryName && <span> • </span>}
          {product.categoryName && <span>{product.categoryName}</span>}
        </div>

        {/* Price */}
        <div className="mt-2">
          {product.pricePerSquareMeter ? (
            <div>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(product.pricePerSquareMeter)}
              </span>
              <span className="text-sm text-gray-500"> / m²</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-primary">
              {formatCurrency(product.basePrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-1">
          {product.inStock ? (
            <span className="text-success text-sm">✓ Mavjud</span>
          ) : (
            <span className="text-error text-sm">{t('shop.product.outOfStock')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
