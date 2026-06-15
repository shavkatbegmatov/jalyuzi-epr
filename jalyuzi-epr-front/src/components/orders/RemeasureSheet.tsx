import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calculator, Send, TrendingUp, TrendingDown } from 'lucide-react';
import { BottomSheet } from '../mobile/BottomSheet';
import { revisionsApi, type RemeasureQuote } from '../../api/revisions.api';
import { formatCurrency } from '../../config/constants';

export interface RemeasureItem {
  id: number;
  productName?: string;
  roomName?: string;
  widthMm?: number;
  heightMm?: number;
}

interface Props {
  orderId: number;
  item: RemeasureItem | null;
  isOpen: boolean;
  onClose: () => void;
  /** So'rov yuborilgach chaqiriladi */
  onSubmitted?: () => void;
}

/**
 * Joyida qayta o'lchov paneli — o'rnatuvchi yangi o'lcham kiritadi, narx onlik
 * qayta hisoblanadi (farq qizil/yashil), so'ng menejer tasdig'iga yuboriladi.
 */
export function RemeasureSheet({ orderId, item, isOpen, onClose, onSubmitted }: Props) {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [note, setNote] = useState('');
  const [quote, setQuote] = useState<RemeasureQuote | null>(null);
  const [calc, setCalc] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setWidth(item.widthMm ? String(item.widthMm) : '');
      setHeight(item.heightMm ? String(item.heightMm) : '');
      setNote('');
      setQuote(null);
    }
  }, [item]);

  if (!item) return null;

  const w = Number(width);
  const h = Number(height);
  const valid = w > 0 && h > 0;
  const changed = w !== item.widthMm || h !== item.heightMm;

  const onW = (v: string) => {
    setWidth(v);
    setQuote(null);
  };
  const onH = (v: string) => {
    setHeight(v);
    setQuote(null);
  };

  const doQuote = async () => {
    if (!valid) {
      toast.error("O'lchamni to'g'ri kiriting");
      return;
    }
    setCalc(true);
    try {
      const q = await revisionsApi.quote(orderId, item.id, { widthMm: w, heightMm: h });
      setQuote(q);
    } catch {
      toast.error("Narxni hisoblab bo'lmadi");
    } finally {
      setCalc(false);
    }
  };

  const submit = async () => {
    if (!valid) {
      toast.error("O'lchamni to'g'ri kiriting");
      return;
    }
    setSubmitting(true);
    try {
      await revisionsApi.request(orderId, item.id, {
        widthMm: w,
        heightMm: h,
        note: note.trim() || undefined,
      });
      toast.success('Menejer tasdig\'iga yuborildi');
      onClose();
      onSubmitted?.();
    } catch {
      toast.error("So'rovni yuborib bo'lmadi");
    } finally {
      setSubmitting(false);
    }
  };

  const delta = quote?.delta ?? 0;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Qayta o'lchov"
      subtitle={(item.productName || '') + (item.roomName ? ` · ${item.roomName}` : '')}
      footer={
        <button
          className="btn btn-primary btn-block"
          onClick={submit}
          disabled={submitting || !valid || !changed}
        >
          {submitting ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          Menejerga yuborish
        </button>
      }
    >
      <div className="rounded-lg bg-base-200 p-3 text-sm">
        <span className="text-base-content/60">Joriy o'lcham: </span>
        <span className="font-medium">
          {item.widthMm ?? '—'} × {item.heightMm ?? '—'} mm
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="form-control">
          <span className="label-text mb-1 text-xs">Eni (mm)</span>
          <input
            type="number"
            inputMode="numeric"
            className="input input-bordered"
            value={width}
            onChange={(e) => onW(e.target.value)}
          />
        </label>
        <label className="form-control">
          <span className="label-text mb-1 text-xs">Bo'yi (mm)</span>
          <input
            type="number"
            inputMode="numeric"
            className="input input-bordered"
            value={height}
            onChange={(e) => onH(e.target.value)}
          />
        </label>
      </div>

      <button className="btn btn-outline btn-sm mt-3" onClick={doQuote} disabled={calc || !valid}>
        {calc ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <Calculator className="h-4 w-4" />
        )}
        Narxni hisoblash
      </button>

      {quote && (
        <div className="mt-3 rounded-xl border border-base-300 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-base-content/60">Eski narx</span>
            <span>{formatCurrency(quote.oldTotalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-base-content/60">Yangi narx</span>
            <span className="font-semibold">{formatCurrency(quote.newTotalPrice)}</span>
          </div>
          <div
            className={`mt-2 flex items-center justify-between rounded-lg p-2 text-sm font-bold ${
              delta > 0
                ? 'bg-error/10 text-error'
                : delta < 0
                  ? 'bg-success/10 text-success'
                  : 'bg-base-200'
            }`}
          >
            <span className="flex items-center gap-1">
              {delta > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : delta < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              Farq
            </span>
            <span>
              {delta > 0 ? '+' : ''}
              {formatCurrency(delta)}
            </span>
          </div>
        </div>
      )}

      <textarea
        className="textarea textarea-bordered mt-3 w-full"
        rows={2}
        placeholder="Izoh (ixtiyoriy)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </BottomSheet>
  );
}
