// src/middleware/auth.js
// Verifica el JWT y adjunta req.user al request.
// req.user contiene: { id, username, eventId, roles[] }

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../shared/response.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return unauthorized(res, 'Token requerido. Incluye Authorization: Bearer <token>');
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded; // { id, username, eventId, roles }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expirado. Vuelve a iniciar sesión.');
    }
    return unauthorized(res, 'Token inválido.');
  }
};
