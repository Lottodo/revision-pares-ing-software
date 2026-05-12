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

  const finalDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const assignment = await prisma.assignment.create({
    data: { paperId, reviewerId, deadline: finalDeadline, status: 'PENDING' },
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
 * Obtiene la revisión actual de una asignación específica.
 * Útil para cargar borradores al abrir el formulario.
 */
export const getReviewByAssignment = async (assignmentId, reviewerId) => {
  const review = await prisma.review.findFirst({
    where: { assignmentId, reviewerId }
  });
  return review;
};

/**
 * Crea o Actualiza una evaluación (Borrador o Final).
 * @param {boolean} isDraft - Si es true, guarda como borrador. Si es false, finaliza.
 */
export const upsertReview = async (data, file, reviewerId, isDraft = false) => {
  const assignmentId = parseInt(data.assignmentId);
  
  const { 
    verdict, 
    comments, 
    originality, 
    methodologicalRigor, 
    writingQuality, 
    relevance 
  } = data;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { paper: { select: { id: true } } },
  });

  if (!assignment) { const e = new Error('Asignación no encontrada.'); e.status = 404; throw e; }
  if (assignment.reviewerId !== reviewerId) { const e = new Error('No eres el revisor de esta asignación.'); e.status = 403; throw e; }
  if (assignment.status === 'CANCELLED') { const e = new Error('La asignación fue cancelada.'); e.status = 400; throw e; }
  
  // Si intentas enviar como final pero ya estaba evaluada, error.
  // Si es borrador, permitimos actualizar aunque ya exista.
  if (!isDraft && assignment.status === 'EVALUATED') { 
    const e = new Error('Ya enviaste una evaluación final para esta asignación.'); 
    e.status = 409; throw e; 
  }

  // Si hay archivo nuevo, usamos esa ruta. Si no, mantenemos la anterior (si existe en el upsert).
  const annotatedPdfUrl = file ? file.path : undefined;

  const reviewData = {
    verdict,
    comments,
    isDraft,
    originality: originality !== undefined ? Number(originality) : undefined,
    methodologicalRigor: methodologicalRigor !== undefined ? Number(methodologicalRigor) : undefined,
    writingQuality: writingQuality !== undefined ? Number(writingQuality) : undefined,
    relevance: relevance !== undefined ? Number(relevance) : undefined,
    ...(annotatedPdfUrl && { annotatedPdfUrl })
  };

  const result = await prisma.$transaction(async (tx) => {
    // 1. Guardar o actualizar la revisión
    const review = await tx.review.upsert({
      where: { assignmentId },
      update: reviewData,
      create: {
        ...reviewData,
        paperId: assignment.paperId,
        reviewerId,
        assignmentId,
        // En creación, si no vienen los campos ponemos 0 por defecto
        originality: Number(originality || 0),
        methodologicalRigor: Number(methodologicalRigor || 0),
        writingQuality: Number(writingQuality || 0),
        relevance: Number(relevance || 0),
      }
    });

    // 2. Si NO es borrador, marcar la asignación como EVALUATED
    if (!isDraft) {
      await tx.assignment.update({
        where: { id: assignmentId },
        data: { status: 'EVALUATED' },
      });

      await logHistory(
        assignment.paperId,
        'Dictamen emitido',
        `Un revisor finalizó su evaluación: ${verdict}.`,
        reviewerId
      );
    } else {
      // Si es borrador, opcionalmente registrar en el historial interno
      console.log(`Borrador guardado para paper ${assignment.paperId} por revisor ${reviewerId}`);
    }

    return review;
  });

  return result;
};

// Modificamos listReviewsByPaper para que NO muestre borradores a los autores
export const listReviewsByPaper = async (paperId, eventId, user) => {
  const { id: userId, roles = [] } = user;
  const isEditor = roles.includes('EDITOR') || roles.includes('ADMIN');

  const paper = await prisma.paper.findFirst({ where: { id: paperId, eventId } });
  if (!paper) { const e = new Error('Artículo no encontrado.'); e.status = 404; throw e; }

  if (!isEditor && paper.authorId !== userId) {
    const e = new Error('No tienes acceso a estas evaluaciones.'); e.status = 403; throw e;
  }

  const reviews = await prisma.review.findMany({
    where: { 
      paperId,
      // IMPORTANTE: Solo mostrar revisiones terminadas (isDraft: false)
      isDraft: false 
    },
    include: {
      reviewer: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!isEditor) {
    return reviews.map(({ reviewer: _r, reviewerId: _id, ...rest }) => rest);
  }

  return reviews;
};

/**
 * Mis asignaciones pendientes (vista del REVISOR).
 * Obtiene los artículos asignados al revisor que no han sido cancelados.
 */
export const myAssignments = async (reviewerId, eventId) => {
  return prisma.assignment.findMany({
    where: {
      reviewerId,
      status: { not: 'CANCELLED' },
      paper: { eventId }, // Filtramos por el evento activo
    },
    include: {
      paper: {
        select: {
          id: true,
          title: true,
          abstract: true,
          documentUrl: true,
          status: true,
          createdAt: true,
          versions: { 
            select: { version: true, url: true, createdAt: true },
            orderBy: { version: 'desc' } // Traer la última versión primero
          },
        },
      },
      review: { 
        select: { 
          id: true, 
          verdict: true, 
          isDraft: true, 
          createdAt: true 
        } 
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * El revisor acepta o rechaza una invitación a revisar.
 */
export const respondToAssignment = async (assignmentId, reviewerId, accept) => {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, reviewerId, status: 'PENDING' },
  });

  if (!assignment) {
    const e = new Error('Invitación no encontrada o ya procesada.');
    e.status = 404;
    throw e;
  }

  const newStatus = accept ? 'IN_PROGRESS' : 'CANCELLED';

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: newStatus },
  });

  await logHistory(
    assignment.paperId,
    accept ? 'Revisión aceptada' : 'Revisión rechazada',
    `El revisor ha ${accept ? 'aceptado' : 'declinado'} la invitación.`,
    reviewerId
  );

  return updated;
};