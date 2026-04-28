// src/modules/papers/papers.service.js
import prisma from '../../config/prisma.js';
import { logHistory } from '../../shared/history.js';

// ─── Helpers internos ────────────────────────────────────────

// Campos que NUNCA se exponen a un revisor (doble ciego)
const BLIND_SELECT = {
  id: true, title: true, abstract: true, documentUrl: true,
  status: true, createdAt: true, updatedAt: true, eventId: true,
  versions: { select: { version: true, url: true, createdAt: true } },
};

// Campos completos para editor/admin/propio autor
const FULL_SELECT = {
  ...BLIND_SELECT,
  authorId: true,
  author: { select: { id: true, username: true, email: true } },
  assignments: {
    select: {
      id: true, status: true, deadline: true, reviewerId: true,
      reviewer: { select: { id: true, username: true } },
    },
  },
};

// ─── Service functions ────────────────────────────────────────

/**
 * Lista artículos del evento activo.
 * - AUTHOR: solo sus propios artículos
 * - REVIEWER: artículos asignados a él (sin datos de autor — doble ciego)
 * - EDITOR / ADMIN: todos los artículos con datos completos
 */
export const listByEvent = async (eventId, user) => {
  const { id: userId, roles = [] } = user;
  const isEditor = roles.includes('EDITOR') || roles.includes('ADMIN');
  const isReviewer = roles.includes('REVIEWER');

  if (isEditor) {
    return prisma.paper.findMany({
      where: { eventId },
      select: FULL_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  if (isReviewer && !roles.includes('AUTHOR')) {
    // Solo artículos asignados a este revisor, sin datos de autor
    const assignments = await prisma.assignment.findMany({
      where: { reviewerId: userId, status: { not: 'CANCELLED' }, paper: { eventId } },
      select: {
        id: true, status: true, deadline: true,
        paper: { select: BLIND_SELECT },
      },
    });
    return assignments.map((a) => ({ ...a.paper, assignmentId: a.id, assignmentStatus: a.status, deadline: a.deadline }));
  }

  // AUTHOR (o multirol): sus propios artículos con info completa
  return prisma.paper.findMany({
    where: { eventId, authorId: userId },
    select: FULL_SELECT,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Obtiene un artículo por ID.
 * Aplica filtrado doble ciego según rol.
 */
export const getById = async (id, eventId, user) => {
  const { id: userId, roles = [] } = user;
  const isEditor = roles.includes('EDITOR') || roles.includes('ADMIN');
  const isReviewer = roles.includes('REVIEWER') && !isEditor;

  const paper = await prisma.paper.findFirst({
    where: { id, eventId },
    select: isReviewer ? BLIND_SELECT : FULL_SELECT,
  });

  if (!paper) { const e = new Error('Artículo no encontrado en este evento.'); e.status = 404; throw e; }

  // Author solo puede ver el suyo
  if (!isEditor && !isReviewer && paper.authorId !== userId) {
    const e = new Error('No tienes acceso a este artículo.'); e.status = 403; throw e;
  }

  // Reviewer: verificar que esté asignado
  if (isReviewer) {
    const assigned = await prisma.assignment.findFirst({
      where: { paperId: id, reviewerId: userId, status: { not: 'CANCELLED' } },
    });
    if (!assigned) { const e = new Error('No tienes asignación para este artículo.'); e.status = 403; throw e; }
  }

  return paper;
};

/**
 * Crea un artículo nuevo. Solo AUTHOR puede hacerlo.
 * El eventId viene del token JWT (contexto activo).
 */
export const create = async ({ title, abstract, documentUrl, eventId, authorId }) => {
  // Verificar que el usuario tenga rol AUTHOR en el evento
  const membership = await prisma.eventUser.findFirst({
    where: { userId: authorId, eventId, role: 'AUTHOR' },
  });
  if (!membership) {
    const e = new Error('No tienes rol de Autor en este evento.'); e.status = 403; throw e;
  }

  const paper = await prisma.paper.create({
    data: {
      eventId, authorId, title, abstract, documentUrl,
      status: 'RECEIVED',
      versions: { create: [{ version: 1, url: documentUrl }] },
    },
    select: FULL_SELECT,
  });

  await logHistory(paper.id, 'Manuscrito recibido', 'Versión 1 subida por el autor.', authorId);
  return paper;
};

/**
 * Sube una nueva versión del PDF.
 * Solo el autor original puede hacerlo y solo cuando el estado lo permite.
 */
export const addVersion = async (paperId, eventId, { documentUrl, note }, userId) => {
  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }
  if (paper.authorId !== userId) { const e = new Error('Solo el autor puede subir versiones.'); e.status = 403; throw e; }

  const allowedStatuses = ['MINOR_CHANGES', 'MAJOR_CHANGES'];
  if (!allowedStatuses.includes(paper.status)) {
    const e = new Error('Solo puedes subir una nueva versión cuando el artículo requiere correcciones.'); e.status = 400; throw e;
  }

  const lastVersion = await prisma.paperVersion.findFirst({
    where: { paperId }, orderBy: { version: 'desc' },
  });
  const nextVersion = (lastVersion?.version ?? 0) + 1;

  const updated = await prisma.paper.update({
    where: { id: paperId },
    data: {
      documentUrl,
      status: 'RECEIVED',
      versions: { create: [{ version: nextVersion, url: documentUrl, note }] },
    },
    select: FULL_SELECT,
  });

  await logHistory(paperId, `Nueva versión V${nextVersion}`, note || 'Autor subió versión corregida.', userId);
  return updated;
};

// ─── Transiciones de estado válidas (US-2241) ────────────────
const VALID_TRANSITIONS = {
  RECEIVED:      ['UNDER_REVIEW'],
  UNDER_REVIEW:  ['ACCEPTED', 'REJECTED', 'MINOR_CHANGES', 'MAJOR_CHANGES'],
  MINOR_CHANGES: ['RECEIVED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'],
  MAJOR_CHANGES: ['RECEIVED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'],
  ACCEPTED:      [], // Estado terminal
  REJECTED:      ['UNDER_REVIEW'], // Puede reabrirse
};

const STATUS_LABELS = {
  RECEIVED: 'Recibido', UNDER_REVIEW: 'En revisión',
  MINOR_CHANGES: 'Cambios menores', MAJOR_CHANGES: 'Cambios mayores',
  ACCEPTED: 'Aceptado', REJECTED: 'Rechazado',
};

/**
 * Cambia el estado de un artículo. Solo EDITOR o ADMIN.
 * Valida transiciones de estado permitidas (US-2241).
 */
export const updateStatus = async (paperId, eventId, status, editorId, editorComment = '') => {
  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }

  // Validar transición de estado
  const allowed = VALID_TRANSITIONS[paper.status] || [];
  if (!allowed.includes(status)) {
    const e = new Error(
      `Transición inválida: no se puede pasar de "${STATUS_LABELS[paper.status]}" a "${STATUS_LABELS[status]}". ` +
      `Transiciones permitidas: ${allowed.map(s => STATUS_LABELS[s]).join(', ') || 'ninguna (estado terminal)'}.`
    );
    e.status = 400;
    throw e;
  }

  const updated = await prisma.paper.update({
    where: { id: paperId },
    data: { status },
    select: FULL_SELECT,
  });

  const detail = editorComment
    ? `Decisión: ${STATUS_LABELS[status]}. Comentario: ${editorComment}`
    : `Decisión: ${STATUS_LABELS[status]}.`;

  await logHistory(paperId, `Decisión editorial: ${STATUS_LABELS[status]}`, detail, editorId);
  return updated;
};

/**
 * Resumen de decisión para el editor (US-2242).
 * Consolida evaluaciones, promedios y sugiere veredicto.
 */
export const getDecisionSummary = async (paperId, eventId) => {
  const paper = await prisma.paper.findFirst({
    where: { id: paperId, eventId },
    select: { id: true, title: true, status: true, createdAt: true },
  });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }

  const reviews = await prisma.review.findMany({
    where: { paperId },
    include: { reviewer: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const assignments = await prisma.assignment.findMany({
    where: { paperId, status: { not: 'CANCELLED' } },
    select: { id: true, status: true, reviewerId: true, deadline: true },
  });

  if (reviews.length === 0) {
    return { paper, reviews: [], assignments, summary: null, suggestion: null };
  }

  // Calcular promedios por criterio
  const criteria = ['originality', 'methodologicalRigor', 'writingQuality', 'relevance'];
  const averages = {};
  for (const c of criteria) {
    averages[c] = +(reviews.reduce((sum, r) => sum + r[c], 0) / reviews.length).toFixed(2);
  }
  const overallAverage = +(Object.values(averages).reduce((a, b) => a + b, 0) / criteria.length).toFixed(2);

  // Contar veredictos
  const verdictCounts = {};
  for (const r of reviews) {
    verdictCounts[r.verdict] = (verdictCounts[r.verdict] || 0) + 1;
  }

  // Sugerencia automática basada en veredictos
  let suggestion = 'MINOR_CHANGES';
  if (verdictCounts.ACCEPT && verdictCounts.ACCEPT >= reviews.length / 2) suggestion = 'ACCEPT';
  else if (verdictCounts.REJECT && verdictCounts.REJECT >= reviews.length / 2) suggestion = 'REJECT';
  else if (verdictCounts.MAJOR_CHANGES) suggestion = 'MAJOR_CHANGES';

  const totalEvaluated = assignments.filter(a => a.status === 'EVALUATED').length;
  const totalActive = assignments.filter(a => a.status !== 'CANCELLED').length;

  return {
    paper,
    reviews: reviews.map(r => ({
      id: r.id,
      reviewer: r.reviewer,
      verdict: r.verdict,
      originality: r.originality,
      methodologicalRigor: r.methodologicalRigor,
      writingQuality: r.writingQuality,
      relevance: r.relevance,
      comments: r.comments,
      createdAt: r.createdAt,
    })),
    assignments,
    summary: {
      averages,
      overallAverage,
      verdictCounts,
      totalReviews: reviews.length,
      totalEvaluated,
      totalActive,
      allComplete: totalEvaluated === totalActive && totalActive > 0,
    },
    suggestion,
  };
};

/**
 * Agrega una nota manual al historial del artículo (US-2241).
 * Solo EDITOR o ADMIN.
 */
export const addHistoryNote = async (paperId, eventId, note, userId) => {
  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }

  await logHistory(paperId, 'Nota del editor', note, userId);
  return { message: 'Nota registrada en el historial.' };
};

/**
 * Historial de un artículo.
 * - AUTHOR: solo del suyo propio
 * - EDITOR/ADMIN: cualquiera
 * - REVIEWER: no tiene acceso
 */
export const getHistory = async (paperId, eventId, user) => {
  const { id: userId, roles = [] } = user;
  const isEditor = roles.includes('EDITOR') || roles.includes('ADMIN');

  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }

  if (!isEditor && paper.authorId !== userId) {
    const e = new Error('No tienes permiso para ver este historial.'); e.status = 403; throw e;
  }

  return prisma.paperHistory.findMany({
    where: { paperId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, event: true, detail: true, createdAt: true },
  });
};
