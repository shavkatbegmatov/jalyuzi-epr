import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shopCatalogApi, type ShopBlindType, type ShopProduct } from '../../api/shop.api';
import { ProductCard } from '../../components/shop/ProductCard';

export function ShopHomePage() {
  const { t } = useTranslation();
  const [blindTypes, setBlindTypes] = useState<ShopBlindType[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [types, products] = await Promise.all([
          shopCatalogApi.getBlindTypes(),
          shopCatalogApi.getProducts({ size: 8 }),
        ]);
        setBlindTypes(types);
        setFeaturedProducts(products.content);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero min-h-[60vh] bg-gradient-to-r from-primary to-secondary text-primary-content">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-6">{t('shop.title')}</h1>
            <p className="text-xl mb-8">
              Sifatli jalyuzi mahsulotlari - uyingiz uchun eng yaxshi tanlov
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/shop/catalog" className="btn btn-lg">
                {t('shop.catalog')}
              </Link>
              <Link to="/shop/configurator" className="btn btn-lg btn-outline">
                {t('shop.configurator.title')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blind Types */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">{t('shop.blindTypes')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {blindTypes.map((type) => (
              <Link
                key={type.code}
                to={`/shop/catalog?blindTypes=${type.code}`}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                <div className="card-body items-center text-center p-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-sm">{type.name}</h3>
                  <p className="text-xs text-gray-500">{type.productCount} mahsulot</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Yangi mahsulotlar</h2>
            <Link to="/shop/catalog" className="btn btn-ghost">
              {t('dashboard.viewAll')} →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary-content"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">Sifat kafolati</h3>
              <p className="text-gray-500">Barcha mahsulotlar sifat sertifikatiga ega</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary-content"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">Tez yetkazib berish</h3>
              <p className="text-gray-500">Toshkent bo'ylab 24 soat ichida</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary-content"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">Professional o'rnatish</h3>
              <p className="text-gray-500">Tajribali ustalar tomonidan</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
