import { useCallback, useEffect, useState } from 'react';
import { Ruler, Check, X, TrendingUp, TrendingDown, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { revisionsApi, type OrderItemRevision } from '../../api/revisions.api';
import { useNotificationsStore } from '../../store/notificationsStore';
import { formatCurrency } from '../../config/constants';
import { getApiErrorMessage } from '../../utils/errorUtils';

/**
 * Menejer dashboardidagi "Qayta o'lchov so'rovlari" kartasi.
 * Kutilayotgan so'rovlarni jonli ko'rsatadi (yangi bildirishnoma kelganda yangilanadi)
 * va inline tasdiqlash/rad etish imkonini beradi. Bo'sh bo'lsa hech narsa ko'rsatmaydi.
 */
export function PendingRemeasureCard() {
  const [items, setItems] = useState<OrderItemRevision[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const notifications = useNotificationsStore((s) => s.notifications);

  const load = useCallback(async () => {
    try {
      setItems(await revisionsApi.getPending());
    } catch {
      // jim
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  const decide = async (id: number, approve: boolean) => {
    setBusyId(id);
    try {
      if (approve) await revisionsApi.approve(id);
      else await revisionsApi.reject(id);
      toast.success(approve ? 'Tasdiqlandi' : 'Rad etildi');
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || 'Xatolik yuz berdi');
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="card border-l-4 border-warning bg-base-100 shadow-sm">
      <div className="card-body gap-3 p-4">
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-warning" />
          <h3 className="font-bold">Qayta o'lchov so'rovlari</h3>
          <span className="badge badge-warning badge-sm font-bold">{items.length}</span>
        </div>

        {items.map((r) => {
          const delta = r.delta ?? 0;
          return (
            <div key={r.id} className="rounded-xl bg-base-200 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono font-bold">{r.orderNumber}</span>
                {r.requestedByName && (
                  <span className="flex items-center gap-1 text-xs text-base-content/55">
                    <User className="h-3 w-3" />
                    {r.requestedByName}
                  </span>
                )}
              </div>

              <div className="mt-1 text-sm">
                {r.productName}
                {r.roomName ? ` · ${r.roomName}` : ''}
              </div>

              <div className="mt-1 text-xs text-base-content/60">
                {r.oldWidthMm}×{r.oldHeightMm} →{' '}
                <span className="font-semibold text-base-content">
                  {r.newWidthMm}×{r.newHeightMm}
                </span>{' '}
                mm
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-base-content/60">
                  {formatCurrency(r.oldTotalPrice)} →{' '}
                  <span className="font-semibold text-base-content">
                    {formatCurrency(r.newTotalPrice)}
                  </span>
                </span>
                <span
                  className={`flex items-center gap-1 font-bold ${
                    delta > 0 ? 'text-error' : delta < 0 ? 'text-success' : ''
                  }`}
                >
                  {delta > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : delta < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : null}
                  {delta > 0 ? '+' : ''}
                  {formatCurrency(delta)}
                </span>
              </div>

              {r.note && (
                <p className="mt-2 rounded-lg bg-base-100 p-2 text-xs text-base-content/70">{r.note}</p>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  className="btn btn-success btn-sm flex-1 gap-1"
                  onClick={() => decide(r.id, true)}
                  disabled={busyId === r.id}
                >
                  {busyId === r.id ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Tasdiqlash
                </button>
                <button
                  className="btn btn-ghost btn-sm gap-1 text-error"
                  onClick={() => decide(r.id, false)}
                  disabled={busyId === r.id}
                >
                  <X className="h-4 w-4" />
                  Rad
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
