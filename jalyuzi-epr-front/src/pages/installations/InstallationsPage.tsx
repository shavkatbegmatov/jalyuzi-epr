import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { installationsApi, InstallationFilters } from '../../api/installations.api';
import { employeesApi } from '../../api/employees.api';
import type { Employee, Installation, InstallationStatus } from '../../types';
import { formatDate, formatTime, INSTALLATION_STATUSES } from '../../config/constants';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export function InstallationsPage() {
  const queryClient = useQueryClient();

  // Filters
  const [filters, setFilters] = useState<InstallationFilters>({
    page: 0,
    size: 20,
  });
  const [showFilters, setShowFilters] = useState(false);


  // Complete modal
  const [completeModal, setCompleteModal] = useState<{
    isOpen: boolean;
    installation: Installation | null;
    notes: string;
  }>({ isOpen: false, installation: null, notes: '' });

  // Cancel modal
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    installation: Installation | null;
    reason: string;
  }>({ isOpen: false, installation: null, reason: '' });

  // Fetch installations
  const { data: installationsData, isLoading, refetch } = useQuery({
    queryKey: ['installations', filters],
    queryFn: () => installationsApi.getAll(filters),
  });

  // Fetch technicians for filter
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => employeesApi.getTechnicians(),
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: InstallationStatus }) =>
      installationsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      toast.success('Status yangilandi');
    },
    onError: () => {
      toast.error('Xatolik yuz berdi');
    },
  });

  // Complete installation mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      installationsApi.complete(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      toast.success("O'rnatish yakunlandi");
      setCompleteModal({ isOpen: false, installation: null, notes: '' });
    },
    onError: () => {
      toast.error('Xatolik yuz berdi');
    },
  });

  // Cancel installation mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      installationsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      toast.success("O'rnatish bekor qilindi");
      setCancelModal({ isOpen: false, installation: null, reason: '' });
    },
    onError: () => {
      toast.error('Xatolik yuz berdi');
    },
  });

  const installations = installationsData?.content || [];
  const totalPages = installationsData?.totalPages || 0;

  const getStatusIcon = (status: InstallationStatus) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle className="h-4 w-4" />;
      case 'SCHEDULED':
        return <Calendar className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeClass = (status: InstallationStatus) => {
    return INSTALLATION_STATUSES[status]?.color || 'badge-ghost';
  };

  const handleFilterChange = (key: keyof InstallationFilters, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 0,
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 0, size: 20 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">O'rnatishlar</h1>
          <p className="text-sm text-base-content/60">
            O'rnatish jadvalini boshqarish
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filtr
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Texnik</span>
                </label>
                <select
                  className="select select-bordered select-sm"
                  value={filters.technicianId || ''}
                  onChange={(e) =>
                    handleFilterChange('technicianId', e.target.value ? Number(e.target.value) : undefined)
                  }
                >
                  <option value="">Barcha texniklar</option>
                  {technicians.map((tech: Employee) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Status</span>
                </label>
                <select
                  className="select select-bordered select-sm"
                  value={filters.status || ''}
                  onChange={(e) =>
                    handleFilterChange('status', e.target.value as InstallationStatus || undefined)
                  }
                >
                  <option value="">Barcha statuslar</option>
                  {Object.entries(INSTALLATION_STATUSES).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Boshlanish sanasi</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tugash sanasi</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                Tozalash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installation Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : installations.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center py-12 text-center">
            <Wrench className="h-12 w-12 text-base-content/30" />
            <p className="text-base-content/60">O'rnatishlar topilmadi</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {installations.map((installation: Installation) => (
            <div key={installation.id} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">#{installation.id}</h3>
                    <p className="text-sm text-base-content/60">
                      Sotuv #{installation.saleId}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      'badge gap-1',
                      getStatusBadgeClass(installation.status)
                    )}
                  >
                    {getStatusIcon(installation.status)}
                    {INSTALLATION_STATUSES[installation.status]?.label}
                  </span>
                </div>

                <div className="divider my-2"></div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-base-content/50" />
                    <span>{formatDate(installation.scheduledDate)}</span>
                    {installation.scheduledTimeStart && (
                      <>
                        <Clock className="ml-2 h-4 w-4 text-base-content/50" />
                        <span>{formatTime(installation.scheduledTimeStart)}</span>
                        {installation.scheduledTimeEnd && (
                          <span>- {formatTime(installation.scheduledTimeEnd)}</span>
                        )}
                      </>
                    )}
                  </div>

                  {installation.technicianName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-base-content/50" />
                      <span>{installation.technicianName}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-base-content/50" />
                    <span className="line-clamp-2">{installation.address}</span>
                  </div>

                  {installation.customerName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-base-content/50" />
                      <span>{installation.customerName}</span>
                    </div>
                  )}

                  {installation.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-base-content/50" />
                      <span>{installation.customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="card-actions mt-4 justify-end">
                  {installation.status === 'PENDING' && (
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: installation.id,
                          status: 'SCHEDULED',
                        })
                      }
                    >
                      Rejalash
                    </button>
                  )}

                  {installation.status === 'SCHEDULED' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: installation.id,
                          status: 'IN_PROGRESS',
                        })
                      }
                    >
                      Boshlash
                    </button>
                  )}

                  {installation.status === 'IN_PROGRESS' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        setCompleteModal({
                          isOpen: true,
                          installation,
                          notes: '',
                        })
                      }
                    >
                      Yakunlash
                    </button>
                  )}

                  {['PENDING', 'SCHEDULED'].includes(installation.status) && (
                    <button
                      className="btn btn-error btn-outline btn-sm"
                      onClick={() =>
                        setCancelModal({
                          isOpen: true,
                          installation,
                          reason: '',
                        })
                      }
                    >
                      Bekor
                    </button>
                  )}
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
              disabled={filters.page === 0}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 0) - 1 }))}
            >
              «
            </button>
            <button className="btn btn-sm join-item">
              {(filters.page || 0) + 1} / {totalPages}
            </button>
            <button
              className="btn btn-sm join-item"
              disabled={(filters.page || 0) >= totalPages - 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 0) + 1 }))}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeModal.isOpen && completeModal.installation && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">O'rnatishni yakunlash</h3>
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Izohlar (ixtiyoriy)</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                rows={3}
                placeholder="Qo'shimcha izohlar..."
                value={completeModal.notes}
                onChange={(e) =>
                  setCompleteModal((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() =>
                  setCompleteModal({ isOpen: false, installation: null, notes: '' })
                }
              >
                Bekor
              </button>
              <button
                className="btn btn-success"
                onClick={() =>
                  completeMutation.mutate({
                    id: completeModal.installation!.id,
                    notes: completeModal.notes || undefined,
                  })
                }
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending && (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
                Yakunlash
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              onClick={() =>
                setCompleteModal({ isOpen: false, installation: null, notes: '' })
              }
            >
              close
            </button>
          </form>
        </dialog>
      )}

      {/* Cancel Modal */}
      {cancelModal.isOpen && cancelModal.installation && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">O'rnatishni bekor qilish</h3>
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Sabab *</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                rows={3}
                placeholder="Bekor qilish sababi..."
                value={cancelModal.reason}
                onChange={(e) =>
                  setCancelModal((prev) => ({ ...prev, reason: e.target.value }))
                }
              />
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() =>
                  setCancelModal({ isOpen: false, installation: null, reason: '' })
                }
              >
                Ortga
              </button>
              <button
                className="btn btn-error"
                onClick={() =>
                  cancelMutation.mutate({
                    id: cancelModal.installation!.id,
                    reason: cancelModal.reason,
                  })
                }
                disabled={!cancelModal.reason.trim() || cancelMutation.isPending}
              >
                {cancelMutation.isPending && (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
                Bekor qilish
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              onClick={() =>
                setCancelModal({ isOpen: false, installation: null, reason: '' })
              }
            >
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
