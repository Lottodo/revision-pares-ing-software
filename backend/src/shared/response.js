// src/shared/response.js
// Helpers centralizados para respuestas HTTP consistentes.
// Todos los controllers los usan — nunca escribir res.json() manualmente.

export const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

export const created = (res, data) => ok(res, data, 201);

export const fail = (res, error, status = 400) =>
  res.status(status).json({ success: false, error });

export const notFound = (res, message = 'Recurso no encontrado') =>
  fail(res, message, 404);

export const forbidden = (res, message = 'Acceso denegado') =>
  fail(res, message, 403);

export const unauthorized = (res, message = 'No autenticado') =>
  fail(res, message, 401);

export const serverError = (res, err) => {
  console.error('[Server Error]', err);
  return fail(res, 'Error interno del servidor', 500);
};
