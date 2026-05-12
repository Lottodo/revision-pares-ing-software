// src/api/auth.js
import api from './client.js';

export const authApi = {
  login:       (data)    => api.post('/auth/login', data),
  register:    (data)    => api.post('/auth/register', data),
  logout:      ()        => api.post('/auth/logout'),
  me:          ()        => api.get('/auth/me'),
  switchEvent: (eventId) => api.post('/auth/switch-event', { eventId }),
};
