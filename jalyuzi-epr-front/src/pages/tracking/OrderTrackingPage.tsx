import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  Blinds,
  ClipboardCheck,
  Factory,
  PackageCheck,
  Wrench,
  PartyPopper,
  CheckCircle2,
  Clock,
  XCircle,
  Ruler,
  HardHat,
  Image as ImageIcon,
  X,
  Wifi,
  WifiOff,
  Send,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { trackingApi, type OrderTracking } from '../../api/tracking.api';
import { API_BASE_URL, formatCurrency, formatDateTime } from '../../config/constants';

// Mijozga tushunarli 5 ta bosqich (backend stageIndex bilan moslashtirilgan)
const STAGES: { label: string; icon: LucideIcon }[] = [
  { label: 'Qabul qilindi', icon: ClipboardCheck },
  { label: 'Ishlab chiqarish', icon: Factory },
  { label: 'Tayyor', icon: PackageCheck },
  { label: "O'rnatish", icon: Wrench },
  { label: 'Yakunlandi', icon: PartyPopper },
];

// Saqlangan rasm URL'ini brauzer uchun yechadi (web: as-is, Vite proxy / bir xil origin hal qiladi)
function resolvePhotoUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return url;
}

function stageTimestamp(data: OrderTracking, stage: number): string | undefined {
  switch (stage) {
    case 0: return data.createdAt;
    case 1: return data.productionStartDate;
    case 2: return data.productionEndDate;
    case 3: return data.installationDate;
    case 4: return data.completedDate;
    default: return undefined;
  }
}

export function OrderTrackingPage() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'notfound' | 'generic' | null>(null);
  const [live, setLive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!code) return;
    if (!silent) setLoading(true);
    try {
      const result = await trackingApi.get(code);
      setData(result);
      setError(null);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (!silent) setError(status === 404 ? 'notfound' : 'generic');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [code]);

  // Dastlabki yuklash + 30s polling fallback (WS ishlamasa ham yangilanib turadi)
  useEffect(() => {
    void load();
    const poll = setInterval(() => void load(true), 30000);
    return () => clearInterval(poll);
  }, [load]);

  // Anonim STOMP — real-vaqt push (token YO'Q; /v1/ws ommaviy, interceptor auth'siz o'tkazadi)
  useEffect(() => {
    if (!code) return;
    const wsUrl = (API_BASE_URL || '/api') + '/v1/ws';
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        setLive(true);
        client.subscribe(`/topic/track/${code}`, () => {
          // Push kelganda to'liq holatni jimgina qayta yuklaymiz (foto/timeline bilan)
          void load(true);
        });
      },
      onDisconnect: () => setLive(false),
      onWebSocketClose: () => setLive(false),
      onStompError: () => setLive(false),
    });
    client.activate();
    clientRef.current = client;
    return () => {
      void client.deactivate();
      clientRef.current = null;
    };
  }, [code, load]);

  return (
    <div data-theme="jalyuzi" className="min-h-[100dvh] bg-base-200">
      {/* Brend sarlavhasi */}
      <header className="bg-gradient-to-br from-primary to-primary/70 text-primary-content">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-5">
          <div className="rounded-2xl bg-primary-content/15 p-2.5 backdrop-blur">
            <Blinds className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-tight">Jalyuzi</h1>
            <p className="text-xs opacity-80">Buyurtma kuzatuvi</p>
          </div>
          {/* Jonli ulanish indikatori */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              live ? 'bg-success/20' : 'bg-primary-content/15'
            }`}
            title={live ? 'Real vaqtda yangilanmoqda' : 'Ulanmoqda...'}
          >
            {live ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {live ? 'Jonli' : 'Oflayn'}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-base-content/50">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm">Yuklanmoqda...</p>
          </div>
        ) : error ? (
          <ErrorState kind={error} onRetry={() => void load()} />
        ) : data ? (
          <div className="space-y-4">
            <StatusHero data={data} />
            {!data.cancelled && data.telegramSubscribeUrl && (
              <TelegramSubscribeCard url={data.telegramSubscribeUrl} />
            )}
            {!data.cancelled && <StageTracker data={data} />}
            {data.photosAfter.length > 0 && (
              <PhotoCard title="O'rnatish natijasi" urls={data.photosAfter} onPreview={setPreview} accent="success" />
            )}
            <PaymentCard data={data} />
            {data.items.length > 0 && <ItemsCard data={data} />}
            {data.photosBefore.length > 0 && (
              <PhotoCard title="O'rnatishdan oldin" urls={data.photosBefore} onPreview={setPreview} accent="warning" />
            )}
            <TeamCard data={data} />
            <TimelineCard data={data} />
            <p className="pt-2 text-center text-xs text-base-content/40">
              Buyurtma raqami: {data.orderNumber}
            </p>
          </div>
        ) : null}
      </main>

      {/* Rasm lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreview(null)}
        >
          <button className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white">
            <X className="h-6 w-6" />
          </button>
          <img
            src={resolvePhotoUrl(preview)}
            alt="Foto"
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function StatusHero({ data }: { data: OrderTracking }) {
  if (data.cancelled) {
    return (
      <div className="card border border-error/20 bg-base-100 shadow-sm">
        <div className="card-body items-center gap-2 p-6 text-center">
          <XCircle className="h-12 w-12 text-error" />
          <h2 className="text-xl font-bold">Buyurtma bekor qilindi</h2>
          <p className="text-sm text-base-content/60">
            Savollar bo'lsa, biz bilan bog'laning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-base-content/40">Hozirgi holat</p>
            <h2 className="text-2xl font-bold text-primary">{data.statusLabel}</h2>
          </div>
          {data.completed ? (
            <PartyPopper className="h-10 w-10 text-success" />
          ) : (
            <span className="text-3xl font-black text-primary/20">{data.progressPercent}%</span>
          )}
        </div>
        <div>
          <progress
            className={`progress w-full ${data.completed ? 'progress-success' : 'progress-primary'}`}
            value={data.progressPercent}
            max={100}
          />
          {data.customerName && (
            <p className="mt-3 text-sm text-base-content/70">
              Hurmatli <span className="font-semibold">{data.customerName}</span>, buyurtmangiz holatini
              shu yerda real vaqtda kuzatishingiz mumkin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TelegramSubscribeCard({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl bg-[#229ED9] p-4 text-white shadow-sm transition active:scale-[0.99]"
    >
      <div className="rounded-xl bg-white/20 p-2">
        <Send className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold leading-tight">Telegram'da yangilik oling</p>
        <p className="text-xs opacity-90">Har bir holat o'zgarishi darhol Telegram'ingizga keladi</p>
      </div>
      <Bell className="h-5 w-5 opacity-80" />
    </a>
  );
}

function StageTracker({ data }: { data: OrderTracking }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-5">
        <ol className="relative ml-1">
          {STAGES.map((stage, i) => {
            const done = i < data.stageIndex;
            const current = i === data.stageIndex;
            const Icon = done ? CheckCircle2 : stage.icon;
            const ts = stageTimestamp(data, i);
            const isLast = i === STAGES.length - 1;
            return (
              <li key={stage.label} className="flex gap-4 pb-7 last:pb-0">
                {/* Rail + tugun */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`z-10 flex h-11 w-11 items-center justify-center rounded-full transition-all ${
                      done
                        ? 'bg-success text-success-content'
                        : current
                        ? 'bg-primary text-primary-content ring-4 ring-primary/20'
                        : 'bg-base-200 text-base-content/40'
                    }`}
                  >
                    {current && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
                    )}
                    <Icon className="h-5 w-5" />
                  </div>
                  {!isLast && (
                    <span
                      className={`absolute top-11 h-full w-0.5 ${
                        done ? 'bg-success' : 'bg-base-200'
                      }`}
                    />
                  )}
                </div>
                {/* Matn */}
                <div className="flex-1 pt-1.5">
                  <p
                    className={`font-semibold ${
                      current ? 'text-primary' : done ? '' : 'text-base-content/40'
                    }`}
                  >
                    {stage.label}
                  </p>
                  {ts && (done || current) && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-base-content/50">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(ts)}
                    </p>
                  )}
                  {current && (
                    <span className="badge badge-primary badge-sm mt-1.5">Jarayonda</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function PaymentCard({ data }: { data: OrderTracking }) {
  const total = data.totalAmount ?? 0;
  const paid = data.paidAmount ?? 0;
  const remaining = data.remainingAmount ?? 0;
  const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body gap-3 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">
          To'lov
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-base-content/70">Jami</span>
            <span className="font-semibold">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">To'langan</span>
            <span className="font-medium text-success">{formatCurrency(paid)}</span>
          </div>
          <div className="flex justify-between border-t border-base-200 pt-2">
            <span className="font-medium">Qoldiq</span>
            <span className={`font-bold ${remaining > 0 ? 'text-error' : 'text-success'}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>
        {total > 0 && (
          <progress className="progress progress-success w-full" value={paidPercent} max={100} />
        )}
      </div>
    </div>
  );
}

function ItemsCard({ data }: { data: OrderTracking }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-5">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-base-content/50">
          Mahsulotlar
        </h3>
        <div className="divide-y divide-base-200">
          {data.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3 py-2.5">
              <div className="flex items-start gap-2">
                <Blinds className="mt-0.5 h-4 w-4 shrink-0 text-base-content/40" />
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  {item.roomName && (
                    <p className="text-xs text-base-content/60">Xona: {item.roomName}</p>
                  )}
                  {(item.widthMm || item.heightMm) && (
                    <p className="text-xs text-base-content/60">
                      {item.widthMm}×{item.heightMm} mm
                    </p>
                  )}
                </div>
              </div>
              <span className="whitespace-nowrap text-sm font-medium text-base-content/70">
                {item.quantity} dona
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamCard({ data }: { data: OrderTracking }) {
  if (!data.measurerName && !data.installerName) return null;
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body gap-3 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">
          Sizning jamoangiz
        </h3>
        {data.measurerName && (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-info/10 p-2">
              <Ruler className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-xs text-base-content/50">O'lchovchi</p>
              <p className="text-sm font-medium">{data.measurerName}</p>
            </div>
          </div>
        )}
        {data.installerName && (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <HardHat className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/50">O'rnatuvchi</p>
              <p className="text-sm font-medium">{data.installerName}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoCard({
  title,
  urls,
  onPreview,
  accent,
}: {
  title: string;
  urls: string[];
  onPreview: (url: string) => void;
  accent: 'success' | 'warning';
}) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-base-content/50">
          <ImageIcon className={`h-4 w-4 text-${accent}`} />
          {title}
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url) => (
            <img
              key={url}
              src={resolvePhotoUrl(url)}
              alt={title}
              loading="lazy"
              onClick={() => onPreview(url)}
              className="aspect-square w-full cursor-pointer rounded-lg object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineCard({ data }: { data: OrderTracking }) {
  if (!data.timeline || data.timeline.length === 0) return null;
  // Eng yangisi yuqorida
  const entries = [...data.timeline].reverse();
  return (
    <div className="collapse-arrow collapse bg-base-100 shadow-sm">
      <input type="checkbox" />
      <div className="collapse-title text-sm font-semibold uppercase tracking-wider text-base-content/50">
        Batafsil tarix
      </div>
      <div className="collapse-content">
        <ol className="space-y-3">
          {entries.map((e, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/40" />
              <div>
                <p className="text-sm font-medium">{e.statusLabel}</p>
                {e.at && <p className="text-xs text-base-content/50">{formatDateTime(e.at)}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ErrorState({ kind, onRetry }: { kind: 'notfound' | 'generic'; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="rounded-full bg-error/10 p-4">
        <XCircle className="h-10 w-10 text-error" />
      </div>
      <h2 className="text-lg font-bold">
        {kind === 'notfound' ? 'Buyurtma topilmadi' : 'Xatolik yuz berdi'}
      </h2>
      <p className="max-w-xs text-sm text-base-content/60">
        {kind === 'notfound'
          ? "Kuzatuv havolasi noto'g'ri yoki eskirgan bo'lishi mumkin. Iltimos, havolani tekshiring."
          : "Ma'lumotni yuklab bo'lmadi. Internet aloqangizni tekshirib, qayta urinib ko'ring."}
      </p>
      {kind === 'generic' && (
        <button className="btn btn-primary btn-sm mt-2" onClick={onRetry}>
          Qayta urinish
        </button>
      )}
    </div>
  );
}
