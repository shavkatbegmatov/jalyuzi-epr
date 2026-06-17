import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Phone, Users, PieChart } from 'lucide-react';
import { customersApi, type RfmInsights } from '../../api/customers.api';
import { formatCurrency } from '../../config/constants';

// Segment ranglari (DaisyUI sinflari)
const SEGMENT_STYLE: Record<string, { ring: string; badge: string; text: string }> = {
  CHAMPION: { ring: 'border-success/40 bg-success/5', badge: 'badge-success', text: 'text-success' },
  LOYAL: { ring: 'border-primary/40 bg-primary/5', badge: 'badge-primary', text: 'text-primary' },
  NEW: { ring: 'border-info/40 bg-info/5', badge: 'badge-info', text: 'text-info' },
  AT_RISK: { ring: 'border-warning/40 bg-warning/5', badge: 'badge-warning', text: 'text-warning' },
  DORMANT: { ring: 'border-base-300 bg-base-200/40', badge: 'badge-ghost', text: 'text-base-content/60' },
  LOST: { ring: 'border-error/40 bg-error/5', badge: 'badge-error', text: 'text-error' },
  REGULAR: { ring: 'border-base-300 bg-base-100', badge: 'badge-ghost', text: 'text-base-content/70' },
};

function styleOf(segment: string) {
  return SEGMENT_STYLE[segment] || SEGMENT_STYLE.REGULAR;
}

export function CustomerInsightsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<RfmInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async (initial = false) => {
    if (!initial) setRefreshing(true);
    try {
      setData(await customersApi.getRfmInsights());
    } catch (e) {
      console.error('RFM yuklashda xatolik', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const filteredCustomers = useMemo(() => {
    if (!data) return [];
    return filter ? data.customers.filter((c) => c.segment === filter) : data.customers;
  }, [data, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="section-title flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Mijoz segmentatsiyasi
            </h1>
            <p className="section-subtitle hidden sm:block">RFM: Recency · Frequency · Monetary</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Segment kartalari */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data?.segments.map((s) => {
          const st = styleOf(s.segment);
          const active = filter === s.segment;
          return (
            <button
              key={s.segment}
              onClick={() => setFilter(active ? null : s.segment)}
              className={`rounded-xl border-2 p-3 text-left transition ${st.ring} ${
                active ? 'ring-2 ring-primary ring-offset-1' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`badge badge-sm ${st.badge}`}>{s.label}</span>
                <span className="text-lg font-bold">{s.count}</span>
              </div>
              <div className="mt-2 text-xs text-base-content/60">
                {formatCurrency(s.totalMonetary)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mijozlar ro'yxati */}
      <div className="surface-card">
        <div className="flex items-center justify-between border-b border-base-200 p-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <Users className="h-4 w-4" />
            {filter ? data?.segments.find((s) => s.segment === filter)?.label : 'Barcha mijozlar'}
            <span className="text-base-content/50">({filteredCustomers.length})</span>
          </h3>
          {filter && (
            <button className="btn btn-ghost btn-xs" onClick={() => setFilter(null)}>
              Filtrni tozalash
            </button>
          )}
        </div>

        {filteredCustomers.length === 0 ? (
          <p className="p-8 text-center text-base-content/50">Mijoz yo'q</p>
        ) : (
          <div className="divide-y divide-base-200">
            {filteredCustomers.map((c) => {
              const st = styleOf(c.segment);
              return (
                <div key={c.customerId} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className={`badge badge-xs ${st.badge}`}>{c.segmentLabel}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-base-content/55">
                      <span>{c.orderCount} buyurtma</span>
                      <span className="font-medium text-base-content/70">{formatCurrency(c.totalSpent)}</span>
                      {c.recencyDays != null && <span>{c.recencyDays} kun oldin</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="btn btn-ghost btn-sm btn-circle" title={c.phone}>
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => navigate(`/customers/${c.customerId}`)}
                    >
                      Ko'rish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
