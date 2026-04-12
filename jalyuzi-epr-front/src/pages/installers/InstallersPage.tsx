import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat,
  Phone,
  Plus,
  UserCheck,
  UserX,
  Wrench,
  ClipboardList,
  Edit3,
  Power,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { installersApi } from '../../api/installers.api';
import { formatCurrency } from '../../config/constants';
import { DataTable, Column } from '../../components/ui/DataTable';
import { ModalPortal } from '../../components/common/Modal';
import { SearchInput } from '../../components/ui/SearchInput';
import { PermissionGate } from '../../components/common/PermissionGate';
import { usePermission, PermissionCode } from '../../hooks/usePermission';
import type {
  Installer,
  InstallerStats,
  InstallerCreateRequest,
  InstallerUpdateRequest,
} from '../../types';

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
}

const emptyFormData: FormData = {
  fullName: '',
  phone: '',
  email: '',
  username: '',
  password: '',
};

export function InstallersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  // List state
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Stats state
  const [stats, setStats] = useState<InstallerStats | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingInstaller, setEditingInstaller] = useState<Installer | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [saving, setSaving] = useState(false);

  // Load installers
  const loadInstallers = useCallback(async () => {
    try {
      const data = await installersApi.getAll({
        page,
        size: pageSize,
        search: search || undefined,
      });
      setInstallers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('Failed to load installers:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const data = await installersApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load installer stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void loadInstallers();
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload on filter change
  useEffect(() => {
    void loadInstallers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  // Open create modal
  const handleOpenNewModal = () => {
    setEditingInstaller(null);
    setFormData(emptyFormData);
    setShowModal(true);
  };

  // Open edit modal
  const handleOpenEditModal = (installer: Installer) => {
    setEditingInstaller(installer);
    setFormData({
      fullName: installer.fullName,
      phone: installer.phone,
      email: installer.email || '',
      username: installer.username,
      password: '',
    });
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInstaller(null);
    setFormData(emptyFormData);
  };

  // Form field change
  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save installer
  const handleSave = async () => {
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      toast.error("Ism va telefon raqamini to'ldiring");
      return;
    }

    if (!editingInstaller && (!formData.username.trim() || !formData.password.trim())) {
      toast.error("Foydalanuvchi nomi va parolni to'ldiring");
      return;
    }

    const requiredPermission = editingInstaller
      ? PermissionCode.INSTALLERS_UPDATE
      : PermissionCode.INSTALLERS_CREATE;

    if (!hasPermission(requiredPermission)) {
      toast.error("Sizda bu amalni bajarish huquqi yo'q");
      return;
    }

    setSaving(true);
    try {
      if (editingInstaller) {
        const updateData: InstallerUpdateRequest = {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email || undefined,
        };
        await installersApi.update(editingInstaller.id, updateData);
        toast.success("O'rnatuvchi muvaffaqiyatli yangilandi");
      } else {
        const createData: InstallerCreateRequest = {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email || undefined,
          username: formData.username,
          password: formData.password,
        };
        await installersApi.create(createData);
        toast.success("Yangi o'rnatuvchi muvaffaqiyatli qo'shildi");
      }
      handleCloseModal();
      void loadInstallers();
      void loadStats();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status !== 403) {
        toast.error(err.response?.data?.message || "Xatolik yuz berdi");
      }
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (installer: Installer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasPermission(PermissionCode.INSTALLERS_TOGGLE)) {
      toast.error("Sizda bu amalni bajarish huquqi yo'q");
      return;
    }
    try {
      await installersApi.toggleActive(installer.id);
      toast.success(
        installer.active ? "O'rnatuvchi nofaol qilindi" : "O'rnatuvchi faollashtrildi"
      );
      void loadInstallers();
      void loadStats();
    } catch {
      toast.error("Holatni o'zgartirishda xatolik");
    }
  };

  // Table columns
  const columns: Column<Installer>[] = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Ism',
        render: (installer) => {
          const initials = installer.fullName
            .split(' ')
            .map((n) => n.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
          return (
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="w-10 rounded-full bg-primary/15 text-primary">
                  <span className="text-sm">{initials}</span>
                </div>
              </div>
              <div>
                <div className="font-medium">{installer.fullName}</div>
                <div className="text-sm text-base-content/50">@{installer.username}</div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'phone',
        header: 'Telefon',
        render: (installer) => (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-base-content/50" />
            <span className="text-sm">{installer.phone}</span>
          </div>
        ),
      },
      {
        key: 'active',
        header: 'Holat',
        render: (installer) => (
          <span
            className={clsx(
              'badge badge-sm',
              installer.active ? 'badge-success' : 'badge-error'
            )}
          >
            {installer.active ? 'Faol' : 'Nofaol'}
          </span>
        ),
      },
      {
        key: 'currentOrder',
        header: 'Joriy buyurtma',
        render: (installer) => (
          <span className="text-sm">
            {installer.currentOrderNumber || '-'}
          </span>
        ),
      },
      {
        key: 'completedOrdersCount',
        header: 'Bajarilgan',
        getValue: (installer) => installer.completedOrdersCount,
        render: (installer) => (
          <span className="font-medium">{installer.completedOrdersCount}</span>
        ),
      },
      {
        key: 'totalCollectedAmount',
        header: "Yig'ilgan summa",
        getValue: (installer) => installer.totalCollectedAmount,
        render: (installer) => (
          <span className="font-medium">
            {formatCurrency(installer.totalCollectedAmount)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        sortable: false,
        render: (installer) => (
          <div className="flex items-center gap-1">
            <PermissionGate permission={PermissionCode.INSTALLERS_UPDATE}>
              <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(installer);
                }}
                title="Tahrirlash"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </PermissionGate>
            <PermissionGate permission={PermissionCode.INSTALLERS_TOGGLE}>
              <button
                className={clsx(
                  'btn btn-ghost btn-sm btn-square',
                  installer.active ? 'text-error' : 'text-success'
                )}
                onClick={(e) => handleToggleActive(installer, e)}
                title={installer.active ? 'Nofaol qilish' : 'Faollashtirish'}
              >
                <Power className="h-4 w-4" />
              </button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    []
  );

  // Stat cards data
  const statCards = [
    {
      label: "Jami o'rnatuvchilar",
      value: stats?.totalInstallers ?? 0,
      icon: Users,
      color: 'primary' as const,
    },
    {
      label: 'Faol',
      value: stats?.activeInstallers ?? 0,
      icon: UserCheck,
      color: 'success' as const,
    },
    {
      label: 'Hozir band',
      value: stats?.busyNow ?? 0,
      icon: Wrench,
      color: 'warning' as const,
    },
    {
      label: 'Bugun bajarilgan',
      value: stats?.completedToday ?? 0,
      icon: ClipboardList,
      color: 'info' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="section-title flex items-center gap-2">
          <HardHat className="h-6 w-6" />
          O'rnatuvchilar
        </h1>
        <p className="section-subtitle">
          O'rnatuvchilar ro'yxati va boshqaruvi
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
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

      {/* Search + Add button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          className="w-full sm:max-w-xs"
        />
        <PermissionGate permission={PermissionCode.INSTALLERS_CREATE}>
          <button className="btn btn-primary btn-sm gap-2" onClick={handleOpenNewModal}>
            <Plus className="h-4 w-4" />
            Yangi o'rnatuvchi
          </button>
        </PermissionGate>
      </div>

      {/* Data table */}
      <DataTable
        data={installers}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        totalElements={totalElements}
        totalPages={totalPages}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={(installer) => navigate(`/installers/${installer.id}`)}
        emptyIcon={<HardHat className="h-12 w-12 text-base-content/30" />}
        emptyTitle="O'rnatuvchilar topilmadi"
        emptyDescription="Hozircha hech qanday o'rnatuvchi qo'shilmagan"
      />

      {/* Create/Edit Modal */}
      <ModalPortal isOpen={showModal} onClose={handleCloseModal}>
        <div className="modal-box w-full max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              {editingInstaller ? "O'rnatuvchini tahrirlash" : "Yangi o'rnatuvchi"}
            </h3>
            <button
              className="btn btn-ghost btn-sm btn-square"
              onClick={handleCloseModal}
            >
              <UserX className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">To'liq ism *</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Ismni kiriting"
                value={formData.fullName}
                onChange={(e) => handleFormChange('fullName', e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Telefon raqam *</span>
              </label>
              <input
                type="tel"
                className="input input-bordered w-full"
                placeholder="+998 90 123 45 67"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </div>

            {/* Username - only for create */}
            {!editingInstaller && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Foydalanuvchi nomi *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => handleFormChange('username', e.target.value)}
                />
              </div>
            )}

            {/* Password - only for create */}
            {!editingInstaller && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Parol *</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  placeholder="Parolni kiriting"
                  value={formData.password}
                  onChange={(e) => handleFormChange('password', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Modal actions */}
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={handleCloseModal}>
              Bekor qilish
            </button>
            <button
              className={clsx('btn btn-primary', saving && 'loading')}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? 'Saqlanmoqda...'
                : editingInstaller
                  ? 'Yangilash'
                  : "Qo'shish"}
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
