import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Calendar,
  User,
  MapPin,
  Phone,
  RefreshCw,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders.api';
import type { Order, OrderStatus } from '../../types';
import { ORDER_STATUSES, formatDateTime } from '../../config/constants';
import { usePermission } from '../../hooks/usePermission';

// O'rnatish bosqichidagi statuslar uchun filtr tablari.
// Manba — Order lifecycle (ORNATISHGA_TAYINLANDI → ORNATISH_JARAYONIDA → ORNATISH_BAJARILDI).
const STATUS_TABS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Barchasi' },
  { value: 'ORNATISHGA_TAYINLANDI', label: 'Tayinlangan' },
  { value: 'ORNATISH_JARAYONIDA', label: 'Jarayonda' },
  { value: 'ORNATISH_BAJARILDI', label: 'Bajarildi' },
];

export function InstallationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canInstallOrders } = usePermission();

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['installation-orders', statusFilter, page],
    queryFn: () =>
      ordersApi.getInstallations({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        size: 20,
      }),
  });

  // O'rnatishni boshlash — yagona xavfsiz inline amal (oldindan shart talab qilmaydi).
  // Yakunlash montaj akti (foto + imzo) talab qiladi, shuning uchun u buyurtma sahifasida.
  const startMutation = useMutation({
    mutationFn: (id: number) => ordersApi.startInstallation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-orders'] });
      toast.success("O'rnatish boshlandi");
    },
    onError: () => toast.error("O'rnatishni boshlashda xatolik"),
  });

  const orders = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleTabChange = (value: OrderStatus | 'ALL') => {
    setStatusFilter(value);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">O'rnatishlar</h1>
          <p className="text-sm text-base-content/60">
            O'rnatishga tayinlangan buyurtmalar
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Yangilash
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={clsx(
              'btn btn-sm',
              statusFilter === tab.value ? 'btn-primary' : 'btn-ghost'
            )}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : isError ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-error/60" />
            <p className="text-base-content/60">Ma'lumotlarni yuklashda xatolik yuz berdi</p>
            <button className="btn btn-sm btn-outline" onClick={() => refetch()}>
              Qayta urinish
            </button>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center py-12 text-center">
            <Wrench className="h-12 w-12 text-base-content/30" />
            <p className="text-base-content/60">O'rnatishlar topilmadi</p>
            <p className="text-xs text-base-content/40">
              Buyurtma "O'rnatishga tayinlandi" bosqichiga o'tgach, bu yerda ko'rinadi
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order: Order) => (
            <div key={order.id} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{order.orderNumber}</h3>
                    {order.installationDate && (
                      <p className="flex items-center gap-1 text-sm text-base-content/60">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(order.installationDate)}
                      </p>
                    )}
                  </div>
                  <span
                    className={clsx('badge', ORDER_STATUSES[order.status]?.color || 'badge-ghost')}
                  >
                    {ORDER_STATUSES[order.status]?.label || order.status}
                  </span>
                </div>

                <div className="divider my-2"></div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-base-content/50" />
                    <span>{order.customerName}</span>
                  </div>

                  {order.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-base-content/50" />
                      <span>{order.customerPhone}</span>
                    </div>
                  )}

                  {order.installationAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-base-content/50" />
                      <span className="line-clamp-2">{order.installationAddress}</span>
                    </div>
                  )}

                  {order.installerName && (
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-base-content/50" />
                      <span>{order.installerName}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="card-actions mt-4 justify-end">
                  {order.status === 'ORNATISHGA_TAYINLANDI' && canInstallOrders && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => startMutation.mutate(order.id)}
                      disabled={startMutation.isPending}
                    >
                      Boshlash
                    </button>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    Ochish
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="join">
            <button
              className="btn btn-sm join-item"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              «
            </button>
            <button className="btn btn-sm join-item">
              {page + 1} / {totalPages}
            </button>
            <button
              className="btn btn-sm join-item"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
