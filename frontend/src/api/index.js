// src/api/events.js
import api from './client.js';

export const eventsApi = {
  list: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  getBySlug: (slug) => api.get(`/events/slug/${slug}`),
  getStats: (id) => api.get(`/events/${id}/stats`),
  create: (payload) => api.post('/events', payload),
  update: (id, payload) => api.patch(`/events/${id}`, payload),
  joinEvent: (accessCode) => api.post('/events/join', { accessCode }),
  remove: (id) => api.delete(`/events/${id}`),
};

// src/api/papers.js
export const papersApi = {
  list: () => api.get('/papers'),

  getById: (id) => api.get(`/papers/${id}`),

  create: (formData) =>
    api.post('/papers', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  addVersion: (id, formData) =>
    api.post(`/papers/${id}/versions`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  updateStatus: (id, status, editorComment) => api.patch(`/papers/${id}/status`, { status, editorComment }),
  getHistory: (id) => api.get(`/papers/${id}/history`),
  addHistoryNote: (id, note) => api.post(`/papers/${id}/history`, { note }),
  /*downloadPdf: async (url) => {
    // Extraer todo lo que está después de '/uploads/' para soportar subcarpetas
    const path = url.split('/uploads/')[1] || url.split('/').pop();
    const response = await api.get('/papers/download', { params: { path }, responseType: 'blob' });
    return window.URL.createObjectURL(response.data);
  }*/

  /**
   * Descarga un PDF (Original o Revisión Anotada)
   * @param {string} url - La ruta guardada en la DB (ej: /uploads/archivo.pdf)
   */
  downloadPdf: async (url) => {
    if (!url) throw new Error("URL de archivo no válida");

    // Extraemos solo el nombre del archivo (ej: "1777...pdf")
    // Esto es lo que espera recibir el backend en req.query.path
    const fileName = url.split('/').pop();

    try {
      const response = await api.get('/papers/download', {
        params: { path: fileName }, 
        responseType: 'blob' // Indispensable para archivos binarios
      });

      // Creamos una URL temporal para que el navegador pueda abrir el PDF
      return window.URL.createObjectURL(response.data);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
      throw error;
    }
  }
};

// src/api/reviews.js
export const reviewsApi = {
  // Revisor
  myAssignments: () => api.get('/reviews/my-assignments'),
  submit: (data) =>
    data instanceof FormData
      ? api.post('/reviews/submit', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.post('/reviews/submit', data),
  respondToAssignment: (id, accept) => api.put(`/reviews/assignments/${id}/respond`, { accept }),

  // Editor / Admin
  createAssignment: (data) => api.post('/reviews/assignments', data),
  cancelAssignment: (paperId, reviewerId) =>
    api.delete('/reviews/assignments', { data: { paperId, reviewerId } }),
  listAssignments: (paperId) => api.get(`/reviews/assignments/${paperId}`),

  // Compartido (editor ve todo, autor ve sin revisor)
  listByPaper: (paperId) => api.get(`/reviews/paper/${paperId}`),
};

// src/api/users.js
export const usersApi = {
  list: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
  assignRole: (data) => api.post('/users/roles/assign', data),
  removeRole: (data) => api.delete('/users/roles/remove', { data }),
  byEvent: (eventId) => api.get(`/users/by-event/${eventId}`),
  reviewersByEvent: (eventId, paperId = null) => api.get(`/users/reviewers/${eventId}`, { params: { paperId } }),
};
