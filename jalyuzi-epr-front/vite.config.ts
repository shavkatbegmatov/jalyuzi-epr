import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'favicon.svg'],
      manifest: {
        name: 'Jalyuzi ERP - Boshqaruv tizimi',
        short_name: 'Jalyuzi ERP',
        description: 'Jalyuzi ishlab chiqarish va savdo ERP tizimi',
        lang: 'uz',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // API so'rovlari - NetworkFirst (online bo'lsa tarmoqdan, offline bo'lsa keshdan)
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 soat
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Google Fonts - CacheFirst (kamdan-kam o'zgaradi)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 yil
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  define: {
    // SockJS uchun global polyfill
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // State management & data fetching
          'vendor-state': ['zustand', 'axios'],
          // UI libraries
          'vendor-ui': ['lucide-react', 'clsx'],
          // Charts (heavy)
          'vendor-charts': ['recharts'],
          // Date utilities
          'vendor-date': ['date-fns'],
          // Form handling
          'vendor-form': ['react-hook-form'],
          // PDF & export utilities
          'vendor-export': ['jspdf', 'jspdf-autotable', 'html2canvas'],
          // WebSocket
          'vendor-websocket': ['sockjs-client', '@stomp/stompjs'],
        },
      },
    },
  },
  server: {
    port: 5175,
    host: true, // SHU QATORNI QO'SHING - teldan kirish uchun shart!
    strictPort: true, // Agar 5175 band bo'lsa, boshqa portga o'tib ketmasligi uchun
    // Port removed - Vite will use any available port (default 5173)
    // This allows flexibility when multiple dev servers are running
    proxy: {
      '/api': {
        target: 'http://localhost:8170',
        // target: 'http://192.168.1.33:8080',
        changeOrigin: true,
        ws: true, // WebSocket support
      },
    },
  },
})
