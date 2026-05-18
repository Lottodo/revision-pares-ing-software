// src/modules/events/events.service.js
import prisma from '../../config/prisma.js';

export const listAll = async () =>
  prisma.event.findMany({ orderBy: { startDate: 'desc' } });

export const getById = async (id) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      _count: { select: { papers: true, members: true } },
    },
  });
  if (!event) { const e = new Error('Evento no encontrado.'); e.status = 404; throw e; }
  return event;
};

export const getBySlug = async (slug) => {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { _count: { select: { papers: true, members: true } } },
  });
  if (!event) { const e = new Error('Evento no encontrado.'); e.status = 404; throw e; }
  return event;
};

export const create = async (data) => {
  const exists = await prisma.event.findUnique({ where: { slug: data.slug } });
  if (exists) { const e = new Error('Ya existe un evento con ese slug.'); e.status = 409; throw e; }
  return prisma.event.create({ data });
};

export const update = async (id, data) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) { const e = new Error('Evento no encontrado.'); e.status = 404; throw e; }
  return prisma.event.update({ where: { id }, data });
};

export const remove = async (id) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) { const e = new Error('Evento no encontrado.'); e.status = 404; throw e; }
  // Soft delete: desactivar en lugar de borrar (preserva historial)
  return prisma.event.update({ where: { id }, data: { active: false } });
};

// Stats resumidas para el dashboard
export const getStats = async (id) => {
  const [papers, members, reviews, assignments] = await Promise.all([
    prisma.paper.groupBy({ by: ['status'], where: { eventId: id }, _count: true }),
    prisma.eventUser.groupBy({ by: ['role'], where: { eventId: id }, _count: true }),
    prisma.review.count({ where: { paper: { eventId: id } } }),
    prisma.assignment.count({ where: { paper: { eventId: id }, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
  ]);

  const papersByStatus = Object.fromEntries(papers.map((p) => [p.status, p._count]));
  const membersByRole  = Object.fromEntries(members.map((m) => [m.role, m._count]));

  return {
    papers: papersByStatus,
    members: membersByRole,
    totalReviews: reviews,
    pendingAssignments: assignments,
  };
};

export const joinByCode = async (userId, accessCode) => {
  // Buscar por accessCode dedicado primero, luego por slug como fallback
  const event = await prisma.event.findFirst({
    where: {
      OR: [
        { accessCode },
        { slug: accessCode },
      ]
    }
  });

  if (!event) {
    const e = new Error('Código de acceso no válido o evento no encontrado.');
    e.status = 404;
    throw e;
  }
  if (!event.active) {
    const e = new Error('Este evento está inactivo.');
    e.status = 403;
    throw e;
  }

  // Si ya es miembro de cualquier tipo, informamos
  const existing = await prisma.eventUser.findFirst({ where: { userId, eventId: event.id } });
  if (existing) {
    return { message: 'Ya eres miembro de este evento.', event };
  }

  // Ingresar como ATTENDEE (sin privilegios, solo puede ver info pública)
  await prisma.eventUser.create({
    data: { userId, eventId: event.id, role: 'ATTENDEE' }
  });

  return { message: 'Te has unido al congreso como Asistente.', event };
};

// ── Solicitudes de acceso (rol AUTHOR) ────────────────────────

/**
 * Usuario solicita ser AUTHOR en un evento.
 * Requiere ser ATTENDEE o no estar en el evento aún.
 */
export const requestAccess = async (userId, eventId, message) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) { const e = new Error('Evento no encontrado.'); e.status = 404; throw e; }
  if (!event.active) { const e = new Error('Este evento está inactivo.'); e.status = 403; throw e; }

  // Ya es AUTHOR o REVIEWER o EDITOR? No necesita solicitar
  const elevated = await prisma.eventUser.findFirst({
    where: { userId, eventId, role: { in: ['AUTHOR', 'REVIEWER', 'EDITOR', 'ADMIN'] } },
  });
  if (elevated) {
    const e = new Error('Ya tienes un rol activo en este evento.');
    e.status = 409;
    throw e;
  }

  // Solicitud ya pendiente?
  const pending = await prisma.eventRequest.findFirst({
    where: { userId, eventId, status: 'PENDING' },
  });
  if (pending) {
    const e = new Error('Ya tienes una solicitud pendiente para este evento.');
    e.status = 409;
    throw e;
  }

  return prisma.eventRequest.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: { status: 'PENDING', message: message || null, updatedAt: new Date() },
    create: { userId, eventId, message: message || null },
  });
};

/** Admin lista solicitudes pendientes de un evento */
export const listRequests = async (eventId, status) => {
  return prisma.eventRequest.findMany({
    where: {
      eventId,
      ...(status ? { status } : {}),
    },
    include: {
      user: { select: { id: true, username: true, email: true, specialty: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Admin aprueba o rechaza una solicitud.
 * Al aprobar, asigna rol AUTHOR (y convierte ATTENDEE en AUTHOR si existía).
 */
export const respondRequest = async (requestId, approve, adminNote) => {
  const req = await prisma.eventRequest.findUnique({
    where: { id: requestId },
    include: { user: true, event: true },
  });
  if (!req) { const e = new Error('Solicitud no encontrada.'); e.status = 404; throw e; }
  if (req.status !== 'PENDING') {
    const e = new Error('Esta solicitud ya fue procesada.'); e.status = 409; throw e;
  }

  if (approve) {
    // Quitar rol ATTENDEE si existe, agregar AUTHOR
    await prisma.eventUser.deleteMany({
      where: { userId: req.userId, eventId: req.eventId, role: 'ATTENDEE' },
    });
    await prisma.eventUser.upsert({
      where: { userId_eventId_role: { userId: req.userId, eventId: req.eventId, role: 'AUTHOR' } },
      update: {},
      create: { userId: req.userId, eventId: req.eventId, role: 'AUTHOR' },
    });
  }

  return prisma.eventRequest.update({
    where: { id: requestId },
    data: { status: approve ? 'APPROVED' : 'REJECTED', updatedAt: new Date() },
  });
};
