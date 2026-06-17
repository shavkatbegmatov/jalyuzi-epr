import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, ShieldCheck } from 'lucide-react';

/** Standart kafolat muddati (oy) */
const WARRANTY_MONTHS = 12;

interface CertItem {
  productName?: string;
  roomName?: string;
}

interface Props {
  orderNumber: string;
  customerName?: string;
  items?: CertItem[];
  installDate?: string;
  /** QR shu havolaga ulanadi — odatda ommaviy treker (/t/{code}) sahifasi (haqiqiylik tekshiruvi) */
  verifyUrl: string;
  onClose: () => void;
}

function fmt(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function addMonths(dateStr: string | undefined, months: number): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Chop etiladigan kafolat sertifikati — brendlangan, QR bilan.
 * QR ommaviy treker sahifasiga ulanib, o'rnatishning haqiqiyligini tasdiqlaydi
 * (tamper-evident). Mijoz ham, xodim ham chop etishi mumkin.
 */
export function WarrantyCertificateModal({
  orderNumber,
  customerName,
  items,
  installDate,
  verifyUrl,
  onClose,
}: Props) {
  const [qr, setQr] = useState('');

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, { width: 240, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [verifyUrl]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #warranty-cert-print, #warranty-cert-print * { visibility: visible !important; }
          #warranty-cert-print { position: fixed; inset: 0; margin: auto; height: max-content; width: 100%; max-width: 640px; }
          .cert-no-print { display: none !important; }
        }
      `}</style>
      <div
        className="w-full max-w-md rounded-2xl bg-base-100 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cert-no-print mb-2 flex items-center justify-between">
          <h3 className="font-bold">Kafolat sertifikati</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div id="warranty-cert-print" className="rounded-2xl border-2 border-primary/30 p-5">
          <div className="flex items-center justify-center gap-2 text-primary">
            <ShieldCheck className="h-7 w-7" />
            <span className="text-lg font-extrabold tracking-wide">KAFOLAT SERTIFIKATI</span>
          </div>
          <div className="mt-1 text-center text-xs text-base-content/50">kanjaltib.uz · Jalyuzi</div>

          <div className="my-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-base-content/60">Buyurtma</span>
              <span className="font-mono font-bold">{orderNumber}</span>
            </div>
            {customerName && (
              <div className="flex justify-between">
                <span className="text-base-content/60">Mijoz</span>
                <span className="font-medium">{customerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-base-content/60">O'rnatilgan sana</span>
              <span className="font-medium">{fmt(installDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/60">Kafolat muddati</span>
              <span className="font-semibold">{WARRANTY_MONTHS} oy</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/60">Amal qiladi</span>
              <span className="font-semibold text-success">
                {addMonths(installDate, WARRANTY_MONTHS)} gacha
              </span>
            </div>
          </div>

          {items && items.length > 0 && (
            <div className="mb-4 space-y-0.5 rounded-lg bg-base-200 p-2 text-xs">
              {items.map((it, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <span className="truncate">{it.productName || '—'}</span>
                  {it.roomName && <span className="text-base-content/50">{it.roomName}</span>}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center">
            {qr ? (
              <img src={qr} alt="QR" className="h-40 w-40" />
            ) : (
              <div className="grid h-40 w-40 place-items-center">
                <span className="loading loading-spinner" />
              </div>
            )}
            <p className="mt-1 text-center text-[11px] text-base-content/60">
              Haqiqiyligini tekshirish uchun skanerlang
            </p>
          </div>
        </div>

        <button className="cert-no-print btn btn-primary btn-block mt-4" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Chop etish
        </button>
      </div>
    </div>
  );
}
