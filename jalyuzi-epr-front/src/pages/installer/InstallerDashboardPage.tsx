import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Phone, MapPin, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders.api';
import { formatCurrency } from '../../config/constants';
import type { Order, OrderStatus } from '../../types';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  YANGI: 'Yangi',
  OLCHOV_KUTILMOQDA: "O'lchov kutilmoqda",
  OLCHOV_BAJARILDI: "O'lchov bajarildi",
  NARX_TASDIQLANDI: 'Narx tasdiqlandi',
  ZAKLAD_QABUL_QILINDI: 'Zaklad qabul qilindi',
  ISHLAB_CHIQARISHDA: 'Ishlab chiqarishda',
  TAYYOR: 'Tayyor',
  ORNATISHGA_TAYINLANDI: "O'rnatishga tayinlandi",
  ORNATISH_JARAYONIDA: "O'rnatish jarayonida",
  ORNATISH_BAJARILDI: "O'rnatish bajarildi",
  TOLOV_KUTILMOQDA: "To'lov kutilmoqda",
  YAKUNLANDI: 'Yakunlandi',
  QARZGA_OTKAZILDI: "Qarzga o'tkazildi",
  BEKOR_QILINDI: 'Bekor qilindi',
};

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  YANGI: 'badge-info',
  OLCHOV_KUTILMOQDA: 'badge-warning',
  OLCHOV_BAJARILDI: 'badge-accent',
  NARX_TASDIQLANDI: 'badge-primary',
  ZAKLAD_QABUL_QILINDI: 'badge-success',
  ISHLAB_CHIQARISHDA: 'badge-warning',
  TAYYOR: 'badge-accent',
  ORNATISHGA_TAYINLANDI: 'badge-info',
  ORNATISH_JARAYONIDA: 'badge-warning',
  ORNATISH_BAJARILDI: 'badge-success',
  TOLOV_KUTILMOQDA: 'badge-warning',
  YAKUNLANDI: 'badge-success',
  QARZGA_OTKAZILDI: 'badge-error',
  BEKOR_QILINDI: 'badge-ghost',
};

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function InstallerDashboardPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    try {
      const data = await ordersApi.getInstallerOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load installer orders:', error);
      toast.error('Buyurtmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders(true);
  }, [loadOrders]);

  const todayOrders = orders.filter((o) => isToday(o.installationDate));
  const upcomingOrders = orders.filter((o) => !isToday(o.installationDate));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const renderOrderCard = (order: Order) => (
    <div
      key={order.id}
      className="card bg-base-100 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/installer/${order.id}`)}
    >
      <div className="card-body p-4">
        {/* Top row: order number + status */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-sm font-bold text-primary">
              {order.orderNumber}
            </span>
            <div className="text-sm font-medium mt-0.5">{order.customerName}</div>
          </div>
          <span className={`badge badge-sm ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Contact info */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-sm text-base-content/70">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <a
              href={`tel:${order.customerPhone}`}
              className="link link-hover"
              onClick={(e) => e.stopPropagation()}
            >
              {order.customerPhone}
            </a>
          </div>
          {order.installationAddress && (
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{order.installationAddress}</span>
            </div>
          )}
        </div>

        {/* Bottom row: amount */}
        <div className="mt-3 pt-3 border-t border-base-200 flex items-center justify-between">
          <span className="text-sm font-semibold">
            {formatCurrency(order.totalAmount)}
          </span>
          {order.remainingAmount > 0 && (
            <span className="text-xs text-error">
              Qoldiq: {formatCurrency(order.remainingAmount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Mening buyurtmalarim</h2>
        <button
          className={`btn btn-ghost btn-sm btn-circle ${refreshing ? 'animate-spin' : ''}`}
          onClick={() => void loadOrders()}
          disabled={refreshing}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-base-content/50">
          <ClipboardList className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">Buyurtmalar yo'q</p>
          <p className="text-sm mt-1">Hozircha sizga tayinlangan buyurtmalar mavjud emas</p>
        </div>
      ) : (
        <>
          {/* Today's orders */}
          {todayOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-3">
                Bugungi ({todayOrders.length})
              </h3>
              <div className="space-y-3">
                {todayOrders.map(renderOrderCard)}
              </div>
            </div>
          )}

          {/* Upcoming orders */}
          {upcomingOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-3">
                Kelgusi ({upcomingOrders.length})
              </h3>
              <div className="space-y-3">
                {upcomingOrders.map(renderOrderCard)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
