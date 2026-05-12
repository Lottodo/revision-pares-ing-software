// src/stores/auth.js
// Store central de autenticación y contexto de evento.
// Es la única fuente de verdad para: token, usuario, evento activo, roles.

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api/auth.js';
import api from '../api/client.js';

export const useAuthStore = defineStore('auth', () => {
  // ── Estado ──────────────────────────────────────────────────
  const token       = ref(localStorage.getItem('token') || null);
  const user        = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const activeEvent = ref(JSON.parse(localStorage.getItem('activeEvent') || 'null'));
  const userEvents  = ref(JSON.parse(localStorage.getItem('userEvents') || '[]'));

  // ── Computed ─────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value);
  const roles           = computed(() => activeEvent.value?.roles ?? []);
  const eventId         = computed(() => activeEvent.value?.event?.id ?? null);

  const isAdmin    = computed(() => roles.value.includes('ADMIN') || user.value?.isGlobalAdmin);
  const isGlobalAdmin = computed(() => !!user.value?.isGlobalAdmin);
  const isEditor   = computed(() => roles.value.includes('EDITOR') || isAdmin.value);
  const isReviewer = computed(() => roles.value.includes('REVIEWER'));
  const isAuthor   = computed(() => roles.value.includes('AUTHOR'));

  // ── Helpers privados ─────────────────────────────────────────
  const persist = () => {
    if (token.value)       localStorage.setItem('token', token.value);
    else                   localStorage.removeItem('token');
    if (user.value)        localStorage.setItem('user', JSON.stringify(user.value));
    else                   localStorage.removeItem('user');
    if (activeEvent.value) localStorage.setItem('activeEvent', JSON.stringify(activeEvent.value));
    else                   localStorage.removeItem('activeEvent');
    localStorage.setItem('userEvents', JSON.stringify(userEvents.value));
  };

  // ── Acciones ─────────────────────────────────────────────────

  /**
   * Login con o sin evento.
   * Si el usuario tiene un solo evento, lo selecciona automáticamente.
   */
  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    const result = data.data;

    // Guardamos el token en el estado y en el storage INMEDIATAMENTE
    token.value      = result.token;
    user.value       = result.user;
    userEvents.value = result.events || [];

    // Inyectamos el token en Axios manualmente para que la siguiente petición (switchEvent) 
    // no falle aunque el interceptor aún no lo vea en el storage
    api.defaults.headers.common['Authorization'] = `Bearer ${result.token}`;
    
    // Persistimos de una vez para que switchEvent tenga acceso al storage si lo necesita
    persist();

    // Auto-seleccionar evento si solo hay uno o si vino eventId en el login
    if (result.activeEventId && result.events.length > 0) {
      const ev = result.events.find((e) => e.event.id === result.activeEventId);
      activeEvent.value = ev ?? result.events[0] ?? null;
      persist(); // Guardamos el evento seleccionado
    } else if (result.events.length === 1) {
      await switchEvent(result.events[0].event.id);
      return result;
    } else {
      activeEvent.value = null; // Usuario debe seleccionar evento
    }

    return result;
  };

  /**
   * Register a new user
   */
  const register = async (userData) => {
    const { data } = await authApi.register(userData);
    return data.data;
  };

  /**
   * Cambia el evento activo y reemite el token con los roles correctos.
   */
  const switchEvent = async (eventId) => {
    const { data } = await authApi.switchEvent(eventId);
    const result = data.data;

    token.value = result.token;

    // ACTUALIZA EL TOKEN EN AXIOS (NUEVO TOKEN CON ROLES)
    api.defaults.headers.common['Authorization'] = `Bearer ${result.token}`;
    
    // Actualizar evento activo con los nuevos roles
    const ev = userEvents.value.find((e) => e.event.id === eventId);
    activeEvent.value = ev
      ? { ...ev, roles: result.roles }
      : { event: { id: eventId, name: result.eventName }, roles: result.roles };

    persist();
    return result;
  };

  /**
   * Refresca el perfil del usuario (llama a /me).
   */
  const refreshMe = async () => {
    const { data } = await authApi.me();
    const me = data.data;
    user.value       = { id: me.id, username: me.username, email: me.email };
    userEvents.value = me.events || [];
    persist();
    return me;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignorar si falla */ }
    token.value       = null;
    user.value        = null;
    activeEvent.value = null;
    userEvents.value  = [];
    localStorage.clear();
  };

  return {
    // Estado
    token, user, activeEvent, userEvents,
    // Computed
    isAuthenticated, roles, eventId,
    isAdmin, isGlobalAdmin, isEditor, isReviewer, isAuthor,
    // Acciones
    login, register, logout, switchEvent, refreshMe,
  };
});
