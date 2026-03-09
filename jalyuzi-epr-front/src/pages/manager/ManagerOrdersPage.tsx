import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Phone, MapPin, RefreshCw, ClipboardList, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders.api';
import { formatCurrency, formatDate } from '../../config/constants';
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

const STATUS_GROUPS: Record<string, OrderStatus[]> = {
  all: [],
  new: ['YANGI'],
  measurement: ['OLCHOV_KUTILMOQDA', 'OLCHOV_BAJARILDI', 'NARX_TASDIQLANDI'],
  production: ['ZAKLAD_QABUL_QILINDI', 'ISHLAB_CHIQARISHDA', 'TAYYOR'],
  installation: ['ORNATISHGA_TAYINLANDI', 'ORNATISH_JARAYONIDA', 'ORNATISH_BAJARILDI', 'TOLOV_KUTILMOQDA'],
  completed: ['YAKUNLANDI', 'QARZGA_OTKAZILDI'],
  cancelled: ['BEKOR_QILINDI'],
};

const GROUP_LABELS: Record<string, string> = {
  all: 'Barchasi',
  new: 'Yangi',
  measurement: "O'lchov",
  production: 'Ishlab chiqarish',
  installation: "O'rnatish",
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
};

export function ManagerOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalElements, setTotalElements] = useState(0);

  const activeGroup = searchParams.get('group') || 'all';

  const loadOrders = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    try {
      const statuses = STATUS_GROUPS[activeGroup] || [];
      // Backend faqat bitta status qabul qiladi — bir nechta bo'lsa frontendda filter qilamiz
      const data = await ordersApi.getAll({
        status: statuses.length === 1 ? statuses[0] : undefined,
        search: searchQuery || undefined,
        size: 100,
        sort: 'createdAt,desc',
      });
      let filtered = data.content;
      if (statuses.length > 1) {
        const statusSet = new Set(statuses);
        filtered = data.content.filter((o) => statusSet.has(o.status));
      }
      setOrders(filtered);
      setTotalElements(statuses.length > 1 ? filtered.length : data.totalElements);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Buyurtmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeGroup, searchQuery]);

  useEffect(() => {
    void loadOrders(true);
  }, [loadOrders]);

  const setGroup = (group: string) => {
    if (group === 'all') {
      searchParams.delete('group');
    } else {
      searchParams.set('group', group);
    }
    setSearchParams(searchParams, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-warning"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Buyurtmalar</h2>
        <button
          className={`btn btn-ghost btn-sm btn-circle ${refreshing ? 'animate-spin' : ''}`}
          onClick={() => void loadOrders()}
          disabled={refreshing}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
        <input
          type="text"
          placeholder="Buyurtma raqami yoki mijoz..."
          className="input input-bordered input-sm w-full pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void loadOrders();
          }}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {Object.entries(GROUP_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`btn btn-xs whitespace-nowrap ${
              activeGroup === key ? 'btn-warning' : 'btn-ghost'
            }`}
            onClick={() => setGroup(key)}
          >
            <Filter className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-xs text-base-content/50">
        {totalElements} ta buyurtma topildi
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-base-content/50">
          <ClipboardList className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">Buyurtmalar yo'q</p>
          <p className="text-sm mt-1">Ushbu filterda buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="card bg-base-100 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/manager/orders/${order.id}`)}
            >
              <div className="card-body p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-sm font-bold text-warning">
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

                {/* Bottom row */}
                <div className="mt-3 pt-3 border-t border-base-200 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <div className="flex items-center gap-3">
                    {order.remainingAmount > 0 && (
                      <span className="text-xs text-error">
                        Qoldiq: {formatCurrency(order.remainingAmount)}
                      </span>
                    )}
                    <span className="text-xs text-base-content/40">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
