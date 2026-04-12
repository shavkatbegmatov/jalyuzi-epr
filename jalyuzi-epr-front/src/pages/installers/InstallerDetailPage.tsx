import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  UserX,
  ClipboardList,
  Banknote,
  Calendar,
  Clock,
  Edit3,
  Power,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { installersApi } from '../../api/installers.api';
import { formatCurrency, formatDate } from '../../config/constants';
import { DataTable, Column } from '../../components/ui/DataTable';
import { ModalPortal } from '../../components/common/Modal';
import { PermissionGate } from '../../components/common/PermissionGate';
import { usePermission, PermissionCode } from '../../hooks/usePermission';
import type { InstallerDetail, InstallerUpdateRequest, Order } from '../../types';

// Order status color mapping
const ORDER_STATUS_COLORS: Record<string, string> = {
  YANGI: 'badge-info',
  OLCHOV_KUTILMOQDA: 'badge-warning',
  OLCHOV_BAJARILDI: 'badge-info',
  NARX_TASDIQLANDI: 'badge-info',
  ZAKLAD_QABUL_QILINDI: 'badge-success',
  ISHLAB_CHIQARISHDA: 'badge-warning',
  TAYYOR: 'badge-success',
  ORNATISHGA_TAYINLANDI: 'badge-primary',
  ORNATISH_JARAYONIDA: 'badge-warning',
  ORNATISH_BAJARILDI: 'badge-success',
  TOLOV_KUTILMOQDA: 'badge-warning',
  YAKUNLANDI: 'badge-success',
  QARZGA_OTKAZILDI: 'badge-error',
  BEKOR_QILINDI: 'badge-error',
};

export function InstallerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  // Installer data
  const [installer, setInstaller] = useState<InstallerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersPageSize] = useState(10);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  const [ordersTotalElements, setOrdersTotalElements] = useState(0);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ fullName: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  // Load installer
  const loadInstaller = useCallback(async () => {
    if (!id) return;
    try {
      const data = await installersApi.getById(Number(id));
      setInstaller(data);
    } catch (error) {
      console.error('Failed to load installer:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load orders
  const loadOrders = useCallback(async () => {
    if (!id) return;
    setOrdersLoading(true);
    try {
      const data = await installersApi.getOrders(Number(id), ordersPage, ordersPageSize);
      setOrders(data.content);
      setOrdersTotalPages(data.totalPages);
      setOrdersTotalElements(data.totalElements);
    } catch (error) {
      console.error('Failed to load installer orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, [id, ordersPage, ordersPageSize]);

  useEffect(() => {
    void loadInstaller();
  }, [loadInstaller]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Edit modal handlers
  const handleOpenEditModal = () => {
    if (!installer) return;
    setEditFormData({
      fullName: installer.fullName,
      phone: installer.phone,
      email: installer.email || '',
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleSaveEdit = async () => {
    if (!installer) return;
    if (!editFormData.fullName.trim() || !editFormData.phone.trim()) {
      toast.error("Ism va telefon raqamini to'ldiring");
      return;
    }
    setSaving(true);
    try {
      const updateData: InstallerUpdateRequest = {
        fullName: editFormData.fullName,
        phone: editFormData.phone,
        email: editFormData.email || undefined,
      };
      await installersApi.update(installer.id, updateData);
      toast.success("O'rnatuvchi muvaffaqiyatli yangilandi");
      handleCloseEditModal();
      void loadInstaller();
    } catch {
      toast.error('Yangilashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active
  const handleToggleActive = async () => {
    if (!installer) return;
    if (!hasPermission(PermissionCode.INSTALLERS_TOGGLE)) {
      toast.error("Sizda bu amalni bajarish huquqi yo'q");
      return;
    }
    try {
      await installersApi.toggleActive(installer.id);
      toast.success(
        installer.active ? "O'rnatuvchi nofaol qilindi" : "O'rnatuvchi faollashtirildi"
      );
      void loadInstaller();
    } catch {
      toast.error("Holatni o'zgartirishda xatolik");
    }
  };

  // Orders table columns
  const orderColumns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Buyurtma raqami',
      render: (order) => (
        <span className="font-medium text-primary">{order.orderNumber}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Mijoz',
      render: (order) => <span>{order.customerName}</span>,
    },
    {
      key: 'status',
      header: 'Holat',
      render: (order) => (
        <span
          className={clsx(
            'badge badge-sm',
            ORDER_STATUS_COLORS[order.status] || 'badge-ghost'
          )}
        >
          {order.statusDisplayName}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Summa',
      getValue: (order) => order.totalAmount,
      render: (order) => (
        <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Sana',
      render: (order) => (
        <span className="text-sm text-base-content/70">
          {formatDate(order.createdAt)}
        </span>
      ),
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  // Not found
  if (!installer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-error mb-4" />
        <h2 className="text-xl font-semibold">O'rnatuvchi topilmadi</h2>
        <button
          className="btn btn-primary mt-4"
          onClick={() => navigate('/installers')}
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  // Initials
  const initials = installer.fullName
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Stat cards
  const detailStats = [
    {
      label: 'Jami bajarilgan',
      value: installer.completedOrdersCount,
      icon: ClipboardList,
      color: 'primary' as const,
    },
    {
      label: 'Shu oy',
      value: installer.completedThisMonth,
      icon: Calendar,
      color: 'success' as const,
    },
    {
      label: "Yig'ilgan summa",
      value: formatCurrency(installer.totalCollectedAmount),
      icon: Banknote,
      color: 'info' as const,
    },
    {
      label: "O'tgan oy",
      value: installer.completedLastMonth,
      icon: Clock,
      color: 'warning' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/installers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="avatar placeholder">
            <div className="w-14 rounded-full bg-primary/15 text-primary">
              <span className="text-lg">{initials}</span>
            </div>
          </div>
          <div>
            <h1 className="section-title flex items-center gap-2">
              {installer.fullName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <Phone className="h-4 w-4" />
              {installer.phone}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              'badge',
              installer.active ? 'badge-success' : 'badge-error'
            )}
          >
            {installer.active ? 'Faol' : 'Nofaol'}
          </span>
          <PermissionGate permission={PermissionCode.INSTALLERS_UPDATE}>
            <button
              className="btn btn-ghost btn-sm gap-1"
              onClick={handleOpenEditModal}
            >
              <Edit3 className="h-4 w-4" />
              Tahrirlash
            </button>
          </PermissionGate>
          <PermissionGate permission={PermissionCode.INSTALLERS_TOGGLE}>
            <button
              className={clsx(
                'btn btn-sm gap-1',
                installer.active ? 'btn-error btn-outline' : 'btn-success btn-outline'
              )}
              onClick={handleToggleActive}
            >
              <Power className="h-4 w-4" />
              {installer.active ? 'Nofaol qilish' : 'Faollashtirish'}
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Info cards */}
      {installer.email && (
        <div className="surface-card p-4 flex items-center gap-3">
          <Mail className="h-5 w-5 text-base-content/50" />
          <span>{installer.email}</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {detailStats.map((card) => (
          <div key={card.label} className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-${card.color}/10 p-2.5`}>
                <card.icon className={`h-5 w-5 text-${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-base-content/60">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Buyurtmalar tarixi</h2>
        <DataTable
          data={orders}
          columns={orderColumns}
          keyExtractor={(item) => item.id}
          loading={ordersLoading}
          totalElements={ordersTotalElements}
          totalPages={ordersTotalPages}
          currentPage={ordersPage}
          pageSize={ordersPageSize}
          onPageChange={setOrdersPage}
          onRowClick={(order) => navigate(`/orders/${order.id}`)}
          emptyIcon={<ClipboardList className="h-12 w-12 text-base-content/30" />}
          emptyTitle="Buyurtmalar topilmadi"
          emptyDescription="Bu o'rnatuvchiga hali buyurtma tayinlanmagan"
        />
      </div>

      {/* Back button */}
      <div className="flex justify-start">
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/installers')}
        >
          <ArrowLeft className="h-4 w-4" />
          O'rnatuvchilar ro'yxatiga qaytish
        </button>
      </div>

      {/* Edit Modal */}
      <ModalPortal isOpen={showEditModal} onClose={handleCloseEditModal}>
        <div className="modal-box w-full max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">O'rnatuvchini tahrirlash</h3>
            <button
              className="btn btn-ghost btn-sm btn-square"
              onClick={handleCloseEditModal}
            >
              <UserX className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">To'liq ism *</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={editFormData.fullName}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Telefon raqam *</span>
              </label>
              <input
                type="tel"
                className="input input-bordered w-full"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={handleCloseEditModal}>
              Bekor qilish
            </button>
            <button
              className={clsx('btn btn-primary', saving && 'loading')}
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? 'Saqlanmoqda...' : 'Yangilash'}
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
