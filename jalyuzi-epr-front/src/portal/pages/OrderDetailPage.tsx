import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CreditCard, Clock, CheckCircle } from 'lucide-react';
import portalApi from '../api/portalAxios';

interface OrderItemDetail {
  id: number;
  productName: string;
  productSku: string;
  roomName?: string;
  widthMm?: number;
  heightMm?: number;
  quantity: number;
  unitPrice: number;
  installationPrice: number;
  discount: number;
  totalPrice: number;
  installationIncluded: boolean;
}

interface OrderPayment {
  id: number;
  paymentType: string;
  amount: number;
  paymentMethod: string;
  isConfirmed: boolean;
  notes?: string;
  createdAt: string;
}

interface OrderStatusHistory {
  id: number;
  fromStatus?: string;
  fromStatusDisplayName?: string;
  toStatus: string;
  toStatusDisplayName: string;
  changedByName: string;
  notes?: string;
  createdAt: string;
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  status: string;
  statusDisplayName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  installationAddress?: string;
  measurementDate?: string;
  productionStartDate?: string;
  productionEndDate?: string;
  installationDate?: string;
  completedDate?: string;
  createdAt: string;
  notes?: string;
  items?: OrderItemDetail[];
  payments?: OrderPayment[];
  statusHistory?: OrderStatusHistory[];
}

const ORDER_STATUS_LABELS: Record<string, string> = {
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

const ORDER_STATUS_COLORS: Record<string, string> = {
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
  BEKOR_QILINDI: 'badge-ghost',
};

const TIMELINE_PHASES = [
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

const ALL_STATUSES_ORDER = [
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

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Zaklad',
  FINAL_PAYMENT: "Yakuniy to'lov",
  PARTIAL_PAYMENT: "Qisman to'lov",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Naqd',
  CARD: 'Karta',
  TRANSFER: "O'tkazma",
};

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('uz-UZ');
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPhaseIndex(status: string): number {
  if (ALL_STATUSES_ORDER.indexOf(status) === -1) return -1;

  for (let i = 0; i < TIMELINE_PHASES.length; i++) {
    if (TIMELINE_PHASES[i].statuses.includes(status)) {
      return i;
    }
  }
  return -1;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      portalApi
        .get<{ data: OrderDetail }>(`/v1/portal/orders/${id}`)
        .then((res) => setOrder(res.data.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-base-content/60">Buyurtma topilmadi</p>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/kabinet/buyurtmalar')}
        >
          <ArrowLeft size={16} />
          Ortga qaytish
        </button>
      </div>
    );
  }

  const currentPhase = getPhaseIndex(order.status);
  const isCancelled = order.status === 'BEKOR_QILINDI';

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-primary text-primary-content px-4 py-3 flex items-center gap-3">
        <button
          className="btn btn-ghost btn-circle btn-sm"
          onClick={() => navigate('/kabinet/buyurtmalar')}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{order.orderNumber}</h1>
          <p className="text-xs opacity-80">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge badge-sm ${ORDER_STATUS_COLORS[order.status] || 'badge-ghost'}`}>
          {ORDER_STATUS_LABELS[order.status] || order.statusDisplayName}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Timeline */}
        {!isCancelled && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock size={18} />
                Buyurtma holati
              </h3>

              <div className="flex items-start overflow-x-auto pb-2 gap-0">
                {TIMELINE_PHASES.map((phase, index) => {
                  const isCompleted = index < currentPhase;
                  const isCurrent = index === currentPhase;
                  const isPending = index > currentPhase;

                  return (
                    <div key={phase.key} className="flex flex-col items-center flex-shrink-0 min-w-[60px] relative">
                      {/* Connector line left */}
                      {index > 0 && (
                        <div
                          className={`absolute top-3 right-1/2 w-full h-0.5 -z-10 ${
                            isCompleted || isCurrent ? 'bg-primary' : 'bg-base-300'
                          }`}
                        />
                      )}

                      {/* Circle */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                          isCompleted
                            ? 'bg-primary text-primary-content'
                            : isCurrent
                            ? 'bg-primary text-primary-content ring-4 ring-primary/20'
                            : 'bg-base-300 text-base-content/40'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle size={14} />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={`text-[10px] mt-1.5 text-center leading-tight max-w-[56px] ${
                          isCurrent
                            ? 'font-bold text-primary'
                            : isPending
                            ? 'text-base-content/40'
                            : 'text-base-content/70'
                        }`}
                      >
                        {phase.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="card bg-error/10 border border-error/20">
            <div className="card-body p-4 text-center">
              <p className="font-semibold text-error">Buyurtma bekor qilingan</p>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package size={18} />
              Mahsulotlar ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start py-2 border-b border-base-200 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    {item.roomName && (
                      <p className="text-xs text-base-content/60">{item.roomName}</p>
                    )}
                    {(item.widthMm || item.heightMm) && (
                      <p className="text-xs text-base-content/60">
                        {item.widthMm || 0} x {item.heightMm || 0} mm
                      </p>
                    )}
                    <p className="text-xs text-base-content/60">
                      {item.quantity} x {formatMoney(item.unitPrice)} so'm
                    </p>
                    {item.installationIncluded && (
                      <p className="text-xs text-info">
                        O'rnatish: {formatMoney(item.installationPrice)} so'm
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-semibold text-sm">
                      {formatMoney(item.totalPrice)} so'm
                    </p>
                    {item.discount > 0 && (
                      <p className="text-xs text-success">-{formatMoney(item.discount)} so'm</p>
                    )}
                  </div>
                </div>
              ))}

              {(!order.items || order.items.length === 0) && (
                <p className="text-sm text-base-content/50 text-center py-4">
                  Mahsulotlar mavjud emas
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard size={18} />
              Moliyaviy ma'lumotlar
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Oraliq summa</span>
                <span>{formatMoney(order.subtotal)} so'm</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>
                    Chegirma
                    {order.discountPercent > 0 && ` (${order.discountPercent}%)`}
                  </span>
                  <span>-{formatMoney(order.discountAmount)} so'm</span>
                </div>
              )}
              <div className="divider my-1"></div>
              <div className="flex justify-between font-bold">
                <span>Jami summa</span>
                <span>{formatMoney(order.totalAmount)} so'm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">To'langan</span>
                <span className="text-success font-medium">
                  {formatMoney(order.paidAmount)} so'm
                </span>
              </div>
              {order.remainingAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/60">Qoldiq</span>
                  <span className="text-error font-medium">
                    {formatMoney(order.remainingAmount)} so'm
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payments List */}
        {order.payments && order.payments.length > 0 && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard size={18} />
                To'lovlar ({order.payments.length})
              </h3>
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-start justify-between py-2 border-b border-base-200 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                      </p>
                      <p className="text-xs text-base-content/50">
                        {formatDateTime(payment.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-success">
                        +{formatMoney(payment.amount)} so'm
                      </p>
                      {payment.isConfirmed ? (
                        <span className="badge badge-xs badge-success">Tasdiqlangan</span>
                      ) : (
                        <span className="badge badge-xs badge-warning">Kutilmoqda</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock size={18} />
                Holat tarixi
              </h3>
              <div className="space-y-0">
                {order.statusHistory.map((entry, index) => (
                  <div key={entry.id} className="flex gap-3 relative">
                    {/* Timeline line */}
                    {index < order.statusHistory!.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-base-300" />
                    )}

                    {/* Dot */}
                    <div className="flex-shrink-0 mt-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-primary text-primary-content' : 'bg-base-300'
                        }`}
                      >
                        <CheckCircle size={12} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`badge badge-xs ${
                            ORDER_STATUS_COLORS[entry.toStatus] || 'badge-ghost'
                          }`}
                        >
                          {ORDER_STATUS_LABELS[entry.toStatus] || entry.toStatusDisplayName}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        {entry.changedByName}
                      </p>
                      <p className="text-xs text-base-content/50">
                        {formatDateTime(entry.createdAt)}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-base-content/70 mt-1 italic">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-2">Izoh</h3>
              <p className="text-sm text-base-content/70">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Installation Address */}
        {order.installationAddress && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-2">O'rnatish manzili</h3>
              <p className="text-sm text-base-content/70">{order.installationAddress}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
