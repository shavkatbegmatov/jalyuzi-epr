import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  Trash2,
  Check,
  User,
  MapPin,
  Package,
  CheckCircle,
} from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { customersApi } from '../../api/customers.api';
import { productsApi } from '../../api/products.api';
import { formatCurrency } from '../../config/constants';
import type {
  OrderCreateRequest,
  OrderCreateItemRequest,
  Customer,
  Product,
} from '../../types';

// ───────── Types ─────────

interface OrderItem {
  productId: number;
  product: Product;
  roomName: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  quantity: number;
  customPrice: number;
  discount: number;
  installationIncluded: boolean;
}

const STEPS = [
  { label: 'Mijoz tanlash', icon: User },
  { label: 'Manzil', icon: MapPin },
  { label: 'Mahsulotlar', icon: Package },
  { label: 'Tasdiqlash', icon: CheckCircle },
] as const;

// ───────── Helpers ─────────

function calcItemPrice(item: OrderItem) {
  const { product, widthMm, heightMm, quantity, discount, installationIncluded } = item;

  let unitPrice: number;
  let sqm: number | undefined;

  if (widthMm && heightMm && product.pricePerSquareMeter) {
    sqm = (widthMm * heightMm) / 1_000_000;
    unitPrice = product.pricePerSquareMeter * sqm;
  } else {
    unitPrice = product.sellingPrice;
  }

  const materialPrice = unitPrice * quantity;
  const installationPrice =
    installationIncluded && product.installationPrice
      ? product.installationPrice * quantity
      : 0;
  const itemTotal = materialPrice + installationPrice - (discount || 0);

  return { unitPrice, sqm, materialPrice, installationPrice, itemTotal };
}

// ───────── Component ─────────

export function CreateOrderPage() {
  const navigate = useNavigate();

  // Wizard step
  const [step, setStep] = useState(0);

  // Step 1: Customer
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Step 2: Address
  const [address, setAddress] = useState('');

  // Step 3: Products
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);

  // Step 4 / Global
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // ───── Customer search ─────

  const searchCustomers = useCallback(async (search: string) => {
    if (!search.trim()) {
      setCustomers([]);
      return;
    }
    setCustomerLoading(true);
    try {
      const data = await customersApi.getAll({ search, page: 0, size: 10 });
      setCustomers(data.content);
    } catch {
      toast.error('Mijozlarni yuklashda xatolik');
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void searchCustomers(customerSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [customerSearch, searchCustomers]);

  // ───── Product search ─────

  const searchProducts = useCallback(async (search: string) => {
    if (!search.trim()) {
      setProducts([]);
      return;
    }
    setProductLoading(true);
    try {
      const data = await productsApi.getAll({ search, page: 0, size: 10 });
      setProducts(data.content);
    } catch {
      toast.error('Mahsulotlarni yuklashda xatolik');
    } finally {
      setProductLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void searchProducts(productSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [productSearch, searchProducts]);

  // ───── Customer select ─────

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setAddress(customer.installationAddress || customer.address || '');
    setCustomerSearch('');
    setCustomers([]);
  };

  // ───── Product add ─────

  const handleAddProduct = (product: Product) => {
    // Prevent duplicate
    if (items.some((i) => i.productId === product.id)) {
      toast.error('Bu mahsulot allaqachon qo\'shilgan');
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        product,
        roomName: '',
        widthMm: 0,
        heightMm: 0,
        depthMm: 0,
        quantity: 1,
        customPrice: 0,
        discount: 0,
        installationIncluded: false,
      },
    ]);
    setProductSearch('');
    setProducts([]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<OrderItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  // ───── Totals ─────

  const grandTotal = items.reduce((sum, item) => sum + calcItemPrice(item).itemTotal, 0);
  const afterDiscount =
    grandTotal -
    (discountAmount || 0) -
    (discountPercent ? (grandTotal * discountPercent) / 100 : 0);

  // ───── Validation ─────

  const canGoNext = (): boolean => {
    switch (step) {
      case 0:
        return selectedCustomer !== null;
      case 1:
        return true; // address is optional
      case 2:
        return items.length > 0;
      case 3:
        return items.length > 0 && selectedCustomer !== null;
      default:
        return false;
    }
  };

  // ───── Submit ─────

  const handleSubmit = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    try {
      const orderItems: OrderCreateItemRequest[] = items.map((item) => ({
        productId: item.productId,
        roomName: item.roomName || undefined,
        widthMm: item.widthMm || undefined,
        heightMm: item.heightMm || undefined,
        depthMm: item.depthMm || undefined,
        quantity: item.quantity || 1,
        customPrice: item.customPrice || undefined,
        discount: item.discount || undefined,
        installationIncluded: item.installationIncluded,
      }));

      const request: OrderCreateRequest = {
        customerId: selectedCustomer.id,
        installationAddress: address || undefined,
        notes: notes || undefined,
        discountAmount: discountAmount || undefined,
        discountPercent: discountPercent || undefined,
        items: orderItems,
      };

      const order = await ordersApi.create(request);
      toast.success('Buyurtma muvaffaqiyatli yaratildi!');
      navigate(`/orders/${order.id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Buyurtma yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // ───────── Render ─────────

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm btn-circle"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Yangi buyurtma</h1>
          <p className="text-sm text-base-content/60">
            Buyurtma yaratish uchun qadamlarni bajaring
          </p>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isCompleted = i < step;

          return (
            <div key={i} className="flex items-center">
              {i > 0 && (
                <div
                  className={`h-0.5 w-8 sm:w-16 transition-colors ${
                    isCompleted ? 'bg-primary' : 'bg-base-300'
                  }`}
                />
              )}
              <button
                onClick={() => {
                  // Allow clicking on completed or current steps
                  if (i <= step) setStep(i);
                }}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  i <= step ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary text-primary-content'
                      : isCompleted
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-base-300 bg-base-200 text-base-content/40'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    isActive
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-primary/70'
                      : 'text-base-content/40'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="surface-card overflow-hidden">
        {/* ─── Step 0: Customer Selection ─── */}
        {step === 0 && (
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Mijoz tanlash</h2>

            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-xl bg-primary/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-content">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedCustomer.fullName}</p>
                    <p className="text-sm text-base-content/60">
                      {selectedCustomer.phone}
                    </p>
                    {selectedCustomer.address && (
                      <p className="text-sm text-base-content/50">
                        {selectedCustomer.address}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setAddress('');
                  }}
                >
                  O'zgartirish
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-base-content/40" />
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="Ism yoki telefon raqam bo'yicha qidirish..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                {customerLoading && (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-md" />
                  </div>
                )}

                {!customerLoading && customers.length > 0 && (
                  <div className="divide-y divide-base-200 rounded-xl border border-base-200">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-base-200"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <span className="text-sm font-semibold">
                            {customer.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{customer.fullName}</p>
                          <p className="text-sm text-base-content/60">
                            {customer.phone}
                            {customer.companyName && ` \u00B7 ${customer.companyName}`}
                          </p>
                        </div>
                        {customer.hasDebt && (
                          <span className="badge badge-error badge-sm">Qarz</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {!customerLoading &&
                  customerSearch.trim() &&
                  customers.length === 0 && (
                    <div className="rounded-xl border border-base-200 p-6 text-center text-base-content/50">
                      <User className="mx-auto mb-2 h-8 w-8" />
                      <p>Mijoz topilmadi</p>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* ─── Step 1: Address ─── */}
        {step === 1 && (
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold">O'rnatish manzili</h2>

            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Manzil
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="O'rnatish manzilini kiriting..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoFocus
              />
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  Mijoz manzilidan avtomatik to'ldirildi (o'zgartirish mumkin)
                </span>
              </label>
            </div>

            {selectedCustomer?.address && address !== selectedCustomer.address && (
              <button
                className="btn btn-ghost btn-sm mt-2"
                onClick={() =>
                  setAddress(
                    selectedCustomer.installationAddress ||
                      selectedCustomer.address ||
                      ''
                  )
                }
              >
                Mijoz manzilini tiklash
              </button>
            )}
          </div>
        )}

        {/* ─── Step 2: Products ─── */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Mahsulotlar</h2>

            {/* Product Search */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="Mahsulot nomi yoki SKU bo'yicha qidirish..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              {productLoading && (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-md" />
                </div>
              )}

              {!productLoading && products.length > 0 && (
                <div className="divide-y divide-base-200 rounded-xl border border-base-200">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-base-200"
                      onClick={() => handleAddProduct(product)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-base-content/60">
                          {product.sku}
                          {product.pricePerSquareMeter
                            ? ` \u00B7 ${formatCurrency(product.pricePerSquareMeter)}/m\u00B2`
                            : ` \u00B7 ${formatCurrency(product.sellingPrice)}`}
                        </p>
                      </div>
                      <Plus className="h-5 w-5 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Added Items */}
            {items.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    Tanlangan mahsulotlar ({items.length})
                  </h3>
                </div>

                {items.map((item, index) => (
                  <div
                    key={item.productId}
                    className="surface-soft space-y-3 rounded-xl p-4"
                  >
                    {/* Item header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-base-content/60">
                          {item.product.sku}
                        </p>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm btn-circle text-error"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Item fields */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs">Xona nomi</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered input-sm"
                          placeholder="masalan, Yotoqxona"
                          value={item.roomName}
                          onChange={(e) =>
                            updateItem(index, { roomName: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs">Eni (mm)</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm"
                          placeholder="0"
                          min={0}
                          value={item.widthMm || ''}
                          onChange={(e) =>
                            updateItem(index, {
                              widthMm: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs">
                            Bo'yi (mm)
                          </span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm"
                          placeholder="0"
                          min={0}
                          value={item.heightMm || ''}
                          onChange={(e) =>
                            updateItem(index, {
                              heightMm: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs">Soni</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-sm"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, {
                              quantity: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Installation checkbox */}
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={item.installationIncluded}
                        onChange={(e) =>
                          updateItem(index, {
                            installationIncluded: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm">
                        O'rnatish xizmati
                        {item.product.installationPrice
                          ? ` (${formatCurrency(item.product.installationPrice)}/dona)`
                          : ''}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {items.length === 0 && (
              <div className="rounded-xl border border-dashed border-base-300 p-8 text-center text-base-content/50">
                <Package className="mx-auto mb-2 h-10 w-10" />
                <p>Hali mahsulot qo'shilmagan</p>
                <p className="text-sm">
                  Yuqoridagi qidiruv orqali mahsulot qo'shing
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 3: Review & Confirm ─── */}
        {step === 3 && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Buyurtmani tasdiqlash</h2>

            {/* Customer info */}
            {selectedCustomer && (
              <div className="surface-soft rounded-xl p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-base-content/70">
                  <User className="h-4 w-4" />
                  Mijoz
                </h3>
                <p className="font-medium">{selectedCustomer.fullName}</p>
                <p className="text-sm text-base-content/60">
                  {selectedCustomer.phone}
                </p>
              </div>
            )}

            {/* Address */}
            {address && (
              <div className="surface-soft rounded-xl p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-base-content/70">
                  <MapPin className="h-4 w-4" />
                  Manzil
                </h3>
                <p>{address}</p>
              </div>
            )}

            {/* Items table */}
            <div className="surface-soft rounded-xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-base-content/70">
                <Package className="h-4 w-4" />
                Mahsulotlar ({items.length})
              </h3>

              <div className="space-y-3">
                {items.map((item) => {
                  const calc = calcItemPrice(item);
                  return (
                    <div
                      key={item.productId}
                      className="flex flex-col gap-1 rounded-lg bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-base-content/60">
                          {item.roomName && `${item.roomName} \u00B7 `}
                          {item.widthMm && item.heightMm
                            ? `${item.widthMm}\u00D7${item.heightMm} mm`
                            : ''}
                          {calc.sqm
                            ? ` (${calc.sqm.toFixed(2)} m\u00B2)`
                            : ''}
                          {' \u00B7 '}
                          {item.quantity} dona
                          {item.installationIncluded && ' \u00B7 O\'rnatish'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(calc.itemTotal)}
                        </p>
                        {calc.installationPrice > 0 && (
                          <p className="text-xs text-base-content/50">
                            Material: {formatCurrency(calc.materialPrice)} +
                            O'rnatish: {formatCurrency(calc.installationPrice)}
                          </p>
                        )}
                        {item.discount > 0 && (
                          <p className="text-xs text-success">
                            Chegirma: -{formatCurrency(item.discount)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discount & Notes */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">
                    Chegirma (so'm)
                  </span>
                </label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  min={0}
                  value={discountAmount || ''}
                  onChange={(e) =>
                    setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">Chegirma (%)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  min={0}
                  max={100}
                  value={discountPercent || ''}
                  onChange={(e) =>
                    setDiscountPercent(
                      Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                    )
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm">Izoh</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                rows={2}
                placeholder="Qo'shimcha izoh..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Totals */}
            <div className="surface-soft rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Jami:</span>
                <span className="font-medium">{formatCurrency(grandTotal)}</span>
              </div>
              {(discountAmount > 0 || discountPercent > 0) && (
                <div className="flex justify-between text-sm text-success">
                  <span>Chegirma:</span>
                  <span>-{formatCurrency(grandTotal - afterDiscount)}</span>
                </div>
              )}
              <div className="divider my-1" />
              <div className="flex justify-between text-lg font-bold">
                <span>Yakuniy summa:</span>
                <span className="text-primary">
                  {formatCurrency(Math.max(0, afterDiscount))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (step === 0) {
              navigate(-1);
            } else {
              setStep(step - 1);
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 0 ? 'Orqaga' : 'Oldingi qadam'}
        </button>

        {step < 3 ? (
          <button
            className="btn btn-primary"
            disabled={!canGoNext()}
            onClick={() => setStep(step + 1)}
          >
            Keyingi qadam
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={loading || !canGoNext()}
            onClick={handleSubmit}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Buyurtma yaratish
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
