// src/api/client.js
// Cliente HTTP centralizado. Todos los módulos API importan desde aquí.
// Inyecta el token automáticamente en cada request.
// Maneja expiración de token y redirige al login.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inyectar token ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: manejar errores globales ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido — limpiar sesión y redirigir
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeEvent');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
