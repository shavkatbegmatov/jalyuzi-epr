import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Phone,
  MapPin,
  RefreshCw,
  ClipboardList,
  X,
  ChevronRight,
  Clock,
  Ruler,
  Factory,
  Wrench,
  CheckCircle2,
  Ban,
  LayoutGrid,
  Plus,
} from 'lucide-react';
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

const FILTER_CHIPS: {
  key: string;
  label: string;
  icon: typeof Clock;
  activeClasses: string;
}[] = [
  { key: 'all', label: 'Barchasi', icon: LayoutGrid, activeClasses: 'bg-warning text-warning-content shadow-warning/25' },
  { key: 'new', label: 'Yangi', icon: Clock, activeClasses: 'bg-info text-info-content shadow-info/25' },
  { key: 'measurement', label: "O'lchov", icon: Ruler, activeClasses: 'bg-warning text-warning-content shadow-warning/25' },
  { key: 'production', label: 'Ishlab chiq.', icon: Factory, activeClasses: 'bg-accent text-accent-content shadow-accent/25' },
  { key: 'installation', label: "O'rnatish", icon: Wrench, activeClasses: 'bg-primary text-primary-content shadow-primary/25' },
  { key: 'completed', label: 'Yakunlangan', icon: CheckCircle2, activeClasses: 'bg-success text-success-content shadow-success/25' },
  { key: 'cancelled', label: 'Bekor', icon: Ban, activeClasses: 'bg-error text-error-content shadow-error/25' },
];

export function ManagerOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [showScrollFadeLeft, setShowScrollFadeLeft] = useState(false);
  const [showScrollFadeRight, setShowScrollFadeRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);

  const activeGroup = searchParams.get('group') || 'all';

  const getGroupCount = useCallback((key: string) => {
    if (key === 'all') {
      return Object.values(statusCounts).reduce((sum, c) => sum + c, 0);
    }
    const statuses = STATUS_GROUPS[key] || [];
    return statuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0);
  }, [statusCounts]);

  const loadOrders = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    try {
      const statuses = STATUS_GROUPS[activeGroup] || [];
      const [data, stats] = await Promise.all([
        ordersApi.getAll({
          status: statuses.length === 1 ? statuses[0] : undefined,
          search: searchQuery || undefined,
          size: 100,
          sort: 'createdAt,desc',
        }),
        isInitial ? ordersApi.getStats().catch(() => null) : Promise.resolve(null),
      ]);

      let filtered = data.content;
      if (statuses.length > 1) {
        const statusSet = new Set(statuses);
        filtered = data.content.filter((o) => statusSet.has(o.status));
      }
      setOrders(filtered);
      setTotalElements(statuses.length > 1 ? filtered.length : data.totalElements);

      if (stats) {
        setStatusCounts(stats.statusCounts || {});
      }
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

  // Scroll active chip into view on mount
  useEffect(() => {
    if (activeChipRef.current) {
      activeChipRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeGroup]);

  // Track scroll position for fade effects
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollFadeLeft(el.scrollLeft > 8);
    setShowScrollFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const setGroup = (group: string) => {
    if (group === 'all') {
      searchParams.delete('group');
    } else {
      searchParams.set('group', group);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setTimeout(() => void loadOrders(), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-warning"></span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Buyurtmalar</h2>
          <p className="text-xs text-base-content/50 mt-0.5">
            {totalElements} ta buyurtma
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-warning btn-sm"
            onClick={() => navigate('/manager/orders/new')}
          >
            <Plus className="h-4 w-4" />
            Yangi
          </button>
          <button
            className={`btn btn-ghost btn-sm btn-circle ${refreshing ? 'animate-spin' : ''}`}
            onClick={() => void loadOrders()}
            disabled={refreshing}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
        <input
          type="text"
          placeholder="Buyurtma raqami yoki mijoz..."
          className="input input-bordered w-full pl-9 pr-9 h-11 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void loadOrders();
          }}
        />
        {searchQuery && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
            onClick={clearSearch}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="relative -mx-4">
        {/* Left fade */}
        {showScrollFadeLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-base-200 to-transparent z-10 pointer-events-none" />
        )}
        {/* Right fade */}
        {showScrollFadeRight && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-base-200 to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-4 py-1 scrollbar-none"
        >
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeGroup === chip.key;
            const count = getGroupCount(chip.key);
            const Icon = chip.icon;
            return (
              <button
                key={chip.key}
                ref={isActive ? activeChipRef : undefined}
                className={`
                  flex items-center gap-1.5 whitespace-nowrap rounded-full
                  px-3.5 min-h-[40px] text-sm font-medium
                  transition-all duration-200 select-none shrink-0
                  ${isActive
                    ? `${chip.activeClasses} shadow-md`
                    : 'bg-base-100 text-base-content/70 shadow-sm hover:shadow active:scale-95'
                  }
                `}
                onClick={() => setGroup(chip.key)}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{chip.label}</span>
                {count > 0 && (
                  <span
                    className={`
                      min-w-[20px] h-5 flex items-center justify-center
                      rounded-full text-xs font-bold px-1.5
                      ${isActive
                        ? 'bg-white/25'
                        : 'bg-base-200 text-base-content/60'
                      }
                    `}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-base-content/50">
          <ClipboardList className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">Buyurtmalar yo'q</p>
          <p className="text-sm mt-1">Ushbu filterda buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="card bg-base-100 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/manager/orders/${order.id}`)}
            >
              <div className="card-body p-3.5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-warning">
                        {order.orderNumber}
                      </span>
                      <span className={`badge badge-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="text-sm font-medium mt-1 truncate">{order.customerName}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-base-content/30 shrink-0 mt-1" />
                </div>

                {/* Contact info */}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-base-content/60">
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex items-center gap-1 link link-hover"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    {order.customerPhone}
                  </a>
                  {order.installationAddress && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{order.installationAddress}</span>
                    </span>
                  )}
                </div>

                {/* Bottom row */}
                <div className="mt-2.5 pt-2.5 border-t border-base-200 flex items-center justify-between">
                  <span className="text-sm font-bold">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <div className="flex items-center gap-2.5">
                    {order.remainingAmount > 0 && (
                      <span className="text-xs font-medium text-error">
                        -{formatCurrency(order.remainingAmount)}
                      </span>
                    )}
                    <span className="text-[11px] text-base-content/40">
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
