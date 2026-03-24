import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Har 1 soatda yangilanish tekshiradi
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('Service Worker xatosi:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm">Yangi versiya mavjud!</span>
            <button
              className="btn btn-primary btn-xs"
              onClick={() => {
                updateServiceWorker(true);
                toast.dismiss(t.id);
              }}
            >
              Yangilash
            </button>
          </div>
        ),
        { duration: 10000, id: 'pwa-update' }
      );
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
