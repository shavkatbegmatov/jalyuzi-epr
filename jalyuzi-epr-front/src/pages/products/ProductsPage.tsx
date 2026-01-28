import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Package, BadgeCheck, AlertTriangle, X, Blinds, Layers, Wrench, Check } from 'lucide-react';
import clsx from 'clsx';
import { productsApi, brandsApi, categoriesApi } from '../../api/products.api';
import { productTypesApi } from '../../api/product-types.api';
import { formatCurrency, BLIND_TYPES, BLIND_MATERIALS, CONTROL_TYPES, PRODUCT_TYPES, UNIT_TYPES } from '../../config/constants';
import { NumberInput } from '../../components/ui/NumberInput';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { Select } from '../../components/ui/Select';
import { SearchInput } from '../../components/ui/SearchInput';
import { DataTable, Column } from '../../components/ui/DataTable';
import { ModalPortal } from '../../components/common/Modal';
import { ExportButtons } from '../../components/common/ExportButtons';
import { DynamicProductForm } from '../../components/products/DynamicProductForm';
import { useNotificationsStore } from '../../store/notificationsStore';
import { PermissionCode } from '../../hooks/usePermission';
import { PermissionGate } from '../../components/common/PermissionGate';
import { useHighlight } from '../../hooks/useHighlight';
import type { Product, Brand, Category, BlindType, BlindMaterial, ControlType, ProductType, UnitType, ProductRequest, ProductTypeEntity } from '../../types';
import type { LucideIcon } from 'lucide-react';

// Mahsulot turi kartalari konfiguratsiyasi
const PRODUCT_TYPE_CARDS: {
  type: ProductType;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
}[] = [
  {
    type: 'FINISHED_PRODUCT',
    icon: Blinds,
    title: 'Tayyor Jalyuzi',
    description: "O'rnatishga tayyor mahsulotlar",
    gradient: 'from-primary/20 to-primary/5',
    borderColor: 'border-primary',
    iconColor: 'text-primary',
  },
  {
    type: 'RAW_MATERIAL',
    icon: Layers,
    title: 'Xomashyo',
    description: 'Ishlab chiqarish materiallari',
    gradient: 'from-secondary/20 to-secondary/5',
    borderColor: 'border-secondary',
    iconColor: 'text-secondary',
  },
  {
    type: 'ACCESSORY',
    icon: Wrench,
    title: 'Aksessuar',
    description: "Qo'shimcha qismlar va jihozlar",
    gradient: 'from-accent/20 to-accent/5',
    borderColor: 'border-accent',
    iconColor: 'text-accent',
  },
];

const emptyFormData: ProductRequest = {
  sku: '',
  name: '',
  sellingPrice: 0,
  productType: 'FINISHED_PRODUCT',
  unitType: 'PIECE',
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeEntity[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [blindTypeFilter, setBlindTypeFilter] = useState<BlindType | ''>('');
  const [materialFilter, setMaterialFilter] = useState<BlindMaterial | ''>('');
  const [controlTypeFilter, setControlTypeFilter] = useState<ControlType | ''>('');
  const [productTypeFilter, setProductTypeFilter] = useState<ProductType | ''>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductRequest>(emptyFormData);
  const [customAttributes, setCustomAttributes] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const { notifications } = useNotificationsStore();
  const { highlightId, clearHighlight } = useHighlight();

  // Tanlangan mahsulot turi (schema bilan)
  const selectedProductType = useMemo(() => {
    // Yangi tizim bo'yicha productTypeId orqali topish
    if (formData.productTypeId) {
      return productTypes.find((pt) => pt.id === formData.productTypeId);
    }
    // Eski enum bo'yicha mos turni topish
    if (formData.productType) {
      return productTypes.find((pt) => pt.code === formData.productType);
    }
    return undefined;
  }, [formData.productTypeId, formData.productType, productTypes]);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (brandFilter) count += 1;
    if (categoryFilter) count += 1;
    if (blindTypeFilter) count += 1;
    if (materialFilter) count += 1;
    if (controlTypeFilter) count += 1;
    if (productTypeFilter) count += 1;
    return count;
  }, [brandFilter, categoryFilter, search, blindTypeFilter, materialFilter, controlTypeFilter, productTypeFilter]);

  const columns: Column<Product>[] = useMemo(() => [
    {
      key: 'sku',
      header: 'SKU',
      render: (product) => <span className="font-mono text-sm">{product.sku}</span>,
    },
    {
      key: 'name',
      header: 'Nomi',
      render: (product) => (
        <div>
          <div className="font-medium">{product.name}</div>
          <div className="text-xs text-base-content/60">{product.categoryName || '—'}</div>
        </div>
      ),
    },
    {
      key: 'productType',
      header: 'Mahsulot turi',
      render: (product) => {
        const typeInfo = PRODUCT_TYPES[product.productType || 'FINISHED_PRODUCT'];
        return (
          <span className={clsx('badge badge-sm', {
            'badge-primary': product.productType === 'FINISHED_PRODUCT',
            'badge-secondary': product.productType === 'RAW_MATERIAL',
            'badge-accent': product.productType === 'ACCESSORY',
          })}>
            {typeInfo?.label}
          </span>
        );
      },
    },
    {
      key: 'blindType',
      header: 'Jalyuzi turi',
      render: (product) =>
        product.blindType ? (
          <span className="badge badge-outline badge-sm">{BLIND_TYPES[product.blindType]?.label}</span>
        ) : '—',
    },
    {
      key: 'material',
      header: 'Material',
      render: (product) =>
        product.material ? (
          <span className="badge badge-ghost badge-sm">{BLIND_MATERIALS[product.material]?.label}</span>
        ) : '—',
    },
    {
      key: 'color',
      header: 'Rang',
      render: (product) => product.color || '—',
    },
    {
      key: 'pricePerSquareMeter',
      header: 'Narx/m²',
      render: (product) => (
        <span className="font-medium">
          {product.pricePerSquareMeter ? formatCurrency(product.pricePerSquareMeter) : '—'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Zaxira',
      render: (product) => (
        <span className={clsx('badge badge-sm', product.lowStock ? 'badge-error' : 'badge-success')}>
          {product.quantity}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (product) => (
        <div className="space-x-2">
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}>
            Tafsilotlar
          </button>
          <PermissionGate permission={PermissionCode.PRODUCTS_UPDATE}>
            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}>Tahrirlash</button>
          </PermissionGate>
        </div>
      ),
    },
  ], []);

  const loadData = useCallback(async () => {
    try {
      const [brandsData, categoriesData, productTypesData] = await Promise.all([
        brandsApi.getAll(),
        categoriesApi.getAll(),
        productTypesApi.getAll(),
      ]);
      setBrands(brandsData);
      setCategories(categoriesData);
      setProductTypes(productTypesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  const loadProducts = useCallback(async (isInitial = false) => {
    if (!isInitial) {
      setRefreshing(true);
    }
    try {
      const data = await productsApi.getAll({
        page,
        size: pageSize,
        search: search || undefined,
        brandId: brandFilter || undefined,
        categoryId: categoryFilter || undefined,
        blindType: blindTypeFilter || undefined,
        material: materialFilter || undefined,
        controlType: controlTypeFilter || undefined,
        productType: productTypeFilter || undefined,
      });
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [brandFilter, categoryFilter, page, pageSize, search, blindTypeFilter, materialFilter, controlTypeFilter, productTypeFilter]);

  useEffect(() => {
    void loadData();
    void loadProducts(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, brandFilter, categoryFilter, blindTypeFilter, materialFilter, controlTypeFilter, productTypeFilter]);

  useEffect(() => {
    if (notifications.length > 0) {
      void loadProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  const handleResetFilters = () => {
    setSearch('');
    setBrandFilter('');
    setCategoryFilter('');
    setBlindTypeFilter('');
    setMaterialFilter('');
    setControlTypeFilter('');
    setProductTypeFilter('');
    setPage(0);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const handleOpenNewProductModal = () => {
    setFormData(emptyFormData);
    setCustomAttributes({});
    setShowNewProductModal(true);
  };

  const handleCloseNewProductModal = () => {
    setShowNewProductModal(false);
    setEditingProductId(null);
    setFormData(emptyFormData);
    setCustomAttributes({});
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      sku: product.sku,
      name: product.name,
      brandId: product.brandId,
      categoryId: product.categoryId,
      productType: product.productType || 'FINISHED_PRODUCT',
      unitType: product.unitType || 'PIECE',
      productTypeId: product.productTypeId,
      blindType: product.blindType,
      material: product.material,
      color: product.color,
      controlType: product.controlType,
      minWidth: product.minWidth,
      maxWidth: product.maxWidth,
      minHeight: product.minHeight,
      maxHeight: product.maxHeight,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      pricePerSquareMeter: product.pricePerSquareMeter,
      installationPrice: product.installationPrice,
      quantity: product.quantity,
      minStockLevel: product.minStockLevel,
      rollWidth: product.rollWidth,
      rollLength: product.rollLength,
      profileLength: product.profileLength,
      weightPerUnit: product.weightPerUnit,
      compatibleBlindTypes: product.compatibleBlindTypes,
      description: product.description,
      imageUrl: product.imageUrl,
    });
    setCustomAttributes(product.customAttributes || {});
    setShowNewProductModal(true);
  };

  const handleFormChange = (field: keyof ProductRequest, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Tur o'zgarganda o'lchov birligini avtomatik sozlash
  useEffect(() => {
    if (!showNewProductModal) return;

    if (formData.productType === 'FINISHED_PRODUCT') {
      setFormData((prev) => ({ ...prev, unitType: 'PIECE' }));
    } else if (formData.productType === 'RAW_MATERIAL') {
      setFormData((prev) => ({ ...prev, unitType: 'METER' }));
    } else if (formData.productType === 'ACCESSORY') {
      setFormData((prev) => ({ ...prev, unitType: 'PIECE' }));
    }
  }, [formData.productType, showNewProductModal]);

  const handleSaveProduct = async () => {
    if (!formData.sku.trim() || !formData.name.trim() || formData.sellingPrice <= 0) {
      return;
    }
    setSaving(true);
    try {
      const dataToSave: ProductRequest = {
        ...formData,
        customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
      };
      if (editingProductId) {
        await productsApi.update(editingProductId, dataToSave);
      } else {
        await productsApi.create(dataToSave);
      }
      handleCloseNewProductModal();
      void loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    await productsApi.export.exportData(format, {
      brandId: brandFilter || undefined,
      categoryId: categoryFilter || undefined,
      blindType: blindTypeFilter || undefined,
      material: materialFilter || undefined,
      controlType: controlTypeFilter || undefined,
      productType: productTypeFilter || undefined,
      search: search || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">Jalyuzi Mahsulotlari</h1>
          <p className="section-subtitle">Mahsulot katalogi</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleResetFilters}>
              <X className="h-4 w-4" />
              Filtrlarni tozalash
            </button>
          )}
          <ExportButtons
            onExportExcel={() => handleExport('excel')}
            onExportPdf={() => handleExport('pdf')}
            disabled={products.length === 0}
            loading={refreshing}
          />
          <PermissionGate permission={PermissionCode.PRODUCTS_CREATE}>
            <button className="btn btn-primary" onClick={handleOpenNewProductModal}>
              <Plus className="h-5 w-5" />
              Yangi mahsulot
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      <div className="surface-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/50">
              Filtrlar
            </h2>
            <p className="text-xs text-base-content/60">
              {activeFilters > 0 ? `${activeFilters} ta filter tanlangan` : "Barcha mahsulotlar ko'rsatilmoqda"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/60">
            <span className="pill">{totalElements} ta mahsulot</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
          <SearchInput
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            label="Qidirish"
            placeholder="SKU, nom..."
          />

          <Select
            label="Mahsulot turi"
            value={productTypeFilter}
            onChange={(value) => { setProductTypeFilter(value as ProductType | ''); setPage(0); }}
            placeholder="Barcha turlar"
            options={Object.entries(PRODUCT_TYPES).map(([key, { label }]) => ({ value: key, label }))}
          />

          <Select
            label="Jalyuzi turi"
            value={blindTypeFilter}
            onChange={(value) => { setBlindTypeFilter(value as BlindType | ''); setPage(0); }}
            placeholder="Barcha turlar"
            options={Object.entries(BLIND_TYPES).map(([key, { label }]) => ({ value: key, label }))}
          />

          <Select
            label="Material"
            value={materialFilter}
            onChange={(value) => { setMaterialFilter(value as BlindMaterial | ''); setPage(0); }}
            placeholder="Barcha materiallar"
            options={Object.entries(BLIND_MATERIALS).map(([key, { label }]) => ({ value: key, label }))}
          />

          <Select
            label="Boshqaruv"
            value={controlTypeFilter}
            onChange={(value) => { setControlTypeFilter(value as ControlType | ''); setPage(0); }}
            placeholder="Barcha turlari"
            options={Object.entries(CONTROL_TYPES).map(([key, { label }]) => ({ value: key, label }))}
          />

          <Select
            label="Brend"
            value={brandFilter}
            onChange={(value) => { setBrandFilter(value ? Number(value) : ''); setPage(0); }}
            placeholder="Barcha brendlar"
            options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
          />

          <Select
            label="Kategoriya"
            value={categoryFilter}
            onChange={(value) => { setCategoryFilter(value ? Number(value) : ''); setPage(0); }}
            placeholder="Barcha kategoriyalar"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="relative">
        {refreshing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-base-100/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <span className="text-sm font-medium text-base-content/70">Yangilanmoqda...</span>
            </div>
          </div>
        )}
        <DataTable
          data={products}
          columns={columns}
          keyExtractor={(product) => product.id}
          loading={initialLoading && !refreshing}
          highlightId={highlightId}
          onHighlightComplete={clearHighlight}
          emptyIcon={<Package className="h-12 w-12" />}
          emptyTitle="Mahsulotlar topilmadi"
          emptyDescription="Filtrlarni o'zgartirib ko'ring"
          rowClassName={(product) => (product.lowStock ? 'bg-error/5' : '')}
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          renderMobileCard={(product) => (
            <div className="surface-panel flex flex-col gap-3 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-base-content/60">SKU: {product.sku}</p>
                  <p className="text-xs text-base-content/60">{product.color || 'Rang ko\'rsatilmagan'}</p>
                </div>
                <span className={clsx('badge badge-sm', product.lowStock ? 'badge-error' : 'badge-success')}>
                  {product.quantity}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/60">
                {product.blindType && <span className="pill">{BLIND_TYPES[product.blindType]?.label}</span>}
                {product.material && <span className="pill">{BLIND_MATERIALS[product.material]?.label}</span>}
                {product.brandName && <span className="pill">{product.brandName}</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">
                  {product.pricePerSquareMeter ? formatCurrency(product.pricePerSquareMeter) + '/m²' : formatCurrency(product.sellingPrice)}
                </span>
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost btn-sm min-h-[44px]" onClick={() => setSelectedProduct(product)}>
                    Tafsilotlar
                  </button>
                  <PermissionGate permission={PermissionCode.PRODUCTS_UPDATE}>
                    <button className="btn btn-ghost btn-sm min-h-[44px]" onClick={() => handleEditProduct(product)}>Tahrirlash</button>
                  </PermissionGate>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {/* Product Detail Modal */}
      <ModalPortal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <div className="w-full max-w-3xl bg-base-100 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                  <p className="text-sm text-base-content/60">SKU: {selectedProduct.sku}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedProduct(null)}>
                  <X className="h-4 w-4" />
                  Yopish
                </button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
                <div className="surface-soft flex h-48 items-center justify-center rounded-xl">
                  {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <Package className="h-12 w-12 text-base-content/40" />
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/60">
                    {selectedProduct.blindType && <span className="pill">{BLIND_TYPES[selectedProduct.blindType]?.label}</span>}
                    {selectedProduct.material && <span className="pill">{BLIND_MATERIALS[selectedProduct.material]?.label}</span>}
                    {selectedProduct.controlType && <span className="pill">{CONTROL_TYPES[selectedProduct.controlType]?.label}</span>}
                    {selectedProduct.brandName && <span className="pill">{selectedProduct.brandName}</span>}
                    {selectedProduct.color && <span className="pill">{selectedProduct.color}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="surface-soft rounded-lg p-3">
                      <p className="text-xs text-base-content/60">Narx/m²</p>
                      <p className="text-lg font-semibold text-primary">
                        {selectedProduct.pricePerSquareMeter ? formatCurrency(selectedProduct.pricePerSquareMeter) : '—'}
                      </p>
                    </div>
                    <div className="surface-soft rounded-lg p-3">
                      <p className="text-xs text-base-content/60">O'rnatish narxi</p>
                      <p className="text-lg font-semibold">
                        {selectedProduct.installationPrice ? formatCurrency(selectedProduct.installationPrice) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="surface-soft rounded-lg p-3">
                      <p className="text-xs text-base-content/60">Zaxira</p>
                      <div className="flex items-center gap-2">
                        <span className={clsx('badge badge-sm', selectedProduct.lowStock ? 'badge-error' : 'badge-success')}>
                          {selectedProduct.quantity}
                        </span>
                        {selectedProduct.lowStock ? (
                          <span className="flex items-center gap-1 text-xs text-error">
                            <AlertTriangle className="h-4 w-4" />
                            Kam zaxira
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <BadgeCheck className="h-4 w-4" />
                            Yetarli
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="surface-soft rounded-lg p-3">
                      <p className="text-xs text-base-content/60">O'lcham diapazoni</p>
                      <p className="font-medium">{selectedProduct.sizeRangeString || '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-base-content/70">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-base-content/40">Min kenglik</p>
                      <p className="font-medium">{selectedProduct.minWidth ? `${selectedProduct.minWidth} mm` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-base-content/40">Max kenglik</p>
                      <p className="font-medium">{selectedProduct.maxWidth ? `${selectedProduct.maxWidth} mm` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-base-content/40">Min balandlik</p>
                      <p className="font-medium">{selectedProduct.minHeight ? `${selectedProduct.minHeight} mm` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-base-content/40">Max balandlik</p>
                      <p className="font-medium">{selectedProduct.maxHeight ? `${selectedProduct.maxHeight} mm` : '—'}</p>
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <div className="surface-soft rounded-lg p-3 text-sm text-base-content/70">
                      {selectedProduct.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* New/Edit Product Modal */}
      <ModalPortal isOpen={showNewProductModal} onClose={handleCloseNewProductModal}>
        <div className="w-full max-w-3xl bg-base-100 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{editingProductId ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h3>
                <p className="text-sm text-base-content/60">Mahsulot ma'lumotlarini kiriting</p>
              </div>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={handleCloseNewProductModal}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Mahsulot turi kartalari */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  Mahsulot turini tanlang
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRODUCT_TYPE_CARDS.map((card) => {
                    const Icon = card.icon;
                    const isSelected = formData.productType === card.type;
                    return (
                      <button
                        key={card.type}
                        type="button"
                        onClick={() => handleFormChange('productType', card.type)}
                        className={clsx(
                          'group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200',
                          'hover:scale-[1.02] hover:shadow-lg',
                          isSelected
                            ? `${card.borderColor} bg-gradient-to-br ${card.gradient}`
                            : 'border-base-300 hover:border-base-content/30'
                        )}
                      >
                        <div className={clsx(
                          'p-3 rounded-full mb-2 transition-colors',
                          isSelected ? `bg-base-100 ${card.iconColor}` : 'bg-base-200 text-base-content/60'
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className={clsx(
                          'font-semibold text-sm',
                          isSelected ? 'text-base-content' : 'text-base-content/80'
                        )}>
                          {card.title}
                        </span>
                        <span className="text-xs text-base-content/50 text-center mt-1">
                          {card.description}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className={clsx('h-4 w-4', card.iconColor)} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Asosiy ma'lumotlar */}
              <div className="surface-soft rounded-xl p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  Asosiy ma'lumotlar
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <label className="form-control">
                    <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">SKU *</span>
                    <input type="text" className="input input-bordered w-full" value={formData.sku} onChange={(e) => handleFormChange('sku', e.target.value)} placeholder="JAL-001" />
                  </label>
                  <label className="form-control sm:col-span-2">
                    <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Nomi *</span>
                    <input type="text" className="input input-bordered w-full" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} placeholder="Roletka Premium Oq" />
                  </label>
                  <Select
                    label="Brend"
                    value={formData.brandId || ''}
                    onChange={(value) => handleFormChange('brandId', value ? Number(value) : undefined)}
                    placeholder="Tanlang..."
                    options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <Select
                    label="Kategoriya"
                    value={formData.categoryId || ''}
                    onChange={(value) => handleFormChange('categoryId', value ? Number(value) : undefined)}
                    placeholder="Tanlang..."
                    options={categories.map((category) => ({ value: category.id, label: category.name }))}
                  />
                  <Select
                    label="O'lchov birligi"
                    value={formData.unitType || 'PIECE'}
                    onChange={(value) => handleFormChange('unitType', value as UnitType || 'PIECE')}
                    options={Object.entries(UNIT_TYPES).map(([key, { label }]) => ({ value: key, label }))}
                  />
                  <label className="form-control sm:col-span-2">
                    <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Rang</span>
                    <input type="text" className="input input-bordered w-full" value={formData.color || ''} onChange={(e) => handleFormChange('color', e.target.value || undefined)} placeholder="Oq" />
                  </label>
                </div>
              </div>

              {/* Turga xos xususiyatlar - dinamik animatsiya bilan */}
              <div className="overflow-hidden">
                {/* FINISHED_PRODUCT seksiyasi */}
                <div className={clsx(
                  'transition-all duration-300 ease-in-out',
                  formData.productType === 'FINISHED_PRODUCT'
                    ? 'opacity-100 max-h-[600px]'
                    : 'opacity-0 max-h-0 overflow-hidden'
                )}>
                  {formData.productType === 'FINISHED_PRODUCT' && (
                    <div className="surface-soft rounded-xl p-4 space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                        Jalyuzi xususiyatlari
                      </p>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <Select
                          label="Jalyuzi turi"
                          value={formData.blindType || ''}
                          onChange={(value) => handleFormChange('blindType', value as BlindType || undefined)}
                          placeholder="Tanlang..."
                          options={Object.entries(BLIND_TYPES).map(([key, { label }]) => ({ value: key, label }))}
                        />
                        <Select
                          label="Material"
                          value={formData.material || ''}
                          onChange={(value) => handleFormChange('material', value as BlindMaterial || undefined)}
                          placeholder="Tanlang..."
                          options={Object.entries(BLIND_MATERIALS).map(([key, { label }]) => ({ value: key, label }))}
                        />
                        <Select
                          label="Boshqaruv"
                          value={formData.controlType || ''}
                          onChange={(value) => handleFormChange('controlType', value as ControlType || undefined)}
                          placeholder="Tanlang..."
                          options={Object.entries(CONTROL_TYPES).map(([key, { label }]) => ({ value: key, label }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <NumberInput label="Min kenglik (mm)" value={formData.minWidth ?? ''} onChange={(val) => handleFormChange('minWidth', val === '' ? undefined : Number(val))} placeholder="300" showButtons={false} min={100} />
                        <NumberInput label="Max kenglik (mm)" value={formData.maxWidth ?? ''} onChange={(val) => handleFormChange('maxWidth', val === '' ? undefined : Number(val))} placeholder="3000" showButtons={false} min={100} />
                        <NumberInput label="Min balandlik (mm)" value={formData.minHeight ?? ''} onChange={(val) => handleFormChange('minHeight', val === '' ? undefined : Number(val))} placeholder="300" showButtons={false} min={100} />
                        <NumberInput label="Max balandlik (mm)" value={formData.maxHeight ?? ''} onChange={(val) => handleFormChange('maxHeight', val === '' ? undefined : Number(val))} placeholder="3000" showButtons={false} min={100} />
                      </div>
                    </div>
                  )}
                </div>

                {/* RAW_MATERIAL seksiyasi */}
                <div className={clsx(
                  'transition-all duration-300 ease-in-out',
                  formData.productType === 'RAW_MATERIAL'
                    ? 'opacity-100 max-h-[400px]'
                    : 'opacity-0 max-h-0 overflow-hidden'
                )}>
                  {formData.productType === 'RAW_MATERIAL' && (
                    <div className="surface-soft rounded-xl p-4 space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                        Xomashyo xususiyatlari
                      </p>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <NumberInput label="Rulon kengligi (m)" value={formData.rollWidth ?? ''} onChange={(val) => handleFormChange('rollWidth', val === '' ? undefined : Number(val))} placeholder="1.5" showButtons={false} min={0} step={0.01} />
                        <NumberInput label="Rulon uzunligi (m)" value={formData.rollLength ?? ''} onChange={(val) => handleFormChange('rollLength', val === '' ? undefined : Number(val))} placeholder="50" showButtons={false} min={0} step={0.01} />
                        <NumberInput label="Profil uzunligi (m)" value={formData.profileLength ?? ''} onChange={(val) => handleFormChange('profileLength', val === '' ? undefined : Number(val))} placeholder="6" showButtons={false} min={0} step={0.01} />
                        <NumberInput label="Birlik og'irligi (kg)" value={formData.weightPerUnit ?? ''} onChange={(val) => handleFormChange('weightPerUnit', val === '' ? undefined : Number(val))} placeholder="0.5" showButtons={false} min={0} step={0.001} />
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCESSORY seksiyasi */}
                <div className={clsx(
                  'transition-all duration-300 ease-in-out',
                  formData.productType === 'ACCESSORY'
                    ? 'opacity-100 max-h-[300px]'
                    : 'opacity-0 max-h-0 overflow-hidden'
                )}>
                  {formData.productType === 'ACCESSORY' && (
                    <div className="surface-soft rounded-xl p-4 space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                        Aksessuar xususiyatlari
                      </p>
                      <label className="form-control">
                        <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Mos jalyuzi turlari</span>
                        <input type="text" className="input input-bordered w-full" value={formData.compatibleBlindTypes || ''} onChange={(e) => handleFormChange('compatibleBlindTypes', e.target.value || undefined)} placeholder="ROLLER, VERTICAL, HORIZONTAL" />
                        <span className="label-text-alt text-xs text-base-content/50 mt-1">Vergul bilan ajrating: ROLLER, VERTICAL, HORIZONTAL, ROMAN, CELLULAR, MOTORIZED</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Dinamik atributlar (ProductType schema'sidan) */}
              {selectedProductType?.attributeSchema?.attributes && selectedProductType.attributeSchema.attributes.length > 0 && (
                <div className="surface-soft rounded-xl p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                    Qo'shimcha xususiyatlar ({selectedProductType.name})
                  </p>
                  <DynamicProductForm
                    schema={selectedProductType.attributeSchema}
                    values={customAttributes}
                    onChange={setCustomAttributes}
                    disabled={saving}
                    showGroupHeaders={true}
                    columns={2}
                  />
                </div>
              )}

              {/* Narxlar va Zaxira */}
              <div className="surface-soft rounded-xl p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  Narxlar va Zaxira
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <CurrencyInput label="Kelish narxi" value={formData.purchasePrice ?? 0} onChange={(val) => handleFormChange('purchasePrice', val || undefined)} min={0} />
                  <CurrencyInput label="Sotish narxi *" value={formData.sellingPrice ?? 0} onChange={(val) => handleFormChange('sellingPrice', val)} min={0} />
                  {formData.productType === 'FINISHED_PRODUCT' && (
                    <>
                      <CurrencyInput label="Narx/m²" value={formData.pricePerSquareMeter ?? 0} onChange={(val) => handleFormChange('pricePerSquareMeter', val || undefined)} min={0} />
                      <CurrencyInput label="O'rnatish narxi" value={formData.installationPrice ?? 0} onChange={(val) => handleFormChange('installationPrice', val || undefined)} min={0} />
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Miqdor" value={formData.quantity ?? ''} onChange={(val) => handleFormChange('quantity', val === '' ? undefined : Number(val))} placeholder="0" min={0} step={formData.productType === 'RAW_MATERIAL' ? 0.001 : 1} />
                  <NumberInput label="Min zaxira" value={formData.minStockLevel ?? ''} onChange={(val) => handleFormChange('minStockLevel', val === '' ? undefined : Number(val))} placeholder="5" min={0} step={formData.productType === 'RAW_MATERIAL' ? 0.001 : 1} />
                </div>
              </div>

              {/* Qo'shimcha ma'lumotlar */}
              <div className="space-y-4">
                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Tavsif</span>
                  <textarea className="textarea textarea-bordered w-full" rows={2} value={formData.description || ''} onChange={(e) => handleFormChange('description', e.target.value || undefined)} placeholder="Mahsulot haqida qo'shimcha ma'lumot..." />
                </label>

                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Rasm URL</span>
                  <input type="text" className="input input-bordered w-full" value={formData.imageUrl || ''} onChange={(e) => handleFormChange('imageUrl', e.target.value || undefined)} placeholder="https://..." />
                </label>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-base-200">
              <button className="btn btn-ghost" onClick={handleCloseNewProductModal} disabled={saving}>
                Bekor qilish
              </button>
              <button
                className="btn btn-primary gap-2"
                onClick={handleSaveProduct}
                disabled={saving || !formData.sku.trim() || !formData.name.trim() || formData.sellingPrice <= 0}
              >
                {saving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
