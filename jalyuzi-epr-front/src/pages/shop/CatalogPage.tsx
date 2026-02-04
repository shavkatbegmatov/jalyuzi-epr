import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  shopCatalogApi,
  type ShopProduct,
  type ShopProductFilter,
  type ShopBlindType,
  type ShopMaterial,
  type ShopCategory,
  type ShopBrand,
} from '../../api/shop.api';
import { ProductCard } from '../../components/shop/ProductCard';
import { ProductFilters } from '../../components/shop/ProductFilters';

export function ShopCatalogPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter data
  const [blindTypes, setBlindTypes] = useState<ShopBlindType[]>([]);
  const [materials, setMaterials] = useState<ShopMaterial[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [brands, setBrands] = useState<ShopBrand[]>([]);

  // Mobile filter drawer
  const [showFilters, setShowFilters] = useState(false);

  // Parse filters from URL
  const getFiltersFromUrl = useCallback((): ShopProductFilter => {
    return {
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined,
      brandId: searchParams.get('brandId') ? Number(searchParams.get('brandId')) : undefined,
      blindTypes: searchParams.getAll('blindTypes').length > 0 ? searchParams.getAll('blindTypes') : undefined,
      materials: searchParams.getAll('materials').length > 0 ? searchParams.getAll('materials') : undefined,
      sortBy: (searchParams.get('sortBy') as 'price' | 'name' | 'newest') || 'newest',
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc',
      inStockOnly: searchParams.get('inStockOnly') === 'true',
      page: Number(searchParams.get('page')) || 0,
      size: 12,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<ShopProductFilter>(getFiltersFromUrl);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [types, mats, cats, brds] = await Promise.all([
          shopCatalogApi.getBlindTypes(),
          shopCatalogApi.getMaterials(),
          shopCatalogApi.getCategories(),
          shopCatalogApi.getBrands(),
        ]);
        setBlindTypes(types);
        setMaterials(mats);
        setCategories(cats);
        setBrands(brds);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const result = await shopCatalogApi.getProducts(filters);
        setProducts(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<ShopProductFilter>) => {
    const updated = { ...filters, ...newFilters, page: 0 }; // Reset page on filter change
    setFilters(updated);

    const params = new URLSearchParams();
    if (updated.search) params.set('search', updated.search);
    if (updated.categoryId) params.set('categoryId', updated.categoryId.toString());
    if (updated.brandId) params.set('brandId', updated.brandId.toString());
    if (updated.blindTypes?.length) updated.blindTypes.forEach(t => params.append('blindTypes', t));
    if (updated.materials?.length) updated.materials.forEach(m => params.append('materials', m));
    if (updated.sortBy) params.set('sortBy', updated.sortBy);
    if (updated.sortDirection) params.set('sortDirection', updated.sortDirection);
    if (updated.inStockOnly) params.set('inStockOnly', 'true');
    if (updated.page) params.set('page', updated.page.toString());

    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ size: 12, page: 0 });
    setSearchParams({});
  };

  const handlePageChange = (page: number) => {
    const updated = { ...filters, page };
    setFilters(updated);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Desktop Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <ProductFilters
            filters={filters}
            onChange={updateFilters}
            blindTypes={blindTypes}
            materials={materials}
            categories={categories}
            brands={brands}
            onClear={clearFilters}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t('shop.catalog')}</h1>
            <div className="flex gap-2">
              {/* Mobile Filter Button */}
              <button
                className="btn btn-outline lg:hidden"
                onClick={() => setShowFilters(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                {t('shop.filters')}
              </button>
              <span className="text-gray-500 self-center">{totalElements} mahsulot</span>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center min-h-[40vh]">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xl text-gray-500">{t('shop.noProducts')}</p>
              <button onClick={clearFilters} className="btn btn-primary mt-4">
                {t('shop.clearFilters')}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="join">
                    <button
                      className="join-item btn"
                      disabled={filters.page === 0}
                      onClick={() => handlePageChange((filters.page || 0) - 1)}
                    >
                      «
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + Math.max(0, (filters.page || 0) - 2);
                      if (page >= totalPages) return null;
                      return (
                        <button
                          key={page}
                          className={`join-item btn ${filters.page === page ? 'btn-active' : ''}`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page + 1}
                        </button>
                      );
                    })}
                    <button
                      className="join-item btn"
                      disabled={(filters.page || 0) >= totalPages - 1}
                      onClick={() => handlePageChange((filters.page || 0) + 1)}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-base-100 z-50 p-4 overflow-y-auto lg:hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{t('shop.filters')}</h3>
              <button onClick={() => setShowFilters(false)} className="btn btn-ghost btn-circle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ProductFilters
              filters={filters}
              onChange={(f) => {
                updateFilters(f);
                setShowFilters(false);
              }}
              blindTypes={blindTypes}
              materials={materials}
              categories={categories}
              brands={brands}
              onClear={() => {
                clearFilters();
                setShowFilters(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
