import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  User,
  Phone,
  MapPin,
  Package,
  Wallet,
  CreditCard,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CircleDollarSign,
  Ruler,
  Factory,
  Wrench,
  CalendarDays,
  FileText,
  ChevronRight,
  BadgeCheck,
  Ban,
} from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { employeesApi } from '../../api/employees.api';
import { usePermission } from '../../hooks/usePermission';
import { formatCurrency, formatDateTime } from '../../config/constants';
import type {
  Order,
  OrderStatus,
  OrderPaymentType,
  Employee,
  OrderAssignRequest,
  OrderPaymentRequest,
} from '../../types';
import toast from 'react-hot-toast';

// ==================== STATUS MAPS ====================

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  YANGI: 'Yangi',
  OLCHOV_KUTILMOQDA: "O'lchov kutilmoqda",
  OLCHOV_BAJARILDI: "O'lchov bajarildi",
  NARX_TASDIQLANDI: 'Narx tasdiqlandi',
  ZAKLAD_QABUL_QILINDI: 'Zaklad qabul qilindi',
  ISHLAB_CHIQARISHDA: 'Ishlab chiqarishda',
  TAYYOR: 'Tayyor',
  ORNATISHGA_TAYINLANDI: "O'rnatishga tayinlandi",
  ORNATISH_JARAYONIDA: "O'rnatish jarayonida",
  ORNATISH_BAJARILDI: "O'rnatish bajarildi",
  TOLOV_KUTILMOQDA: "To'lov kutilmoqda",
  YAKUNLANDI: 'Yakunlandi',
  QARZGA_OTKAZILDI: "Qarzga o'tkazildi",
  BEKOR_QILINDI: 'Bekor qilindi',
};

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  YANGI: 'badge-info',
  OLCHOV_KUTILMOQDA: 'badge-warning',
  OLCHOV_BAJARILDI: 'badge-info',
  NARX_TASDIQLANDI: 'badge-accent',
  ZAKLAD_QABUL_QILINDI: 'badge-primary',
  ISHLAB_CHIQARISHDA: 'badge-secondary',
  TAYYOR: 'badge-success',
  ORNATISHGA_TAYINLANDI: 'badge-warning',
  ORNATISH_JARAYONIDA: 'badge-secondary',
  ORNATISH_BAJARILDI: 'badge-success',
  TOLOV_KUTILMOQDA: 'badge-warning',
  YAKUNLANDI: 'badge-success',
  QARZGA_OTKAZILDI: 'badge-error',
  BEKOR_QILINDI: 'badge-error',
};

// Timeline stepper phases
const TIMELINE_PHASES: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: 'yangi', label: 'Yangi', statuses: ['YANGI'] },
  { key: 'olchov', label: "O'lchov", statuses: ['OLCHOV_KUTILMOQDA', 'OLCHOV_BAJARILDI'] },
  { key: 'narx', label: 'Narx', statuses: ['NARX_TASDIQLANDI'] },
  { key: 'zaklad', label: 'Zaklad', statuses: ['ZAKLAD_QABUL_QILINDI'] },
  { key: 'ishlab', label: 'Ishlab chiqarish', statuses: ['ISHLAB_CHIQARISHDA'] },
  { key: 'tayyor', label: 'Tayyor', statuses: ['TAYYOR'] },
  { key: 'ornatish', label: "O'rnatish", statuses: ['ORNATISHGA_TAYINLANDI', 'ORNATISH_JARAYONIDA', 'ORNATISH_BAJARILDI'] },
  { key: 'tolov', label: "To'lov", statuses: ['TOLOV_KUTILMOQDA'] },
  { key: 'yakunlandi', label: 'Yakunlandi', statuses: ['YAKUNLANDI', 'QARZGA_OTKAZILDI'] },
];

const ALL_STATUSES_ORDER: OrderStatus[] = [
  'YANGI',
  'OLCHOV_KUTILMOQDA',
  'OLCHOV_BAJARILDI',
  'NARX_TASDIQLANDI',
  'ZAKLAD_QABUL_QILINDI',
  'ISHLAB_CHIQARISHDA',
  'TAYYOR',
  'ORNATISHGA_TAYINLANDI',
  'ORNATISH_JARAYONIDA',
  'ORNATISH_BAJARILDI',
  'TOLOV_KUTILMOQDA',
  'YAKUNLANDI',
  'QARZGA_OTKAZILDI',
];

const PAYMENT_TYPE_LABELS: Record<OrderPaymentType, string> = {
  DEPOSIT: 'Zaklad',
  FINAL_PAYMENT: "Yakuniy to'lov",
  PARTIAL_PAYMENT: "Qisman to'lov",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Naqd',
  CARD: 'Karta',
  TRANSFER: "O'tkazma",
};

const FINAL_STATUSES: OrderStatus[] = ['YAKUNLANDI', 'QARZGA_OTKAZILDI', 'BEKOR_QILINDI'];

// ==================== HELPER FUNCTIONS ====================

function getPhaseIndex(status: OrderStatus): number {
  const statusIdx = ALL_STATUSES_ORDER.indexOf(status);
  if (statusIdx === -1) return -1;

  let phaseIdx = 0;
  for (let i = 0; i < TIMELINE_PHASES.length; i++) {
    if (TIMELINE_PHASES[i].statuses.includes(status)) {
      phaseIdx = i;
      break;
    }
  }
  return phaseIdx;
}

function formatDimensionsMm(widthMm?: number, heightMm?: number): string {
  if (!widthMm && !heightMm) return '\u2014';
  return `${widthMm || 0} x ${heightMm || 0} mm`;
}

// ==================== MODALS ====================

interface AssignModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (data: OrderAssignRequest) => void;
  loading: boolean;
  employees: Employee[];
  employeesLoading: boolean;
}

function AssignModal({ open, title, onClose, onSubmit, loading, employees, employeesLoading }: AssignModalProps) {
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!assigneeId) {
      toast.error('Xodimni tanlang');
      return;
    }
    onSubmit({
      assigneeId: Number(assigneeId),
      scheduledDate: scheduledDate || undefined,
      notes: notes || undefined,
    });
  };

  useEffect(() => {
    if (!open) {
      setAssigneeId('');
      setScheduledDate('');
      setNotes('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{title}</h3>

        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Xodim *</span>
            </label>
            {employeesLoading ? (
              <div className="skeleton h-12 w-full" />
            ) : (
              <select
                className="select select-bordered w-full"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Tanlang...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} - {emp.position}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Rejalashtirilgan sana</span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Izoh</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qo'shimcha izoh..."
            />
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Bekor qilish
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !assigneeId}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            Tayinlash
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: OrderPaymentRequest) => void;
  loading: boolean;
  maxAmount?: number;
}

function PaymentModal({ open, onClose, onSubmit, loading, maxAmount }: PaymentModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentType, setPaymentType] = useState<OrderPaymentType>('DEPOSIT');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Summani kiriting");
      return;
    }
    onSubmit({
      paymentType,
      amount: Number(amount),
      paymentMethod: paymentMethod || undefined,
      notes: notes || undefined,
    });
  };

  useEffect(() => {
    if (!open) {
      setAmount('');
      setPaymentType('DEPOSIT');
      setPaymentMethod('CASH');
      setNotes('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">To'lov qabul qilish</h3>

        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Summa *</span>
              {maxAmount !== undefined && maxAmount > 0 && (
                <span className="label-text-alt">
                  Qoldiq: {new Intl.NumberFormat('uz-UZ').format(maxAmount)} so'm
                </span>
              )}
            </label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="Summani kiriting"
              min={0}
            />
            {maxAmount !== undefined && maxAmount > 0 && (
              <label className="label">
                <span />
                <button
                  type="button"
                  className="label-text-alt link link-primary"
                  onClick={() => setAmount(maxAmount)}
                >
                  To'liq summa
                </button>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">To'lov turi *</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as OrderPaymentType)}
            >
              <option value="DEPOSIT">Zaklad</option>
              <option value="PARTIAL_PAYMENT">Qisman to'lov</option>
              <option value="FINAL_PAYMENT">Yakuniy to'lov</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">To'lov usuli *</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">Naqd</option>
              <option value="CARD">Karta</option>
              <option value="TRANSFER">O'tkazma</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Izoh</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qo'shimcha izoh..."
            />
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Bekor qilish
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !amount}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            To'lovni qabul qilish
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

// ==================== CONFIRM MODAL ====================

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmClass?: string;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  loading: boolean;
  showNotes?: boolean;
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Tasdiqlash',
  confirmClass = 'btn-primary',
  onClose,
  onConfirm,
  loading,
  showNotes = false,
}: ConfirmModalProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) setNotes('');
  }, [open]);

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-base-content/70 mb-4">{message}</p>

        {showNotes && (
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Izoh</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Izoh qo'shing..."
            />
          </div>
        )}

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Bekor qilish
          </button>
          <button
            className={`btn ${confirmClass}`}
            onClick={() => onConfirm(notes || undefined)}
            disabled={loading}
          >
            {loading && <span className="loading loading-spinner loading-sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

// ==================== MAIN COMPONENT ====================

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  // Data state
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Employees for assign modals
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // Modal states
  const [assignMeasurerOpen, setAssignMeasurerOpen] = useState(false);
  const [assignInstallerOpen, setAssignInstallerOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmClass: string;
    action: (notes?: string) => Promise<void>;
    showNotes: boolean;
  } | null>(null);

  // ==================== DATA LOADING ====================

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ordersApi.getById(Number(id));
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error("Buyurtmani yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadEmployees = useCallback(async () => {
    try {
      setEmployeesLoading(true);
      const data = await employeesApi.getAll({ size: 100 });
      setEmployees(data.content);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  // ==================== ACTIONS ====================

  const handleAssignMeasurer = async (data: OrderAssignRequest) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.assignMeasurer(order.id, data);
      setOrder(updated);
      setAssignMeasurerOpen(false);
      toast.success("O'lchovchi tayinlandi");
    } catch (error) {
      console.error('Assign measurer failed:', error);
      toast.error("O'lchovchi tayinlashda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignInstaller = async (data: OrderAssignRequest) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.assignInstaller(order.id, data);
      setOrder(updated);
      setAssignInstallerOpen(false);
      toast.success("O'rnatuvchi tayinlandi");
    } catch (error) {
      console.error('Assign installer failed:', error);
      toast.error("O'rnatuvchi tayinlashda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPrice = async (notes?: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.confirmPrice(order.id, notes);
      setOrder(updated);
      setConfirmModal(null);
      toast.success('Narx tasdiqlandi');
    } catch (error) {
      console.error('Confirm price failed:', error);
      toast.error('Narxni tasdiqlashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveDeposit = async (data: OrderPaymentRequest) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.receiveDeposit(order.id, data);
      setOrder(updated);
      setPaymentModalOpen(false);
      toast.success('Zaklad qabul qilindi');
    } catch (error) {
      console.error('Receive deposit failed:', error);
      toast.error('Zaklad qabul qilishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartProduction = async (notes?: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.startProduction(order.id, notes);
      setOrder(updated);
      setConfirmModal(null);
      toast.success('Ishlab chiqarish boshlandi');
    } catch (error) {
      console.error('Start production failed:', error);
      toast.error('Ishlab chiqarishni boshlashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteProduction = async (notes?: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.completeProduction(order.id, notes);
      setOrder(updated);
      setConfirmModal(null);
      toast.success('Ishlab chiqarish yakunlandi');
    } catch (error) {
      console.error('Complete production failed:', error);
      toast.error('Ishlab chiqarishni yakunlashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartInstallation = async (notes?: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.startInstallation(order.id, notes);
      setOrder(updated);
      setConfirmModal(null);
      toast.success("O'rnatish boshlandi");
    } catch (error) {
      console.error('Start installation failed:', error);
      toast.error("O'rnatishni boshlashda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteInstallation = async (notes?: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.completeInstallation(order.id, notes);
      setOrder(updated);
      setConfirmModal(null);
      toast.success("O'rnatish bajarildi");
    } catch (error) {
      console.error('Complete installation failed:', error);
      toast.error("O'rnatishni yakunlashda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollectPayment = async (data: OrderPaymentRequest) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.collectPayment(order.id, data);
      setOrder(updated);
      setPaymentModalOpen(false);
      toast.success("To'lov qabul qilindi");
    } catch (error) {
      console.error('Collect payment failed:', error);
      toast.error("To'lov qabul qilishda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId: number) => {
    try {
      setActionLoading(true);
      const updated = await ordersApi.confirmPayment(paymentId);
      setOrder(updated);
      toast.success("To'lov tasdiqlandi");
    } catch (error) {
      console.error('Confirm payment failed:', error);
      toast.error("To'lovni tasdiqlashda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizeOrder = async (notes?: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.finalizeOrder(order.id, notes);
      setOrder(updated);
      setConfirmModal(null);
      toast.success('Buyurtma yakunlandi');
    } catch (error) {
      console.error('Finalize order failed:', error);
      toast.error('Buyurtmani yakunlashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferToDebt = async (notes?: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.transferToDebt(order.id, notes);
      setOrder(updated);
      setConfirmModal(null);
      toast.success("Qarzga o'tkazildi");
    } catch (error) {
      console.error('Transfer to debt failed:', error);
      toast.error("Qarzga o'tkazishda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (notes?: string) => {
    if (!order) return;
    try {
      setActionLoading(true);
      const updated = await ordersApi.cancelOrder(order.id, notes);
      setOrder(updated);
      setConfirmModal(null);
      toast.success('Buyurtma bekor qilindi');
    } catch (error) {
      console.error('Cancel order failed:', error);
      toast.error('Buyurtmani bekor qilishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== OPEN MODALS HELPERS ====================

  const openAssignMeasurer = () => {
    void loadEmployees();
    setAssignMeasurerOpen(true);
  };

  const openAssignInstaller = () => {
    void loadEmployees();
    setAssignInstallerOpen(true);
  };

  const openPaymentModal = () => {
    setPaymentModalOpen(true);
  };

  const openConfirmModal = (config: {
    title: string;
    message: string;
    confirmLabel: string;
    confirmClass?: string;
    action: (notes?: string) => Promise<void>;
    showNotes?: boolean;
  }) => {
    setConfirmModal({
      open: true,
      title: config.title,
      message: config.message,
      confirmLabel: config.confirmLabel,
      confirmClass: config.confirmClass || 'btn-primary',
      action: config.action,
      showNotes: config.showNotes ?? true,
    });
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 mx-auto text-error mb-4" />
        <h2 className="text-xl font-semibold mb-2">Buyurtma topilmadi</h2>
        <p className="text-base-content/60 mb-6">So'ralgan buyurtma mavjud emas yoki o'chirilgan.</p>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4" />
          Buyurtmalar ro'yxatiga qaytish
        </button>
      </div>
    );
  }

  const status = order.status;
  const currentPhaseIndex = getPhaseIndex(status);
  const isCancelled = status === 'BEKOR_QILINDI';
  const isFinal = FINAL_STATUSES.includes(status);

  // Permission checks
  const canAssign = hasPermission('ORDERS_ASSIGN');
  const canMeasure = hasPermission('ORDERS_MEASURE');
  const canUpdate = hasPermission('ORDERS_UPDATE');
  const canProduce = hasPermission('ORDERS_PRODUCE');
  const canInstall = hasPermission('ORDERS_INSTALL');
  const canCollectPayment = hasPermission('ORDERS_COLLECT_PAYMENT');
  const canConfirmPayment = hasPermission('ORDERS_CONFIRM_PAYMENT');

  return (
    <div className="space-y-6">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="section-title flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              {order.orderNumber}
            </h1>
            <p className="section-subtitle">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge badge-lg ${ORDER_STATUS_COLORS[status]}`}>
            {ORDER_STATUS_LABELS[status]}
          </span>
        </div>
      </div>

      {/* ==================== TIMELINE STEPPER ==================== */}
      {!isCancelled && (
        <div className="surface-card p-4 overflow-x-auto">
          <div className="flex items-center min-w-[600px]">
            {TIMELINE_PHASES.map((phase, idx) => {
              const isCompleted = idx < currentPhaseIndex;
              const isCurrent = idx === currentPhaseIndex;
              const isUpcoming = idx > currentPhaseIndex;

              return (
                <div key={phase.key} className="flex items-center flex-1 last:flex-none">
                  {/* Circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        isCompleted
                          ? 'bg-success text-success-content'
                          : isCurrent
                            ? 'bg-primary text-primary-content ring-4 ring-primary/30'
                            : 'bg-base-300 text-base-content/40'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 whitespace-nowrap ${
                        isCurrent
                          ? 'font-semibold text-primary'
                          : isCompleted
                            ? 'text-success'
                            : 'text-base-content/40'
                      }`}
                    >
                      {phase.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {idx < TIMELINE_PHASES.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-16px] ${
                        isCompleted
                          ? 'bg-success'
                          : isCurrent
                            ? 'bg-gradient-to-r from-primary to-base-300'
                            : isUpcoming
                              ? 'bg-base-300'
                              : 'bg-base-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="alert alert-error">
          <XCircle className="h-5 w-5" />
          <span>Bu buyurtma bekor qilingan.</span>
        </div>
      )}

      {/* ==================== ACTION BUTTONS ==================== */}
      {!isFinal && (
        <div className="flex flex-wrap gap-2">
          {/* YANGI -> Assign measurer */}
          {status === 'YANGI' && canAssign && (
            <button className="btn btn-primary btn-sm" onClick={openAssignMeasurer}>
              <Ruler className="h-4 w-4" />
              O'lchovchi tayinlash
            </button>
          )}

          {/* OLCHOV_KUTILMOQDA -> Enter measurement */}
          {status === 'OLCHOV_KUTILMOQDA' && canMeasure && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/orders/${order.id}/measure`)}
            >
              <Ruler className="h-4 w-4" />
              O'lchov kiritish
            </button>
          )}

          {/* OLCHOV_BAJARILDI -> Confirm price */}
          {status === 'OLCHOV_BAJARILDI' && canUpdate && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                openConfirmModal({
                  title: 'Narxni tasdiqlash',
                  message: `Buyurtma narxini tasdiqlaysizmi? Jami: ${formatCurrency(order.totalAmount)}`,
                  confirmLabel: 'Tasdiqlash',
                  action: handleConfirmPrice,
                })
              }
            >
              <CircleDollarSign className="h-4 w-4" />
              Narxni tasdiqlash
            </button>
          )}

          {/* NARX_TASDIQLANDI -> Receive deposit */}
          {status === 'NARX_TASDIQLANDI' && canCollectPayment && (
            <button className="btn btn-primary btn-sm" onClick={openPaymentModal}>
              <Wallet className="h-4 w-4" />
              Zaklad olish
            </button>
          )}

          {/* ZAKLAD_QABUL_QILINDI -> Start production */}
          {status === 'ZAKLAD_QABUL_QILINDI' && canProduce && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                openConfirmModal({
                  title: 'Ishlab chiqarishni boshlash',
                  message: 'Ishlab chiqarish jarayonini boshlaysizmi?',
                  confirmLabel: 'Boshlash',
                  action: handleStartProduction,
                })
              }
            >
              <Factory className="h-4 w-4" />
              Ishlab chiqarishni boshlash
            </button>
          )}

          {/* ISHLAB_CHIQARISHDA -> Complete production */}
          {status === 'ISHLAB_CHIQARISHDA' && canProduce && (
            <button
              className="btn btn-success btn-sm"
              onClick={() =>
                openConfirmModal({
                  title: 'Ishlab chiqarish tayyor',
                  message: 'Mahsulot tayyor bo\'ldimi?',
                  confirmLabel: 'Tayyor',
                  confirmClass: 'btn-success',
                  action: handleCompleteProduction,
                })
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              Tayyor
            </button>
          )}

          {/* TAYYOR -> Assign installer */}
          {status === 'TAYYOR' && canAssign && (
            <button className="btn btn-primary btn-sm" onClick={openAssignInstaller}>
              <Wrench className="h-4 w-4" />
              O'rnatuvchi tayinlash
            </button>
          )}

          {/* ORNATISHGA_TAYINLANDI -> Start installation */}
          {status === 'ORNATISHGA_TAYINLANDI' && canInstall && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                openConfirmModal({
                  title: "O'rnatishni boshlash",
                  message: "O'rnatish jarayonini boshlaysizmi?",
                  confirmLabel: 'Boshlash',
                  action: handleStartInstallation,
                })
              }
            >
              <Wrench className="h-4 w-4" />
              O'rnatishni boshlash
            </button>
          )}

          {/* ORNATISH_JARAYONIDA -> Complete installation */}
          {status === 'ORNATISH_JARAYONIDA' && canInstall && (
            <button
              className="btn btn-success btn-sm"
              onClick={() =>
                openConfirmModal({
                  title: "O'rnatish bajarildi",
                  message: "O'rnatish muvaffaqiyatli yakunlandimi?",
                  confirmLabel: 'Bajarildi',
                  confirmClass: 'btn-success',
                  action: handleCompleteInstallation,
                })
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              O'rnatish bajarildi
            </button>
          )}

          {/* ORNATISH_BAJARILDI / TOLOV_KUTILMOQDA -> Collect payment */}
          {(status === 'ORNATISH_BAJARILDI' || status === 'TOLOV_KUTILMOQDA') && canCollectPayment && (
            <button className="btn btn-primary btn-sm" onClick={openPaymentModal}>
              <CreditCard className="h-4 w-4" />
              To'lov olish
            </button>
          )}

          {/* TOLOV_KUTILMOQDA -> Finalize */}
          {status === 'TOLOV_KUTILMOQDA' && canUpdate && (
            <>
              <button
                className="btn btn-success btn-sm"
                onClick={() =>
                  openConfirmModal({
                    title: 'Buyurtmani yakunlash',
                    message: 'Buyurtma to\'liq yakunlansinmi?',
                    confirmLabel: 'Yakunlash',
                    confirmClass: 'btn-success',
                    action: handleFinalizeOrder,
                  })
                }
              >
                <BadgeCheck className="h-4 w-4" />
                Yakunlash
              </button>
              <button
                className="btn btn-warning btn-sm"
                onClick={() =>
                  openConfirmModal({
                    title: "Qarzga o'tkazish",
                    message: "Qoldiq summani qarzga o'tkazasizmi?",
                    confirmLabel: "Qarzga o'tkazish",
                    confirmClass: 'btn-warning',
                    action: handleTransferToDebt,
                  })
                }
              >
                <Receipt className="h-4 w-4" />
                Qarzga o'tkazish
              </button>
            </>
          )}

          {/* Cancel button (any non-final status) */}
          {canUpdate && (
            <button
              className="btn btn-error btn-outline btn-sm"
              onClick={() =>
                openConfirmModal({
                  title: 'Buyurtmani bekor qilish',
                  message: 'Haqiqatan ham bu buyurtmani bekor qilmoqchimisiz? Bu amalni qaytarib bo\'lmaydi.',
                  confirmLabel: 'Bekor qilish',
                  confirmClass: 'btn-error',
                  action: handleCancelOrder,
                  showNotes: true,
                })
              }
            >
              <Ban className="h-4 w-4" />
              Bekor qilish
            </button>
          )}
        </div>
      )}

      {/* ==================== CUSTOMER INFO + ASSIGNED STAFF ==================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer Info Card */}
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4">
            Mijoz ma'lumotlari
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-base-200 p-2">
                <User className="h-4 w-4 text-base-content/60" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Mijoz</p>
                <p className="font-semibold">{order.customerName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-base-200 p-2">
                <Phone className="h-4 w-4 text-base-content/60" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Telefon</p>
                <p className="font-semibold">{order.customerPhone}</p>
              </div>
            </div>

            {order.installationAddress && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-base-200 p-2">
                  <MapPin className="h-4 w-4 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">O'rnatish manzili</p>
                  <p className="font-semibold">{order.installationAddress}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Staff */}
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4">
            Tayinlangan xodimlar
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base-content/70">Menejer</span>
              <span className="font-semibold">{order.managerName || order.createdByName || '\u2014'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base-content/70">O'lchovchi</span>
              <span className="font-semibold">{order.measurerName || '\u2014'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base-content/70">O'rnatuvchi</span>
              <span className="font-semibold">{order.installerName || '\u2014'}</span>
            </div>

            <div className="divider my-1" />

            {order.measurementDate && (
              <div className="flex items-center justify-between">
                <span className="text-base-content/70 text-sm">O'lchov sanasi</span>
                <span className="text-sm">{formatDateTime(order.measurementDate)}</span>
              </div>
            )}
            {order.productionStartDate && (
              <div className="flex items-center justify-between">
                <span className="text-base-content/70 text-sm">Ishlab chiqarish boshi</span>
                <span className="text-sm">{formatDateTime(order.productionStartDate)}</span>
              </div>
            )}
            {order.productionEndDate && (
              <div className="flex items-center justify-between">
                <span className="text-base-content/70 text-sm">Ishlab chiqarish tugashi</span>
                <span className="text-sm">{formatDateTime(order.productionEndDate)}</span>
              </div>
            )}
            {order.installationDate && (
              <div className="flex items-center justify-between">
                <span className="text-base-content/70 text-sm">O'rnatish sanasi</span>
                <span className="text-sm">{formatDateTime(order.installationDate)}</span>
              </div>
            )}
            {order.completedDate && (
              <div className="flex items-center justify-between">
                <span className="text-base-content/70 text-sm">Yakunlanish sanasi</span>
                <span className="text-sm">{formatDateTime(order.completedDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== ITEMS TABLE ==================== */}
      {order.items && order.items.length > 0 && (
        <div className="surface-card">
          <div className="p-4 border-b border-base-200">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Buyurtma mahsulotlari ({order.items.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mahsulot</th>
                  <th>Xona</th>
                  <th className="text-center">O'lcham</th>
                  <th className="text-right">m²</th>
                  <th className="text-right">Miqdor</th>
                  <th className="text-right">Narx</th>
                  <th className="text-center">O'rnatish</th>
                  <th className="text-right">Jami</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-base-content/60">{index + 1}</td>
                    <td>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-base-content/60">{item.productSku}</p>
                      </div>
                    </td>
                    <td className="text-base-content/70">{item.roomName || '\u2014'}</td>
                    <td className="text-center text-sm">
                      {formatDimensionsMm(item.widthMm, item.heightMm)}
                    </td>
                    <td className="text-right text-sm">
                      {item.calculatedSqm ? item.calculatedSqm.toFixed(2) : '\u2014'}
                    </td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right text-sm">
                      {new Intl.NumberFormat('uz-UZ').format(item.unitPrice)} so'm
                    </td>
                    <td className="text-center">
                      {item.installationIncluded ? (
                        <span className="badge badge-success badge-xs">Ha</span>
                      ) : (
                        <span className="badge badge-ghost badge-xs">Yo'q</span>
                      )}
                    </td>
                    <td className="text-right font-semibold">
                      {new Intl.NumberFormat('uz-UZ').format(item.totalPrice)} so'm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== FINANCIAL SUMMARY ==================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Moliyaviy xulosa
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-base-200">
              <span className="text-base-content/70">Oraliq summa</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('uz-UZ').format(order.subtotal)} so'm
              </span>
            </div>

            {(order.discountAmount > 0 || order.discountPercent > 0) && (
              <div className="flex items-center justify-between py-2 border-b border-base-200">
                <span className="text-base-content/70">Chegirma</span>
                <span className="font-semibold text-warning">
                  -{new Intl.NumberFormat('uz-UZ').format(order.discountAmount)} so'm
                  {order.discountPercent > 0 && ` (${order.discountPercent}%)`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-base-200">
              <span className="text-base-content/70 font-medium">Jami</span>
              <span className="font-bold text-lg">
                {new Intl.NumberFormat('uz-UZ').format(order.totalAmount)} so'm
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-base-200">
              <span className="text-base-content/70">To'langan</span>
              <span className="font-semibold text-success">
                {new Intl.NumberFormat('uz-UZ').format(order.paidAmount)} so'm
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-base-content/70">Qoldiq</span>
              <span
                className={`font-semibold ${order.remainingAmount > 0 ? 'text-error' : 'text-success'}`}
              >
                {new Intl.NumberFormat('uz-UZ').format(order.remainingAmount)} so'm
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Qo'shimcha ma'lumotlar
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base-content/70">Yaratuvchi</span>
              <span className="font-semibold">{order.createdByName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base-content/70">Yaratilgan sana</span>
              <span className="font-semibold">{formatDateTime(order.createdAt)}</span>
            </div>
            {order.notes && (
              <>
                <div className="divider my-1" />
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Izoh</p>
                  <p className="text-base-content/80 whitespace-pre-wrap">{order.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================== PAYMENTS LIST ==================== */}
      {order.payments && order.payments.length > 0 && (
        <div className="surface-card">
          <div className="p-4 border-b border-base-200">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              To'lovlar ({order.payments.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Turi</th>
                  <th className="text-right">Summa</th>
                  <th>Usul</th>
                  <th>Qabul qiluvchi</th>
                  <th>Sana</th>
                  <th className="text-center">Holat</th>
                  {canConfirmPayment && <th className="text-center">Amal</th>}
                </tr>
              </thead>
              <tbody>
                {order.payments.map((payment, index) => (
                  <tr key={payment.id}>
                    <td className="text-base-content/60">{index + 1}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
                      </span>
                    </td>
                    <td className="text-right font-semibold">
                      {new Intl.NumberFormat('uz-UZ').format(payment.amount)} so'm
                    </td>
                    <td>
                      {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                    </td>
                    <td className="text-base-content/70">{payment.collectedByName || '\u2014'}</td>
                    <td className="text-sm">{formatDateTime(payment.createdAt)}</td>
                    <td className="text-center">
                      {payment.isConfirmed ? (
                        <span className="badge badge-success badge-sm gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Tasdiqlangan
                        </span>
                      ) : (
                        <span className="badge badge-warning badge-sm gap-1">
                          <Clock className="h-3 w-3" />
                          Kutilmoqda
                        </span>
                      )}
                    </td>
                    {canConfirmPayment && (
                      <td className="text-center">
                        {!payment.isConfirmed && (
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => handleConfirmPayment(payment.id)}
                            disabled={actionLoading}
                          >
                            Tasdiqlash
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="text-right font-semibold">Jami to'langan:</td>
                  <td className="text-right font-bold text-success">
                    {new Intl.NumberFormat('uz-UZ').format(order.paidAmount)} so'm
                  </td>
                  <td colSpan={canConfirmPayment ? 5 : 4} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ==================== STATUS HISTORY ==================== */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Status tarixi
          </h3>
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-base-300" />

            <div className="space-y-4">
              {order.statusHistory.map((entry, index) => (
                <div key={entry.id} className="flex gap-4 relative">
                  {/* Timeline dot */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      index === 0
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-200 text-base-content/60'
                    }`}
                  >
                    {index === 0 ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <CalendarDays className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {entry.fromStatusDisplayName && (
                        <>
                          <span className="badge badge-ghost badge-sm">
                            {entry.fromStatusDisplayName}
                          </span>
                          <ChevronRight className="h-3 w-3 text-base-content/40" />
                        </>
                      )}
                      <span
                        className={`badge badge-sm ${
                          entry.toStatus ? ORDER_STATUS_COLORS[entry.toStatus] || 'badge-ghost' : 'badge-ghost'
                        }`}
                      >
                        {entry.toStatusDisplayName}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/60">
                      <span>{entry.changedByName}</span>
                      <span>{formatDateTime(entry.createdAt)}</span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-base-content/70 mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== BACK BUTTON ==================== */}
      <div className="flex justify-start">
        <button className="btn btn-ghost" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4" />
          Buyurtmalar ro'yxatiga qaytish
        </button>
      </div>

      {/* ==================== MODALS ==================== */}
      <AssignModal
        open={assignMeasurerOpen}
        title="O'lchovchi tayinlash"
        onClose={() => setAssignMeasurerOpen(false)}
        onSubmit={handleAssignMeasurer}
        loading={actionLoading}
        employees={employees}
        employeesLoading={employeesLoading}
      />

      <AssignModal
        open={assignInstallerOpen}
        title="O'rnatuvchi tayinlash"
        onClose={() => setAssignInstallerOpen(false)}
        onSubmit={handleAssignInstaller}
        loading={actionLoading}
        employees={employees}
        employeesLoading={employeesLoading}
      />

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={
          status === 'NARX_TASDIQLANDI'
            ? handleReceiveDeposit
            : handleCollectPayment
        }
        loading={actionLoading}
        maxAmount={order.remainingAmount}
      />

      {confirmModal && (
        <ConfirmModal
          open={confirmModal.open}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmClass={confirmModal.confirmClass}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.action}
          loading={actionLoading}
          showNotes={confirmModal.showNotes}
        />
      )}
    </div>
  );
}
