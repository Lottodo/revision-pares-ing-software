// src/stores/reviews.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { reviewsApi } from '../api/index.js';

export const useReviewsStore = defineStore('reviews', () => {
  const assignments    = ref([]); // mis asignaciones (revisor)
  const paperReviews   = ref([]); // evaluaciones de un paper (editor/autor)
  const paperAssignments = ref([]); // asignaciones de un paper (editor)
  const loading        = ref(false);
  const error          = ref(null);

  const clearError = () => { error.value = null; };

  // ── Revisor ──────────────────────────────────────────────────
  const fetchMyAssignments = async () => {
    loading.value = true; error.value = null;
    try {
      const { data } = await reviewsApi.myAssignments();
      assignments.value = data.data;
    } catch (e) {
      error.value = e.response?.data?.error || 'Error al cargar asignaciones';
    } finally { loading.value = false; }
  };

  const submitReview = async (reviewData) => {
    loading.value = true; error.value = null;
    try {
      const { data } = await reviewsApi.submit(reviewData);
      // Marcar la asignación como evaluada en el store
      const idx = assignments.value.findIndex((a) => a.id === reviewData.assignmentId);
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
    fetchMyAssignments, submitReview,
    fetchAssignmentsByPaper, createAssignment, cancelAssignment,
    fetchReviewsByPaper,
  };
});
