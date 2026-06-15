import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  User,
  Check,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { escalationsApi, type OrderEscalation } from '../../api/escalations.api';
import { useNotificationsStore } from '../../store/notificationsStore';
import { formatDateTime } from '../../config/constants';
import { getApiErrorMessage } from '../../utils/errorUtils';

export function ManagerEscalationsPage() {
  const [items, setItems] = useState<OrderEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // Jonli yangilanish: yangi staff bildirishnomasi kelganda ro'yxatni qayta yuklaymiz
  const notifications = useNotificationsStore((s) => s.notifications);

  const load = useCallback(async () => {
    try {
      const data = await escalationsApi.getActive();
      setItems(data);
    } catch (e) {
      console.error('Eskalatsiyalarni yuklashda xatolik', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // WebSocket bildirishnomasi (yangi eskalatsiya) -> darhol qayta yuklash
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  // Zaxira: 25s da bir marta yangilash (WebSocket uzilsa ham dolzarb qoladi)
  useEffect(() => {
    const t = setInterval(() => void load(), 25_000);
    return () => clearInterval(t);
  }, [load]);

  const startResolve = (id: number) => {
    setResolvingId(id);
    setNote('');
  };

  const confirmResolve = async (id: number) => {
    setBusy(true);
    try {
      await escalationsApi.resolve(id, note.trim() || undefined);
      toast.success('Eskalatsiya hal qilindi');
      setResolvingId(null);
      setNote('');
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Hal qilib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-warning" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-error" />
          <h2 className="text-lg font-bold">Tezkor yordamlar</h2>
          {items.length > 0 && (
            <span className="badge badge-error badge-sm font-bold">{items.length}</span>
          )}
        </div>
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => void load()} title="Yangilash">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-base-content/50">
          <ShieldCheck className="mb-3 h-12 w-12 text-success/60" />
          <p className="text-base font-medium">Ochiq so'rovlar yo'q</p>
          <p className="text-sm">Hamma narsa nazoratda 👍</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <div
              key={e.id}
              className="card border-l-4 border-error bg-base-100 shadow-sm"
            >
              <div className="card-body gap-2 p-4">
                {/* Header: sabab + vaqt */}
                <div className="flex items-start justify-between gap-2">
                  <span className="badge badge-error gap-1 font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    {e.reasonLabel}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-base-content/50">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(e.createdAt)}
                  </span>
                </div>

                {/* Buyurtma + mijoz */}
                <div className="text-sm">
                  <span className="font-mono font-bold">{e.orderNumber}</span>
                  {e.customerName && <span className="text-base-content/70"> · {e.customerName}</span>}
                </div>

                {e.description && (
                  <p className="rounded-lg bg-base-200 p-2 text-sm text-base-content/80">
                    {e.description}
                  </p>
                )}

                {e.photoUrl && (
                  <a href={e.photoUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={e.photoUrl}
                      alt="Muammo fotosi"
                      className="max-h-40 rounded-lg object-cover"
                      loading="lazy"
                    />
                  </a>
                )}

                {/* Meta: kim yubordi */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/55">
                  {e.createdByName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {e.createdByName}
                    </span>
                  )}
                </div>

                {/* Tezkor amallar */}
                <div className="mt-1 flex flex-wrap gap-2">
                  {e.customerPhone && (
                    <a href={`tel:${e.customerPhone}`} className="btn btn-outline btn-sm gap-1">
                      <Phone className="h-4 w-4" />
                      Qo'ng'iroq
                    </a>
                  )}
                  {e.installationAddress && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(e.installationAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm gap-1"
                    >
                      <MapPin className="h-4 w-4" />
                      Manzil
                    </a>
                  )}
                  {resolvingId !== e.id && (
                    <button
                      className="btn btn-success btn-sm gap-1"
                      onClick={() => startResolve(e.id)}
                    >
                      <Check className="h-4 w-4" />
                      Hal qilish
                    </button>
                  )}
                </div>

                {/* Hal qilish izohi */}
                {resolvingId === e.id && (
                  <div className="mt-2 space-y-2 rounded-lg bg-base-200 p-2">
                    <textarea
                      className="textarea textarea-bordered w-full text-sm"
                      rows={2}
                      placeholder="Qanday hal qilindi? (ixtiyoriy)"
                      value={note}
                      onChange={(ev) => setNote(ev.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setResolvingId(null)}
                        disabled={busy}
                      >
                        Bekor
                      </button>
                      <button
                        className="btn btn-success btn-sm gap-1"
                        onClick={() => confirmResolve(e.id)}
                        disabled={busy}
                      >
                        {busy ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Tasdiqlash
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
