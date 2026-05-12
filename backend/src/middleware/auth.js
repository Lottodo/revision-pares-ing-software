// src/middleware/auth.js
// Verifica el JWT y adjunta req.user al request.
// req.user contiene: { id, username, eventId, roles[] }

import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
import { unauthorized } from '../shared/response.js';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return unauthorized(res, 'Token requerido. Incluye Authorization: Bearer <token>');
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    
    // Validar restricción de sesión única (múltiples dispositivos)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { currentSessionId: true }
    });

    if (!user || user.currentSessionId !== decoded.sessionId) {
      return unauthorized(res, 'Sesión inválida o iniciada en otro dispositivo. Vuelve a iniciar sesión.');
    }

    req.user = decoded; // { id, username, eventId, roles, sessionId }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expirado. Vuelve a iniciar sesión.');
    }
    return unauthorized(res, 'Token inválido.');
  }
};
