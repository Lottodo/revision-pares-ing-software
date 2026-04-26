// src/middleware/roles.js
// Middleware de autorización por rol dentro de un evento.
// SIEMPRE se usa DESPUÉS de verifyToken.
//
// Uso:
//   router.get('/papers', verifyToken, requireRole('EDITOR'), controller.getAll)
//   router.post('/reviews', verifyToken, requireRole('REVIEWER'), controller.create)

import { forbidden } from '../shared/response.js';

/**
 * Verifica que el usuario tenga AL MENOS UNO de los roles permitidos
 * en el evento activo de su token.
 *
 * @param {...string} allowedRoles - Roles permitidos (ej: 'EDITOR', 'ADMIN')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'No autenticado.');
    }

    const userRoles = req.user.roles ?? [];
    
    // El Global Admin automáticamente tiene el rol ADMIN para cualquier evento
    if (req.user.isGlobalAdmin && allowedRoles.includes('ADMIN')) {
      return next();
    }

    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return forbidden(
        res,
        `Acceso denegado para este evento. Se requiere: ${allowedRoles.join(' o ')}.`
      );
    }

    next();
  };
};

/**
 * Verifica que el token incluya un eventId válido.
 * Úsalo en cualquier ruta que opere sobre datos de un evento.
 */
export const requireEventContext = (req, res, next) => {
  if (!req.user?.eventId) {
    return forbidden(
      res,
      'El token no tiene contexto de evento. Selecciona un evento primero.'
    );
  }
  next();
};

/**
 * Verifica que el usuario sea administrador global de la plataforma.
 * Usado para crear/gestionar eventos sin depender de un eventId en el token.
 */
export const requireGlobalAdmin = (req, res, next) => {
  if (!req.user?.isGlobalAdmin) {
    return forbidden(res, 'Se requiere administrador global de la plataforma.');
  }
  next();
};
