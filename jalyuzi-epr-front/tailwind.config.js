import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Sora', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Premium, juda nozik elevation tizimi
        card: '0 1px 2px -1px rgba(13, 18, 28, 0.08), 0 2px 8px -4px rgba(13, 18, 28, 0.06)',
        float: '0 8px 30px -12px rgba(13, 18, 28, 0.22)',
        nav: '0 -1px 24px -8px rgba(13, 18, 28, 0.16)',
        sheet: '0 -8px 40px -12px rgba(13, 18, 28, 0.30)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Bottom sheet pastdan yuqoriga chiqishi
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        // Suzuvchi elementlar (FAB, sticky bar) yumshoq paydo bo'lishi
        'rise-in': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'dropdown': 'slide-in-from-top 0.2s ease-out, fade-in 0.2s ease-out',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        'rise-in': 'rise-in 0.28s cubic-bezier(0.32, 0.72, 0, 1) both',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        // Premium minimalist — light
        jalyuzi: {
          "primary": "#0d9488",
          "primary-content": "#ffffff",
          "secondary": "#f97316",
          "secondary-content": "#ffffff",
          "accent": "#0ea5e9",
          "accent-content": "#ffffff",
          "neutral": "#111827",
          "neutral-content": "#f8fafc",
          "base-100": "#ffffff",
          "base-200": "#f3f5f7",
          "base-300": "#e5e8ec",
          "base-content": "#0d1320",
          "info": "#0284c7",
          "success": "#16a34a",
          "warning": "#d97706",
          "error": "#dc2626",
          "--rounded-box": "1.5rem",
          "--rounded-btn": "0.875rem",
          "--rounded-badge": "1.9rem",
          "--tab-radius": "0.75rem",
          "--border-btn": "1px",
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
        },
      },
      {
        // Premium minimalist — dark
        "jalyuzi-dark": {
          "primary": "#2dd4bf",
          "primary-content": "#04201c",
          "secondary": "#fb923c",
          "secondary-content": "#1a0e02",
          "accent": "#38bdf8",
          "accent-content": "#03212f",
          "neutral": "#1b1f28",
          "neutral-content": "#e7eaf0",
          "base-100": "#13161d",
          "base-200": "#1b1f28",
          "base-300": "#2a3039",
          "base-content": "#e7eaf0",
          "info": "#38bdf8",
          "success": "#4ade80",
          "warning": "#fbbf24",
          "error": "#f87171",
          "--rounded-box": "1.5rem",
          "--rounded-btn": "0.875rem",
          "--rounded-badge": "1.9rem",
          "--tab-radius": "0.75rem",
          "--border-btn": "1px",
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
        },
      },
      "light",
      "dark",
    ],
    defaultTheme: "jalyuzi",
  },
}
