import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalPortal } from '../common/Modal';
import { warrantyApi, type WarrantyIssueType } from '../../api/warranty.api';

interface Props {
  orderId: number;
  // Faqat yakunlangan buyurtmalar uchun ko'rinadi (shikoyat hali boshlanmagan ish uchun mantiqsiz)
  isEligible?: boolean;
}

const ISSUE_TYPES: { value: WarrantyIssueType; label: string }[] = [
  { value: 'MECHANISM', label: 'Mexanizm nosozligi' },
  { value: 'FABRIC', label: 'Mato yoki tashqi ko\'rinish' },
  { value: 'MOTOR', label: 'Motor / elektronika' },
  { value: 'INSTALLATION', label: 'O\'rnatish xatosi' },
  { value: 'OTHER', label: 'Boshqa' },
];

export function WarrantyClaimButton({ orderId, isEligible = true }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<WarrantyIssueType>('MECHANISM');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Muammoni tasvirlab bering");
      return;
    }
    setSaving(true);
    try {
      const claim = await warrantyApi.create({
        orderId,
        issueType,
        issueDescription: description.trim(),
        priority,
      });
      toast.success(`Shikoyat ${claim.claimNumber} yaratildi`);
      setOpen(false);
      setDescription('');
      navigate(`/warranty/${claim.id}`);
    } catch {
      toast.error("Shikoyatni yaratib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  if (!isEligible) return null;

  return (
    <>
      <button
        className="btn btn-warning btn-sm btn-outline"
        onClick={() => setOpen(true)}
        title="Mijoz mahsulot bilan muammo bo'lsa shikoyat yarating"
      >
        <Wrench className="h-4 w-4" />
        Kafolat shikoyati
      </button>

      <ModalPortal isOpen={open} onClose={() => setOpen(false)}>
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Yangi kafolat shikoyati</h3>
              <button className="btn btn-ghost btn-sm btn-square" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="form-label">Muammo turi</label>
                <select
                  className="select select-bordered w-full"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as WarrantyIssueType)}
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Muammoni tasvirlang</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masalan: 'Roletkani torta olmayapman, mexanizm ushlanib qoladi...'"
                />
              </div>

              <div>
                <label className="form-label">Muhimligi</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <button
                      key={p}
                      className={`btn btn-sm ${priority === p ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-base-content/50 mt-1">
                  1 = past, 5 = eng yuqori (shoshilinch)
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>
                Bekor qilish
              </button>
              <button
                className="btn btn-warning"
                onClick={handleSubmit}
                disabled={saving || !description.trim()}
              >
                {saving && <span className="loading loading-spinner loading-sm" />}
                Shikoyat yuborish
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </>
  );
}
