import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Wrench, Calendar, User, Phone, AlertTriangle, Check, X } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  warrantyApi,
  type WarrantyClaim,
  type WarrantyClaimStatus,
} from '../../api/warranty.api';
import { formatCurrency } from '../../config/constants';

const STATUSES: { value: WarrantyClaimStatus; label: string }[] = [
  { value: 'NEW', label: 'Yangi' },
  { value: 'IN_PROGRESS', label: 'Jarayonda' },
  { value: 'WAITING_PARTS', label: 'Ehtiyot qism kutilmoqda' },
  { value: 'RESOLVED', label: 'Hal qilindi' },
  { value: 'CLOSED', label: 'Yopilgan' },
  { value: 'REJECTED', label: 'Rad etilgan' },
];

function formatDate(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function WarrantyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await warrantyApi.getById(Number(id));
      setClaim(data);
    } catch {
      toast.error("Shikoyatni yuklab bo'lmadi");
      navigate('/warranty');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (newStatus: WarrantyClaimStatus) => {
    if (!claim) return;
    let resolution: string | undefined;
    if (newStatus === 'RESOLVED' || newStatus === 'REJECTED' || newStatus === 'CLOSED') {
      const input = prompt('Yechim/sababni kiriting:');
      if (input === null) return;
      resolution = input;
    }
    try {
      const updated = await warrantyApi.changeStatus(claim.id, newStatus, resolution);
      setClaim(updated);
      toast.success("Holat o'zgartirildi");
    } catch {
      toast.error("Holatni o'zgartirib bo'lmadi");
    }
  };

  const handleSetCoverage = async (covered: boolean) => {
    if (!claim) return;
    let cost: number | undefined;
    if (!covered) {
      const input = prompt("Mijoz to'lashi kerak bo'lgan summa (so'm):");
      if (input === null) return;
      cost = parseFloat(input) || 0;
    }
    try {
      const updated = await warrantyApi.setCoverage(claim.id, covered, cost);
      setClaim(updated);
      toast.success('Saqlandi');
    } catch {
      toast.error("Saqlab bo'lmadi");
    }
  };

  const handleScheduleVisit = async () => {
    if (!claim || !visitDate) return;
    try {
      const updated = await warrantyApi.scheduleVisit(claim.id, {
        scheduledDate: visitDate,
        scheduledTime: visitTime || undefined,
        visitNotes: visitNotes || undefined,
      });
      setClaim(updated);
      setShowVisitModal(false);
      setVisitDate('');
      setVisitTime('');
      setVisitNotes('');
      toast.success('Tashrif belgilandi');
    } catch {
      toast.error("Tashrifni belgilab bo'lmadi");
    }
  };

  const handleCompleteVisit = async (visitId: number) => {
    const action = prompt('Bajarilgan ishni qisqacha yozing:');
    if (action === null) return;
    try {
      const updated = await warrantyApi.completeVisit(visitId, action);
      setClaim(updated);
      toast.success('Tashrif yopildi');
    } catch {
      toast.error("Yopib bo'lmadi");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>;
  }
  if (!claim) return null;

  return (
    <div className="space-y-4">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/warranty')}>
        <ArrowLeft className="h-4 w-4" />
        Orqaga
      </button>

      {/* Header */}
      <div className="surface-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-lg">{claim.claimNumber}</span>
              <span className={clsx('badge', {
                'badge-info': claim.status === 'NEW',
                'badge-warning': claim.status === 'IN_PROGRESS' || claim.status === 'WAITING_PARTS',
                'badge-success': claim.status === 'RESOLVED' || claim.status === 'CLOSED',
                'badge-error': claim.status === 'REJECTED',
              })}>
                {claim.statusDisplayName}
              </span>
            </div>
            <p className="text-sm text-base-content/60">
              {formatDate(claim.createdAt)} {claim.submittedByName && `· ${claim.submittedByName}`}
            </p>
          </div>
          <select
            className="select select-bordered select-sm"
            value={claim.status}
            onChange={(e) => handleStatusChange(e.target.value as WarrantyClaimStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer & Order */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface-card p-4">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Mijoz
          </h3>
          <p className="font-medium">{claim.customerName}</p>
          <p className="text-sm text-base-content/60 flex items-center gap-1 mt-1">
            <Phone className="h-3 w-3" />
            {claim.customerPhone}
          </p>
        </div>
        <div className="surface-card p-4">
          <h3 className="font-semibold text-sm mb-2">Buyurtma</h3>
          <button
            className="btn btn-link btn-sm p-0 font-mono"
            onClick={() => navigate(`/orders/${claim.orderId}`)}
          >
            {claim.orderNumber}
          </button>
        </div>
      </div>

      {/* Issue */}
      <div className="surface-card p-4">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Muammo: {claim.issueTypeDisplayName}
        </h3>
        <p className="text-sm whitespace-pre-wrap">{claim.issueDescription}</p>
      </div>

      {/* Warranty coverage */}
      <div className="surface-card p-4">
        <h3 className="font-semibold text-sm mb-2">Kafolat qoplamasi</h3>
        {claim.isWarrantyCovered === null || claim.isWarrantyCovered === undefined ? (
          <div className="flex gap-2">
            <button className="btn btn-success btn-sm" onClick={() => handleSetCoverage(true)}>
              <Check className="h-4 w-4" />
              Kafolat ostida (tekin)
            </button>
            <button className="btn btn-warning btn-sm" onClick={() => handleSetCoverage(false)}>
              Mijoz to'lashi kerak
            </button>
          </div>
        ) : claim.isWarrantyCovered ? (
          <div className="alert alert-success">
            <Check className="h-5 w-5" />
            <span>Kafolat ostida — tekin ta'mirlanadi</span>
            <button className="btn btn-ghost btn-xs ml-auto" onClick={() => handleSetCoverage(false)}>
              O'zgartirish
            </button>
          </div>
        ) : (
          <div className="alert alert-warning">
            <X className="h-5 w-5" />
            <span>Kafolatdan tashqari — mijoz to'lovi: <strong>{formatCurrency(claim.costToCustomer)}</strong></span>
            <button className="btn btn-ghost btn-xs ml-auto" onClick={() => handleSetCoverage(true)}>
              Kafolatga ko'chirish
            </button>
          </div>
        )}
      </div>

      {/* Service visits */}
      <div className="surface-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Xizmat tashriflari ({claim.visits?.length || 0})
          </h3>
          {!claim.status.includes('CLOSED') && claim.status !== 'REJECTED' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowVisitModal(true)}>
              <Wrench className="h-4 w-4" />
              Tashrif belgilash
            </button>
          )}
        </div>

        {!claim.visits || claim.visits.length === 0 ? (
          <p className="text-center text-sm text-base-content/40 py-4">Tashriflar yo'q</p>
        ) : (
          <div className="space-y-2">
            {claim.visits.map((v) => (
              <div key={v.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {v.scheduledDate} {v.scheduledTime && `· ${v.scheduledTime}`}
                    </p>
                    {v.technicianName && (
                      <p className="text-xs text-base-content/60">Usta: {v.technicianName}</p>
                    )}
                    {v.actionTaken && (
                      <p className="text-xs mt-1 italic">"{v.actionTaken}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-sm ${v.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                      {v.statusDisplayName}
                    </span>
                    {v.status === 'SCHEDULED' && (
                      <button
                        className="btn btn-success btn-xs"
                        onClick={() => handleCompleteVisit(v.id)}
                      >
                        Yopish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution */}
      {claim.resolution && (
        <div className="surface-card p-4">
          <h3 className="font-semibold text-sm mb-2">Yechim</h3>
          <p className="text-sm whitespace-pre-wrap">{claim.resolution}</p>
        </div>
      )}

      {/* Visit modal */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="surface-card max-w-md w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Yangi tashrif belgilash</h3>
              <button className="btn btn-ghost btn-sm btn-square" onClick={() => setShowVisitModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label">Sana</label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Vaqt (ixtiyoriy)</label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Izoh</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Mijoz uchun ko'rsatma yoki ichki eslatma..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowVisitModal(false)}>
                Bekor qilish
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleScheduleVisit}
                disabled={!visitDate}
              >
                Belgilash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
