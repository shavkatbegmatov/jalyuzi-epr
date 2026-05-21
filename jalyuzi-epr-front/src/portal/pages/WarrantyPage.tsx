import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Plus, AlertTriangle, Check, Clock, X } from 'lucide-react';
import portalApi from '../api/portalAxios';
import { WarrantySubmitForm } from '../components/WarrantySubmitForm';

interface WarrantyClaim {
  id: number;
  claimNumber: string;
  orderId: number;
  orderNumber?: string;
  issueType: string;
  issueTypeDisplayName: string;
  issueDescription: string;
  status: string;
  statusDisplayName: string;
  priority: number;
  resolution?: string;
  isWarrantyCovered?: boolean;
  costToCustomer: number;
  createdAt: string;
  resolvedAt?: string;
}

const STATUS_BADGE: Record<string, string> = {
  NEW: 'badge-info',
  IN_PROGRESS: 'badge-warning',
  WAITING_PARTS: 'badge-accent',
  RESOLVED: 'badge-success',
  CLOSED: 'badge-ghost',
  REJECTED: 'badge-error',
};

const STATUS_ICON: Record<string, typeof Check> = {
  NEW: AlertTriangle,
  IN_PROGRESS: Clock,
  WAITING_PARTS: Clock,
  RESOLVED: Check,
  CLOSED: Check,
  REJECTED: X,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function WarrantyPage() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await portalApi.get<{ data: { content: WarrantyClaim[] } }>('/v1/portal/warranty/claims');
      setClaims(res.data.data.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>;
  }

  return (
    <div className="flex flex-col pb-24">
      <div className="sticky top-0 z-40 bg-primary text-primary-content px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Mening shikoyatlarim
        </h1>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          Yangi
        </button>
      </div>

      <div className="p-4 space-y-3">
        {claims.length === 0 ? (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-6 text-center">
              <Check className="h-12 w-12 mx-auto mb-2 text-success/50" />
              <p className="font-semibold">Shikoyatlaringiz yo'q</p>
              <p className="text-sm text-base-content/60 mt-1">
                Agar mahsulot bilan muammo bo'lsa, "Yangi" tugmasini bosib shikoyat qoldiring.
              </p>
            </div>
          </div>
        ) : (
          claims.map((claim) => {
            const Icon = STATUS_ICON[claim.status] || AlertTriangle;
            return (
              <div
                key={claim.id}
                className="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/kabinet/shikoyatlar/${claim.id}`)}
              >
                <div className="card-body p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-base-content/60">{claim.claimNumber}</p>
                      <h3 className="font-semibold mt-1">{claim.issueTypeDisplayName}</h3>
                      <p className="text-sm text-base-content/70 mt-0.5 line-clamp-2">
                        {claim.issueDescription}
                      </p>
                    </div>
                    <span className={`badge badge-sm ${STATUS_BADGE[claim.status] || 'badge-ghost'} gap-1`}>
                      <Icon className="h-3 w-3" />
                      {claim.statusDisplayName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-base-content/50 mt-2">
                    <span>Buyurtma: {claim.orderNumber || '—'}</span>
                    <span>{formatDate(claim.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && (
        <WarrantySubmitForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
