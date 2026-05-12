// frontend/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',

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
        // skipWaiting hace que el nuevo SW tome control INMEDIATAMENTE sin esperar
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:3000\/api\/papers/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-papers',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^http:\/\/localhost:3000\/api\/reviews\/my-assignments/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-assignments',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 12 },
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^http:\/\/localhost:3000\/api\/events/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-events',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^http:\/\/localhost:3000\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
    host: '0.0.0.0',
    watch: {
      usePolling: true,
      interval: 1000,
    },
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
