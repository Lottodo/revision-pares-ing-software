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
