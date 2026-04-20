// src/api/events.js
import api from './client.js';

export const eventsApi = {
  list:      ()        => api.get('/events'),
  getById:   (id)      => api.get(`/events/${id}`),
  getBySlug: (slug)    => api.get(`/events/slug/${slug}`),
  getStats:  (id)      => api.get(`/events/${id}/stats`),
  create:    (data)    => api.post('/events', data),
  update:    (id, data)=> api.patch(`/events/${id}`, data),
  remove:    (id)      => api.delete(`/events/${id}`),
};

// src/api/papers.js
export const papersApi = {
  list: () => api.get('/papers'),

  getById: (id) => api.get(`/papers/${id}`),

  create: (formData) =>
    api.post('/papers', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  addVersion: (id, formData) =>
    api.post(`/papers/${id}/versions`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  updateStatus: (id, status) => api.patch(`/papers/${id}/status`, { status }),

  getHistory: (id) => api.get(`/papers/${id}/history`),
};

// src/api/reviews.js
export const reviewsApi = {
  // Revisor
  myAssignments: ()     => api.get('/reviews/my-assignments'),
  submit:        (data) => api.post('/reviews/submit', data),

  // Editor / Admin
  createAssignment: (data)             => api.post('/reviews/assignments', data),
  cancelAssignment: (paperId, reviewerId) =>
    api.delete('/reviews/assignments', { data: { paperId, reviewerId } }),
  listAssignments:  (paperId)          => api.get(`/reviews/assignments/${paperId}`),

  // Compartido (editor ve todo, autor ve sin revisor)
  listByPaper: (paperId) => api.get(`/reviews/paper/${paperId}`),
};

// src/api/users.js
export const usersApi = {
  list:              ()             => api.get('/users'),
  getById:           (id)           => api.get(`/users/${id}`),
  update:            (id, data)     => api.patch(`/users/${id}`, data),
  assignRole:        (data)         => api.post('/users/roles/assign', data),
  removeRole:        (data)         => api.delete('/users/roles/remove', { data }),
  byEvent:           (eventId)      => api.get(`/users/by-event/${eventId}`),
  reviewersByEvent:  (eventId)      => api.get(`/users/reviewers/${eventId}`),
};
