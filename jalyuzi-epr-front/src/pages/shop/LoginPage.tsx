import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { shopAuthApi, TelegramInfo } from '../../api/shop.api';
import { useShopStore } from '../../store/shopStore';

export function ShopLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, isAuthenticated } = useShopStore();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [telegramInfo, setTelegramInfo] = useState<TelegramInfo | null>(null);

  const from = (location.state as { from?: string })?.from || '/shop';

  // Already authenticated, redirect
  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 13) {
      toast.error('Telefon raqamni to\'liq kiriting');
      return;
    }

    setLoading(true);
    try {
      // Avval Telegram bot holati va mijoz bog'langanligini tekshirish
      const info = await shopAuthApi.telegramInfo(phone);
      setTelegramInfo(info);

      if (info.enabled && info.phoneLinked) {
        // Foydalanuvchi botga allaqachon ulangan — kod darhol Telegram'ga yuboriladi
        await shopAuthApi.sendCode(phone);
        toast.success('📱 Tasdiqlash kodi Telegram\'ga yuborildi');
        setStep('code');
      } else if (info.enabled && !info.phoneLinked) {
        // Telegram bot mavjud, lekin foydalanuvchi hali bog'lanmagan
        // Bot ochilgach, kontakt ulashgach — kod bot tomonidan yuboriladi
        setStep('code');
        toast('Kodni olish uchun Telegram botga o\'ting', { icon: '📱' });
      } else {
        // Telegram o'chirilgan — odatdagi SMS
        await shopAuthApi.sendCode(phone);
        toast.success(t('shop.auth.codeSent'));
        setStep('code');
      }
    } catch (error: unknown) {
      console.error('Send code error:', error);
      const axiosErr = error as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('6 xonali kodni kiriting');
      return;
    }

    setLoading(true);
    try {
      const response = await shopAuthApi.login(phone, code);
      setAuth(response.customer, response.accessToken, response.refreshToken);
      toast.success(t('auth.welcome'));
      navigate(from, { replace: true });
    } catch (error: unknown) {
      console.error('Login error:', error);
      const axiosErr = error as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || t('shop.auth.codeError'));
    } finally {
      setLoading(false);
    }
  };

  const showTelegramLink = telegramInfo?.enabled && telegramInfo?.deepLink;
  const needsBotSetup = telegramInfo?.enabled && !telegramInfo.phoneLinked;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl justify-center mb-6">{t('shop.auth.login')}</h2>

          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t('shop.auth.phone')}</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered text-lg"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('shop.auth.phonePlaceholder')}
                  maxLength={13}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading || phone.length < 13}
              >
                {loading && <span className="loading loading-spinner loading-sm"></span>}
                {t('shop.auth.sendCode')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center text-gray-500 mb-4">
                <p>{phone}</p>
                <button
                  type="button"
                  className="link link-primary text-sm"
                  onClick={() => {
                    setStep('phone');
                    setTelegramInfo(null);
                    setCode('');
                  }}
                >
                  O'zgartirish
                </button>
              </div>

              {needsBotSetup && showTelegramLink && (
                <div className="alert alert-info">
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📱</span>
                      <span className="text-sm font-semibold">Telegram orqali kod oling</span>
                    </div>
                    <p className="text-xs">
                      Tasdiqlash kodi Telegram orqali yuboriladi. Tugmani bosib, botni oching va telefon raqamingizni ulashing.
                    </p>
                    <a
                      href={telegramInfo!.deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-info w-full"
                    >
                      Telegram botni ochish
                    </a>
                  </div>
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t('shop.auth.code')}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered text-center text-2xl tracking-widest"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('shop.auth.codePlaceholder')}
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading || code.length !== 6}
              >
                {loading && <span className="loading loading-spinner loading-sm"></span>}
                {t('shop.auth.verifyCode')}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="link link-primary text-sm"
                  onClick={handleSendCode}
                  disabled={loading}
                >
                  Kodni qayta yuborish
                </button>
              </div>
            </form>
          )}

          <div className="divider">yoki</div>

          <p className="text-center">
            {t('shop.auth.noAccount')}{' '}
            <Link to="/shop/register" className="link link-primary">
              {t('shop.auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
