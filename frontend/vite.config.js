// frontend/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),

    VitePWA({
      registerType: 'autoUpdate',

      // ── Manifest de la PWA ──────────────────────────────────
      manifest: {
        name: 'Sistema de Revisión de Congresos',
        short_name: 'Congresos PWA',
        description: 'Plataforma de gestión de revisión por pares de congresos académicos',
        theme_color: '#1A2B4C',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },

      // ── Workbox: estrategia de caché ─────────────────────────
      workbox: {
        // Cachear todos los assets del build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Rutas de la API con estrategia NetworkFirst:
        //  - Intenta la red primero
        //  - Si falla, sirve del caché
        //  - Ideal para datos que cambian frecuentemente
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:3000\/api\/papers/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-papers',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 24h
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^http:\/\/localhost:3000\/api\/reviews\/my-assignments/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-assignments',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 12 }, // 12h
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^http:\/\/localhost:3000\/api\/events/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-events',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 días
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // PDFs y archivos subidos: CacheFirst (no cambian)
          {
            urlPattern: /^http:\/\/localhost:3000\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 días
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // Forzar a que el service worker tome control inmediatamente
      injectRegister: 'auto',
      strategies: 'generateSW',
    }),
  ],

  server: {
    port: 5173,
    // Proxy para desarrollo: las llamadas a /api van al backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  resolve: {
    alias: { '@': '/src' },
  },
});
