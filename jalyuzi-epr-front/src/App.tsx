import { useEffect, useCallback } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { router } from './router';
import { useUIStore } from './store/uiStore';
import { PWAUpdatePrompt } from './components/common/PWAUpdatePrompt';
import { waitForTelegramWebApp, type TelegramWebApp } from './telegram/telegramWebApp';

function useNativeStatusBar() {
  const { themeMode, getEffectiveTheme } = useUIStore();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const isDark = getEffectiveTheme() === 'jalyuzi-dark';

    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: isDark ? '#0a0c10' : '#ffffff' }).catch(() => {});
  }, [themeMode, getEffectiveTheme]);
}

// Global theme hook - applies theme on app load
function useTheme() {
  const { themeMode, getEffectiveTheme } = useUIStore();

  const applyTheme = useCallback(() => {
    document.documentElement.setAttribute('data-theme', getEffectiveTheme());
  }, [getEffectiveTheme]);

  useEffect(() => {
    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, applyTheme]);

  // Telegram Mini App: skript yuklangach va Telegram mavzusi o'zgarganda qayta qo'llash
  useEffect(() => {
    let cancelled = false;
    let webApp: TelegramWebApp | null = null;
    const handleTelegramTheme = () => {
      if (useUIStore.getState().themeMode === 'system') {
        applyTheme();
      }
    };

    waitForTelegramWebApp().then((wa) => {
      if (cancelled || !wa) return;
      webApp = wa;
      handleTelegramTheme();
      wa.onEvent('themeChanged', handleTelegramTheme);
    });

    return () => {
      cancelled = true;
      webApp?.offEvent('themeChanged', handleTelegramTheme);
    };
  }, [applyTheme]);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Apply theme globally
  useTheme();
  // Sync native Android status bar with app theme
  useNativeStatusBar();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <PWAUpdatePrompt />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className: 'bg-base-100 text-base-content border border-base-300',
          style: {
            borderRadius: '14px',
            padding: '12px 14px',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
