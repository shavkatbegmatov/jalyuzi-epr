import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { shopAuthApi, TelegramInfo } from '../../api/shop.api';
import { useShopStore } from '../../store/shopStore';

export function ShopRegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useShopStore();

  const [step, setStep] = useState<'phone' | 'code' | 'info'>('phone');
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [telegramInfo, setTelegramInfo] = useState<TelegramInfo | null>(null);

  if (isAuthenticated) {
    navigate('/shop', { replace: true });
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
      const info = await shopAuthApi.telegramInfo(phone);
      setTelegramInfo(info);

      if (info.enabled && info.phoneLinked) {
        await shopAuthApi.sendCode(phone);
        toast.success('📱 Tasdiqlash kodi Telegram\'ga yuborildi');
        setStep('code');
      } else if (info.enabled && !info.phoneLinked) {
        setStep('code');
        toast('Kodni olish uchun Telegram botga o\'ting', { icon: '📱' });
      } else {
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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('6 xonali kodni kiriting');
      return;
    }

    setLoading(true);
    try {
      const verified = await shopAuthApi.verifyCode(phone, code);
      if (verified) {
        setStep('info');
      } else {
        toast.error(t('shop.auth.codeError'));
      }
    } catch (error: unknown) {
      console.error('Verify code error:', error);
      const axiosErr = error as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || t('shop.auth.codeError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      toast.error('Ismingizni kiriting');
      return;
    }

    setLoading(true);
    try {
      const response = await shopAuthApi.register(phone, code, fullName, address);
      setAuth(response.customer, response.accessToken, response.refreshToken);
      toast.success(t('shop.auth.registerSuccess'));
      navigate('/shop', { replace: true });
    } catch (error: unknown) {
      console.error('Register error:', error);
      const axiosErr = error as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl justify-center mb-6">{t('shop.auth.register')}</h2>

          {/* Progress Steps */}
          <ul className="steps w-full mb-6">
            <li className={`step ${step === 'phone' || step === 'code' || step === 'info' ? 'step-primary' : ''}`}>
              Telefon
            </li>
            <li className={`step ${step === 'code' || step === 'info' ? 'step-primary' : ''}`}>
              Tasdiqlash
            </li>
            <li className={`step ${step === 'info' ? 'step-primary' : ''}`}>
              Ma'lumotlar
            </li>
          </ul>

          {step === 'phone' && (
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
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
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

              {telegramInfo?.enabled && !telegramInfo.phoneLinked && telegramInfo.deepLink && (
                <div className="alert alert-info">
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📱</span>
                      <span className="text-sm font-semibold">Telegram orqali kod oling</span>
                    </div>
                    <p className="text-xs">
                      Botni oching va "📱 Telefon raqamni ulashish" tugmasini bosing — bot sizga kodni yuboradi.
                    </p>
                    <a
                      href={telegramInfo.deepLink}
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
            </form>
          )}

          {step === 'info' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t('shop.auth.fullName')} *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('shop.auth.fullNamePlaceholder')}
                  required
                  autoFocus
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t('shop.auth.address')}</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('shop.auth.addressPlaceholder')}
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading || !fullName}
              >
                {loading && <span className="loading loading-spinner loading-sm"></span>}
                {t('shop.auth.register')}
              </button>
            </form>
          )}

          <div className="divider">yoki</div>

          <p className="text-center">
            {t('shop.auth.hasAccount')}{' '}
            <Link to="/shop/login" className="link link-primary">
              {t('shop.auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
