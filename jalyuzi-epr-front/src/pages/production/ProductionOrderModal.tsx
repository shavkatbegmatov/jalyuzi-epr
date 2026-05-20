import { useCallback, useEffect, useState } from 'react';
import { X, Clock, User, Package, AlertTriangle, Pause, Play, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalPortal } from '../../components/common/Modal';
import {
  productionApi,
  type ProductionOrder,
  type ProductionStage,
} from '../../api/production.api';

interface Props {
  orderId: number;
  // Kelajakda manual stage tanlash uchun (hozircha drag-drop board orqali harakatlantiramiz)
  stages?: ProductionStage[];
  onClose: () => void;
  onUpdate: (updated: ProductionOrder) => void;
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes?: number): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} daq`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} soat ${m} daq` : `${h} soat`;
}

export function ProductionOrderModal({ orderId, onClose, onUpdate }: Props) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const data = await productionApi.getById(orderId);
      setOrder(data);
    } catch {
      toast.error('Ma\'lumot yuklab bo\'lmadi');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [orderId, onClose]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStatusChange = async (status: 'ON_HOLD' | 'CANCELLED' | 'IN_PROGRESS') => {
    if (!order) return;
    let reason: string | undefined;
    if (status === 'ON_HOLD' || status === 'CANCELLED') {
      const input = prompt('Sababini kiriting:');
      if (input === null) return;
      reason = input;
    }
    setActionLoading(true);
    try {
      const updated = await productionApi.setStatus(order.id, status, reason);
      onUpdate(updated);
      toast.success('Holat o\'zgartirildi');
    } catch {
      toast.error('Holatni o\'zgartirib bo\'lmadi');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ModalPortal isOpen onClose={onClose}>
      <div className="modal modal-open">
        <div className="modal-box max-w-3xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold font-mono">
                {order?.productionNumber || '...'}
              </h3>
              {order && (
                <p className="text-sm text-base-content/60">
                  Buyurtma: {order.orderNumber} • {order.customerName}
                </p>
              )}
            </div>
            <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading || !order ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Product info */}
              <div className="surface-soft rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Mahsulot</span>
                </div>
                <p className="text-sm">{order.productName || '—'}</p>
                {order.roomName && (
                  <p className="text-xs text-base-content/60">Xona: {order.roomName}</p>
                )}
                {(order.widthMm || order.heightMm) && (
                  <p className="text-xs text-base-content/60">
                    O'lcham: {order.widthMm || 0} × {order.heightMm || 0} mm
                  </p>
                )}
              </div>

              {/* Current stage */}
              <div className="surface-soft rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: order.currentStageColor || '#999' }}
                  />
                  <span className="font-semibold text-sm">Hozirgi bosqich</span>
                </div>
                <p className="text-sm">{order.currentStageName || '—'}</p>
                <p className="text-xs text-base-content/60">
                  Holat: <span className="badge badge-sm">{order.statusDisplayName}</span>
                </p>
              </div>

              {/* Worker & deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div className="surface-soft rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-info" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                      Ishchi
                    </span>
                  </div>
                  <p className="text-sm">{order.assignedWorkerName || 'Tayinlanmagan'}</p>
                </div>
                <div className="surface-soft rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                      Muddat
                    </span>
                  </div>
                  <p className="text-sm">
                    {order.deadline ? formatDateTime(order.deadline) : 'Belgilanmagan'}
                  </p>
                </div>
              </div>

              {/* Defect alert */}
              {order.defectReason && (
                <div className="alert alert-error">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold text-sm">Brak/sabab</p>
                    <p className="text-xs">{order.defectReason}</p>
                  </div>
                </div>
              )}

              {/* Stage history */}
              {order.stageHistory && order.stageHistory.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">Bosqichlar tarixi</p>
                  <div className="space-y-1.5">
                    {order.stageHistory.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-2 text-xs border-l-2 pl-2 py-1"
                        style={{ borderLeftColor: h.stageColor || '#999' }}
                      >
                        <span className="font-semibold w-24 truncate">{h.stageName}</span>
                        <span className="text-base-content/60 flex-1">
                          {formatDateTime(h.startedAt)} → {h.completedAt ? formatDateTime(h.completedAt) : 'davom etmoqda'}
                        </span>
                        {h.durationMinutes !== undefined && (
                          <span className="badge badge-xs">{formatDuration(h.durationMinutes)}</span>
                        )}
                        {h.workerName && (
                          <span className="text-info text-[10px]">{h.workerName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {order.materials && order.materials.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">Sarflangan materiallar</p>
                  <div className="overflow-x-auto">
                    <table className="table table-xs">
                      <thead>
                        <tr>
                          <th>Mahsulot</th>
                          <th>Reja</th>
                          <th>Sarflandi</th>
                          <th>Chiqindi</th>
                          <th>Narx</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.materials.map((m) => (
                          <tr key={m.id}>
                            <td className="truncate max-w-32">{m.productName}</td>
                            <td>{m.quantityPlanned} {m.unit}</td>
                            <td>{m.quantityUsed} {m.unit}</td>
                            <td className={m.quantityWasted > 0 ? 'text-error' : ''}>
                              {m.quantityWasted} {m.unit}
                            </td>
                            <td>{m.totalCost ? new Intl.NumberFormat('uz-UZ').format(m.totalCost) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <div className="surface-soft rounded-lg p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-1">
                    Izoh
                  </p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-base-300">
                {order.status === 'IN_PROGRESS' && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => handleStatusChange('ON_HOLD')}
                    disabled={actionLoading}
                  >
                    <Pause className="h-4 w-4" />
                    To'xtatish
                  </button>
                )}
                {order.status === 'ON_HOLD' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    disabled={actionLoading}
                  >
                    <Play className="h-4 w-4" />
                    Davom etish
                  </button>
                )}
                {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                  <button
                    className="btn btn-error btn-sm btn-outline"
                    onClick={() => handleStatusChange('CANCELLED')}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    Bekor qilish
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
