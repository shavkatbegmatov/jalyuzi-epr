import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Clock, AlertTriangle, Users, Package, TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { productionApi, type ProductionStats } from '../../api/production.api';
import { formatCurrency } from '../../config/constants';

function formatMinutes(mins?: number): string {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}s ${m}d` : `${m} daq`;
}

export function ProductionStatsPanel() {
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setStats(await productionApi.getStats());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="surface-card p-6">
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-primary" />
            <p className="text-xs text-base-content/60">Sexda</p>
          </div>
          <p className="text-2xl font-bold">{stats.totalOrdersInProgress}</p>
          <p className="text-xs text-base-content/50">faol buyurtma</p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-success" />
            <p className="text-xs text-base-content/60">30 kun</p>
          </div>
          <p className="text-2xl font-bold text-success">{stats.totalCompletedLast30Days}</p>
          <p className="text-xs text-base-content/50">bajarildi</p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-info" />
            <p className="text-xs text-base-content/60">O'rtacha</p>
          </div>
          <p className="text-2xl font-bold">
            {stats.averageCompletionDays ? stats.averageCompletionDays.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-base-content/50">kun (zakaz tugashi)</p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-error" />
            <p className="text-xs text-base-content/60">Muddati o'tgan</p>
          </div>
          <p className={`text-2xl font-bold ${stats.overdueOrders > 0 ? 'text-error' : ''}`}>
            {stats.overdueOrders}
          </p>
          <p className="text-xs text-base-content/50">deadline o'tgan</p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <p className="text-xs text-base-content/60">Brak ulushi</p>
          </div>
          <p className={`text-2xl font-bold ${stats.defectRatePercent > 10 ? 'text-error' : 'text-warning'}`}>
            {stats.defectRatePercent.toFixed(1)}%
          </p>
          <p className="text-xs text-base-content/50">defect rate</p>
        </div>
      </div>

      {/* Stage distribution + Worker KPI */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface-card p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Bosqichlar bo'yicha taqsimot
          </h3>
          {stats.stageDistribution.length === 0 ? (
            <p className="py-6 text-center text-sm text-base-content/40">Faol buyurtma yo'q</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.stageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="stageName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Sex" radius={[4, 4, 0, 0]}>
                    {stats.stageDistribution.map((s, i) => (
                      <Cell key={i} fill={s.stageColor || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="surface-card p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Ishchilar unumdorligi (30 kun)
          </h3>
          {stats.workerKpi.length === 0 ? (
            <p className="py-6 text-center text-sm text-base-content/40">Tayinlangan ishchi yo'q</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-xs">
                <thead>
                  <tr>
                    <th>Ishchi</th>
                    <th className="text-center">Bajardi</th>
                    <th className="text-center">Hozir</th>
                    <th className="text-right">O'rtacha</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.workerKpi.map((w) => (
                    <tr key={w.workerId}>
                      <td className="font-medium">{w.workerName}</td>
                      <td className="text-center">{w.completedOrders}</td>
                      <td className="text-center">{w.activeOrders}</td>
                      <td className="text-right text-xs">
                        {formatMinutes(w.averageMinutesPerOrder)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Material va Defects */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface-card p-4">
          <h3 className="font-semibold text-sm mb-3">Material chiqindi</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-base-content/60">Jami sarf</span>
              <span className="font-semibold">{formatCurrency(stats.totalMaterialCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-base-content/60">Chiqindi summasi</span>
              <span className="font-semibold text-error">{formatCurrency(stats.totalMaterialWasted)}</span>
            </div>
            <div className="divider my-1"></div>
            <div className="flex justify-between">
              <span className="text-sm">Chiqindi foizi</span>
              <span className={`text-lg font-bold ${stats.wastePercent > 5 ? 'text-error' : 'text-warning'}`}>
                {stats.wastePercent.toFixed(1)}%
              </span>
            </div>
            <progress
              className={`progress w-full ${stats.wastePercent > 5 ? 'progress-error' : 'progress-warning'}`}
              value={Math.min(stats.wastePercent, 100)}
              max={100}
            />
          </div>
        </div>

        <div className="surface-card p-4">
          <h3 className="font-semibold text-sm mb-3">Brak/Defect sabablari</h3>
          {stats.defectReasons.length === 0 ? (
            <p className="py-6 text-center text-sm text-success">✓ Brak yo'q (30 kun)</p>
          ) : (
            <div className="space-y-2">
              {stats.defectReasons.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex-1 truncate pr-2">{d.reason}</span>
                  <span className="badge badge-error badge-sm">{d.count}</span>
                </div>
              ))}
              {stats.defectReasons.length > 5 && (
                <p className="text-xs text-base-content/40 text-center mt-2">
                  va yana {stats.defectReasons.length - 5} ta sabab
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
