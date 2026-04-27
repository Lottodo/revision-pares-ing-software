// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

import App from './App.vue';
import router from './router/index.js';

const storedTheme = localStorage.getItem('studiopeer-theme') || 'light';

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: storedTheme,
    themes: {
      light: {
        dark: false,
        colors: {
          primary:   '#0F172A', // Slate 900
          secondary: '#64748B', // Slate 500
          accent:    '#334155', // Slate 700
          error:     '#EF4444',
          warning:   '#F59E0B',
          surface:   '#FFFFFF',
          background:'#F8FAFC',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary:   '#E2E8F0', // Slate 200
          secondary: '#94A3B8', // Slate 400
          accent:    '#F1F5F9', // Slate 100
          error:     '#F87171',
          warning:   '#FBBF24',
          surface:   '#1E293B',
          background:'#0F172A',
        },
      },
      ocean: {
        dark: true,
        colors: {
          primary:   '#38BDF8',
          secondary: '#0284C7',
          accent:    '#10B981',
          error:     '#EF4444',
          warning:   '#F59E0B',
          surface:   '#0F172A',
          background:'#020617',
        },
      },
      emerald: {
        dark: false,
        colors: {
          primary:   '#065F46',
          secondary: '#059669',
          accent:    '#F59E0B',
          error:     '#DC2626',
          warning:   '#D97706',
          surface:   '#FFFFFF',
          background:'#ECFDF5',
        },
      },
    },
  },
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(vuetify);
app.mount('#app');
