// src/modules/auth/auth.service.js
// TODA la lógica de negocio de autenticación vive aquí.
// NO conoce req/res. Devuelve datos o lanza errores.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma.js';
import { env } from '../../config/env.js';

// ─── Helpers internos ────────────────────────────────────────────

/**
 * Genera un JWT con contexto de evento.
 * Si eventId se provee, busca los roles del usuario en ese evento.
 */
const generateToken = async (user, eventId = null) => {
  let roles = [];

  if (eventId) {
    const memberships = await prisma.eventUser.findMany({
      where: { userId: user.id, eventId },
    });
    roles = memberships.map((m) => m.role);
  }

  const payload = {
    id:       user.id,
    username: user.username,
    eventId:  eventId ?? null,
    roles,    // ['AUTHOR', 'REVIEWER'] — roles en el evento activo
  };

  return jwt.sign(payload, env.jwtSecret, { expiresIn: '24h' });
};

// ─── Service functions ───────────────────────────────────────────

/**
 * Registra un nuevo usuario en el sistema.
 * Por defecto no tiene roles — se asignan por evento después.
 */
export const register = async ({ username, email, password }) => {
  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (exists) {
    const field = exists.username === username ? 'username' : 'email';
    const error = new Error(`El ${field} ya está en uso.`);
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username: username.trim(), email: email.trim().toLowerCase(), passwordHash },
    select: { id: true, username: true, email: true, createdAt: true },
  });

  return user;
};

/**
 * Inicia sesión y devuelve token + perfil del usuario.
 * Si se provee eventId, el token incluye roles en ese evento.
 */
export const login = async ({ username, password, eventId }) => {
  const user = await prisma.user.findFirst({
    where: { username, active: true },
  });

  if (!user) {
    const error = new Error('Credenciales inválidas.');
    error.status = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const error = new Error('Credenciales inválidas.');
    error.status = 401;
    throw error;
  }

  // Obtener todos los eventos a los que pertenece el usuario
  const memberships = await prisma.eventUser.findMany({
    where: { userId: user.id },
    include: { event: { select: { id: true, name: true, slug: true } } },
  });

  // Consolidar: { eventId -> { event, roles[] } }
  const eventsMap = {};
  for (const m of memberships) {
    if (!eventsMap[m.eventId]) {
      eventsMap[m.eventId] = { event: m.event, roles: [] };
    }
    eventsMap[m.eventId].roles.push(m.role);
  }
  const userEvents = Object.values(eventsMap);

  const token = await generateToken(user, eventId ?? null);

  return {
    token,
    user: {
      id:       user.id,
      username: user.username,
      email:    user.email,
    },
    // Eventos disponibles para que el frontend muestre selector
    events: userEvents,
    // Contexto activo del token
    activeEventId: eventId ?? null,
  };
};

/**
 * Cambia el contexto de evento del usuario y reemite el token.
 * El frontend llama esto cuando el usuario selecciona un congreso distinto.
 */
export const switchEvent = async (userId, eventId) => {
  // Verificar que el usuario pertenezca al evento
  const membership = await prisma.eventUser.findFirst({
    where: { userId, eventId },
    include: { event: { select: { id: true, name: true } } },
  });

  if (!membership) {
    const error = new Error('No perteneces a este evento.');
    error.status = 403;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const token = await generateToken(user, eventId);

  // Roles del usuario en el nuevo evento
  const memberships = await prisma.eventUser.findMany({
    where: { userId, eventId },
  });
  const roles = memberships.map((m) => m.role);

  return { token, eventId, roles, eventName: membership.event.name };
};

/**
 * Obtiene el perfil completo del usuario autenticado.
 */
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:         true,
      username:   true,
      email:      true,
      active:     true,
      createdAt:  true,
      eventRoles: {
        include: {
          event: { select: { id: true, name: true, slug: true, active: true } },
        },
      },
    },
  });

  if (!user) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  // Consolidar eventos y roles
  const eventsMap = {};
  for (const er of user.eventRoles) {
    if (!eventsMap[er.eventId]) {
      eventsMap[er.eventId] = { event: er.event, roles: [] };
    }
    eventsMap[er.eventId].roles.push(er.role);
  }

  return {
    id:        user.id,
    username:  user.username,
    email:     user.email,
    active:    user.active,
    createdAt: user.createdAt,
    events:    Object.values(eventsMap),
  };
};
