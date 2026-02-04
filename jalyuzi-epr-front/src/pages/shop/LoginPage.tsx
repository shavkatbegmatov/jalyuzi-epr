import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { shopAuthApi } from '../../api/shop.api';
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
      await shopAuthApi.sendCode(phone);
      toast.success(t('shop.auth.codeSent'));
      setStep('code');
    } catch (error: any) {
      console.error('Send code error:', error);
      toast.error(error.response?.data?.message || t('common.error'));
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
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || t('shop.auth.codeError'));
    } finally {
      setLoading(false);
    }
  };

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
                  onClick={() => setStep('phone')}
                >
                  O'zgartirish
                </button>
              </div>

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
