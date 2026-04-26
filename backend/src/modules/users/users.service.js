import prisma from '../../config/prisma.js';
import { consolidateEvents } from '../../shared/consolidateEvents.js';

export const listAll = async () => {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: {
      id: true, username: true, email: true, active: true, createdAt: true,
      eventRoles: { include: { event: { select: { id: true, name: true, slug: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return users.map((u) => {
    return { id: u.id, username: u.username, email: u.email, active: u.active, createdAt: u.createdAt, events: consolidateEvents(u.eventRoles) };
  });
};

export const getById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, username: true, email: true, active: true, createdAt: true,
      eventRoles: { include: { event: { select: { id: true, name: true, slug: true } } } },
    },
  });
  if (!user) { const e = new Error('Usuario no encontrado.'); e.status = 404; throw e; }

  return { ...user, eventRoles: undefined, events: consolidateEvents(user.eventRoles) };
};

export const updateUser = async (id, data) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { const e = new Error('Usuario no encontrado.'); e.status = 404; throw e; }
  return prisma.user.update({ where: { id }, data, select: { id: true, username: true, email: true, active: true } });
};

export const assignRole = async ({ userId, eventId, role }) => {
  if (role === 'ADMIN') {
    const e = new Error('No se puede asignar el rol de administrador desde esta interfaz. Solo hay un administrador root.');
    e.status = 403;
    throw e;
  }

  // ── Validación Doble Ciego ──────────────────────────────────
  // Un autor no puede ser editor/revisor en el MISMO congreso y viceversa.
  const conflictMap = {
    REVIEWER: ['AUTHOR'],
    EDITOR:   ['AUTHOR'],
    AUTHOR:   ['REVIEWER', 'EDITOR'],
  };

  const conflictingRoles = conflictMap[role] ?? [];
  if (conflictingRoles.length > 0) {
    const conflicts = await prisma.eventUser.findMany({
      where: { userId, eventId, role: { in: conflictingRoles } },
    });
    if (conflicts.length > 0) {
      const conflictNames = conflicts.map(c => c.role).join(', ');
      const e = new Error(
        `Conflicto de doble ciego: el usuario ya tiene el rol "${conflictNames}" en este congreso. ` +
        `Un ${role} no puede ser ${conflictNames} en el mismo evento.`
      );
      e.status = 409;
      throw e;
    }
  }
  // ────────────────────────────────────────────────────────────

  // Verificar que ambos existen
  const [user, event] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.event.findUnique({ where: { id: eventId } }),
  ]);
  if (!user) { const e = new Error('Usuario no encontrado.'); e.status = 404; throw e; }
  if (!event) { const e = new Error('Evento no encontrado.'); e.status = 404; throw e; }

  // upsert: si ya existe no falla
  await prisma.eventUser.upsert({
    where: { userId_eventId_role: { userId, eventId, role } },
    update: {},
    create: { userId, eventId, role },
  });

  return { userId, eventId, role, message: `Rol ${role} asignado en "${event.name}".` };
};

export const removeRole = async ({ userId, eventId, role }) => {
  const membership = await prisma.eventUser.findUnique({
    where: { userId_eventId_role: { userId, eventId, role } },
  });
  if (!membership) { const e = new Error('El usuario no tiene ese rol en ese evento.'); e.status = 404; throw e; }
  await prisma.eventUser.delete({ where: { userId_eventId_role: { userId, eventId, role } } });
  return { message: `Rol ${role} removido.` };
};

export const getUsersByEvent = async (eventId) => {
  const memberships = await prisma.eventUser.findMany({
    where: { eventId },
    include: { user: { select: { id: true, username: true, email: true, active: true } } },
  });
  // Consolidar roles por usuario
  const map = {};
  for (const m of memberships) {
    if (!map[m.userId]) map[m.userId] = { ...m.user, roles: [] };
    map[m.userId].roles.push(m.role);
  }
  return Object.values(map);
};

export const getReviewersByEvent = async (eventId, paperId = null) => {
  const memberships = await prisma.eventUser.findMany({
    where: { eventId, role: 'REVIEWER' },
    include: { user: { select: { id: true, username: true, email: true, specialty: true } } },
  });

  let paperArea = null;
  if (paperId) {
    const paper = await prisma.paper.findUnique({ where: { id: paperId } });
    if (paper) paperArea = paper.area;
  }

  // Agregar carga de trabajo actual por revisor y matchArea
  const reviewers = await Promise.all(memberships.map(async (m) => {
    const workload = await prisma.assignment.count({
      where: {
        reviewerId: m.userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        paper: { eventId },
      },
    });
    
    // Si la especialidad del revisor coincide (ignorando mayúsculas) con el área del paper, es un "match"
    const matchArea = paperArea && m.user.specialty && m.user.specialty.toLowerCase() === paperArea.toLowerCase();
    
    return { id: m.user.id, username: m.user.username, email: m.user.email, specialty: m.user.specialty, workload, matchArea };
  }));

  // Ordenar: primero los que hacen matchArea, luego por workload (menor primero)
  return reviewers.sort((a, b) => {
    if (a.matchArea && !b.matchArea) return -1;
    if (!a.matchArea && b.matchArea) return 1;
    return a.workload - b.workload;
  });
};
