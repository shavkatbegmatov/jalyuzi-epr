import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ClipboardList,
  Package,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders.api';
import {
  formatDateTime,
  formatCurrency,
  getOrderStatusLabel,
  getOrderStatusColor,
  ORDER_STATUS_LIST,
} from '../../config/constants';
import { usePermission, PermissionCode } from '../../hooks/usePermission';
import {
  FilterChipBar,
  type FilterChip,
  MetricCard,
  ListItemCard,
  EmptyState,
} from '../../components/mobile';
import { Pagination } from '../../components/ui/Pagination';
import type { Order, OrderStatus, OrderStatsResponse } from '../../types';

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
    <span className={`badge badge-sm ${getOrderStatusColor(status)}`}>
      {getOrderStatusLabel(status)}
    </span>
  );

  // Status filter chiplari
  const statusChips: FilterChip[] = useMemo(
    () => [
      { key: '', label: 'Barchasi', count: stats?.totalOrders },
      ...ORDER_STATUS_LIST.map((status) => ({
        key: status,
        label: getOrderStatusLabel(status),
        count: stats?.statusCounts?.[status],
      })),
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Buyurtmalar</h1>
          <p className="section-subtitle hidden sm:block">Buyurtmalar boshqaruvi</p>
          <p className="text-sm text-base-content/55 sm:hidden">{totalElements} ta buyurtma</p>
        </div>
        {hasPermission(PermissionCode.SALES_CREATE) && (
          <button className="btn btn-primary btn-sm lg:btn-md" onClick={() => navigate('/orders/new')}>
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Yangi buyurtma</span>
            <span className="sm:hidden">Yangi</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <MetricCard title="Jami" value={stats.totalOrders} icon={ClipboardList} color="primary" />
          <MetricCard title="Faol" value={stats.activeOrders} icon={Package} color="warning" />
          <MetricCard title="Yakunlangan" value={stats.completedOrders} icon={CheckCircle} color="success" />
          <MetricCard title="Bekor qilingan" value={stats.cancelledOrders} icon={XCircle} color="error" />
        </div>
      )}

      {/* Status Filter */}
      <FilterChipBar
        chips={statusChips}
        value={statusFilter}
        onChange={(key) => handleStatusFilterChange(key as OrderStatus | '')}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/45" />
        <input
          type="text"
          className="input input-bordered h-12 w-full pl-10 lg:max-w-md"
          placeholder="Buyurtma raqami yoki mijoz..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Orders */}
      <div className="relative">
        {refreshing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-base-100/60 backdrop-blur-sm">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Buyurtmalar topilmadi"
            description="Filtrlarni o'zgartiring yoki yangi buyurtma yarating"
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-card lg:block">
              <table className="table">
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
                      className="cursor-pointer transition-colors hover:bg-base-200/50"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="text-base-content/60">{page * pageSize + index + 1}</td>
                      <td>
                        <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-base-content/60">{order.customerPhone}</div>
                        </div>
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td className="text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                      <td className="text-right text-success">{formatCurrency(order.paidAmount)}</td>
                      <td className="text-right">
                        <span className={order.remainingAmount > 0 ? 'text-error' : ''}>
                          {formatCurrency(order.remainingAmount)}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/70">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-2.5 lg:hidden">
              {orders.map((order) => (
                <ListItemCard
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  title={
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                  }
                  subtitle={`${order.customerName} · ${order.customerPhone}`}
                  footer={
                    <>
                      <span className="text-sm font-bold">{formatCurrency(order.totalAmount)}</span>
                      <div className="flex items-center gap-2">
                        {order.remainingAmount > 0 && (
                          <span className="text-xs font-medium text-error">
                            -{formatCurrency(order.remainingAmount)}
                          </span>
                        )}
                        <span className="text-[11px] text-base-content/45">{formatDateTime(order.createdAt)}</span>
                      </div>
                    </>
                  }
                />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50]}
            className="mt-4 lg:rounded-2xl lg:border lg:border-base-300/70 lg:bg-base-100"
          />
        )}
      </div>
    </div>
  );
}
