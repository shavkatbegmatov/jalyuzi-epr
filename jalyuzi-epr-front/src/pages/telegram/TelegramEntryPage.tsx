import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AlertCircle, Eye, EyeOff, Link2, Loader2, LogIn, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { telegramAuthApi } from '../../api/telegramAuth.api';
import { useAuthStore } from '../../store/authStore';
import { getRolePanelPath } from '../../utils/roleHome';
import {
  initTelegramWebApp,
  waitForTelegramWebApp,
  type TelegramWebApp,
} from '../../telegram/telegramWebApp';
import type { JwtResponse, LoginRequest } from '../../types';

type Status = 'loading' | 'not-telegram' | 'link' | 'error';

/** Avtomatik kirish tsiklini to'xtatish uchun: 1 daqiqada 3 martadan ko'p urinish — xato */
const ATTEMPTS_KEY = 'tg-auto-login-attempts';
const MAX_ATTEMPTS_PER_MINUTE = 3;

function registerAutoLoginAttempt(): boolean {
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem(ATTEMPTS_KEY);
    const recent = (raw ? (JSON.parse(raw) as number[]) : []).filter((t) => now - t < 60_000);
    recent.push(now);
    sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(recent));
    return recent.length <= MAX_ATTEMPTS_PER_MINUTE;
  } catch {
    return true;
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } } };
  return err.response?.data?.message || fallback;
}

/**
 * Xodimlar Telegram Mini App'ining kirish nuqtasi (/tg).
 *
 * 1. Telegram skriptini kutadi va initData'ni backend'ga yuboradi.
 * 2. Telegram akkaunt xodimga ulangan bo'lsa — avtomatik kirib, rol paneliga o'tadi.
 * 3. Ulanmagan bo'lsa — bir martalik login/parol formasi; kirgach akkaunt ulanadi.
 */
export function TelegramEntryPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [telegramName, setTelegramName] = useState<string | null>(null);
  const [botLink, setBotLink] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const webAppRef = useRef<TelegramWebApp | null>(null);
  const startedRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const applyAuth = useCallback((response: JwtResponse) => {
    useAuthStore.getState().setAuth(
      { ...response.user, mustChangePassword: response.requiresPasswordChange || false },
      response.accessToken,
      response.refreshToken,
      response.permissions,
      response.roles
    );
  }, []);

  const goHome = useCallback(
    (roles?: Iterable<string> | null) => {
      navigate(getRolePanelPath(roles) ?? '/', { replace: true });
    },
    [navigate]
  );

  const authenticate = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    const webApp = await waitForTelegramWebApp();
    if (!webApp) {
      setStatus('not-telegram');
      telegramAuthApi
        .info()
        .then((info) => setBotLink(info.startLink ?? null))
        .catch(() => {});
      return;
    }
    webAppRef.current = webApp;
    initTelegramWebApp(webApp);

    // Shu Telegram akkaunt bilan allaqachon kirilgan bo'lsa — mavjud sessiyadan foydalanamiz
    const { isAuthenticated, user, roles, logout } = useAuthStore.getState();
    const telegramUserId = webApp.initDataUnsafe.user?.id;
    if (
      isAuthenticated &&
      localStorage.getItem('accessToken') &&
      telegramUserId &&
      user?.telegramUserId === telegramUserId
    ) {
      goHome(roles);
      return;
    }
    if (isAuthenticated) {
      // Boshqa akkaunt bilan kirilgan — lokal holatni tozalab, Telegram bo'yicha qayta kiramiz
      logout();
    }

    if (!registerAutoLoginAttempt()) {
      setErrorMessage("Avtomatik kirish takror-takror uzilyapti. Birozdan so'ng qayta urinib ko'ring.");
      setStatus('error');
      return;
    }

    try {
      const result = await telegramAuthApi.login(webApp.initData);
      if (result.linked && result.auth) {
        applyAuth(result.auth);
        goHome(result.auth.roles);
        return;
      }
      setTelegramName(result.telegramName ?? null);
      setStatus('link');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Telegram orqali kirib bo\'lmadi'));
      setStatus('error');
    }
  }, [applyAuth, goHome]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void authenticate();
  }, [authenticate]);

  const onSubmit = async (data: LoginRequest) => {
    const webApp = webAppRef.current;
    if (!webApp) return;

    setSubmitting(true);
    try {
      const response = await authApi.login(data);
      applyAuth(response);

      try {
        const linkedUser = await telegramAuthApi.link(webApp.initData);
        useAuthStore.getState().updateUser({
          telegramUserId: linkedUser.telegramUserId,
          telegramUsername: linkedUser.telegramUsername,
        });
        toast.success('Telegram akkauntingiz ulandi — keyingi safar avtomatik kirasiz');
      } catch (linkError) {
        // Login bo'ldi, faqat ulash amalga oshmadi — ishni davom ettirishga to'sqinlik qilmaymiz
        toast.error(getErrorMessage(linkError, 'Telegram akkauntni ulab bo\'lmadi'), { duration: 6000 });
      }

      goHome(response.roles);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Kirish xatosi'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-base-200 px-5 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15">
            <Send className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Jalyuzi ERP</h1>
          <p className="mt-1 text-xs text-base-content/60">Xodimlar ilovasi</p>
        </div>

        {status === 'loading' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body items-center py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-base-content/70">Telegram orqali kirilmoqda...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body items-center text-center">
              <AlertCircle className="h-8 w-8 text-error" />
              <p className="mt-2 text-sm">{errorMessage}</p>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-4"
                onClick={() => void authenticate()}
              >
                <RefreshCw className="h-4 w-4" />
                Qayta urinish
              </button>
            </div>
          </div>
        )}

        {status === 'not-telegram' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body text-center">
              <p className="text-sm text-base-content/80">
                Bu sahifa Telegram ichida ishlaydi. Botni oching va <b>“Ilovani ochish”</b> tugmasini bosing.
              </p>
              {botLink && (
                <a href={botLink} className="btn btn-primary mt-4 w-full">
                  <Send className="h-4 w-4" />
                  Telegram botni ochish
                </a>
              )}
              <Link to="/login" className="btn btn-ghost btn-sm mt-2 w-full">
                Brauzerda login qilish
              </Link>
            </div>
          </div>
        )}

        {status === 'link' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="mb-2 flex items-start gap-3 rounded-xl bg-info/10 p-3 text-sm">
                <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-info" />
                <p>
                  {telegramName ? <>Salom, <b>{telegramName}</b>! </> : null}
                  Telegram akkauntingizni ulash uchun bir marta ERP login va parolingizni kiriting.
                  Keyingi safar ilova avtomatik ochiladi.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <label className="form-control">
                  <span className="label-text text-sm">Foydalanuvchi nomi</span>
                  <input
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    className={`input input-bordered h-12 w-full text-base ${errors.username ? 'input-error' : ''}`}
                    {...register('username', { required: 'Foydalanuvchi nomi kiritilishi shart' })}
                  />
                  {errors.username && (
                    <span className="mt-1 text-xs text-error">{errors.username.message}</span>
                  )}
                </label>

                <label className="form-control">
                  <span className="label-text text-sm">Parol</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`input input-bordered h-12 w-full pr-12 text-base ${errors.password ? 'input-error' : ''}`}
                      {...register('password', { required: 'Parol kiritilishi shart' })}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-base-content/50"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="mt-1 text-xs text-error">{errors.password.message}</span>
                  )}
                </label>

                <button type="submit" className="btn btn-primary h-12 w-full text-base" disabled={submitting}>
                  {submitting ? (
                    <span className="loading loading-spinner" />
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      Kirish va ulash
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
