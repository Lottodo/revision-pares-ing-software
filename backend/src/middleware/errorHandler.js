// src/middleware/errorHandler.js
// Manejador de errores global de Express.
// Debe ser el ÚLTIMO middleware en app.js.

import { env } from '../config/env.js';

export const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  // Errores de Prisma conocidos
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Ya existe un registro con esos datos únicos.',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Registro no encontrado.',
    });
  }

  // Error genérico
  const status = err.status || err.statusCode || 500;
  const message =
    env.isDev
      ? err.message || 'Error interno del servidor'
      : 'Error interno del servidor';

  return res.status(status).json({ success: false, error: message });
};
