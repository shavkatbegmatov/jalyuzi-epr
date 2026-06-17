import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Factory, ArrowLeft, Package, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { productionApi, type ProductionOrder } from '../../api/production.api';
import { getApiErrorMessage } from '../../utils/errorUtils';

/**
 * QR job-traveler skaneri — ishchi sexda QR'ni telefon kamerasi bilan skanerlab
 * shu sahifaga tushadi va bir tugma bilan keyingi bosqichga o'tkazadi.
 * O'tkazilganda wallboard (STOMP) jonli yangilanadi.
 */
export function ProductionScanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setOrder(await productionApi.getById(Number(id)));
    } catch {
      toast.error('Buyurtma topilmadi');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const advance = async () => {
    if (!id) return;
    setAdvancing(true);
    try {
      const updated = await productionApi.advance(Number(id));
      setOrder(updated);
      toast.success(
        updated.status === 'COMPLETED'
          ? 'Yakunlandi! 🎉'
          : `Keyingi bosqich: ${updated.currentStageName}`,
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Bosqichni o'tkazib bo'lmadi");
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="grid min-h-[70vh] place-items-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold">Buyurtma topilmadi</p>
          <button className="btn btn-ghost btn-sm mt-3" onClick={() => navigate('/production')}>
            <ArrowLeft className="h-4 w-4" /> Sexga qaytish
          </button>
        </div>
      </div>
    );
  }

  const completed = order.status === 'COMPLETED';
  const terminal = completed || order.status === 'CANCELLED';

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center gap-2 text-base-content/60">
        <Factory className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">Sex skaneri</span>
      </div>

      <div className="surface-card rounded-2xl p-5 text-center">
        <div className="font-mono text-2xl font-bold">{order.productionNumber}</div>
        {order.productName && (
          <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-base-content/70">
            <Package className="h-4 w-4" />
            {order.productName}
            {order.roomName ? ` · ${order.roomName}` : ''}
          </div>
        )}
        {(order.widthMm || order.heightMm) && (
          <div className="text-xs text-base-content/50">
            {order.widthMm || 0} × {order.heightMm || 0} mm
          </div>
        )}
        {order.customerName && (
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-base-content/50">
            <User className="h-3 w-3" />
            {order.customerName}
          </div>
        )}

        {/* Joriy bosqich */}
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-base-content/40">Joriy bosqich</div>
          <div
            className="mt-1 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-semibold"
            style={{
              backgroundColor: `${order.currentStageColor || '#6366f1'}20`,
              color: order.currentStageColor || '#6366f1',
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: order.currentStageColor || '#6366f1' }}
            />
            {order.currentStageName || '—'}
          </div>
        </div>
      </div>

      {completed ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-success/10 p-6 text-success">
          <CheckCircle2 className="h-12 w-12" />
          <p className="text-lg font-bold">Ishlab chiqarish yakunlandi</p>
        </div>
      ) : terminal ? (
        <div className="rounded-2xl bg-base-200 p-6 text-center text-base-content/60">
          Bu buyurtma bekor qilingan
        </div>
      ) : (
        <button
          className="btn btn-primary btn-lg btn-block h-16 text-lg"
          onClick={advance}
          disabled={advancing}
        >
          {advancing ? (
            <span className="loading loading-spinner" />
          ) : (
            <>
              Keyingi bosqichga o'tkazish
              <ArrowRight className="h-6 w-6" />
            </>
          )}
        </button>
      )}

      <button className="btn btn-ghost btn-sm btn-block" onClick={() => navigate('/production')}>
        <ArrowLeft className="h-4 w-4" /> Sex doskasiga qaytish
      </button>
    </div>
  );
}
