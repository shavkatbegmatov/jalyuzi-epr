import type { CSSProperties } from 'react';
import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  Clock,
  Calendar,
  ClipboardList,
  Ruler,
  Hammer,
  Banknote,
  Sun,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { MetricCard } from '../../components/mobile';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart as RechartsPie,
  Pie,
  Legend,
} from 'recharts';
import { dashboardApi } from '../../api/dashboard.api';
import { ordersApi } from '../../api/orders.api';
import { formatCurrency, formatNumber } from '../../config/constants';
import type { DashboardStats, ChartData, OrderStatsResponse } from '../../types';
import { useNotificationsStore } from '../../store/notificationsStore';
import { useAuthStore } from '../../store/authStore';

// Premium rang palitrasi (teal asosli — brendga mos)
const COLORS = {
  primary: '#0d9488',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0ea5e9',
  secondary: '#f97316',
  chart: ['#0d9488', '#0ea5e9', '#f97316', '#8b5cf6', '#16a34a', '#f59e0b', '#ec4899', '#6366f1'],
};

// Valyuta formatlash (qisqa)
const formatCompactCurrency = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toString();
};

// Chart Card komponenti
function ChartCard({
  title,
  icon: Icon,
  children,
  action,
  className,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('surface-card overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b border-base-300/60 px-4 py-3.5 lg:px-5 lg:py-4">
        <h3 className="flex items-center gap-2 font-semibold">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="p-3 lg:p-5">{children}</div>
    </div>
  );
}

// Recharts tooltip types
interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-base-200 bg-base-100 p-3 shadow-lg">
        <p className="mb-2 font-medium">{label}</p>
        {payload.map((entry: TooltipPayloadEntry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('Daromad') ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatsResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<7 | 30>(30);
  const { notifications } = useNotificationsStore();
  const hasOrdersPermission = useAuthStore((state) => state.permissions.has('ORDERS_VIEW'));
  const loadData = useCallback(async (isInitial = false) => {
    try {
      if (!isInitial) {
        setRefreshing(true);
      }
      const promises: [Promise<DashboardStats>, Promise<ChartData>, ...Promise<OrderStatsResponse>[]] = [
        dashboardApi.getStats(),
        dashboardApi.getChartData(period),
      ];
      if (hasOrdersPermission) {
        promises.push(ordersApi.getStats());
      }
      const results = await Promise.all(promises);
      setStats(results[0] as DashboardStats);
      setChartData(results[1] as ChartData);
      if (hasOrdersPermission && results[2]) {
        setOrderStats(results[2] as OrderStatsResponse);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [period, hasOrdersPermission]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (notifications.length > 0) {
      void loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-48" />
            <div className="skeleton mt-2 h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface-card p-5">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton mt-3 h-8 w-32" />
              <div className="skeleton mt-3 h-6 w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="surface-card p-5">
            <div className="skeleton h-64 w-full" />
          </div>
          <div className="surface-card p-5">
            <div className="skeleton h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {refreshing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-base-100/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <span className="text-sm font-medium text-base-content/70">Yangilanmoqda...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Dashboard</h1>
          <p className="mt-0.5 text-sm text-base-content/55 lg:mt-1 lg:text-base">
            Biznesingiz haqida real vaqtda ma'lumotlar
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="join flex-1 lg:flex-none">
            <button
              className={clsx('join-item btn btn-sm flex-1', period === 7 && 'btn-primary')}
              onClick={() => setPeriod(7)}
            >
              7 kun
            </button>
            <button
              className={clsx('join-item btn btn-sm flex-1', period === 30 && 'btn-primary')}
              onClick={() => setPeriod(30)}
            >
              30 kun
            </button>
          </div>
          <Link to="/pos" className="btn btn-primary btn-sm hidden sm:inline-flex">
            <ShoppingCart className="h-4 w-4" />
            Yangi sotuv
          </Link>
        </div>
      </div>

      {/* Bugungi ish kuni - tezkor ko'rinish */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-base-300/60 px-4 py-3 lg:px-5">
          <div className="rounded-lg bg-warning/10 p-1.5">
            <Sun className="h-4 w-4 text-warning" />
          </div>
          <h3 className="font-semibold">Bugungi ish kuni</h3>
          <span className="ml-auto text-xs text-base-content/50">
            {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-5 lg:gap-4 lg:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Yangi buyurtmalar</p>
              <p className="text-xl font-bold">{formatNumber(stats?.todayOrdersCount || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-info/10 p-2">
              <Ruler className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">O'lchovlar</p>
              <p className="text-xl font-bold">{formatNumber(stats?.todayMeasurementsCount || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2">
              <Hammer className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">O'rnatishlar</p>
              <p className="text-xl font-bold">{formatNumber(stats?.todayInstallationsCount || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary/10 p-2">
              <CreditCard className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">To'lovlar</p>
              <p className="text-xl font-bold">{formatNumber(stats?.todayPaymentsCount || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 col-span-2 lg:col-span-1">
            <div className="rounded-lg bg-success/10 p-2">
              <Banknote className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-base-content/60">Yig'ilgan summa</p>
              <p className="truncate text-xl font-bold text-success">
                {formatCurrency(stats?.todayPaymentsCollected || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          title="Bugungi sotuvlar"
          value={stats?.todaySalesCount || 0}
          icon={ShoppingCart}
          color="primary"
          trend={chartData?.salesGrowthPercent}
          trendLabel="o'tgan haftaga nisbatan"
          style={{ '--i': 0 } as CSSProperties}
        />
        <MetricCard
          title="Bugungi daromad"
          value={formatCurrency(stats?.todayRevenue || 0)}
          icon={DollarSign}
          color="success"
          trend={chartData?.revenueGrowthPercent}
          trendLabel="o'tgan haftaga nisbatan"
          style={{ '--i': 1 } as CSSProperties}
        />
        <MetricCard
          title="Jami mahsulotlar"
          value={formatNumber(stats?.totalProducts || 0)}
          icon={Package}
          color="info"
          style={{ '--i': 2 } as CSSProperties}
        />
        <MetricCard
          title="Mijozlar soni"
          value={formatNumber(stats?.totalCustomers || 0)}
          icon={Users}
          color="secondary"
          style={{ '--i': 3 } as CSSProperties}
        />
      </div>

      {/* Order Stats Card */}
      {orderStats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link to="/orders" className="surface-soft rounded-xl p-4 transition hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Faol buyurtmalar</p>
                <p className="font-bold">{formatNumber(orderStats.activeOrders)}</p>
              </div>
            </div>
          </Link>
          <Link to="/orders" className="surface-soft rounded-xl p-4 transition hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <ClipboardList className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Yakunlangan</p>
                <p className="font-bold">{formatNumber(orderStats.completedOrders)}</p>
              </div>
            </div>
          </Link>
          <div className="surface-soft rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <ClipboardList className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Jami buyurtmalar</p>
                <p className="font-bold">{formatNumber(orderStats.totalOrders)}</p>
              </div>
            </div>
          </div>
          <div className="surface-soft rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Qoldiq to'lov</p>
                <p className="font-bold">{formatCompactCurrency(orderStats.totalRemaining)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="surface-soft rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Bu hafta</p>
              <p className="font-bold">{formatCompactCurrency(chartData?.thisWeekRevenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="surface-soft rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-info/10 p-2">
              <Calendar className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Bu oy</p>
              <p className="font-bold">{formatCompactCurrency(chartData?.thisMonthRevenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="surface-soft rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2">
              <Package className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Omborda</p>
              <p className="font-bold">{formatNumber(stats?.totalStock || 0)} dona</p>
            </div>
          </div>
        </div>
        <div className="surface-soft rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-error/10 p-2">
              <Wallet className="h-5 w-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Jami qarz</p>
              <p className="font-bold text-error">{formatCompactCurrency(stats?.totalDebt || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Sales Trend - Takes 2 columns */}
        <ChartCard
          title="Sotuvlar dinamikasi"
          icon={TrendingUp}
          className="lg:col-span-2"
          action={
            <span className="text-xs text-base-content/50">
              Oxirgi {period} kun
            </span>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData?.salesTrend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCompactCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Daromad"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Payment Methods - Donut Chart */}
        <ChartCard title="To'lov usullari" icon={CreditCard}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={chartData?.paymentMethods || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="methodLabel"
                  label={({ methodLabel, percentage }) =>
                    `${methodLabel} ${percentage.toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {(chartData?.paymentMethods || []).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS.chart[index % COLORS.chart.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <ChartCard title="Top mahsulotlar" icon={BarChart3}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData?.topProducts?.slice(0, 5) || []}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCompactCurrency(value)}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  tick={{ fontSize: 11 }}
                  width={120}
                  tickFormatter={(value) =>
                    value.length > 18 ? `${value.slice(0, 18)}...` : value
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Mahsulot: ${label}`}
                />
                <Bar dataKey="revenue" name="Daromad" fill={COLORS.success} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Hourly Sales */}
        <ChartCard
          title="Bugungi sotuvlar (soatlik)"
          icon={Clock}
          action={
            <span className="text-xs text-base-content/50">
              08:00 - 22:00
            </span>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.hourlySales || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="hourLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'Daromad' ? formatCurrency(value) : value
                  }
                />
                <Bar
                  dataKey="salesCount"
                  name="Sotuvlar"
                  fill={COLORS.info}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Third Row - Weekday and Category */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Weekday Sales */}
        <ChartCard title="Hafta kunlari bo'yicha" icon={Calendar}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.weekdaySales || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompactCurrency(v)} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'Daromad' ? formatCurrency(value) : value
                  }
                />
                <Bar dataKey="revenue" name="Daromad" radius={[4, 4, 0, 0]}>
                  {(chartData?.weekdaySales || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.dayOfWeek === 0 || entry.dayOfWeek === 6 ? COLORS.warning : COLORS.primary}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Category Sales */}
        <ChartCard title="Kategoriyalar bo'yicha" icon={PieChart}>
          <div className="h-64">
            {chartData?.categorySales && chartData.categorySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={chartData.categorySales}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="revenue"
                    nameKey="categoryName"
                    label={({ categoryName, percentage }) =>
                      percentage > 5 ? `${categoryName} ${percentage.toFixed(0)}%` : ''
                    }
                  >
                    {chartData.categorySales.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.chart[index % COLORS.chart.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-base-content/50">
                Ma'lumot mavjud emas
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Quick Links */}
      <div className="surface-card p-4 lg:p-5">
        <h3 className="mb-3 font-semibold lg:mb-4">Tez havolalar</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { to: '/pos', icon: ShoppingCart, label: 'Kassa', color: 'bg-primary/10 text-primary' },
            { to: '/products', icon: Package, label: 'Mahsulotlar', color: 'bg-info/10 text-info' },
            { to: '/customers', icon: Users, label: 'Mijozlar', color: 'bg-secondary/10 text-secondary' },
            { to: '/reports', icon: BarChart3, label: 'Hisobotlar', color: 'bg-success/10 text-success' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="surface-soft flex flex-col items-center justify-center gap-2.5 p-4 press-scale tap-transparent"
            >
              <div className={clsx('grid h-11 w-11 place-items-center rounded-xl', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
