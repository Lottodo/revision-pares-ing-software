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
      devOptions: {
        enabled: true,
      },

      // ── Manifest de la PWA (Hardened) ─────────────────────────
      manifest: {
        name: 'StudioPeer — Revisión Académica',
        short_name: 'StudioPeer',
        description: 'Plataforma de revisión por pares para congresos académicos',
        theme_color: '#1A2B4C',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        id: '/',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Panel Principal de StudioPeer',
          },
        ],
      },

      // ── Workbox: estrategia de caché (Host-agnostic) ──────────
      workbox: {
        // SPA fallback — so all routes load from cache offline
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],

        // Activate new SW immediately
        skipWaiting: true,
        clientsClaim: true,

        // Precache app shell — EXCLUDE heavy webviewer assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/webviewer/**'],

        // Maximum file size for precaching (default 2MB, bump for Vue bundles)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        // Runtime caching — HOST-AGNOSTIC patterns (works on any domain)
        runtimeCaching: [
          {
            // Cache API responses for papers
            urlPattern: /\/api\/papers/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-papers',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache reviewer assignments
            urlPattern: /\/api\/reviews\/my-assignments/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-assignments',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 12 },
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache event listings (changes rarely)
            urlPattern: /\/api\/events/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-events',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache auth endpoints briefly (for /me refreshes)
            urlPattern: /\/api\/auth\/me/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-auth',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache uploaded PDFs aggressively (they don't change)
            urlPattern: /\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache MDI icon font
            urlPattern: /\/@mdi\/font/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mdi-fonts',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
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
