import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Star, Loader2, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../../api/products.api';
import { usePermission, PermissionCode } from '../../hooks/usePermission';

interface ProductImageManagerProps {
  productId: number;
  /** Boshlang'ich rasmlar ro'yxati (galereya) */
  initialImages?: string[];
  /** Joriy asosiy (muqova) rasm URL'i */
  initialCover?: string;
}

const MAX_IMAGES = 10;

export function ProductImageManager({
  productId,
  initialImages = [],
  initialCover,
}: ProductImageManagerProps) {
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PermissionCode.PRODUCTS_UPDATE);

  const [images, setImages] = useState<string[]>(initialImages);
  const [cover, setCover] = useState<string | undefined>(initialCover);
  const [uploading, setUploading] = useState(false);
  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const slotsLeft = MAX_IMAGES - images.length;
    if (slotsLeft <= 0) {
      toast.error(`Eng ko'pi ${MAX_IMAGES} ta rasm yuklash mumkin`);
      return;
    }

    const toUpload = Array.from(files).slice(0, slotsLeft);
    if (files.length > slotsLeft) {
      toast(`Faqat ${slotsLeft} ta rasm qo'shildi (limit ${MAX_IMAGES} ta)`);
    }

    setUploading(true);
    try {
      let latest = images;
      // Backend bitta fayl qabul qiladi — ketma-ket yuklaymiz
      for (const file of toUpload) {
        latest = await productsApi.uploadImage(productId, file);
      }
      setImages(latest);
      // Muqova bo'sh edi bo'lsa, backend birinchi rasmni muqova qildi
      if (!cover && latest.length > 0) {
        setCover(latest[0]);
      }
      toast.success('Rasm yuklandi');
    } catch (error) {
      console.error('Rasm yuklashda xatolik:', error);
      toast.error("Rasm yuklab bo'lmadi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (url: string) => {
    setBusyUrl(url);
    try {
      const updated = await productsApi.deleteImage(productId, url);
      setImages(updated);
      if (url === cover) {
        setCover(updated.length > 0 ? updated[0] : undefined);
      }
      toast.success("Rasm o'chirildi");
    } catch (error) {
      console.error("Rasmni o'chirishda xatolik:", error);
      toast.error("Rasmni o'chirib bo'lmadi");
    } finally {
      setBusyUrl(null);
    }
  };

  const handleSetCover = async (url: string) => {
    if (url === cover) return;
    setBusyUrl(url);
    try {
      await productsApi.setCoverImage(productId, url);
      setCover(url);
      toast.success('Asosiy rasm belgilandi');
    } catch (error) {
      console.error('Asosiy rasmni belgilashda xatolik:', error);
      toast.error("Asosiy rasmni belgilab bo'lmadi");
    } finally {
      setBusyUrl(null);
    }
  };

  return (
    <div className="surface-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60">
          <ImageIcon className="h-4 w-4" />
          Mahsulot rasmlari
        </h3>
        <span className="text-xs text-base-content/50">
          {images.length} / {MAX_IMAGES}
        </span>
      </div>

      {images.length === 0 && !canEdit ? (
        <p className="py-6 text-center text-base-content/50">Rasm mavjud emas</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url) => {
            const isCover = url === cover;
            const busy = busyUrl === url;
            return (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-xl border border-base-200 bg-base-200"
              >
                <img src={url} alt="Mahsulot rasmi" className="h-full w-full object-cover" />

                {/* Asosiy rasm belgisi */}
                {isCover && (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-content">
                    <Star className="h-3 w-3 fill-current" />
                    Asosiy
                  </span>
                )}

                {/* Yuklanish/band holati overlay */}
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}

                {/* Amal tugmalari — faqat ruxsat bo'lsa */}
                {canEdit && !busy && (
                  <div className="absolute inset-0 flex items-end justify-end gap-1 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {!isCover && (
                      <button
                        type="button"
                        className="btn btn-circle btn-xs btn-primary"
                        title="Asosiy qilish"
                        onClick={() => handleSetCover(url)}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-circle btn-xs btn-error"
                      title="O'chirish"
                      onClick={() => handleDelete(url)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Yuklash tugmasi */}
          {canEdit && images.length < MAX_IMAGES && (
            <button
              type="button"
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-base-300 text-base-content/50 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="h-6 w-6" />
              )}
              <span className="text-xs font-medium">
                {uploading ? 'Yuklanmoqda...' : 'Rasm qo\'shish'}
              </span>
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {canEdit && (
        <p className="mt-3 text-xs text-base-content/50">
          JPG, PNG, WebP — har biri 10 MB gacha. Asosiy rasm katalog kartochkasida ko'rinadi.
        </p>
      )}
    </div>
  );
}
