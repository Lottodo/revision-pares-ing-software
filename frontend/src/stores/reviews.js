// src/stores/reviews.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { reviewsApi } from '../api/index.js';
import { getAll, replaceAll, put, enqueueSync } from '../utils/offlineDb.js';
import { refreshCount } from '../utils/syncManager.js';

export const useReviewsStore = defineStore('reviews', () => {
  const assignments     = ref([]); 
  const paperReviews    = ref([]); 
  const paperAssignments = ref([]); 
  const loading         = ref(false);
  const error           = ref(null);

  const clearError = () => { error.value = null; };

  // ── Revisor ──────────────────────────────────────────────────

  /**
   * Fetch my assignments — Network-first with IndexedDB fallback.
   */
  const fetchMyAssignments = async () => {
    if (assignments.value.length === 0) loading.value = true;
    error.value = null;
    try {
      const { data } = await reviewsApi.myAssignments();
      assignments.value = data.data;
      // Cache for offline
      await replaceAll('cachedAssignments', data.data).catch(() => {});
    } catch (e) {
      // Network failed — try IndexedDB cache
      try {
        const cached = await getAll('cachedAssignments');
        if (cached.length) {
          assignments.value = cached;
          console.log('[Reviews] Loaded from offline cache:', cached.length, 'assignments');
        } else {
          error.value = 'Sin conexión y sin datos en caché';
        }
      } catch {
        error.value = e.response?.data?.error || 'Error al cargar asignaciones';
      }
    } finally { loading.value = false; }
  };

  const respondToAssignment = async (assignmentId, accept) => {
    loading.value = true; error.value = null;
    try {
      await reviewsApi.respondToAssignment(assignmentId, accept);
      // Actualizar estado local si aceptó
      const idx = assignments.value.findIndex(a => a.id === assignmentId);
      if (idx !== -1) assignments.value[idx].status = accept ? 'IN_PROGRESS' : 'REJECTED';
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al responder asignación';
      throw e;
    } finally { loading.value = false; }
  };

  /**
   * Save draft — works offline by saving to IndexedDB and queuing for sync.
   */
  const saveDraft = async (formData) => {
    error.value = null;
    try {
      const { data } = await reviewsApi.saveDraft(formData);
      return data.data;
    } catch (e) {
      // If it's a network error, save draft locally
      if (!e.response) {
        const draftData = formData instanceof FormData
          ? Object.fromEntries(formData.entries())
          : formData;

        await put('draftReviews', {
          assignmentId: parseInt(draftData.assignmentId),
          ...draftData,
          savedAt: new Date().toISOString(),
          pendingSync: true,
        });

        // Queue the sync operation (JSON only, not multipart)
        if (!(formData instanceof FormData)) {
          await enqueueSync({
            type: 'saveDraft',
            method: 'POST',
            url: '/reviews/draft',
            data: draftData,
          });
          await refreshCount();
        }

        console.log('[Reviews] Draft saved offline for assignment:', draftData.assignmentId);
        return draftData;
      }
      error.value = e.response?.data?.error || 'Error al guardar borrador';
      throw e;
    }
  };

  /**
   * Submit final review — queued for sync if offline.
   */
  const submitReview = async (reviewData) => {
    loading.value = true; error.value = null;
    try {
      const { data } = await reviewsApi.submit(reviewData);
      
      const assignmentId = reviewData instanceof FormData 
        ? parseInt(reviewData.get('assignmentId')) 
        : reviewData.assignmentId;

      const idx = assignments.value.findIndex((a) => a.id === assignmentId);
      if (idx !== -1) assignments.value[idx].status = 'EVALUATED';
      
      return data.data;
    } catch (e) {
      // Queue for offline if network error and it's JSON data
      if (!e.response && !(reviewData instanceof FormData)) {
        await enqueueSync({
          type: 'submitReview',
          method: 'POST',
          url: '/reviews/submit',
          data: reviewData,
        });
        await refreshCount();

        // Optimistic update
        const assignmentId = reviewData.assignmentId;
        const idx = assignments.value.findIndex((a) => a.id === assignmentId);
        if (idx !== -1) assignments.value[idx].status = 'EVALUATED';

        console.log('[Reviews] Review queued for sync:', assignmentId);
        return reviewData;
      }
      error.value = e.response?.data?.error || 'Error al enviar evaluación';
      throw e;
    } finally { loading.value = false; }
  };

  // ── Editor / Admin ───────────────────────────────────────────
  const fetchAssignmentsByPaper = async (paperId) => {
    try {
      const { data } = await reviewsApi.listAssignments(paperId);
      paperAssignments.value = data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al cargar asignaciones';
    }
  };

  const createAssignment = async (paperId, reviewerId, deadline) => {
    try {
      const { data } = await reviewsApi.createAssignment({ paperId, reviewerId, deadline });
      paperAssignments.value.push(data.data);
      return data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al asignar revisor';
      throw e;
    }
  };

  const cancelAssignment = async (paperId, reviewerId) => {
    try {
      await reviewsApi.cancelAssignment(paperId, reviewerId);
      const idx = paperAssignments.value.findIndex(
        (a) => a.paperId === paperId && a.reviewerId === reviewerId
      );
      if (idx !== -1) paperAssignments.value[idx].status = 'CANCELLED';
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al cancelar asignación';
      throw e;
    }
  };

  // ── Compartido ───────────────────────────────────────────────
  const fetchReviewsByPaper = async (paperId) => {
    try {
      const { data } = await reviewsApi.listByPaper(paperId);
      paperReviews.value = data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al cargar evaluaciones';
    }
  };

  return {
    assignments, paperReviews, paperAssignments, loading, error, clearError,
    fetchMyAssignments, submitReview, saveDraft, respondToAssignment,
    fetchAssignmentsByPaper, createAssignment, cancelAssignment,
    fetchReviewsByPaper,
  };
});