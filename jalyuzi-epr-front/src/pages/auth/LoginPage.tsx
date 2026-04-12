import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  Gauge,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import type { LoginRequest } from '../../types';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, isAuthenticated } = useAuthStore();

  const redirectTo = useMemo(() => {
    const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
    const path = from?.pathname ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/';
    if (path.startsWith('/login') || path.startsWith('/register')) {
      return '/';
    }
    return path;
  }, [location.state]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authApi.login(data);

      // Update user object with mustChangePassword flag from response
      const userWithPasswordFlag = {
        ...response.user,
        mustChangePassword: response.requiresPasswordChange || false,
      };

      setAuth(
        userWithPasswordFlag,
        response.accessToken,
        response.refreshToken,
        response.permissions,
        response.roles
      );

      toast.success('Muvaffaqiyatli kirish!');

      // Role-based redirects to mobile panels
      if (response.roles?.includes('INSTALLER')) {
        navigate('/installer/', { replace: true });
      } else if (response.roles?.includes('MANAGER')) {
        navigate('/manager/', { replace: true });
      } else {
        // Navigate to main app - modal will show automatically if mustChangePassword is true
        navigate(redirectTo, { replace: true });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Kirish xatosi');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="flex min-h-[100dvh] bg-gradient-to-br from-primary/15 via-base-100 to-secondary/15 lg:items-center lg:p-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid min-h-[100dvh] w-full lg:min-h-0 lg:grid-cols-[1.1fr_1fr] lg:overflow-hidden lg:rounded-3xl lg:border lg:border-base-200 lg:bg-base-100/85 lg:shadow-[var(--shadow-strong)] lg:backdrop-blur">
          {/* Left promo panel — desktop only */}
          <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary/15 via-transparent to-secondary/10 p-10 lg:flex">
            <div>
              <div className="pill w-fit">ERP Platforma</div>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">
                Jalyuzi ERP
                <span className="block text-base-content/60">
                  Savdo va zaxira nazorati
                </span>
              </h1>
              <p className="mt-4 text-sm text-base-content/60">
                Ish jarayonlarini soddalashtiring, zaxiralarni nazorat qiling va
                savdoni tezlashtiring.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
                  <Gauge className="h-4 w-4" />
                </span>
                <span>Tezkor savdo va kassa jarayoni</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary/15 text-secondary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span>Oson filtr va katalog boshqaruvi</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-success">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>Xavfsiz kirish va rolga asoslangan boshqaruv</span>
              </div>
            </div>
          </div>

          {/* Login form — full-screen on mobile, card panel on desktop */}
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:py-10">
            {/* Mobile brand header */}
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Jalyuzi ERP</h1>
              <p className="mt-1 text-xs text-base-content/50">
                Savdo va zaxira nazorati
              </p>
            </div>

            <div className="mb-6 max-lg:text-center">
              <h2 className="text-2xl font-semibold">Kirish</h2>
              <p className="mt-1 text-sm text-base-content/60">
                ERP tizimiga kirish uchun ma'lumotlaringizni kiriting
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <label className="form-control">
                <span className="label-text text-sm">Foydalanuvchi nomi</span>
                <input
                  type="text"
                  placeholder="admin"
                  autoComplete="username"
                  className={`input input-bordered h-12 w-full text-base ${errors.username ? 'input-error' : ''}`}
                  {...register('username', {
                    required: 'Foydalanuvchi nomi kiritilishi shart',
                  })}
                />
                {errors.username && (
                  <span className="mt-1 text-xs text-error">
                    {errors.username.message}
                  </span>
                )}
              </label>

              <label className="form-control">
                <span className="label-text text-sm">Parol</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`input input-bordered h-12 w-full pr-12 text-base ${errors.password ? 'input-error' : ''}`}
                    {...register('password', {
                      required: 'Parol kiritilishi shart',
                    })}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-base-content/50 active:scale-90"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="mt-1 text-xs text-error">
                    {errors.password.message}
                  </span>
                )}
              </label>

              <div className="flex items-center justify-between text-xs text-base-content/60">
                <label className="flex items-center gap-2 py-2">
                  <input type="checkbox" className="checkbox checkbox-xs" />
                  Eslab qolish
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    toast('Parolni tiklash uchun administratorga murojaat qiling.')
                  }
                >
                  Parolni unutdingizmi?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary h-12 w-full text-base"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Kirish
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-xl bg-base-200/50 p-4 text-sm text-base-content/70">
              <p className="font-medium text-base-content">Demo kirish</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Admin:</span>
                <code className="rounded bg-base-300/60 px-2 py-0.5 text-xs">admin</code>
                <span>/</span>
                <code className="rounded bg-base-300/60 px-2 py-0.5 text-xs">admin123</code>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Sotuvchi:</span>
                <code className="rounded bg-base-300/60 px-2 py-0.5 text-xs">seller</code>
                <span>/</span>
                <code className="rounded bg-base-300/60 px-2 py-0.5 text-xs">seller123</code>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-base-content/50">
              Hisob kerakmi?{' '}
              <Link to="/register" className="link link-primary">
                Ro'yxatdan o'tish
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
