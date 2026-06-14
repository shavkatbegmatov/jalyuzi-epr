import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Trash2, X, Upload, FileSignature, Ruler, Wrench, Check } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';
import {
  orderPhotosApi,
  type OrderPhotos,
  type PhotoType,
} from '../../api/orderPhotos.api';
import { isNativeMobile, pickImageNative } from '../../utils/nativeCamera';

interface Props {
  orderId: number;
  canEdit?: boolean;
  /** Foto/imzo holati o'zgarganda ota-komponentni xabardor qiladi (yakunlash tugmasini boshqarish uchun) */
  onStateChange?: (state: { afterCount: number; hasSignature: boolean }) => void;
}

const TYPE_CONFIG: Record<PhotoType, { label: string; icon: typeof Camera; color: string }> = {
  MEASUREMENT: { label: "O'lchov", icon: Ruler, color: 'info' },
  BEFORE: { label: 'O\'rnatish oldidan', icon: Camera, color: 'warning' },
  AFTER: { label: 'O\'rnatish keyin', icon: Wrench, color: 'success' },
};

// Backend URL'ni absolute qilish (kerak bo'lsa)
function resolvePhotoUrl(url: string): string {
  if (url.startsWith('http')) return url;
  // /api/files/... → axios baseURL bilan qo'shiladi (Vite proxy hal qiladi)
  return url;
}

function PhotoGrid({
  type,
  urls,
  canEdit,
  onUpload,
  onDelete,
  onPreview,
}: {
  type: PhotoType;
  urls: string[];
  canEdit: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (url: string) => Promise<void>;
  onPreview: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await onUpload(file);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Native APK: Capacitor Camera prompt (kamera/galereya); web: HTML file input
  const handleUploadClick = async () => {
    if (isNativeMobile()) {
      setUploading(true);
      try {
        const file = await pickImageNative();
        if (file) await onUpload(file);
      } catch {
        toast.error("Kamera ochilmadi yoki ruxsat berilmadi");
      } finally {
        setUploading(false);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="surface-soft rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg bg-${config.color}/10 p-1.5`}>
            <Icon className={`h-4 w-4 text-${config.color}`} />
          </div>
          <h3 className="font-semibold text-sm">{config.label}</h3>
          <span className="text-xs text-base-content/50">({urls.length})</span>
        </div>
        {canEdit && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              className={clsx('btn btn-sm', `btn-${config.color}`)}
              onClick={handleUploadClick}
              disabled={uploading}
            >
              {uploading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : isNativeMobile() ? (
                <Camera className="h-4 w-4" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isNativeMobile() ? 'Suratga olish' : 'Yuklash'}
            </button>
          </>
        )}
      </div>

      {urls.length === 0 ? (
        <p className="py-6 text-center text-sm text-base-content/40">
          Fotosurat yo'q
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {urls.map((url) => (
            <div key={url} className="group relative aspect-square">
              <img
                src={resolvePhotoUrl(url)}
                alt="Order photo"
                className="h-full w-full rounded-lg object-cover cursor-pointer"
                onClick={() => onPreview(url)}
                loading="lazy"
              />
              {canEdit && (
                <button
                  className="absolute right-1 top-1 rounded-full bg-error/90 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("O'chirilsinmi?")) onDelete(url);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderPhotoTab({ orderId, canEdit = false, onStateChange }: Props) {
  const [photos, setPhotos] = useState<OrderPhotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const signaturePadRef = useRef<SignatureCanvas | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await orderPhotosApi.getAll(orderId);
      setPhotos(data);
    } catch (e) {
      console.error(e);
      toast.error('Fotosuratlarni yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Ota-komponentni "keyin" foto soni va imzo mavjudligidan xabardor qilish.
  // MUHIM: ota-komponent `onStateChange`ni useCallback bilan memoizatsiya qilishi shart,
  // aks holda bu effekt ota har render'da qayta ishlaydi (InstallerOrderDetailPage
  // shunday qiladi — handlePhotoStateChange, deps []).
  useEffect(() => {
    if (photos && onStateChange) {
      onStateChange({
        afterCount: photos.after.length,
        hasSignature: photos.signature.length > 0,
      });
    }
  }, [photos, onStateChange]);

  const handleUpload = async (type: PhotoType, file: File) => {
    try {
      const urls = await orderPhotosApi.upload(orderId, type, file);
      setPhotos((prev) => prev ? { ...prev, [type.toLowerCase()]: urls } : prev);
      toast.success('Fotosurat yuklandi');
    } catch (e) {
      console.error(e);
      toast.error('Yuklab bo\'lmadi');
    }
  };

  const handleDelete = async (type: PhotoType, url: string) => {
    try {
      const urls = await orderPhotosApi.delete(orderId, type, url);
      setPhotos((prev) => prev ? { ...prev, [type.toLowerCase()]: urls } : prev);
      toast.success('O\'chirildi');
    } catch (e) {
      console.error(e);
      toast.error('O\'chirib bo\'lmadi');
    }
  };

  const handleSaveSignature = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      toast.error('Imzo bo\'sh');
      return;
    }
    try {
      const dataUrl = signaturePadRef.current.toDataURL('image/png');
      const saved = await orderPhotosApi.saveSignature(orderId, dataUrl);
      setPhotos((prev) => prev ? { ...prev, signature: [saved] } : prev);
      setShowSignature(false);
      toast.success('Imzo saqlandi');
    } catch (e) {
      console.error(e);
      toast.error('Imzoni saqlab bo\'lmadi');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!photos) return null;

  const signatureUrl = photos.signature[0];

  return (
    <div className="space-y-4">
      <PhotoGrid
        type="MEASUREMENT"
        urls={photos.measurement}
        canEdit={canEdit}
        onUpload={(f) => handleUpload('MEASUREMENT', f)}
        onDelete={(u) => handleDelete('MEASUREMENT', u)}
        onPreview={setPreview}
      />
      <PhotoGrid
        type="BEFORE"
        urls={photos.before}
        canEdit={canEdit}
        onUpload={(f) => handleUpload('BEFORE', f)}
        onDelete={(u) => handleDelete('BEFORE', u)}
        onPreview={setPreview}
      />
      <PhotoGrid
        type="AFTER"
        urls={photos.after}
        canEdit={canEdit}
        onUpload={(f) => handleUpload('AFTER', f)}
        onDelete={(u) => handleDelete('AFTER', u)}
        onPreview={setPreview}
      />

      {/* Customer signature */}
      <div className="surface-soft rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <FileSignature className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Mijoz imzosi</h3>
            {signatureUrl && (
              <span className="badge badge-success badge-xs gap-1">
                <Check className="h-3 w-3" />
                Imzolangan
              </span>
            )}
          </div>
          {canEdit && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowSignature(true)}
            >
              <FileSignature className="h-4 w-4" />
              {signatureUrl ? 'Qayta imzo' : 'Imzo olish'}
            </button>
          )}
        </div>
        {signatureUrl ? (
          <img
            src={signatureUrl}
            alt="Customer signature"
            className="max-h-32 rounded border border-base-300 bg-white p-2"
          />
        ) : (
          <p className="py-4 text-center text-sm text-base-content/40">
            Imzo olinmagan
          </p>
        )}
      </div>

      {/* Photo preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"
            onClick={() => setPreview(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={resolvePhotoUrl(preview)}
            alt="Preview"
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Signature modal */}
      {showSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="surface-card max-w-2xl w-full p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Mijoz imzosi</h3>
              <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => setShowSignature(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-lg border-2 border-dashed border-base-300 bg-white">
              <SignatureCanvas
                ref={signaturePadRef}
                penColor="black"
                canvasProps={{
                  className: 'w-full h-64',
                }}
              />
            </div>
            <div className="mt-3 flex justify-between gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => signaturePadRef.current?.clear()}
              >
                Tozalash
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveSignature}
              >
                <Check className="h-4 w-4" />
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
