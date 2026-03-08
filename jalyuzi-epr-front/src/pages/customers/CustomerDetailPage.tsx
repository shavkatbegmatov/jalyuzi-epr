import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Building2,
  Wallet,
  FileText,
  AlertCircle,
  Shield,
  Key,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { customersApi } from '../../api/customers.api';
import { formatCurrency } from '../../config/constants';
import { PermissionGate } from '../../components/common/PermissionGate';
import { PermissionCode } from '../../hooks/usePermission';
import type { Customer } from '../../types';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Portal boshqaruv state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [togglingPortal, setTogglingPortal] = useState(false);

  const loadCustomer = useCallback(async () => {
    if (!id) return;
    try {
      const data = await customersApi.getById(Number(id));
      setCustomer(data);
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  const handleSetPin = async () => {
    if (!id || pin.length < 4 || pin !== confirmPin) return;
    setSavingPin(true);
    try {
      await customersApi.setPin(Number(id), pin, confirmPin);
      toast.success('PIN kod o\'rnatildi. Portal yoqildi.');
      setShowPinModal(false);
      setPin('');
      setConfirmPin('');
      void loadCustomer();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'PIN o\'rnatishda xatolik');
    } finally {
      setSavingPin(false);
    }
  };

  const handleTogglePortal = async () => {
    if (!customer) return;
    const newState = !customer.portalEnabled;
    setTogglingPortal(true);
    try {
      await customersApi.togglePortal(customer.id, newState);
      toast.success(newState ? 'Portal yoqildi' : 'Portal o\'chirildi');
      void loadCustomer();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setTogglingPortal(false);
    }
  };

  // Customer type label helper
  const getCustomerTypeLabel = (type?: string) => {
    switch (type) {
      case 'INDIVIDUAL':
        return 'Jismoniy shaxs';
      case 'BUSINESS':
        return 'Yuridik shaxs';
      default:
        return '—';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-error mb-4" />
        <h2 className="text-xl font-semibold">Mijoz topilmadi</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/customers')}>
          Orqaga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/customers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="section-title flex items-center gap-2">
              <User className="h-6 w-6" />
              {customer.fullName}
            </h1>
            <p className="section-subtitle">{getCustomerTypeLabel(customer.customerType)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={clsx('badge', customer.active ? 'badge-success' : 'badge-error')}>
            {customer.active ? 'Faol' : 'Nofaol'}
          </span>
          {customer.hasDebt && (
            <span className="badge badge-warning">Qarzdor</span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Telefon</p>
              <p className="font-semibold">{customer.phone}</p>
            </div>
          </div>
        </div>

        {customer.phone2 && (
          <div className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2.5">
                <Phone className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Qo'shimcha telefon</p>
                <p className="font-semibold">{customer.phone2}</p>
              </div>
            </div>
          </div>
        )}

        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'rounded-lg p-2.5',
              customer.hasDebt ? 'bg-error/10' : 'bg-success/10'
            )}>
              <Wallet className={clsx(
                'h-5 w-5',
                customer.hasDebt ? 'text-error' : 'text-success'
              )} />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Balans</p>
              <p className={clsx(
                'font-semibold',
                customer.balance < 0 ? 'text-error' : 'text-success'
              )}>
                {formatCurrency(Math.abs(customer.balance))}
                {customer.balance < 0 && ' (qarz)'}
              </p>
            </div>
          </div>
        </div>

        {customer.customerType === 'BUSINESS' && customer.companyName && (
          <div className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5">
                <Building2 className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Kompaniya</p>
                <p className="font-semibold">{customer.companyName}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact Information */}
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4">
            Aloqa ma'lumotlari
          </h3>
          <div className="space-y-4">
            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-base-200 p-2">
                <Phone className="h-4 w-4 text-base-content/60" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Asosiy telefon</p>
                <p className="font-semibold">{customer.phone}</p>
              </div>
            </div>

            {/* Phone 2 */}
            {customer.phone2 && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-base-200 p-2">
                  <Phone className="h-4 w-4 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Qo'shimcha telefon</p>
                  <p className="font-semibold">{customer.phone2}</p>
                </div>
              </div>
            )}

            {/* Address */}
            {customer.address && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-base-200 p-2">
                  <MapPin className="h-4 w-4 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Manzil</p>
                  <p className="font-semibold">{customer.address}</p>
                </div>
              </div>
            )}

            {/* Company Name */}
            {customer.companyName && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-base-200 p-2">
                  <Building2 className="h-4 w-4 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Kompaniya nomi</p>
                  <p className="font-semibold">{customer.companyName}</p>
                </div>
              </div>
            )}

            {/* Show placeholder if minimal info */}
            {!customer.phone2 && !customer.address && !customer.companyName && (
              <p className="text-base-content/50 text-center py-4">
                Qo'shimcha aloqa ma'lumotlari mavjud emas
              </p>
            )}
          </div>
        </div>

        {/* Financial Info */}
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4">
            Moliyaviy ma'lumotlar
          </h3>
          <div className="space-y-4">
            {/* Customer Type */}
            <div className="flex items-center justify-between py-2 border-b border-base-200">
              <span className="text-base-content/70">Mijoz turi</span>
              <span className="font-semibold">{getCustomerTypeLabel(customer.customerType)}</span>
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between py-2 border-b border-base-200">
              <span className="text-base-content/70">Balans</span>
              <span className={clsx(
                'font-semibold',
                customer.balance < 0 ? 'text-error' : 'text-success'
              )}>
                {customer.balance < 0 ? '-' : ''}{formatCurrency(Math.abs(customer.balance))}
              </span>
            </div>

            {/* Debt Status */}
            <div className="flex items-center justify-between py-2 border-b border-base-200">
              <span className="text-base-content/70">Qarz holati</span>
              <span className={clsx(
                'badge',
                customer.hasDebt ? 'badge-warning' : 'badge-success'
              )}>
                {customer.hasDebt ? 'Qarzdor' : 'Qarzsiz'}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between py-2">
              <span className="text-base-content/70">Holat</span>
              <span className={clsx(
                'badge',
                customer.active ? 'badge-success' : 'badge-error'
              )}>
                {customer.active ? 'Faol' : 'Nofaol'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Izoh
          </h3>
          <p className="text-base-content/80 whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}

      {/* Portal boshqaruvi */}
      <PermissionGate permission={PermissionCode.CUSTOMERS_UPDATE}>
        <div className="surface-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-base-content/60 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Portal boshqaruvi
          </h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base-content/80">
                Portal holati:{' '}
                <span className={clsx(
                  'badge',
                  customer.portalEnabled ? 'badge-success' : 'badge-ghost'
                )}>
                  {customer.portalEnabled ? 'Yoqilgan' : 'O\'chirilgan'}
                </span>
              </p>
              <p className="text-xs text-base-content/50 mt-1">
                Portal yoqilganda mijoz telefon va PIN kod orqali shaxsiy kabinetiga kira oladi
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowPinModal(true)}
              >
                <Key className="h-4 w-4" />
                PIN o'rnatish
              </button>
              {customer.portalEnabled && (
                <button
                  className="btn btn-error btn-outline btn-sm"
                  onClick={handleTogglePortal}
                  disabled={togglingPortal}
                >
                  {togglingPortal && <span className="loading loading-spinner loading-xs" />}
                  Portalni o'chirish
                </button>
              )}
            </div>
          </div>
        </div>
      </PermissionGate>

      {/* Set PIN Modal */}
      {showPinModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-lg">PIN kod o'rnatish</h3>
            <p className="text-sm text-base-content/60 mt-1">
              {customer.fullName} uchun portal PIN kodi
            </p>
            <div className="mt-4 space-y-3">
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  PIN kod (4-6 raqam)
                </span>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="****"
                  maxLength={6}
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  PIN kodni tasdiqlang
                </span>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="****"
                  maxLength={6}
                />
              </label>
              {pin && confirmPin && pin !== confirmPin && (
                <p className="text-error text-sm">PIN kodlar mos kelmadi</p>
              )}
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => { setShowPinModal(false); setPin(''); setConfirmPin(''); }}
                disabled={savingPin}
              >
                Bekor qilish
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSetPin}
                disabled={savingPin || pin.length < 4 || pin !== confirmPin}
              >
                {savingPin && <span className="loading loading-spinner loading-sm" />}
                O'rnatish
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { if (!savingPin) { setShowPinModal(false); setPin(''); setConfirmPin(''); } }} />
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-start">
        <button className="btn btn-ghost" onClick={() => navigate('/customers')}>
          <ArrowLeft className="h-4 w-4" />
          Mijozlar ro'yxatiga qaytish
        </button>
      </div>
    </div>
  );
}
