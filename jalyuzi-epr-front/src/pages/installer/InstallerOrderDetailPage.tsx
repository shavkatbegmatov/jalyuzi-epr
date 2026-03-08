import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Banknote,
  Play,
  CheckCircle,
  Package,
  Clock,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders.api';
import { formatCurrency } from '../../config/constants';
import type { Order, OrderPaymentType, OrderStatus } from '../../types';

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

export function InstallerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ordersApi.getById(Number(id));
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('Buyurtmani yuklashda xatolik');
      navigate('/installer');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleStartInstallation = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.startInstallation(order.id);
      setOrder(updated);
      toast.success("O'rnatish boshlandi");
    } catch (error) {
      console.error('Failed to start installation:', error);
      toast.error("O'rnatishni boshlashda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteInstallation = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.completeInstallation(order.id);
      setOrder(updated);
      toast.success("O'rnatish bajarildi");
    } catch (error) {
      console.error('Failed to complete installation:', error);
      toast.error("O'rnatishni yakunlashda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  const openPaymentModal = () => {
    if (order) {
      setPaymentAmount(String(order.remainingAmount));
    }
    setPaymentMethod('CASH');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleCollectPayment = async () => {
    if (!order) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("To'lov summasini kiriting");
      return;
    }
    if (amount > order.remainingAmount) {
      toast.error("Summa qoldiq summadan oshib ketdi");
      return;
    }

    setPaymentSubmitting(true);
    try {
      const paymentType: OrderPaymentType =
        amount >= order.remainingAmount ? 'FINAL_PAYMENT' : 'PARTIAL_PAYMENT';

      const updated = await ordersApi.collectPayment(order.id, {
        paymentType,
        amount,
        paymentMethod,
        notes: paymentNotes || undefined,
      });
      setOrder(updated);
      setShowPaymentModal(false);
      toast.success("To'lov muvaffaqiyatli qabul qilindi");
    } catch (error) {
      console.error('Failed to collect payment:', error);
      toast.error("To'lovni qabul qilishda xatolik");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary"></span>
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

  const canStartInstallation = order.status === 'ORNATISHGA_TAYINLANDI';
  const canCompleteInstallation = order.status === 'ORNATISH_JARAYONIDA';
  const canCollectPayment =
    (order.status === 'ORNATISH_BAJARILDI' || order.status === 'TOLOV_KUTILMOQDA') &&
    order.remainingAmount > 0;

  return (
    <div className="space-y-4">
      {/* Back Button + Header */}
      <div className="flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm btn-circle"
          onClick={() => navigate('/installer')}
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
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <a
                href={`tel:${order.customerPhone}`}
                className="link link-primary font-medium"
              >
                {order.customerPhone}
              </a>
            </div>
            {order.installationAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(order.installationAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary text-sm"
                >
                  {order.installationAddress}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items Card */}
      {order.items && order.items.length > 0 && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-2">
              Buyurtma mahsulotlari
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
                        <div className="text-xs text-base-content/60">
                          Xona: {item.roomName}
                        </div>
                      )}
                      {(item.widthMm || item.heightMm) && (
                        <div className="text-xs text-base-content/60">
                          {item.widthMm}x{item.heightMm} mm
                          {item.calculatedSqm
                            ? ` (${item.calculatedSqm.toFixed(2)} m\u00B2)`
                            : ''}
                        </div>
                      )}
                      <div className="text-xs text-base-content/60">
                        {item.quantity} dona
                        {item.installationIncluded && ' \u2022 O\'rnatish bilan'}
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
              <span className="text-success font-medium">
                {formatCurrency(order.paidAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-base-200 pt-2">
              <span className="font-medium">Qoldiq</span>
              <span
                className={`font-bold ${
                  order.remainingAmount > 0 ? 'text-error' : 'text-success'
                }`}
              >
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
                  <div
                    key={payment.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-base-content/40" />
                      <span className="text-base-content/70">
                        {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                      </span>
                      {payment.isConfirmed && (
                        <CheckCircle className="h-3 w-3 text-success" />
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

      {/* Action Buttons */}
      <div className="space-y-3 pb-4">
        {canStartInstallation && (
          <button
            className="btn btn-success btn-block"
            onClick={handleStartInstallation}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Play className="h-5 w-5" />
            )}
            O'rnatishni boshlash
          </button>
        )}

        {canCompleteInstallation && (
          <button
            className="btn btn-success btn-block"
            onClick={handleCompleteInstallation}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            O'rnatish bajarildi
          </button>
        )}

        {canCollectPayment && (
          <button
            className="btn btn-primary btn-block"
            onClick={openPaymentModal}
          >
            <Banknote className="h-5 w-5" />
            To'lov olish
          </button>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">To'lov qabul qilish</h3>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowPaymentModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Amount */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Summa</span>
                  <span className="label-text-alt">
                    Qoldiq: {formatCurrency(order.remainingAmount)}
                  </span>
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

              {/* Payment Method */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">To'lov usuli</span>
                </label>
                <div className="flex gap-2">
                  {(['CASH', 'CARD', 'TRANSFER'] as const).map((method) => (
                    <button
                      key={method}
                      className={`btn btn-sm flex-1 ${
                        paymentMethod === method ? 'btn-primary' : 'btn-outline'
                      }`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {PAYMENT_METHOD_LABELS[method]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
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
              <button
                className="btn btn-ghost"
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentSubmitting}
              >
                Bekor qilish
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCollectPayment}
                disabled={paymentSubmitting}
              >
                {paymentSubmitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Banknote className="h-4 w-4" />
                )}
                To'lovni qabul qilish
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowPaymentModal(false)}
          ></div>
        </div>
      )}
    </div>
  );
}
