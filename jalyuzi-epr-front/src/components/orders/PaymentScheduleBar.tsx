import { useCallback, useEffect, useState } from 'react';
import { Calendar, Check, Clock, AlertTriangle, XCircle, Plus, RotateCw } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  paymentSchedulesApi,
  type PaymentSchedule,
} from '../../api/paymentSchedules.api';
import { formatCurrency } from '../../config/constants';

interface Props {
  orderId: number;
  totalAmount: number;
  canManage?: boolean;
}

const STATUS_CONFIG: Record<PaymentSchedule['status'], { color: string; icon: typeof Check }> = {
  PENDING: { color: 'badge-warning', icon: Clock },
  PARTIAL: { color: 'badge-info', icon: Clock },
  PAID: { color: 'badge-success', icon: Check },
  OVERDUE: { color: 'badge-error', icon: AlertTriangle },
  CANCELLED: { color: 'badge-ghost', icon: XCircle },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function PaymentScheduleBar({ orderId, totalAmount, canManage = false }: Props) {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await paymentSchedulesApi.getByOrder(orderId);
      setSchedules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateStandard = async () => {
    setActionLoading(true);
    try {
      const data = await paymentSchedulesApi.createStandard(orderId);
      setSchedules(data);
      toast.success("Standart 50/30/20 reja yaratildi");
    } catch (e) {
      console.error(e);
      toast.error("Reja yaratib bo'lmadi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (scheduleId: number) => {
    const reason = prompt('Bekor qilish sababini kiriting:');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await paymentSchedulesApi.cancel(orderId, scheduleId, reason);
      await load();
      toast.success('Bekor qilindi');
    } catch (e) {
      console.error(e);
      toast.error("Bekor qilib bo'lmadi");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="surface-card p-4">
        <div className="skeleton h-8 w-48" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
        </div>
      </div>
    );
  }

  const activeSchedules = schedules.filter((s) => s.status !== 'CANCELLED');
  const totalPaid = activeSchedules.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalRemaining = activeSchedules.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);
  const progress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <div className="surface-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          To'lov rejasi
        </h3>
        {canManage && activeSchedules.length === 0 && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCreateStandard}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Standart reja (50/30/20)
          </button>
        )}
      </div>

      {activeSchedules.length === 0 ? (
        <p className="py-4 text-center text-sm text-base-content/40">
          To'lov rejasi yaratilmagan
        </p>
      ) : (
        <>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-base-content/60">
                To'langan: <span className="font-semibold text-success">{formatCurrency(totalPaid)}</span>
              </span>
              <span className="text-base-content/60">
                Qoldiq: <span className="font-semibold text-warning">{formatCurrency(totalRemaining)}</span>
              </span>
            </div>
            <progress
              className="progress progress-success w-full"
              value={progress}
              max="100"
            />
            <p className="mt-0.5 text-center text-xs text-base-content/50">
              {progress.toFixed(0)}% bajarildi
            </p>
          </div>

          {/* Schedule items */}
          <div className="space-y-2">
            {activeSchedules.map((s) => {
              const config = STATUS_CONFIG[s.status];
              const Icon = config.icon;
              return (
                <div
                  key={s.id}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg border p-3',
                    s.status === 'PAID' && 'border-success/30 bg-success/5',
                    s.status === 'OVERDUE' && 'border-error/30 bg-error/5',
                    (s.status === 'PENDING' || s.status === 'PARTIAL') && 'border-base-300',
                  )}
                >
                  <div className="flex-shrink-0">
                    <div className={clsx(
                      'rounded-full p-2',
                      s.status === 'PAID' ? 'bg-success/20' : s.status === 'OVERDUE' ? 'bg-error/20' : 'bg-base-200'
                    )}>
                      <span className="text-sm font-bold">{s.sequenceNo}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{s.label}</span>
                      {s.percentage && (
                        <span className="text-xs text-base-content/50">({s.percentage}%)</span>
                      )}
                      <span className={`badge badge-xs ${config.color} gap-1`}>
                        <Icon className="h-3 w-3" />
                        {s.statusDisplayName}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-base-content/60">
                      Sana: <strong>{formatDate(s.dueDate)}</strong>
                      {s.overdue && s.status !== 'PAID' && (
                        <span className="ml-2 text-error font-semibold">
                          ({Math.abs(s.daysUntilDue)} kun kechikmoqda!)
                        </span>
                      )}
                      {!s.overdue && s.status !== 'PAID' && s.daysUntilDue >= 0 && (
                        <span className="ml-2 text-base-content/40">
                          ({s.daysUntilDue === 0 ? 'bugun' : `${s.daysUntilDue} kun qoldi`})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold">{formatCurrency(s.amount)}</p>
                    {s.paidAmount > 0 && s.paidAmount < s.amount && (
                      <p className="text-xs text-success">
                        {formatCurrency(s.paidAmount)} to'langan
                      </p>
                    )}
                    {canManage && s.status !== 'PAID' && (
                      <button
                        className="btn btn-ghost btn-xs text-error mt-1"
                        onClick={() => handleCancel(s.id)}
                        disabled={actionLoading}
                      >
                        <XCircle className="h-3 w-3" />
                        Bekor
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canManage && activeSchedules.length > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                className="btn btn-ghost btn-xs"
                onClick={handleCreateStandard}
                disabled={actionLoading}
                title="Mavjud reja bekor qilinib, yangi standart 50/30/20 qayta yaratiladi"
              >
                <RotateCw className="h-3 w-3" />
                Qayta yaratish
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
