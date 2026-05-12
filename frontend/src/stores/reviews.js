// src/stores/reviews.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { reviewsApi } from '../api/index.js';

export const useReviewsStore = defineStore('reviews', () => {
  const assignments     = ref([]); 
  const paperReviews    = ref([]); 
  const paperAssignments = ref([]); 
  const loading         = ref(false);
  const error           = ref(null);

  const clearError = () => { error.value = null; };

  // ── Revisor ──────────────────────────────────────────────────
  const fetchMyAssignments = async () => {
    if (assignments.value.length === 0) loading.value = true;
    error.value = null;
    try {
      const { data } = await reviewsApi.myAssignments();
      assignments.value = data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al cargar asignaciones';
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
   * NUEVO: Guardar borrador
   * No cambia el estado de la asignación, solo persiste los datos.
   */
  const saveDraft = async (formData) => {
    error.value = null;
    try {
      const { data } = await reviewsApi.saveDraft(formData);
      return data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al guardar borrador';
      throw e;
    }
  };

  const submitReview = async (reviewData) => {
    loading.value = true; error.value = null;
    try {
      // Usamos reviewsApi.submit (asegúrate que en tu api/index.js se llame así o submitReview)
      const { data } = await reviewsApi.submit(reviewData);
      
      // Marcar la asignación como evaluada en el store
      // Si mandaste FormData, el ID viene dentro, hay que extraerlo
      const assignmentId = reviewData instanceof FormData 
        ? parseInt(reviewData.get('assignmentId')) 
        : reviewData.assignmentId;

      const idx = assignments.value.findIndex((a) => a.id === assignmentId);
      if (idx !== -1) assignments.value[idx].status = 'EVALUATED';
      
      return data.data;
    } catch (e) {
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