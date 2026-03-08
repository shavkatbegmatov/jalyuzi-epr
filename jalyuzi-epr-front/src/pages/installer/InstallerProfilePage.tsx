import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Shield, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import type { ChangePasswordRequest } from '../../types';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function InstallerProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword', '');

  const onSubmitPassword = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Yangi parol va tasdiqlash mos kelmadi');
      return;
    }

    setChangingPassword(true);
    try {
      const request: ChangePasswordRequest = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };

      await authApi.changePassword(request);
      toast.success("Parol muvaffaqiyatli o'zgartirildi!");
      reset();

      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Parolni o'zgartirishda xatolik");
    } finally {
      setChangingPassword(false);
    }
  };

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="space-y-6">
      {/* User Card */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-4 ring-primary/10">
            <span className="text-3xl font-bold text-primary">{userInitial}</span>
          </div>
          <h2 className="text-xl font-bold mt-2">{user?.fullName}</h2>
          <p className="text-sm text-base-content/60">@{user?.username}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Shield className="h-3.5 w-3.5" />
              O'rnatuvchi
            </span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="font-semibold mb-3">Ma'lumotlar</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-base-content/50">Foydalanuvchi nomi</p>
                <p className="font-medium">{user?.username}</p>
              </div>
            </div>
            {user?.phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50">
                <User className="h-5 w-5 text-info" />
                <div>
                  <p className="text-xs text-base-content/50">Telefon</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-5 w-5 text-warning" />
            <h3 className="font-semibold">Parolni o'zgartirish</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-3">
            <div className="form-control">
              <span className="label-text text-xs mb-1">Joriy parol</span>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Joriy parolingiz"
                  autoComplete="current-password"
                  className={clsx('input input-bordered w-full pr-10 input-sm', errors.currentPassword && 'input-error')}
                  {...register('currentPassword', { required: 'Joriy parol kiritilishi shart' })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && <span className="text-xs text-error mt-1">{errors.currentPassword.message}</span>}
            </div>

            <div className="form-control">
              <span className="label-text text-xs mb-1">Yangi parol</span>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Yangi parol"
                  autoComplete="new-password"
                  className={clsx('input input-bordered w-full pr-10 input-sm', errors.newPassword && 'input-error')}
                  {...register('newPassword', {
                    required: 'Yangi parol kiritilishi shart',
                    minLength: { value: 6, message: 'Kamida 6 belgi' },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <span className="text-xs text-error mt-1">{errors.newPassword.message}</span>}
            </div>

            <div className="form-control">
              <span className="label-text text-xs mb-1">Parolni tasdiqlash</span>
              <input
                type="password"
                placeholder="Yangi parolni qayta kiriting"
                autoComplete="new-password"
                className={clsx('input input-bordered w-full input-sm', errors.confirmPassword && 'input-error')}
                {...register('confirmPassword', {
                  required: 'Tasdiqlash kiritilishi shart',
                  validate: (value) => value === newPassword || 'Parollar mos kelmadi',
                })}
              />
              {errors.confirmPassword && <span className="text-xs text-error mt-1">{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-sm w-full" disabled={changingPassword}>
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  O'zgartirilmoqda...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  Parolni o'zgartirish
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
