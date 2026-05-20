import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Factory,
  AlertTriangle,
  Clock,
  User,
  Hammer,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  productionApi,
  type ProductionOrder,
  type ProductionStage,
} from '../../api/production.api';
import { ProductionOrderModal } from './ProductionOrderModal';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
}

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Eng past', color: 'bg-base-300 text-base-content/60' },
  2: { label: 'Past', color: 'bg-info/10 text-info' },
  3: { label: 'O\'rta', color: 'bg-primary/10 text-primary' },
  4: { label: 'Yuqori', color: 'bg-warning/10 text-warning' },
  5: { label: 'Shoshilinch', color: 'bg-error/10 text-error' },
};

function ProductionCard({
  order,
  onClick,
  onDragStart,
}: {
  order: ProductionOrder;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const priority = PRIORITY_LABELS[order.priority] || PRIORITY_LABELS[3];
  const overdue = isOverdue(order.deadline);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={clsx(
        'surface-panel cursor-pointer rounded-lg p-3 transition hover:shadow-md',
        overdue && 'border-l-4 border-l-error',
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-bold text-base-content/70">
          {order.productionNumber}
        </span>
        <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold', priority.color)}>
          {priority.label}
        </span>
      </div>

      <p className="mb-1 font-semibold text-sm line-clamp-1">{order.productName || '—'}</p>

      {order.roomName && (
        <p className="text-xs text-base-content/60">{order.roomName}</p>
      )}

      {(order.widthMm || order.heightMm) && (
        <p className="text-xs text-base-content/60">
          {order.widthMm || 0} × {order.heightMm || 0} mm
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-base-content/60">
          {order.customerName}
        </span>
        {order.deadline && (
          <span
            className={clsx(
              'flex items-center gap-0.5 whitespace-nowrap',
              overdue ? 'text-error font-semibold' : 'text-base-content/50',
            )}
          >
            <Clock className="h-3 w-3" />
            {formatDate(order.deadline)}
          </span>
        )}
      </div>

      {order.assignedWorkerName && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-info">
          <User className="h-3 w-3" />
          <span className="truncate">{order.assignedWorkerName}</span>
        </div>
      )}

      {order.defectReason && (
        <div className="mt-1.5 flex items-center gap-1 rounded bg-error/10 px-1.5 py-0.5 text-xs text-error">
          <AlertTriangle className="h-3 w-3" />
          <span className="truncate">{order.defectReason}</span>
        </div>
      )}
    </div>
  );
}

export function ProductionPage() {
  const [stages, setStages] = useState<ProductionStage[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);

  const loadData = useCallback(async (initial = false) => {
    if (!initial) setRefreshing(true);
    try {
      const [stageList, board] = await Promise.all([
        productionApi.getStages(),
        productionApi.getBoard(),
      ]);
      setStages(stageList);
      setOrders(board);
    } catch (e) {
      console.error(e);
      toast.error('Ma\'lumotlarni yuklab bo\'lmadi');
    } finally {
      if (initial) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const ordersByStage = useMemo(() => {
    const map = new Map<number, ProductionOrder[]>();
    stages.forEach((s) => map.set(s.id, []));
    orders.forEach((o) => {
      if (o.currentStageId && map.has(o.currentStageId)) {
        map.get(o.currentStageId)!.push(o);
      }
    });
    return map;
  }, [stages, orders]);

  const handleDrop = async (stageId: number) => {
    if (!draggedOrderId) return;
    const order = orders.find((o) => o.id === draggedOrderId);
    if (!order || order.currentStageId === stageId) {
      setDraggedOrderId(null);
      setDragOverStageId(null);
      return;
    }

    try {
      const updated = await productionApi.moveToStage(draggedOrderId, { stageId });
      setOrders((prev) =>
        updated.status === 'COMPLETED'
          ? prev.filter((o) => o.id !== updated.id)
          : prev.map((o) => (o.id === updated.id ? updated : o)),
      );
      toast.success(`${order.productionNumber} → ${stages.find((s) => s.id === stageId)?.name}`);
    } catch (e) {
      console.error(e);
      toast.error('Bosqichni o\'zgartirib bo\'lmadi');
    } finally {
      setDraggedOrderId(null);
      setDragOverStageId(null);
    }
  };

  const handleOrderUpdate = (updated: ProductionOrder) => {
    setOrders((prev) =>
      updated.status === 'COMPLETED' || updated.status === 'CANCELLED'
        ? prev.filter((o) => o.id !== updated.id)
        : prev.map((o) => (o.id === updated.id ? updated : o)),
    );
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Factory className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ishlab chiqarish</h1>
            <p className="text-sm text-base-content/60">
              {orders.length} ta faol buyurtma sexda
            </p>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => loadData(false)}
          disabled={refreshing}
        >
          <RefreshCw className={clsx('h-4 w-4', refreshing && 'animate-spin')} />
          Yangilash
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <Hammer className="mx-auto mb-3 h-12 w-12 text-base-content/30" />
          <p className="font-semibold">Hozircha sexda buyurtma yo'q</p>
          <p className="mt-1 text-sm text-base-content/60">
            Buyurtma "Zaklad qabul qilindi" holatiga o'tganda avtomatik sex uchun ochiladi.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageOrders = ordersByStage.get(stage.id) || [];
            const isDropTarget = dragOverStageId === stage.id;
            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStageId(stage.id);
                }}
                onDragLeave={() => setDragOverStageId(null)}
                onDrop={() => handleDrop(stage.id)}
                className={clsx(
                  'flex w-72 flex-shrink-0 flex-col rounded-xl border-2 transition',
                  isDropTarget
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-base-200/50',
                )}
              >
                {/* Stage header */}
                <div
                  className="flex items-center justify-between rounded-t-xl px-3 py-2.5"
                  style={{ backgroundColor: `${stage.color}20` }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-semibold text-sm">{stage.name}</span>
                  </div>
                  <span className="badge badge-sm">{stageOrders.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 p-2 min-h-[200px]">
                  {stageOrders.map((order) => (
                    <ProductionCard
                      key={order.id}
                      order={order}
                      onClick={() => setSelectedOrder(order)}
                      onDragStart={() => setDraggedOrderId(order.id)}
                    />
                  ))}
                  {stageOrders.length === 0 && (
                    <p className="py-4 text-center text-xs text-base-content/40">
                      Bo'sh
                    </p>
                  )}
                </div>

                {/* Next stage hint */}
                {stage.sequence < stages.length && (
                  <div className="border-t border-base-300/50 px-3 py-1.5 text-xs text-base-content/40 flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {stages.find((s) => s.sequence === stage.sequence + 1)?.name || 'Tugadi'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <ProductionOrderModal
          orderId={selectedOrder.id}
          stages={stages}
          onClose={() => setSelectedOrder(null)}
          onUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
}
