import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useShopStore } from '../../store/shopStore';
import { shopOrderApi, type ShopOrderRequest } from '../../api/shop.api';
import { formatCurrency } from '../../config/constants';

export function ShopCheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, clearCart, getCartTotal, isAuthenticated, customer } = useShopStore();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: customer?.fullName || '',
    customerPhone: customer?.phone || '',
    deliveryAddress: customer?.address || '',
    withInstallation: true,
    installationNotes: '',
    paymentMethod: 'DEBT' as 'CASH' | 'CARD' | 'TRANSFER' | 'DEBT',
    notes: '',
  });

  const total = getCartTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Savat bo\'sh');
      return;
    }

    if (!form.deliveryAddress) {
      toast.error('Yetkazib berish manzilini kiriting');
      return;
    }

    if (!isAuthenticated && !form.customerPhone) {
      toast.error('Telefon raqamingizni kiriting');
      return;
    }

    setLoading(true);

    try {
      const orderRequest: ShopOrderRequest = {
        items: cart.map((item) => ({
          productId: item.product.id,
          width: item.width,
          height: item.height,
          quantity: item.quantity,
          notes: item.notes,
        })),
        customerName: isAuthenticated ? undefined : form.customerName,
        customerPhone: isAuthenticated ? undefined : form.customerPhone,
        deliveryAddress: form.deliveryAddress,
        withInstallation: form.withInstallation,
        installationNotes: form.installationNotes,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      };

      const order = await shopOrderApi.createOrder(orderRequest);
      clearCart();
      toast.success(t('shop.checkout.orderSuccess'));
      navigate(`/shop/orders/${order.id}`);
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl mb-4">{t('shop.cart.empty')}</p>
        <Link to="/shop/catalog" className="btn btn-primary">
          {t('shop.catalog')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{t('shop.checkout.title')}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info (if not authenticated) */}
          {!isAuthenticated && (
            <div className="card bg-base-200 p-6">
              <h3 className="font-bold text-lg mb-4">Kontakt ma'lumotlari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('shop.auth.fullName')}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder={t('shop.auth.fullNamePlaceholder')}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t('shop.auth.phone')} *</span>
                  </label>
                  <input
                    type="tel"
                    className="input input-bordered"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder={t('shop.auth.phonePlaceholder')}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delivery */}
          <div className="card bg-base-200 p-6">
            <h3 className="font-bold text-lg mb-4">{t('shop.checkout.deliveryAddress')}</h3>
            <div className="form-control">
              <textarea
                className="textarea textarea-bordered"
                rows={3}
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                placeholder={t('shop.checkout.addressPlaceholder')}
                required
              />
            </div>
          </div>

          {/* Installation */}
          <div className="card bg-base-200 p-6">
            <h3 className="font-bold text-lg mb-4">{t('shop.checkout.withInstallation')}</h3>
            <div className="form-control">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.withInstallation}
                  onChange={(e) => setForm({ ...form, withInstallation: e.target.checked })}
                />
                <span>O'rnatish xizmati kerak</span>
              </label>
            </div>
            {form.withInstallation && (
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">{t('shop.checkout.installationNotes')}</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  rows={2}
                  value={form.installationNotes}
                  onChange={(e) => setForm({ ...form, installationNotes: e.target.value })}
                  placeholder="Qo'shimcha ma'lumotlar..."
                />
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="card bg-base-200 p-6">
            <h3 className="font-bold text-lg mb-4">{t('shop.checkout.paymentMethod')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'DEBT', label: t('shop.checkout.payDebt') },
                { value: 'CASH', label: t('shop.checkout.payCash') },
                { value: 'CARD', label: t('shop.checkout.payCard') },
                { value: 'TRANSFER', label: t('shop.checkout.payTransfer') },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`btn ${form.paymentMethod === method.value ? 'btn-primary' : 'btn-outline'}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={form.paymentMethod === method.value}
                    onChange={(e) =>
                      setForm({ ...form, paymentMethod: e.target.value as typeof form.paymentMethod })
                    }
                    className="hidden"
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card bg-base-200 p-6">
            <h3 className="font-bold text-lg mb-4">{t('shop.checkout.notes')}</h3>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Qo'shimcha izohlar..."
            />
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="card bg-base-200 p-6 sticky top-24">
            <h3 className="font-bold text-lg mb-4">{t('shop.cart.title')}</h3>

            <div className="space-y-4 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-base-300 rounded flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.width} x {item.height} mm • {item.quantity} dona
                    </p>
                    <p className="font-bold text-sm">{formatCurrency(item.priceInfo.grandTotal)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider"></div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('shop.cart.subtotal')}:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>{t('shop.cart.total')}:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-6"
              disabled={loading}
            >
              {loading && <span className="loading loading-spinner loading-sm"></span>}
              {t('shop.checkout.placeOrder')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
