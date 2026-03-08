import { useEffect, useState, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ClipboardList, ChevronRight } from 'lucide-react';
import portalApi from '../api/portalAxios';

interface OutletContextType {
  newNotificationTrigger: number;
}

interface OrderItem {
  id: number;
  orderNumber: string;
  status: string;
  statusDisplayName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  installationAddress?: string;
  notes?: string;
}

interface PagedResponse {
  content: OrderItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
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

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('uz-UZ');
}

export default function OrdersPage() {
  const { newNotificationTrigger } = useOutletContext<OutletContextType>();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchOrders = useCallback(async (pageNum: number, showLoading = true) => {
    try {
      if (showLoading) {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);
      }

      const { data } = await portalApi.get<{ data: PagedResponse }>('/v1/portal/orders', {
        params: { page: pageNum, size: 10 },
      });
      const result = data.data;

      if (pageNum === 0) {
        setOrders(result.content);
      } else {
        setOrders((prev) => [...prev, ...result.content]);
      }

      setHasMore(!result.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Buyurtmalarni yuklashda xatolik', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(0);
  }, [fetchOrders]);

  // WebSocket orqali yangi notification kelganda buyurtmalarni yangilash
  useEffect(() => {
    if (newNotificationTrigger > 0) {
      fetchOrders(0, false);
    }
  }, [newNotificationTrigger, fetchOrders]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchOrders(page + 1);
    }
  };

  const getStatusLabel = (status: string): string => {
    return ORDER_STATUS_LABELS[status] || status;
  };

  const getStatusColor = (status: string): string => {
    return ORDER_STATUS_COLORS[status] || 'badge-ghost';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Page Title */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold">Buyurtmalar</h2>
        <p className="text-sm text-base-content/60">Barcha buyurtmalaringiz</p>
      </div>

      <div className="p-4">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <p className="text-lg font-medium text-base-content/50">Buyurtmalar topilmadi</p>
            <p className="text-sm text-base-content/40 mt-1">
              Hozircha buyurtmalar mavjud emas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/kabinet/buyurtmalar/${order.id}`}
                className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="card-body p-4">
                  {/* Top row: order number + status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold font-mono text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={`badge badge-sm ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="divider my-2"></div>

                  {/* Bottom row: amounts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-base-content/60">Jami summa</p>
                      <p className="font-bold">{formatMoney(order.totalAmount)} so'm</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-base-content/60">To'langan</p>
                      <p className="font-medium text-success">
                        {formatMoney(order.paidAmount)} so'm
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        {order.remainingAmount > 0 && (
                          <>
                            <p className="text-xs text-base-content/60">Qoldiq</p>
                            <p className="font-medium text-error">
                              {formatMoney(order.remainingAmount)} so'm
                            </p>
                          </>
                        )}
                      </div>
                      <ChevronRight className="text-base-content/40 flex-shrink-0" size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                className="btn btn-ghost w-full"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Ko'proq yuklash"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
