// src/stores/papers.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { papersApi } from '../api/index.js';

export const usePapersStore = defineStore('papers', () => {
  const papers  = ref([]);
  const current = ref(null);
  const history = ref([]);
  const loading = ref(false);
  const error   = ref(null);

  const clearError = () => { error.value = null; };

  const fetchAll = async () => {
    loading.value = true; error.value = null;
    try {
      const { data } = await papersApi.list();
      papers.value = data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al cargar artículos';
    } finally { loading.value = false; }
  };

  const fetchById = async (id) => {
    loading.value = true; error.value = null;
    try {
      const { data } = await papersApi.getById(id);
      current.value = data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Artículo no encontrado';
    } finally { loading.value = false; }
  };

  const submit = async (formData) => {
    loading.value = true; error.value = null;
    try {
      const { data } = await papersApi.create(formData);
      papers.value.unshift(data.data);
      return data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al subir artículo';
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

  const updateStatus = async (id, status) => {
    try {
      const { data } = await papersApi.updateStatus(id, status);
      const idx = papers.value.findIndex((p) => p.id === id);
      if (idx !== -1) papers.value[idx] = data.data;
      if (current.value?.id === id) current.value = data.data;
      return data.data;
    } catch (e) {
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
