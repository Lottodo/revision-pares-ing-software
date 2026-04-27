// src/modules/reviews/reviews.controller.js
import * as svc from './reviews.service.js';
import { ok, created, fail, serverError } from '../../shared/response.js';

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

export const submitReview = async (req, res) => {
  try {
    const result = await svc.submitReview(req.body, req.user.id);
    return created(res, result);
  } catch (err) { return err.status ? fail(res, err.message, err.status) : serverError(res, err); }
};

export const listReviewsByPaper = handle((req) =>
  svc.listReviewsByPaper(parseInt(req.params.paperId), req.user.eventId, req.user)
);
