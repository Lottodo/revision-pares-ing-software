// src/modules/users/users.service.js
import prisma from '../../config/prisma.js';

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
    const eventsMap = {};
    for (const er of u.eventRoles) {
      if (!eventsMap[er.eventId]) eventsMap[er.eventId] = { event: er.event, roles: [] };
      eventsMap[er.eventId].roles.push(er.role);
    }
    return { id: u.id, username: u.username, email: u.email, active: u.active, createdAt: u.createdAt, events: Object.values(eventsMap) };
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

  const eventsMap = {};
  for (const er of user.eventRoles) {
    if (!eventsMap[er.eventId]) eventsMap[er.eventId] = { event: er.event, roles: [] };
    eventsMap[er.eventId].roles.push(er.role);
  }
  return { ...user, eventRoles: undefined, events: Object.values(eventsMap) };
};

export const updateUser = async (id, data) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { const e = new Error('Usuario no encontrado.'); e.status = 404; throw e; }
  return prisma.user.update({ where: { id }, data, select: { id: true, username: true, email: true, active: true } });
};

export const assignRole = async ({ userId, eventId, role }) => {
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

export const getReviewersByEvent = async (eventId) => {
  const memberships = await prisma.eventUser.findMany({
    where: { eventId, role: 'REVIEWER' },
    include: { user: { select: { id: true, username: true, email: true } } },
  });

  // Agregar carga de trabajo actual por revisor
  return Promise.all(memberships.map(async (m) => {
    const workload = await prisma.assignment.count({
      where: {
        reviewerId: m.userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        paper: { eventId },
      },
    });
    return { id: m.user.id, username: m.user.username, email: m.user.email, workload };
  }));
};
