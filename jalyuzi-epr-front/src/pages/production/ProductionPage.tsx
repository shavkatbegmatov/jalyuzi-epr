import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Factory,
  AlertTriangle,
  Clock,
  User,
  Hammer,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Flame,
  Maximize2,
  Minimize2,
  Radio,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  productionApi,
  type ProductionOrder,
  type ProductionStage,
} from '../../api/production.api';
import { ProductionOrderModal } from './ProductionOrderModal';
import { ProductionStatsPanel } from './ProductionStatsPanel';
import { useProductionBoardLive } from '../../hooks/useProductionBoardLive';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
}

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

// ===== Bottleneck / dwell-time heat helpers =====
type HeatLevel = 'ok' | 'warn' | 'crit';

function dwellMinutes(order: ProductionOrder, nowMs: number): number | null {
  if (!order.currentStageEnteredAt) return null;
  return Math.max(0, Math.floor((nowMs - new Date(order.currentStageEnteredAt).getTime()) / 60000));
}

function heatLevel(dwellMin: number | null, estimatedMin?: number): HeatLevel {
  if (dwellMin == null || !estimatedMin || estimatedMin <= 0) return 'ok';
  if (dwellMin > estimatedMin * 2) return 'crit';
  if (dwellMin > estimatedMin) return 'warn';
  return 'ok';
}

function formatDwell(min: number | null): string {
  if (min == null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}s ${m}m` : `${m}m`;
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
  estimatedMinutes,
  nowMs,
  tv,
  onClick,
  onDragStart,
}: {
  order: ProductionOrder;
  estimatedMinutes?: number;
  nowMs: number;
  tv: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const priority = PRIORITY_LABELS[order.priority] || PRIORITY_LABELS[3];
  const overdue = isOverdue(order.deadline);
  const dwell = dwellMinutes(order, nowMs);
  const heat = heatLevel(dwell, estimatedMinutes);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={clsx(
        'surface-panel cursor-pointer rounded-lg p-3 transition hover:shadow-md',
        heat === 'crit' && 'border-l-4 border-l-error bg-error/5 animate-pulse',
        heat === 'warn' && 'border-l-4 border-l-warning bg-warning/5',
        heat === 'ok' && overdue && 'border-l-4 border-l-error',
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={clsx('font-mono font-bold text-base-content/70', tv ? 'text-sm' : 'text-xs')}>
          {order.productionNumber}
        </span>
        <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold', priority.color)}>
          {priority.label}
        </span>
      </div>

      <p className={clsx('mb-1 font-semibold line-clamp-1', tv ? 'text-base' : 'text-sm')}>
        {order.productName || '—'}
      </p>

      {order.roomName && (
        <p className="text-xs text-base-content/60">{order.roomName}</p>
      )}

      {(order.widthMm || order.heightMm) && (
        <p className="text-xs text-base-content/60">
          {order.widthMm || 0} × {order.heightMm || 0} mm
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-base-content/60">{order.customerName}</span>
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

      <div className="mt-1.5 flex items-center justify-between gap-2">
        {order.assignedWorkerName ? (
          <div className="flex items-center gap-1 text-xs text-info">
            <User className="h-3 w-3" />
            <span className="truncate">{order.assignedWorkerName}</span>
          </div>
        ) : (
          <span />
        )}

        {/* Dwell-time (bosqichda turgan vaqt) — SLA oshsa rangli */}
        {dwell != null && heat !== 'ok' && (
          <span
            className={clsx(
              'flex items-center gap-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold',
              heat === 'crit' ? 'bg-error/15 text-error' : 'bg-warning/15 text-warning',
            )}
            title={`Bosqichda ${formatDwell(dwell)} (reja: ${estimatedMinutes}m)`}
          >
            <Clock className="h-3 w-3" />
            {formatDwell(dwell)}
          </span>
        )}
      </div>

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
  const [showStats, setShowStats] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [tvMode, setTvMode] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

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

  // Jonli yangilanish uchun board'ni jimgina (spinnersiz) qayta yuklash
  const refreshBoard = useCallback(async () => {
    try {
      setOrders(await productionApi.getBoard());
      setNowMs(Date.now());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // WebSocket: har stage o'zgarishida board jonli yangilanadi
  useProductionBoardLive(refreshBoard, setLiveConnected);

  // Dwell-time issiqlik-rangi vaqt o'tishi bilan yangilanib tursin (30s)
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Fullscreen'dan chiqilsa (Esc) TV rejimini sinxronlash
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setTvMode(false);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleTv = () => {
    setTvMode((v) => {
      const next = !v;
      if (next) document.documentElement.requestFullscreen?.().catch(() => {});
      else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      return next;
    });
  };

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

  const LiveBadge = (
    <span
      className={clsx(
        'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        liveConnected ? 'bg-success/10 text-success' : 'bg-base-300 text-base-content/50',
      )}
      title={liveConnected ? 'Real vaqtda yangilanmoqda' : 'Ulanmoqda...'}
    >
      <Radio className={clsx('h-3 w-3', liveConnected && 'animate-pulse')} />
      {liveConnected ? 'Jonli' : 'Oflayn'}
    </span>
  );

  return (
    <div className={clsx('space-y-4', tvMode && 'fixed inset-0 z-[100] overflow-auto bg-base-200 p-5')}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Factory className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className={clsx('font-bold', tv2(tvMode))}>Ishlab chiqarish</h1>
            <p className="flex items-center gap-2 text-sm text-base-content/60">
              {orders.length} ta faol buyurtma sexda
              {LiveBadge}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!tvMode && (
            <button
              className={clsx('btn btn-sm', showStats ? 'btn-primary' : 'btn-ghost')}
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4" />
              {showStats ? 'Kanban' : 'KPI Statistika'}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => loadData(false)} disabled={refreshing}>
            <RefreshCw className={clsx('h-4 w-4', refreshing && 'animate-spin')} />
            {!tvMode && 'Yangilash'}
          </button>
          <button className={clsx('btn btn-sm', tvMode ? 'btn-primary' : 'btn-ghost')} onClick={toggleTv}>
            {tvMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {tvMode ? 'Chiqish' : 'Devor rejimi'}
          </button>
        </div>
      </div>

      {showStats && !tvMode && <ProductionStatsPanel />}

      {showStats && !tvMode ? null : orders.length === 0 ? (
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
            // Bottleneck: bu bosqichda SLA oshgan kartalar soni
            let crit = 0;
            let warn = 0;
            stageOrders.forEach((o) => {
              const lvl = heatLevel(dwellMinutes(o, nowMs), stage.estimatedMinutes);
              if (lvl === 'crit') crit++;
              else if (lvl === 'warn') warn++;
            });
            const isBottleneck = crit > 0 || warn >= 2;
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
                  'flex flex-shrink-0 flex-col rounded-xl border-2 transition',
                  tvMode ? 'w-80' : 'w-72',
                  isDropTarget
                    ? 'border-primary bg-primary/5'
                    : isBottleneck
                      ? crit > 0
                        ? 'border-error/40 bg-error/5'
                        : 'border-warning/40 bg-warning/5'
                      : 'border-transparent bg-base-200/50',
                )}
              >
                {/* Stage header */}
                <div
                  className="flex items-center justify-between rounded-t-xl px-3 py-2.5"
                  style={{ backgroundColor: `${stage.color}20` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="font-semibold text-sm">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isBottleneck && (
                      <span
                        className={clsx(
                          'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                          crit > 0 ? 'bg-error/15 text-error' : 'bg-warning/15 text-warning',
                        )}
                        title={`${crit + warn} ta karta rejadan oshib ketdi`}
                      >
                        <Flame className="h-3 w-3" />
                        {crit + warn}
                      </span>
                    )}
                    <span className="badge badge-sm">{stageOrders.length}</span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 p-2 min-h-[200px]">
                  {stageOrders.map((order) => (
                    <ProductionCard
                      key={order.id}
                      order={order}
                      estimatedMinutes={stage.estimatedMinutes}
                      nowMs={nowMs}
                      tv={tvMode}
                      onClick={() => setSelectedOrder(order)}
                      onDragStart={() => setDraggedOrderId(order.id)}
                    />
                  ))}
                  {stageOrders.length === 0 && (
                    <p className="py-4 text-center text-xs text-base-content/40">Bo'sh</p>
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

      {selectedOrder && !tvMode && (
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

// TV rejimida sarlavha kattaroq
function tv2(tv: boolean): string {
  return tv ? 'text-3xl' : 'text-2xl';
}
