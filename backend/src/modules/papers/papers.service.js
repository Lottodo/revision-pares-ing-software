// src/modules/papers/papers.service.js
import prisma from '../../config/prisma.js';
import { logHistory } from '../../shared/history.js';

// ─── Helpers internos ────────────────────────────────────────

// Campos que NUNCA se exponen a un revisor (doble ciego)
const BLIND_SELECT = {
  id: true, title: true, abstract: true, documentUrl: true, area: true,
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

// Campos para el autor (no debe ver quién es su revisor)
const AUTHOR_SELECT = {
  ...BLIND_SELECT,
  authorId: true,
  author: { select: { id: true, username: true, email: true } },
  assignments: {
    select: {
      id: true, status: true, deadline: true,
      // SIN DATOS DEL REVISOR
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

  // AUTHOR (o multirol): sus propios artículos
  return prisma.paper.findMany({
    where: { eventId, authorId: userId },
    select: isEditor ? FULL_SELECT : AUTHOR_SELECT,
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
    select: isReviewer ? BLIND_SELECT : (isEditor ? FULL_SELECT : AUTHOR_SELECT),
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
export const create = async ({ title, abstract, documentUrl, area, eventId, authorId }) => {
  // Verificar que el usuario tenga rol AUTHOR en el evento
  const membership = await prisma.eventUser.findFirst({
    where: { userId: authorId, eventId, role: 'AUTHOR' },
  });
  if (!membership) {
    const e = new Error('No tienes rol de Autor en este evento.'); e.status = 403; throw e;
  }

  const paper = await prisma.paper.create({
    data: {
      eventId, authorId, title, abstract, documentUrl, area,
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

// Ya no restringiremos transiciones estrictas para el editor, para permitir corregir errores.
// Simplemente se actualizará al nuevo estado (como ACCEPTED o REJECTED de forma nativa).

export const updateStatus = async (paperId, eventId, newStatus, editorId, editorComment) => {
  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) {
    const e = new Error('Artículo no encontrado.'); e.status = 404; throw e;
  }

  const updated = await prisma.paper.update({
    where: { id: paperId },
    data: { status: newStatus },
    select: FULL_SELECT,
  });

  await logHistory(
    paperId,
    `Decisión editorial: ${newStatus}`,
    editorComment ? `Editor: ${editorComment}` : `Editor dictaminó el artículo como ${newStatus}.`,
    editorId
  );

  // Si fue aceptado o rechazado, registrar cierre del ciclo
  if (['ACCEPTED', 'REJECTED'].includes(newStatus)) {
    await logHistory(paperId, 'Proceso completado', 'El artículo cerró su ciclo de revisión.', null);
  }

  return updated;
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

/**
 * Añadir nota manual al historial (comentarios, respuestas)
 */
export const addHistoryNote = async (paperId, eventId, user, note) => {
  const { id: userId, roles = [], username } = user;
  const isEditor = roles.includes('EDITOR') || roles.includes('ADMIN');

  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }

  if (!isEditor && paper.authorId !== userId) {
    const e = new Error('No tienes permiso para comentar en este artículo.'); e.status = 403; throw e;
  }
  
  if (!note || note.trim().length === 0) {
    const e = new Error('La nota no puede estar vacía.'); e.status = 400; throw e;
  }

  const roleName = isEditor ? 'Editor' : 'Autor';
  await logHistory(paperId, `Comentario de ${roleName}`, note, userId);

  return { message: 'Nota añadida exitosamente.' };
};

export const verifyPdfAccess = async (filename, user) => {
  if (user.isGlobalAdmin) return true;
  
  const targetPath = `/uploads/${filename}`;
  let eventId = null;
  
  // 1. Buscar en Artículos (Papeles originales)
  const paper = await prisma.paper.findFirst({ 
    where: { documentUrl: { endsWith: targetPath } } 
  });
  if (paper) eventId = paper.eventId;
  
  // 2. Si no se halló, buscar en Versiones anteriores
  if (!eventId) {
    const version = await prisma.paperVersion.findFirst({ 
      where: { url: { endsWith: targetPath } }, 
      include: { paper: true } 
    });
    if (version) eventId = version.paper?.eventId;
  }

  // 3. NUEVO: Si aún no se halla, buscar en REVISIONES (PDFs anotados)
  if (!eventId) {
    const review = await prisma.review.findFirst({
      where: { annotatedPdfUrl: { endsWith: targetPath } },
      include: { assignment: { include: { paper: true } } }
    });
    // Sacamos el eventId a través de la asignación del artículo
    if (review) eventId = review.assignment?.paper?.eventId;
  }
  
  // Si después de buscar en las 3 tablas no hay eventId, el archivo no existe en DB
  if (!eventId) {
    const e = new Error('Archivo no registrado en el sistema.'); 
    e.status = 404; 
    throw e;
  }
  
  // Verificar que el usuario pertenezca al evento
  if (eventId !== user.eventId) {
    const e = new Error('No tienes acceso a los documentos de este congreso.'); 
    e.status = 403; 
    throw e;
  }
  
  return true;
};
