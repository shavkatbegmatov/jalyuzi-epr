import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  Play,
  UserPlus,
  Banknote,
  X,
  XCircle,
  FileCheck,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders.api';
import { employeesApi } from '../../api/employees.api';
import { formatCurrency, formatDate } from '../../config/constants';
import type { Order, OrderStatus, OrderPaymentType, Employee } from '../../types';

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
  OLCHOV_BAJARILDI: 'badge-accent',
  NARX_TASDIQLANDI: 'badge-primary',
  ZAKLAD_QABUL_QILINDI: 'badge-success',
  ISHLAB_CHIQARISHDA: 'badge-warning',
  TAYYOR: 'badge-accent',
  ORNATISHGA_TAYINLANDI: 'badge-info',
  ORNATISH_JARAYONIDA: 'badge-warning',
  ORNATISH_BAJARILDI: 'badge-success',
  TOLOV_KUTILMOQDA: 'badge-warning',
  YAKUNLANDI: 'badge-success',
  QARZGA_OTKAZILDI: 'badge-error',
  BEKOR_QILINDI: 'badge-ghost',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Naqd',
  CARD: 'Karta',
  TRANSFER: "O'tkazma",
};

export function ManagerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState<'measurer' | 'installer' | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [assignDate, setAssignDate] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState<'deposit' | 'payment' | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState<'cancel' | 'finalize' | 'debt' | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ordersApi.getById(Number(id));
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('Buyurtmani yuklashda xatolik');
      navigate('/manager/orders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  // --- Assign handlers ---
  const openAssignModal = async (type: 'measurer' | 'installer') => {
    setShowAssignModal(type);
    setSelectedEmployeeId('');
    setAssignDate('');
    setAssignNotes('');
    try {
      const data = await employeesApi.getTechnicians();
      setEmployees(data);
    } catch {
      toast.error('Xodimlarni yuklashda xatolik');
    }
  };

  const handleAssign = async () => {
    if (!order || !selectedEmployeeId) return;
    setAssignSubmitting(true);
    try {
      let updated: Order;
      const request = {
        assigneeId: Number(selectedEmployeeId),
        scheduledDate: assignDate || undefined,
        notes: assignNotes || undefined,
      };
      if (showAssignModal === 'measurer') {
        updated = await ordersApi.assignMeasurer(order.id, request);
        toast.success("O'lchuvchi tayinlandi");
      } else {
        updated = await ordersApi.assignInstaller(order.id, request);
        toast.success("O'rnatuvchi tayinlandi");
      }
      setOrder(updated);
      setShowAssignModal(null);
    } catch (error) {
      console.error('Failed to assign:', error);
      toast.error('Tayinlashda xatolik');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // --- Simple action handlers ---
  const handleSimpleAction = async (
    action: () => Promise<Order>,
    successMsg: string,
  ) => {
    setActionLoading(true);
    try {
      const updated = await action();
      setOrder(updated);
      toast.success(successMsg);
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('Amal bajarishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Payment handlers ---
  const openPaymentModal = (type: 'deposit' | 'payment') => {
    if (order) {
      setPaymentAmount(String(order.remainingAmount));
    }
    setPaymentMethod('CASH');
    setPaymentNotes('');
    setShowPaymentModal(type);
  };

  const handlePayment = async () => {
    if (!order) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Summani kiriting");
      return;
    }
    if (amount > order.remainingAmount) {
      toast.error("Summa qoldiq summadan oshib ketdi");
      return;
    }
    setPaymentSubmitting(true);
    try {
      let updated: Order;
      if (showPaymentModal === 'deposit') {
        updated = await ordersApi.receiveDeposit(order.id, {
          paymentType: 'DEPOSIT',
          amount,
          paymentMethod,
          notes: paymentNotes || undefined,
        });
        toast.success('Zaklad qabul qilindi');
      } else {
        const paymentType: OrderPaymentType =
          amount >= order.remainingAmount ? 'FINAL_PAYMENT' : 'PARTIAL_PAYMENT';
        updated = await ordersApi.collectPayment(order.id, {
          paymentType,
          amount,
          paymentMethod,
          notes: paymentNotes || undefined,
        });
        toast.success("To'lov qabul qilindi");
      }
      setOrder(updated);
      setShowPaymentModal(null);
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error("To'lov qabul qilishda xatolik");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // --- Confirm action handlers ---
  const handleConfirmAction = async () => {
    if (!order) return;
    setConfirmSubmitting(true);
    try {
      let updated: Order;
      if (showConfirmModal === 'cancel') {
        updated = await ordersApi.cancelOrder(order.id, confirmNotes || undefined);
        toast.success('Buyurtma bekor qilindi');
      } else if (showConfirmModal === 'finalize') {
        updated = await ordersApi.finalizeOrder(order.id, confirmNotes || undefined);
        toast.success('Buyurtma yakunlandi');
      } else {
        updated = await ordersApi.transferToDebt(order.id, confirmNotes || undefined);
        toast.success("Qarzga o'tkazildi");
      }
      setOrder(updated);
      setShowConfirmModal(null);
    } catch (error) {
      console.error('Confirm action failed:', error);
      toast.error('Amal bajarishda xatolik');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  // --- Payment confirmation ---
  const handleConfirmPayment = async (paymentId: number) => {
    setActionLoading(true);
    try {
      const updated = await ordersApi.confirmPayment(paymentId);
      setOrder(updated);
      toast.success("To'lov tasdiqlandi");
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error("To'lovni tasdiqlashda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-warning"></span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-base-content/50">
        <p className="text-lg font-medium">Buyurtma topilmadi</p>
      </div>
    );
  }

  const isFinal = ['YAKUNLANDI', 'QARZGA_OTKAZILDI', 'BEKOR_QILINDI'].includes(order.status);

  return (
    <div className="space-y-4">
      {/* Back Button + Header */}
      <div className="flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm btn-circle"
          onClick={() => navigate('/manager/orders')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-mono text-lg font-bold">{order.orderNumber}</h2>
        </div>
        <span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Customer Info Card */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-2">
            Mijoz ma'lumotlari
          </h3>
          <div className="space-y-3">
            <div className="font-medium text-base">{order.customerName}</div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-warning shrink-0" />
              <a href={`tel:${order.customerPhone}`} className="link link-warning font-medium">
                {order.customerPhone}
              </a>
            </div>
            {order.installationAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(order.installationAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-warning text-sm"
                >
                  {order.installationAddress}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignments Info */}
      {(order.managerName || order.measurerName || order.installerName) && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-2">
              Tayinlanganlar
            </h3>
            <div className="space-y-2 text-sm">
              {order.managerName && (
                <div className="flex justify-between">
                  <span className="text-base-content/60">Menejer</span>
                  <span className="font-medium">{order.managerName}</span>
                </div>
              )}
              {order.measurerName && (
                <div className="flex justify-between">
                  <span className="text-base-content/60">O'lchuvchi</span>
                  <span className="font-medium">{order.measurerName}</span>
                </div>
              )}
              {order.installerName && (
                <div className="flex justify-between">
                  <span className="text-base-content/60">O'rnatuvchi</span>
                  <span className="font-medium">{order.installerName}</span>
                </div>
              )}
              {order.installationDate && (
                <div className="flex justify-between">
                  <span className="text-base-content/60">O'rnatish sanasi</span>
                  <span className="font-medium">{formatDate(order.installationDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Items Card */}
      {order.items && order.items.length > 0 && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-2">
              Mahsulotlar
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 pb-3 border-b border-base-200 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-base-content/40 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium">{item.productName}</div>
                      {item.roomName && (
                        <div className="text-xs text-base-content/60">Xona: {item.roomName}</div>
                      )}
                      {(item.widthMm || item.heightMm) && (
                        <div className="text-xs text-base-content/60">
                          {item.widthMm}x{item.heightMm} mm
                          {item.calculatedSqm ? ` (${item.calculatedSqm.toFixed(2)} m²)` : ''}
                        </div>
                      )}
                      <div className="text-xs text-base-content/60">
                        {item.quantity} dona
                        {item.installationIncluded && " • O'rnatish bilan"}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Info Card */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-2">
            To'lov ma'lumotlari
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">Jami summa</span>
              <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Chegirma</span>
                <span className="text-error">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">To'langan</span>
              <span className="text-success font-medium">{formatCurrency(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-base-200 pt-2">
              <span className="font-medium">Qoldiq</span>
              <span className={`font-bold ${order.remainingAmount > 0 ? 'text-error' : 'text-success'}`}>
                {formatCurrency(order.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Payment history */}
          {order.payments && order.payments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-base-200">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                To'lov tarixi
              </h4>
              <div className="space-y-2">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-base-content/40" />
                      <span className="text-base-content/70">
                        {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                      </span>
                      {payment.isConfirmed ? (
                        <CheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <button
                          className="btn btn-xs btn-ghost text-warning"
                          onClick={() => handleConfirmPayment(payment.id)}
                          disabled={actionLoading}
                        >
                          Tasdiqlash
                        </button>
                      )}
                    </div>
                    <span className="font-medium text-success">
                      +{formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-2">
              Izohlar
            </h3>
            <p className="text-sm text-base-content/80">{order.notes}</p>
          </div>
        </div>
      )}

      {/* Status History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-2">
              Status tarixi
            </h3>
            <div className="space-y-2">
              {order.statusHistory.slice().reverse().map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 text-xs">
                  <Clock className="h-3 w-3 text-base-content/40 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">{entry.toStatusDisplayName}</span>
                    {entry.changedByName && (
                      <span className="text-base-content/50"> — {entry.changedByName}</span>
                    )}
                    <div className="text-base-content/40">{formatDate(entry.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isFinal && (
        <div className="space-y-2 pb-4">
          {/* YANGI — tayinlash */}
          {order.status === 'YANGI' && (
            <button
              className="btn btn-warning btn-block"
              onClick={() => openAssignModal('measurer')}
              disabled={actionLoading}
            >
              <UserPlus className="h-5 w-5" />
              O'lchuvchi tayinlash
            </button>
          )}

          {/* OLCHOV_BAJARILDI — narx tasdiqlash */}
          {order.status === 'OLCHOV_BAJARILDI' && (
            <button
              className="btn btn-warning btn-block"
              onClick={() => handleSimpleAction(
                () => ordersApi.confirmPrice(order.id),
                'Narx tasdiqlandi'
              )}
              disabled={actionLoading}
            >
              {actionLoading ? <span className="loading loading-spinner loading-sm" /> : <FileCheck className="h-5 w-5" />}
              Narxni tasdiqlash
            </button>
          )}

          {/* NARX_TASDIQLANDI — zaklad olish */}
          {order.status === 'NARX_TASDIQLANDI' && (
            <button
              className="btn btn-success btn-block"
              onClick={() => openPaymentModal('deposit')}
              disabled={actionLoading}
            >
              <Banknote className="h-5 w-5" />
              Zaklad qabul qilish
            </button>
          )}

          {/* ZAKLAD_QABUL_QILINDI — ishlab chiqarishni boshlash */}
          {order.status === 'ZAKLAD_QABUL_QILINDI' && (
            <button
              className="btn btn-warning btn-block"
              onClick={() => handleSimpleAction(
                () => ordersApi.startProduction(order.id),
                'Ishlab chiqarish boshlandi'
              )}
              disabled={actionLoading}
            >
              {actionLoading ? <span className="loading loading-spinner loading-sm" /> : <Play className="h-5 w-5" />}
              Ishlab chiqarishni boshlash
            </button>
          )}

          {/* ISHLAB_CHIQARISHDA — yakunlash */}
          {order.status === 'ISHLAB_CHIQARISHDA' && (
            <button
              className="btn btn-success btn-block"
              onClick={() => handleSimpleAction(
                () => ordersApi.completeProduction(order.id),
                'Ishlab chiqarish yakunlandi'
              )}
              disabled={actionLoading}
            >
              {actionLoading ? <span className="loading loading-spinner loading-sm" /> : <CheckCircle className="h-5 w-5" />}
              Ishlab chiqarishni yakunlash
            </button>
          )}

          {/* TAYYOR — o'rnatuvchi tayinlash */}
          {order.status === 'TAYYOR' && (
            <button
              className="btn btn-warning btn-block"
              onClick={() => openAssignModal('installer')}
              disabled={actionLoading}
            >
              <UserPlus className="h-5 w-5" />
              O'rnatuvchi tayinlash
            </button>
          )}

          {/* ORNATISH_BAJARILDI / TOLOV_KUTILMOQDA — to'lov olish */}
          {(order.status === 'ORNATISH_BAJARILDI' || order.status === 'TOLOV_KUTILMOQDA') && order.remainingAmount > 0 && (
            <button
              className="btn btn-success btn-block"
              onClick={() => openPaymentModal('payment')}
            >
              <CreditCard className="h-5 w-5" />
              To'lov olish
            </button>
          )}

          {/* ORNATISH_BAJARILDI / TOLOV_KUTILMOQDA — yakunlash */}
          {(order.status === 'ORNATISH_BAJARILDI' || order.status === 'TOLOV_KUTILMOQDA') && (
            <>
              {order.remainingAmount <= 0 && (
                <button
                  className="btn btn-success btn-block"
                  onClick={() => {
                    setConfirmNotes('');
                    setShowConfirmModal('finalize');
                  }}
                >
                  <CheckCircle className="h-5 w-5" />
                  Buyurtmani yakunlash
                </button>
              )}
              {order.remainingAmount > 0 && (
                <button
                  className="btn btn-outline btn-warning btn-block"
                  onClick={() => {
                    setConfirmNotes('');
                    setShowConfirmModal('debt');
                  }}
                >
                  <AlertTriangle className="h-5 w-5" />
                  Qarzga o'tkazish
                </button>
              )}
            </>
          )}

          {/* Cancel — har doim */}
          <button
            className="btn btn-outline btn-error btn-block btn-sm"
            onClick={() => {
              setConfirmNotes('');
              setShowConfirmModal('cancel');
            }}
          >
            <XCircle className="h-4 w-4" />
            Bekor qilish
          </button>
        </div>
      )}

      {/* =================== MODALS =================== */}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {showAssignModal === 'measurer' ? "O'lchuvchi tayinlash" : "O'rnatuvchi tayinlash"}
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowAssignModal(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Xodim</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Xodimni tanlang</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.userId || emp.id}>
                      {emp.fullName} {emp.position ? `(${emp.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {showAssignModal === 'installer' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">O'rnatish sanasi</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                  />
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Izoh</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Izoh (ixtiyoriy)"
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowAssignModal(null)} disabled={assignSubmitting}>
                Bekor qilish
              </button>
              <button
                className="btn btn-warning"
                onClick={handleAssign}
                disabled={assignSubmitting || !selectedEmployeeId}
              >
                {assignSubmitting ? <span className="loading loading-spinner loading-sm" /> : <UserPlus className="h-4 w-4" />}
                Tayinlash
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAssignModal(null)} />
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {showPaymentModal === 'deposit' ? 'Zaklad qabul qilish' : "To'lov qabul qilish"}
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowPaymentModal(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Summa</span>
                  <span className="label-text-alt">Qoldiq: {formatCurrency(order.remainingAmount)}</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="Summani kiriting"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min={1}
                  max={order.remainingAmount}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">To'lov usuli</span>
                </label>
                <div className="flex gap-2">
                  {(['CASH', 'CARD', 'TRANSFER'] as const).map((method) => (
                    <button
                      key={method}
                      className={`btn btn-sm flex-1 ${paymentMethod === method ? 'btn-warning' : 'btn-outline'}`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {PAYMENT_METHOD_LABELS[method]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Izoh</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Izoh (ixtiyoriy)"
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowPaymentModal(null)} disabled={paymentSubmitting}>
                Bekor qilish
              </button>
              <button className="btn btn-warning" onClick={handlePayment} disabled={paymentSubmitting}>
                {paymentSubmitting ? <span className="loading loading-spinner loading-sm" /> : <Banknote className="h-4 w-4" />}
                Qabul qilish
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowPaymentModal(null)} />
        </div>
      )}

      {/* Confirm Action Modal */}
      {showConfirmModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                {showConfirmModal === 'cancel' && 'Buyurtmani bekor qilish'}
                {showConfirmModal === 'finalize' && 'Buyurtmani yakunlash'}
                {showConfirmModal === 'debt' && "Qarzga o'tkazish"}
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowConfirmModal(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-base-content/70 mb-4">
              {showConfirmModal === 'cancel' && "Buyurtma bekor qilinadi. Bu amalni ortga qaytarib bo'lmaydi."}
              {showConfirmModal === 'finalize' && "Buyurtma yakunlanadi va sotuv yozuvi yaratiladi."}
              {showConfirmModal === 'debt' && `Qoldiq ${formatCurrency(order.remainingAmount)} qarz sifatida yoziladi.`}
            </p>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Izoh</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Izoh (ixtiyoriy)"
                rows={2}
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowConfirmModal(null)} disabled={confirmSubmitting}>
                Bekor qilish
              </button>
              <button
                className={`btn ${showConfirmModal === 'cancel' ? 'btn-error' : showConfirmModal === 'debt' ? 'btn-warning' : 'btn-success'}`}
                onClick={handleConfirmAction}
                disabled={confirmSubmitting}
              >
                {confirmSubmitting && <span className="loading loading-spinner loading-sm" />}
                {showConfirmModal === 'cancel' && 'Bekor qilish'}
                {showConfirmModal === 'finalize' && 'Yakunlash'}
                {showConfirmModal === 'debt' && "Qarzga o'tkazish"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowConfirmModal(null)} />
        </div>
      )}
    </div>
  );
}
