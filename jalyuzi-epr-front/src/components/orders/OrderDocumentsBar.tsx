import { useState } from 'react';
import { FileText, FileSignature, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderDocumentsApi, type DocumentType } from '../../api/orderDocuments.api';

interface Props {
  orderId: number;
  // Akt va Warranty faqat o'rnatish bajarilgan / yakunlangan order'lar uchun mantiqiy
  isCompleted?: boolean;
}

const BUTTONS: { type: DocumentType; label: string; icon: typeof FileText; color: string }[] = [
  { type: 'invoice', label: 'Faktura', icon: FileText, color: 'btn-primary' },
  { type: 'act', label: "O'rnatish akti", icon: FileSignature, color: 'btn-success' },
  { type: 'warranty', label: 'Garantiya', icon: ShieldCheck, color: 'btn-info' },
];

export function OrderDocumentsBar({ orderId, isCompleted = false }: Props) {
  const [loading, setLoading] = useState<DocumentType | null>(null);

  const handleDownload = async (type: DocumentType) => {
    setLoading(type);
    try {
      await orderDocumentsApi.download(orderId, type);
      toast.success('Hujjat yuklandi');
    } catch (e) {
      console.error(e);
      toast.error('Hujjatni yuklab bo\'lmadi');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="surface-card p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-3">
        Rasmiy hujjatlar
      </h3>
      <div className="flex flex-wrap gap-2">
        {BUTTONS.map(({ type, label, icon: Icon, color }) => {
          // Akt va warranty faqat yakunlangan order uchun aniq mantiqiy
          const disabled = (type === 'act' || type === 'warranty') && !isCompleted;
          return (
            <button
              key={type}
              className={`btn btn-sm ${color}`}
              onClick={() => handleDownload(type)}
              disabled={loading !== null || disabled}
              title={disabled ? "O'rnatish bajarilgandan keyin" : ''}
            >
              {loading === type ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
