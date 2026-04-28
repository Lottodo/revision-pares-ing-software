// src/modules/reviews/reviews.service.js
import prisma from '../../config/prisma.js';
import { logHistory } from '../../shared/history.js';

// ─── ASIGNACIONES ────────────────────────────────────────────

/**
 * Asigna un revisor a un artículo. Solo EDITOR/ADMIN.
 * Valida:
 *  - El artículo pertenece al evento activo del token
 *  - El revisor tiene rol REVIEWER en ese mismo evento
 *  - No existe asignación activa duplicada
 */
export const createAssignment = async ({ paperId, reviewerId, deadline }, editorId, eventId) => {
  // Verificar que el artículo existe en el evento
  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado en este evento.'); e.status = 404; throw e; }

  // Verificar que el revisor tiene rol REVIEWER en este evento
  const isReviewer = await prisma.eventUser.findFirst({
    where: { userId: reviewerId, eventId, role: 'REVIEWER' },
  });
  if (!isReviewer) {
    const e = new Error('El usuario no tiene rol de Revisor en este evento.'); e.status = 400; throw e;
  }

  // Verificar que no existe asignación activa ya
  const existing = await prisma.assignment.findFirst({
    where: { paperId, reviewerId, status: { not: 'CANCELLED' } },
  });
  if (existing) { const e = new Error('Este revisor ya está asignado a este artículo.'); e.status = 409; throw e; }

  const assignment = await prisma.assignment.create({
    data: { paperId, reviewerId, deadline: deadline ?? null, status: 'PENDING' },
    include: { reviewer: { select: { id: true, username: true } } },
  });

  // Si hay ≥2 revisores activos → cambiar estado a UNDER_REVIEW
  const activeCount = await prisma.assignment.count({
    where: { paperId, status: { not: 'CANCELLED' } },
  });
  if (activeCount >= 2 && paper.status === 'RECEIVED') {
    await prisma.paper.update({ where: { id: paperId }, data: { status: 'UNDER_REVIEW' } });
    await logHistory(paperId, 'En revisión', 'Dos o más revisores asignados.', editorId);
  }

  await logHistory(paperId, 'Revisor asignado', `Revisor ${assignment.reviewer.username} vinculado.`, editorId);
  return assignment;
};

/**
 * Lista asignaciones de un artículo. Solo EDITOR/ADMIN.
 * Incluye nombre de revisor — el editor sí puede ver quién revisa.
 */
export const listAssignmentsByPaper = async (paperId, eventId) => {
  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }

  return prisma.assignment.findMany({
    where: { paperId },
    include: {
      reviewer: { select: { id: true, username: true, email: true } },
      review: { select: { id: true, verdict: true, createdAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Cancela una asignación. Solo EDITOR/ADMIN.
 */
export const cancelAssignment = async ({ paperId, reviewerId }, editorId, eventId) => {
  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }

  const assignment = await prisma.assignment.findFirst({
    where: { paperId, reviewerId, status: { not: 'CANCELLED' } },
    include: { reviewer: { select: { username: true } } },
  });
  if (!assignment) { const e = new Error('Asignación no encontrada o ya cancelada.'); e.status = 404; throw e; }
  if (assignment.status === 'EVALUATED') { const e = new Error('No se puede cancelar una asignación ya evaluada.'); e.status = 400; throw e; }

  await prisma.assignment.update({ where: { id: assignment.id }, data: { status: 'CANCELLED' } });
  await logHistory(paperId, 'Revisor removido', `Revisor ${assignment.reviewer.username} desvinculado.`, editorId);
  return { message: 'Asignación cancelada.' };
};

// ─── EVALUACIONES ─────────────────────────────────────────────

/**
 * Mis asignaciones pendientes (vista del REVISOR).
 * Solo devuelve artículos asignados al revisor en el evento activo.
 * SIN datos del autor — doble ciego.
 */
export const myAssignments = async (reviewerId, eventId) => {
  return prisma.assignment.findMany({
    where: {
      reviewerId,
      status: { not: 'CANCELLED' },
      paper: { eventId },
    },
    include: {
      paper: {
        select: {
          id: true, title: true, abstract: true, documentUrl: true,
          status: true, createdAt: true,
          versions: { select: { version: true, url: true, createdAt: true } },
          // authorId y author se omiten deliberadamente — doble ciego
        },
      },
      review: { select: { id: true, verdict: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Envía una evaluación. Solo el REVISOR asignado puede hacerlo.
 * Valida que la asignación le pertenezca y no haya sido ya evaluada.
 */
export const submitReview = async (data, reviewerId) => {
  const { assignmentId, ...reviewData } = data;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { paper: { select: { id: true, eventId: true } } },
  });

  if (!assignment) { const e = new Error('Asignación no encontrada.'); e.status = 404; throw e; }
  if (assignment.reviewerId !== reviewerId) { const e = new Error('No eres el revisor de esta asignación.'); e.status = 403; throw e; }
  if (assignment.status === 'CANCELLED') { const e = new Error('La asignación fue cancelada.'); e.status = 400; throw e; }
  if (assignment.status === 'EVALUATED') { const e = new Error('Ya enviaste una evaluación para esta asignación.'); e.status = 409; throw e; }

  // Verificar que no tenga ya un review en BD (por si acaso)
  const existing = await prisma.review.findUnique({ where: { assignmentId } });
  if (existing) { const e = new Error('Ya existe una evaluación para esta asignación.'); e.status = 409; throw e; }

  const [review] = await prisma.$transaction([
    prisma.review.create({
      data: {
        paperId:    assignment.paperId,
        reviewerId,
        assignmentId,
        ...reviewData,
      },
    }),
    prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: 'EVALUATED' },
    }),
  ]);

  await logHistory(
    assignment.paperId,
    'Dictamen emitido',
    `Un revisor emitió su evaluación: ${reviewData.verdict}.`,
    reviewerId
  );

  return review;
};

/**
 * Lista evaluaciones de un artículo.
 * - EDITOR/ADMIN: ve nombre del revisor
 * - AUTHOR: ve veredicto y comentarios, SIN nombre del revisor (doble ciego)
 */
export const listReviewsByPaper = async (paperId, eventId, user) => {
  const { id: userId, roles = [] } = user;
  const isEditor = roles.includes('EDITOR') || roles.includes('ADMIN');

  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }

  // Author: solo puede ver evaluaciones de sus propios artículos
  if (!isEditor && paper.authorId !== userId) {
    const e = new Error('No tienes acceso a estas evaluaciones.'); e.status = 403; throw e;
  }

  const reviews = await prisma.review.findMany({
    where: { paperId },
    include: {
      reviewer: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Si es autor, ocultar datos del revisor
  if (!isEditor) {
    return reviews.map(({ reviewer: _r, reviewerId: _id, ...rest }) => rest);
  }

  return reviews;
};

// ─── RETRASOS (US-2246) ───────────────────────────────────────

/**
 * Lista asignaciones con deadline vencido o próximo a vencer (≤3 días).
 * Solo EDITOR/ADMIN.
 */
export const getDelayedAssignments = async (eventId) => {
  const now = new Date();
  const warningDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 días

  const assignments = await prisma.assignment.findMany({
    where: {
      paper: { eventId },
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      deadline: { not: null, lte: warningDate },
    },
    include: {
      paper: { select: { id: true, title: true, status: true } },
      reviewer: { select: { id: true, username: true, email: true } },
    },
    orderBy: { deadline: 'asc' },
  });

  return assignments.map(a => {
    const deadline = new Date(a.deadline);
    const diffMs = deadline - now;
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isOverdue = diffMs < 0;
    const daysOverdue = isOverdue ? Math.abs(daysRemaining) : 0;

    return {
      ...a,
      daysRemaining: isOverdue ? -daysOverdue : daysRemaining,
      daysOverdue,
      severity: isOverdue ? 'critical' : daysRemaining <= 1 ? 'critical' : 'warning',
    };
  });
};
