import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Banknote,
} from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { dashboardApi } from '../../api/dashboard.api';
import { formatCurrency } from '../../config/constants';
import type { OrderStatsResponse, DashboardStats, OrderStatus } from '../../types';

const STATUS_GROUP_LABELS: { key: string; label: string; statuses: OrderStatus[]; color: string; icon: typeof Clock }[] = [
  {
    key: 'new',
    label: 'Yangi',
    statuses: ['YANGI'],
    color: 'bg-info/10 text-info border-info/20',
    icon: ClipboardList,
  },
  {
    key: 'measurement',
    label: "O'lchov",
    statuses: ['OLCHOV_KUTILMOQDA', 'OLCHOV_BAJARILDI', 'NARX_TASDIQLANDI'],
    color: 'bg-warning/10 text-warning border-warning/20',
    icon: Clock,
  },
  {
    key: 'production',
    label: 'Ishlab chiqarish',
    statuses: ['ZAKLAD_QABUL_QILINDI', 'ISHLAB_CHIQARISHDA', 'TAYYOR'],
    color: 'bg-accent/10 text-accent border-accent/20',
    icon: TrendingUp,
  },
  {
    key: 'installation',
    label: "O'rnatish",
    statuses: ['ORNATISHGA_TAYINLANDI', 'ORNATISH_JARAYONIDA', 'ORNATISH_BAJARILDI', 'TOLOV_KUTILMOQDA'],
    color: 'bg-primary/10 text-primary border-primary/20',
    icon: CheckCircle,
  },
  {
    key: 'completed',
    label: 'Yakunlangan',
    statuses: ['YAKUNLANDI', 'QARZGA_OTKAZILDI'],
    color: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle,
  },
  {
    key: 'cancelled',
    label: 'Bekor qilingan',
    statuses: ['BEKOR_QILINDI'],
    color: 'bg-error/10 text-error border-error/20',
    icon: XCircle,
  },
];

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const [orderStats, setOrderStats] = useState<OrderStatsResponse | null>(null);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true);
    try {
      const [oStats, dStats] = await Promise.allSettled([
        ordersApi.getStats(),
        dashboardApi.getStats(),
      ]);
      if (oStats.status === 'fulfilled') setOrderStats(oStats.value);
      if (dStats.status === 'fulfilled') setDashStats(dStats.value);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  const getGroupCount = (statuses: OrderStatus[]) => {
    if (!orderStats?.statusCounts) return 0;
    return statuses.reduce((sum, s) => sum + (orderStats.statusCounts[s] || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-warning"></span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Dashboard</h2>
        <button
          className={`btn btn-ghost btn-sm btn-circle ${refreshing ? 'animate-spin' : ''}`}
          onClick={() => void loadData()}
          disabled={refreshing}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-3">
            <div className="text-xs text-base-content/50">Bugungi sotuv</div>
            <div className="text-lg font-bold text-success">
              {formatCurrency(dashStats?.todayRevenue || 0)}
            </div>
            <div className="text-xs text-base-content/60">
              {dashStats?.todaySalesCount || 0} ta sotuv
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-3">
            <div className="text-xs text-base-content/50">Faol buyurtmalar</div>
            <div className="text-lg font-bold text-warning">
              {orderStats?.activeOrders || 0}
            </div>
            <div className="text-xs text-base-content/60">
              Jami: {orderStats?.totalOrders || 0}
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-3">
            <div className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-success" />
              <div className="text-xs text-base-content/50">To'langan</div>
            </div>
            <div className="text-lg font-bold text-success">
              {formatCurrency(orderStats?.totalPaid || 0)}
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-3">
            <div className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-error" />
              <div className="text-xs text-base-content/50">Qoldiq</div>
            </div>
            <div className="text-lg font-bold text-error">
              {formatCurrency(orderStats?.totalRemaining || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Groups */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-3">
          Buyurtmalar holati
        </h3>
        <div className="space-y-2">
          {STATUS_GROUP_LABELS.map((group) => {
            const count = getGroupCount(group.statuses);
            const Icon = group.icon;
            return (
              <div
                key={group.key}
                className="card bg-base-100 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => navigate(`/manager/orders?group=${group.key}`)}
              >
                <div className="card-body p-3 flex-row items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${group.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{group.label}</div>
                    <div className="text-xs text-base-content/60">
                      {group.statuses.length > 1
                        ? group.statuses.map(s => `${orderStats?.statusCounts?.[s] || 0}`).join(' + ')
                        : ''
                      }
                    </div>
                  </div>
                  <div className="text-xl font-bold">{count}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
