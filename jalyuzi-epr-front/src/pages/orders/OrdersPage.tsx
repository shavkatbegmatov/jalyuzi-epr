import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ClipboardList,
  Package,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders.api';
import { formatDateTime, formatCurrency } from '../../config/constants';
import { usePermission, PermissionCode } from '../../hooks/usePermission';
import type { Order, OrderStatus, OrderStatsResponse } from '../../types';

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

const ALL_STATUSES: OrderStatus[] = [
  'YANGI',
  'OLCHOV_KUTILMOQDA',
  'OLCHOV_BAJARILDI',
  'NARX_TASDIQLANDI',
  'ZAKLAD_QABUL_QILINDI',
  'ISHLAB_CHIQARISHDA',
  'TAYYOR',
  'ORNATISHGA_TAYINLANDI',
  'ORNATISH_JARAYONIDA',
  'ORNATISH_BAJARILDI',
  'TOLOV_KUTILMOQDA',
  'YAKUNLANDI',
  'QARZGA_OTKAZILDI',
  'BEKOR_QILINDI',
];

export function OrdersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStatsResponse | null>(null);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      const data = await ordersApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load order stats:', error);
    }
  }, []);

  const loadOrders = useCallback(
    async (isInitial = false) => {
      if (!isInitial) {
        setRefreshing(true);
      }
      try {
        const data = await ordersApi.getAll({
          status: statusFilter || undefined,
          search: search.trim() || undefined,
          page,
          size: pageSize,
          sort: 'createdAt,desc',
        });
        setOrders(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (error) {
        console.error('Failed to load orders:', error);
        toast.error('Buyurtmalarni yuklashda xatolik');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, search, page, pageSize]
  );

  // Initial load
  useEffect(() => {
    void loadOrders(true);
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when filters/pagination change
  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, page, pageSize]);

  const handleStatusFilterChange = (status: OrderStatus | '') => {
    setStatusFilter(status);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const getStatusBadge = (status: OrderStatus) => (
    <span className={`badge badge-sm ${ORDER_STATUS_COLORS[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">Buyurtmalar</h1>
          <p className="section-subtitle">Buyurtmalar boshqaruvi</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill">{totalElements} ta buyurtma</span>
          {hasPermission(PermissionCode.SALES_CREATE) && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/orders/new')}
            >
              <Plus className="h-5 w-5" />
              Yangi buyurtma
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="surface-card flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Jami
              </p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
          </div>

          <div className="surface-card flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15">
              <Package className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Faol
              </p>
              <p className="text-2xl font-bold">{stats.activeOrders}</p>
            </div>
          </div>

          <div className="surface-card flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Yakunlangan
              </p>
              <p className="text-2xl font-bold">{stats.completedOrders}</p>
            </div>
          </div>

          <div className="surface-card flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error/15">
              <XCircle className="h-6 w-6 text-error" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Bekor qilingan
              </p>
              <p className="text-2xl font-bold">{stats.cancelledOrders}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="surface-card p-4">
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <button
            className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => handleStatusFilterChange('')}
          >
            Barchasi
          </button>
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              className={`btn btn-sm whitespace-nowrap ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleStatusFilterChange(status)}
            >
              {ORDER_STATUS_LABELS[status]}
              {stats?.statusCounts?.[status] != null && (
                <span className="badge badge-sm badge-neutral ml-1">
                  {stats.statusCounts[status]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="surface-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            className="input input-bordered w-full pl-10"
            placeholder="Buyurtma raqami yoki mijoz nomi bo'yicha qidirish..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="relative">
        {refreshing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-base-100/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <span className="text-sm font-medium text-base-content/70">
                Yangilanmoqda...
              </span>
            </div>
          </div>
        )}

        <div className="surface-card overflow-x-auto">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-base-content/50">
              <ClipboardList className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">Buyurtmalar topilmadi</p>
              <p className="text-sm mt-1">
                Filtrlarni o'zgartiring yoki yangi buyurtma yarating
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <table className="table hidden lg:table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Buyurtma</th>
                    <th>Mijoz</th>
                    <th>Holat</th>
                    <th className="text-right">Jami summa</th>
                    <th className="text-right">To'langan</th>
                    <th className="text-right">Qoldiq</th>
                    <th>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr
                      key={order.id}
                      className="cursor-pointer hover:bg-base-200/50 transition-colors"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="text-base-content/60">
                        {page * pageSize + index + 1}
                      </td>
                      <td>
                        <span className="font-mono text-sm font-medium">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-base-content/60">
                            {order.customerPhone}
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td className="text-right font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="text-right text-success">
                        {formatCurrency(order.paidAmount)}
                      </td>
                      <td className="text-right">
                        <span
                          className={
                            order.remainingAmount > 0 ? 'text-error' : ''
                          }
                        >
                          {formatCurrency(order.remainingAmount)}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/70">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 p-4 lg:hidden">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="surface-panel cursor-pointer rounded-xl p-4 transition-colors hover:bg-base-200/50"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-sm font-medium">
                          {order.orderNumber}
                        </span>
                        <div className="mt-1 text-sm font-medium">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-base-content/60">
                          {order.customerPhone}
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-base-200 pt-3">
                      <div>
                        <div className="font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        {order.remainingAmount > 0 && (
                          <div className="text-xs text-error">
                            Qoldiq: {formatCurrency(order.remainingAmount)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {formatDateTime(order.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <span>Sahifada:</span>
              <select
                className="select select-bordered select-sm"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>
                Jami: {totalElements} ta buyurtma
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-sm btn-ghost"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Oldingi
              </button>
              <span className="text-sm text-base-content/70">
                {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-sm btn-ghost"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Keyingi
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
