// src/stores/papers.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { papersApi } from '../api/index.js';
import { getAll, replaceAll, enqueueSync } from '../utils/offlineDb.js';
import { refreshCount } from '../utils/syncManager.js';

export const usePapersStore = defineStore('papers', () => {
  const papers  = ref([]);
  const current = ref(null);
  const history = ref([]);
  const loading = ref(false);
  const error   = ref(null);

  const clearError = () => { error.value = null; };

  /**
   * Fetch all papers — Network-first with IndexedDB fallback.
   * On success: cache data locally. On failure: load from cache.
   */
  const fetchAll = async () => {
    loading.value = true; error.value = null;
    try {
      const { data } = await papersApi.list();
      papers.value = data.data;
      // Persist to IndexedDB for offline access
      await replaceAll('cachedPapers', data.data).catch(() => {});
    } catch (e) {
      // Network failed — try IndexedDB cache
      try {
        const cached = await getAll('cachedPapers');
        if (cached.length) {
          papers.value = cached;
          console.log('[Papers] Loaded from offline cache:', cached.length, 'papers');
        } else {
          error.value = 'Sin conexión y sin datos en caché';
        }
      } catch {
        error.value = e.response?.data?.error || 'Error al cargar artículos';
      }
    } finally { loading.value = false; }
  };

  const fetchById = async (id) => {
    loading.value = true; error.value = null;
    try {
      const { data } = await papersApi.getById(id);
      current.value = data.data;
    } catch (e) {
      // Try local cache
      try {
        const { getById: getFromDb } = await import('../utils/offlineDb.js');
        const cached = await getFromDb('cachedPapers', id);
        if (cached) {
          current.value = cached;
        } else {
          error.value = e.response?.data?.error || 'Artículo no encontrado';
        }
      } catch {
        error.value = e.response?.data?.error || 'Artículo no encontrado';
      }
    } finally { loading.value = false; }
  };

  const submit = async (formData) => {
    loading.value = true; error.value = null;
    try {
      const { data } = await papersApi.create(formData);
      papers.value.unshift(data.data);
      return data.data;
    } catch (e) {
      // Cannot queue multipart uploads offline
      error.value = e.response?.data?.error || 'Error al subir artículo (requiere conexión)';
      throw e;
    } finally { loading.value = false; }
  };

  const addVersion = async (id, formData) => {
    loading.value = true; error.value = null;
    try {
      const { data } = await papersApi.addVersion(id, formData);
      const idx = papers.value.findIndex((p) => p.id === id);
      if (idx !== -1) papers.value[idx] = data.data;
      if (current.value?.id === id) current.value = data.data;
      return data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al subir versión';
      throw e;
    } finally { loading.value = false; }
  };

  const updateStatus = async (id, status, editorComment) => {
    try {
      const { data } = await papersApi.updateStatus(id, status, editorComment);
      const idx = papers.value.findIndex((p) => p.id === id);
      if (idx !== -1) papers.value[idx] = data.data;
      if (current.value?.id === id) current.value = data.data;
      return data.data;
    } catch (e) {
      // Queue for offline sync if it's a network error
      if (!e.response) {
        await enqueueSync({
          type: 'updatePaperStatus',
          method: 'PATCH',
          url: `/papers/${id}/status`,
          data: { status, editorComment },
        });
        await refreshCount();
        // Optimistic update
        const idx = papers.value.findIndex((p) => p.id === id);
        if (idx !== -1) papers.value[idx] = { ...papers.value[idx], status };
        return papers.value[idx];
      }
      error.value = e.response?.data?.error || 'Error al actualizar estado';
      throw e;
    }
  };

  const fetchHistory = async (id) => {
    try {
      const { data } = await papersApi.getHistory(id);
      history.value = data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al cargar historial';
    }
  };

  return { papers, current, history, loading, error, clearError, fetchAll, fetchById, submit, addVersion, updateStatus, fetchHistory };
});
