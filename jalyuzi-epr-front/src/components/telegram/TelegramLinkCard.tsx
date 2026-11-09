import { useEffect, useState } from 'react';
import { CheckCircle2, Link2, Loader2, Send, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { telegramAuthApi, type TelegramStaffInfo } from '../../api/telegramAuth.api';
import { useAuthStore } from '../../store/authStore';
import { getTelegramWebApp } from '../../telegram/telegramWebApp';

function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } } };
  return err.response?.data?.message || fallback;
}

/**
 * Profil sahifasidagi "Telegram ilova" kartasi: xodimning Telegram akkaunti
 * ulanganligi, botni ochish havolasi va ulash/uzish tugmalari.
 * Bot o'chirilgan bo'lsa ko'rinmaydi.
 */
export function TelegramLinkCard() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [info, setInfo] = useState<TelegramStaffInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const webApp = getTelegramWebApp();

  useEffect(() => {
    telegramAuthApi
      .info()
      .then(setInfo)
      .catch(() => setInfo(null));
    // Boshqa qurilmada ulangan/uzilgan bo'lishi mumkin — holatni serverdan yangilaymiz
    authApi
      .getCurrentUser()
      .then((me) =>
        updateUser({
          telegramUserId: me.telegramUserId ?? null,
          telegramUsername: me.telegramUsername ?? null,
        })
      )
      .catch(() => {});
  }, [updateUser]);

  if (!info?.enabled) return null;

  const linked = !!user?.telegramUserId;

  const handleLink = async () => {
    if (!webApp) return;
    setBusy(true);
    try {
      const updated = await telegramAuthApi.link(webApp.initData);
      updateUser({ telegramUserId: updated.telegramUserId, telegramUsername: updated.telegramUsername });
      toast.success('Telegram akkaunt ulandi');
    } catch (error) {
      toast.error(getErrorMessage(error, "Telegram akkauntni ulab bo'lmadi"));
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    setBusy(true);
    try {
      await telegramAuthApi.unlink();
      updateUser({ telegramUserId: null, telegramUsername: null });
      setConfirmUnlink(false);
      toast.success('Telegram akkaunt uzildi');
    } catch (error) {
      toast.error(getErrorMessage(error, "Telegram akkauntni uzib bo'lmadi"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="mb-2 flex items-center gap-2">
          <Send className="h-5 w-5 text-info" />
          <h3 className="font-semibold">Telegram ilova</h3>
          {linked && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ulangan
            </span>
          )}
        </div>

        {linked ? (
          <p className="text-sm text-base-content/70">
            {user?.telegramUsername ? <>Akkaunt: <b>@{user.telegramUsername}</b>. </> : null}
            Ilovani botdagi <b>«Ilova»</b> tugmasi orqali login va parolsiz ochasiz.
          </p>
        ) : webApp ? (
          <p className="text-sm text-base-content/70">
            Shu Telegram akkauntni ulang — keyingi safar ilova avtomatik ochiladi.
          </p>
        ) : (
          <p className="text-sm text-base-content/70">
            Botni oching, <b>«Ilovani ochish»</b> tugmasini bosing va bir marta login qiling — shundan so'ng
            ilova Telegram ichida avtomatik ochiladi.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {!linked && webApp && (
            <button type="button" className="btn btn-info btn-sm flex-1" onClick={handleLink} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Shu akkauntni ulash
            </button>
          )}

          {!webApp && info.startLink && (
            <a
              href={info.startLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-info btn-sm flex-1"
            >
              <Send className="h-4 w-4" />
              Telegram botni ochish
            </a>
          )}

          {linked &&
            (confirmUnlink ? (
              <div className="flex w-full gap-2">
                <button
                  type="button"
                  className="btn btn-error btn-sm flex-1"
                  onClick={handleUnlink}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                  Ha, uzish
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm flex-1"
                  onClick={() => setConfirmUnlink(false)}
                  disabled={busy}
                >
                  Bekor qilish
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm"
                onClick={() => setConfirmUnlink(true)}
              >
                <Unlink className="h-4 w-4" />
                Uzish
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
