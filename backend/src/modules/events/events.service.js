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

/**
 * Métricas completas para el editor (US-2245).
 * Dashboard con tasas, promedios, retrasos y distribución.
 */
export const getEditorMetrics = async (eventId) => {
  const now = new Date();
  const warningDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [
    papersByStatus,
    membersByRole,
    allReviews,
    assignmentsByStatus,
    totalPapers,
    delayedCount,
  ] = await Promise.all([
    prisma.paper.groupBy({ by: ['status'], where: { eventId }, _count: true }),
    prisma.eventUser.groupBy({ by: ['role'], where: { eventId }, _count: true }),
    prisma.review.findMany({
      where: { paper: { eventId } },
      select: {
        verdict: true,
        originality: true,
        methodologicalRigor: true,
        writingQuality: true,
        relevance: true,
        createdAt: true,
        assignment: { select: { createdAt: true } },
      },
    }),
    prisma.assignment.groupBy({
      by: ['status'],
      where: { paper: { eventId } },
      _count: true,
    }),
    prisma.paper.count({ where: { eventId } }),
    prisma.assignment.count({
      where: {
        paper: { eventId },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        deadline: { not: null, lte: now },
      },
    }),
  ]);

  // Papers por estado
  const papersMap = Object.fromEntries(papersByStatus.map(p => [p.status, p._count]));
  const accepted = papersMap.ACCEPTED || 0;
  const rejected = papersMap.REJECTED || 0;
  const decided = accepted + rejected;

  // Miembros por rol
  const membersMap = Object.fromEntries(membersByRole.map(m => [m.role, m._count]));

  // Asignaciones por estado
  const assignmentsMap = Object.fromEntries(assignmentsByStatus.map(a => [a.status, a._count]));

  // Promedios de evaluaciones
  const criteria = ['originality', 'methodologicalRigor', 'writingQuality', 'relevance'];
  const averages = {};
  if (allReviews.length > 0) {
    for (const c of criteria) {
      averages[c] = +(allReviews.reduce((sum, r) => sum + r[c], 0) / allReviews.length).toFixed(2);
    }
  }
  const overallAverage = allReviews.length > 0
    ? +(Object.values(averages).reduce((a, b) => a + b, 0) / criteria.length).toFixed(2)
    : 0;

  // Veredictos
  const verdictCounts = {};
  for (const r of allReviews) {
    verdictCounts[r.verdict] = (verdictCounts[r.verdict] || 0) + 1;
  }

  // Tiempo promedio de revisión (días desde asignación hasta evaluación)
  let avgDaysToReview = 0;
  const reviewsWithTime = allReviews.filter(r => r.assignment?.createdAt);
  if (reviewsWithTime.length > 0) {
    const totalDays = reviewsWithTime.reduce((sum, r) => {
      const diff = new Date(r.createdAt) - new Date(r.assignment.createdAt);
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    avgDaysToReview = +(totalDays / reviewsWithTime.length).toFixed(1);
  }

  return {
    papers: {
      byStatus: papersMap,
      total: totalPapers,
    },
    assignments: {
      pending: assignmentsMap.PENDING || 0,
      inProgress: assignmentsMap.IN_PROGRESS || 0,
      evaluated: assignmentsMap.EVALUATED || 0,
      cancelled: assignmentsMap.CANCELLED || 0,
    },
    reviews: {
      total: allReviews.length,
      averages,
      overallAverage,
      byVerdict: verdictCounts,
    },
    reviewers: {
      total: membersMap.REVIEWER || 0,
    },
    delays: {
      overdue: delayedCount,
    },
    rates: {
      acceptanceRate: totalPapers > 0 ? +((accepted / totalPapers) * 100).toFixed(1) : 0,
      rejectionRate: totalPapers > 0 ? +((rejected / totalPapers) * 100).toFixed(1) : 0,
      decisionRate: totalPapers > 0 ? +((decided / totalPapers) * 100).toFixed(1) : 0,
      pendingRate: totalPapers > 0 ? +(((totalPapers - decided) / totalPapers) * 100).toFixed(1) : 0,
    },
    timeline: {
      avgDaysToReview,
    },
    members: membersMap,
  };
};
