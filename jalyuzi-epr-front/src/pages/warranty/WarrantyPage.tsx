import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, AlertTriangle, Check, Clock, Filter, RefreshCw, X } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  warrantyApi,
  type WarrantyClaim,
  type WarrantyClaimStatus,
} from '../../api/warranty.api';

const STATUS_LABELS: Record<WarrantyClaimStatus, { label: string; badge: string; icon: typeof Check }> = {
  NEW: { label: 'Yangi', badge: 'badge-info', icon: AlertTriangle },
  IN_PROGRESS: { label: 'Jarayonda', badge: 'badge-warning', icon: Clock },
  WAITING_PARTS: { label: 'Ehtiyot qism kutilmoqda', badge: 'badge-accent', icon: Clock },
  RESOLVED: { label: 'Hal qilindi', badge: 'badge-success', icon: Check },
  CLOSED: { label: 'Yopilgan', badge: 'badge-ghost', icon: Check },
  REJECTED: { label: 'Rad etilgan', badge: 'badge-error', icon: X },
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WarrantyPage() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<WarrantyClaimStatus | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warrantyApi.list(statusFilter || undefined);
      setClaims(data.content);
    } catch (e) {
      console.error(e);
      toast.error("Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-warning/10 p-2">
            <Wrench className="h-6 w-6 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Kafolat shikoyatlari</h1>
            <p className="text-sm text-base-content/60">{claims.length} ta shikoyat</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-base-content/50" />
            <select
              className="select select-bordered select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as WarrantyClaimStatus | '')}
            >
              <option value="">Barcha holatlar</option>
              {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            Yangilash
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : claims.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <Check className="mx-auto mb-3 h-12 w-12 text-success" />
          <p className="font-semibold">Hozircha shikoyat yo'q</p>
          <p className="mt-1 text-sm text-base-content/60">
            Mijozlardan kafolat shikoyatlari kelganda bu yerda ko'rinadi.
          </p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Raqam</th>
                  <th>Mijoz</th>
                  <th>Buyurtma</th>
                  <th>Muammo</th>
                  <th>Holat</th>
                  <th>Mas'ul</th>
                  <th>Sana</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => {
                  const cfg = STATUS_LABELS[c.status];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={c.id}
                      className="cursor-pointer hover:bg-base-200/50"
                      onClick={() => navigate(`/warranty/${c.id}`)}
                    >
                      <td className="font-mono font-semibold text-xs">{c.claimNumber}</td>
                      <td>
                        <div>
                          <div className="text-sm font-medium">{c.customerName}</div>
                          <div className="text-xs text-base-content/60">{c.customerPhone}</div>
                        </div>
                      </td>
                      <td className="text-xs">{c.orderNumber}</td>
                      <td>
                        <div className="text-sm font-medium">{c.issueTypeDisplayName}</div>
                        <div className="text-xs text-base-content/60 line-clamp-1 max-w-xs">
                          {c.issueDescription}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${cfg.badge} gap-1`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="text-xs">{c.assignedToName || '—'}</td>
                      <td className="text-xs whitespace-nowrap">{formatDateTime(c.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/warranty/${c.id}`);
                          }}
                        >
                          Ochish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
