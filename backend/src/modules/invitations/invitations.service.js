// src/modules/invitations/invitations.service.js
import prisma from '../../config/prisma.js';
import crypto from 'crypto';

// ── Helpers ───────────────────────────────────────────────────
const throwIf = (cond, msg, status = 400) => {
  if (cond) { const e = new Error(msg); e.status = status; throw e; }
};

const generateToken = () => crypto.randomBytes(32).toString('hex');

const defaultExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7); // 7 días de validez
  return d;
};

// ── Para el Admin: enviar una invitación ──────────────────────
/**
 * Admin invita a alguien por email o por username.
 * Si ya es miembro con ese rol, lanza error.
 * Si ya existe una invitación pendiente, la reutiliza.
 */
export const sendInvitation = async ({ eventId, email, username, role }) => {
  // Validar que se indicó al menos uno
  throwIf(!email && !username, 'Debes indicar un email o nombre de usuario.');

  // Verificar que el evento existe
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  throwIf(!event, 'Evento no encontrado.', 404);

  // Buscar usuario si se indicó username
  let user = null;
  if (username) {
    user = await prisma.user.findUnique({ where: { username } });
    throwIf(!user, `El usuario "${username}" no existe en el sistema.`, 404);
    email = user.email; // Normalizar: siempre guardar el email
  } else if (email) {
    // Ver si el email ya corresponde a un usuario registrado
    user = await prisma.user.findUnique({ where: { email } });
  }

  // Si ya es miembro con ese rol, no tiene sentido invitarlo de nuevo
  if (user) {
    const alreadyMember = await prisma.eventUser.findFirst({
      where: { userId: user.id, eventId, role },
    });
    throwIf(alreadyMember, `El usuario ya tiene el rol ${role} en este evento.`, 409);
  }

  // Si ya hay una invitación pendiente, la actualizamos en lugar de duplicar
  const existing = await prisma.invitation.findFirst({
    where: { eventId, email, role, status: 'PENDING' },
  });

  if (existing) {
    return prisma.invitation.update({
      where: { id: existing.id },
      data: { token: generateToken(), expiresAt: defaultExpiry(), updatedAt: new Date() },
      include: { event: { select: { name: true } } },
    });
  }

  // Crear la invitación nueva
  return prisma.invitation.create({
    data: {
      eventId,
      email,
      userId: user?.id ?? null,
      role,
      token: generateToken(),
      expiresAt: defaultExpiry(),
    },
    include: { event: { select: { name: true } } },
  });
};

// ── Para el usuario: ver sus invitaciones pendientes ──────────
export const myInvitations = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];

  return prisma.invitation.findMany({
    where: {
      email: user.email,
      status: 'PENDING',
      expiresAt: { gte: new Date() },
    },
    include: {
      event: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ── Para el usuario: aceptar o rechazar una invitación ────────
export const respondToInvitation = async (userId, token, accept) => {
  const inv = await prisma.invitation.findUnique({ where: { token } });
  throwIf(!inv, 'Invitación no encontrada o enlace inválido.', 404);
  throwIf(inv.status !== 'PENDING', 'Esta invitación ya fue respondida.', 409);
  throwIf(inv.expiresAt < new Date(), 'Esta invitación ha expirado.', 410);

  // Verificar que la invitación es para este usuario
  const user = await prisma.user.findUnique({ where: { id: userId } });
  throwIf(user.email !== inv.email, 'Esta invitación no es para tu cuenta.', 403);

  if (!accept) {
    // Rechazar: solo actualizar estado
    await prisma.invitation.update({
      where: { token },
      data: { status: 'REJECTED', userId, updatedAt: new Date() },
    });
    return { message: 'Invitación rechazada.' };
  }

  // Aceptar: asignar rol en el evento (si no lo tiene ya)
  const alreadyMember = await prisma.eventUser.findFirst({
    where: { userId, eventId: inv.eventId, role: inv.role },
  });

  if (!alreadyMember) {
    await prisma.eventUser.create({
      data: { userId, eventId: inv.eventId, role: inv.role },
    });
  }

  await prisma.invitation.update({
    where: { token },
    data: { status: 'APPROVED', userId, updatedAt: new Date() },
  });

  const event = await prisma.event.findUnique({ where: { id: inv.eventId } });
  return { message: `¡Bienvenido! Ahora eres ${inv.role} en ${event.name}.`, event };
};

// ── Para el Admin: listar todas las invitaciones de un evento ─
export const listByEvent = async (eventId) => {
  return prisma.invitation.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, username: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ── Para el Admin: cancelar una invitación pendiente ──────────
export const cancelInvitation = async (invId) => {
  const inv = await prisma.invitation.findUnique({ where: { id: invId } });
  throwIf(!inv, 'Invitación no encontrada.', 404);
  throwIf(inv.status !== 'PENDING', 'Solo se pueden cancelar invitaciones pendientes.', 409);
  return prisma.invitation.delete({ where: { id: invId } });
};
