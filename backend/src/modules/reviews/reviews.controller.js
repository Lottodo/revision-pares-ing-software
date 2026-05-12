import * as svc from './reviews.service.js';
import { ok, created, fail, serverError } from '../../shared/response.js';
import { submitReviewSchema, saveDraftSchema } from './reviews.validator.js';

const handle = (fn) => async (req, res) => {
  try { return ok(res, await fn(req, res)); }
  catch (err) { return err.status ? fail(res, err.message, err.status) : serverError(res, err); }
};

// ── Asignaciones ──────────────────────────────────────────────
export const createAssignment = async (req, res) => {
  try {
    const result = await svc.createAssignment(req.body, req.user.id, req.user.eventId);
    return created(res, result);
  } catch (err) { return err.status ? fail(res, err.message, err.status) : serverError(res, err); }
};

export const listAssignmentsByPaper = handle((req) =>
  svc.listAssignmentsByPaper(parseInt(req.params.paperId), req.user.eventId)
);

export const cancelAssignment = handle((req) =>
  svc.cancelAssignment(req.body, req.user.id, req.user.eventId)
);

// ── Evaluaciones ──────────────────────────────────────────────
export const myAssignments = handle((req) =>
  svc.myAssignments(req.user.id, req.user.eventId)
);

export const respondToAssignment = handle((req) =>
  svc.respondToAssignment(parseInt(req.params.id), req.user.id, req.body.accept)
);

/**
 * Guarda un borrador de la revisión. 
 * Usa el saveDraftSchema que es más permisivo.
 */
export const saveDraft = async (req, res) => {
  try {
    // Validamos con el esquema de borrador (campos opcionales)
    const validatedData = saveDraftSchema.parse(req.body);
    
    const result = await svc.upsertReview(validatedData, req.file, req.user.id, true);
    return ok(res, result);
  } catch (err) { 
    if (err.name === 'ZodError') return fail(res, err.errors[0].message, 400);
    return err.status ? fail(res, err.message, err.status) : serverError(res, err); 
  }
};

/**
 * Envío final de la revisión.
 * Usa el submitReviewSchema que exige todos los campos.
 */
export const submitReview = async (req, res) => {
  try {
    // Validamos con el esquema estricto
    const validatedData = submitReviewSchema.parse(req.body);
    
    const result = await svc.upsertReview(validatedData, req.file, req.user.id, false);
    return created(res, result);
  } catch (err) { 
    if (err.name === 'ZodError') return fail(res, err.errors[0].message, 400);
    return err.status ? fail(res, err.message, err.status) : serverError(res, err); 
  }
};

// NUEVO: Para recuperar el borrador existente al cargar el formulario
export const getReviewByAssignment = handle((req) =>
  svc.getReviewByAssignment(parseInt(req.params.assignmentId), req.user.id)
);

export const listReviewsByPaper = handle((req) =>
  svc.listReviewsByPaper(parseInt(req.params.paperId), req.user.eventId, req.user)
);