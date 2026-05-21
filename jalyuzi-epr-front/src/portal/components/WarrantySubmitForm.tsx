import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import portalApi from '../api/portalAxios';

interface MyOrder {
  id: number;
  orderNumber: string;
  status: string;
  installationDate?: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const ISSUE_TYPES = [
  { value: 'MECHANISM', label: 'Mexanizm nosozligi' },
  { value: 'FABRIC', label: 'Mato yoki tashqi ko\'rinish' },
  { value: 'MOTOR', label: 'Motor / elektronika' },
  { value: 'INSTALLATION', label: 'O\'rnatish xatosi' },
  { value: 'OTHER', label: 'Boshqa' },
];

const ELIGIBLE_STATUSES = ['ORNATISH_BAJARILDI', 'YAKUNLANDI', 'TOLOV_KUTILMOQDA'];

export function WarrantySubmitForm({ onClose, onCreated }: Props) {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderId, setOrderId] = useState<number | ''>('');
  const [issueType, setIssueType] = useState('MECHANISM');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const res = await portalApi.get<{ data: { content: MyOrder[] } }>('/v1/portal/orders?size=50');
      const eligible = (res.data.data.content || []).filter((o) => ELIGIBLE_STATUSES.includes(o.status));
      setOrders(eligible);
    } catch {
      toast.error("Buyurtmalaringizni yuklab bo'lmadi");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleSubmit = async () => {
    if (!orderId) {
      toast.error('Buyurtma tanlang');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      toast.error("Muammoni batafsilroq yozing (kamida 10 ta harf)");
      return;
    }
    setSaving(true);
    try {
      await portalApi.post('/v1/portal/warranty/claims', {
        orderId,
        issueType,
        issueDescription: description.trim(),
        priority,
      });
      toast.success('Shikoyat qabul qilindi. Tez orada aloqaga chiqamiz.');
      onCreated();
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? "Shikoyatni yuborib bo'lmadi";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="card bg-base-100 w-full sm:max-w-lg rounded-b-none sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Yangi shikoyat</h3>
            <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {loadingOrders ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : orders.length === 0 ? (
            <div className="alert alert-warning text-sm">
              Sizda shikoyat qoldirish mumkin bo'lgan buyurtma yo'q.
              Faqat o'rnatish bajarilgan buyurtmalar uchun shikoyat qoldira olasiz.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label-text font-semibold mb-1 block">Qaysi buyurtma?</label>
                <select
                  className="select select-bordered w-full"
                  value={orderId}
                  onChange={(e) => setOrderId(Number(e.target.value) || '')}
                >
                  <option value="">— Buyurtmani tanlang —</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber}
                      {o.installationDate && ` (${new Date(o.installationDate).toLocaleDateString('uz-UZ')})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text font-semibold mb-1 block">Muammo turi</label>
                <select
                  className="select select-bordered w-full"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text font-semibold mb-1 block">
                  Muammoni batafsil yozing
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masalan: 'Roletkani tortganda mexanizm ushlanib qoladi, 2 hafta oldin o'rnatilgandan keyin paydo bo'ldi...'"
                />
                <p className="text-xs text-base-content/50 mt-1">
                  Qanchalik batafsil yozsangiz, shunchalik tez yechiladi.
                </p>
              </div>

              <div>
                <label className="label-text font-semibold mb-1 block">Muhimligi</label>
                <div className="flex gap-2">
                  {[
                    { v: 1, label: 'Past' },
                    { v: 3, label: "O'rta" },
                    { v: 5, label: 'Shoshilinch' },
                  ].map((p) => (
                    <button
                      key={p.v}
                      className={`btn btn-sm flex-1 ${priority === p.v ? 'btn-primary' : 'btn-ghost border-base-300'}`}
                      onClick={() => setPriority(p.v)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary w-full mt-4"
                onClick={handleSubmit}
                disabled={saving || !orderId || description.trim().length < 10}
              >
                {saving && <span className="loading loading-spinner loading-sm" />}
                Shikoyat yuborish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
