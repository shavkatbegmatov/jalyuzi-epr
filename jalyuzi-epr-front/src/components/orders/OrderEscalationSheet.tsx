import { useState, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { Camera, Upload, X, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { BottomSheet } from '../mobile/BottomSheet';
import {
  escalationsApi,
  ESCALATION_REASONS,
  type EscalationReason,
} from '../../api/escalations.api';
import { isNativeMobile, pickImageNative } from '../../utils/nativeCamera';

interface Props {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
  /** Eskalatsiya muvaffaqiyatli yuborilgach chaqiriladi */
  onCreated?: () => void;
}

/**
 * Dala SOS paneli — o'rnatuvchi obyektda muammoga duch kelganda
 * sabab + izoh + ixtiyoriy foto bilan tezkor yordam so'raydi.
 */
export function OrderEscalationSheet({ orderId, isOpen, onClose, onCreated }: Props) {
  const [reason, setReason] = useState<EscalationReason | null>(null);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(null);
    setDescription('');
    setFile(null);
    setPreview(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const setPicked = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const attachNative = async () => {
    try {
      const f = await pickImageNative();
      if (f) setPicked(f);
    } catch {
      toast.error('Kamera ochilmadi yoki ruxsat berilmadi');
    }
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPicked(f);
  };

  const submit = async () => {
    if (!reason) {
      toast.error('Muammo sababini tanlang');
      return;
    }
    setSubmitting(true);
    try {
      await escalationsApi.create(orderId, {
        reason,
        description: description.trim() || undefined,
        file: file || undefined,
      });
      toast.success("Tezkor yordam so'rovi yuborildi");
      reset();
      onClose();
      onCreated?.();
    } catch {
      toast.error("So'rovni yuborib bo'lmadi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Tezkor yordam"
      subtitle="Muammoni tanlang — menejer darhol xabar oladi"
      footer={
        <button
          className="btn btn-error btn-block"
          onClick={submit}
          disabled={submitting || !reason}
        >
          {submitting ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          Yordam so'rash
        </button>
      }
    >
      {/* Sabablar */}
      <div className="grid grid-cols-2 gap-2 py-2">
        {ESCALATION_REASONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setReason(o.value)}
            className={clsx(
              'flex items-center gap-2 rounded-xl border-2 p-3 text-left text-sm transition press-scale',
              reason === o.value
                ? 'border-error bg-error/10 font-semibold'
                : 'border-base-300 hover:border-base-content/30',
            )}
          >
            <span className="text-lg">{o.emoji}</span>
            <span className="leading-tight">{o.label}</span>
          </button>
        ))}
      </div>

      {/* Izoh */}
      <textarea
        className="textarea textarea-bordered mt-2 w-full"
        rows={3}
        placeholder="Qo'shimcha izoh (ixtiyoriy)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Foto */}
      <div className="mt-3 pb-2">
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Biriktirilgan foto" className="h-28 w-28 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="absolute right-1 top-1 rounded-full bg-error/90 p-1 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : isNativeMobile() ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={attachNative}>
            <Camera className="h-4 w-4" />
            Foto biriktirish
          </button>
        ) : (
          <label className="btn btn-outline btn-sm">
            <Upload className="h-4 w-4" />
            Foto biriktirish
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileInput}
            />
          </label>
        )}
      </div>
    </BottomSheet>
  );
}
