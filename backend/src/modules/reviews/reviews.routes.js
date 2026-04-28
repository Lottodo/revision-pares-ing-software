// src/modules/reviews/reviews.routes.js
import { Router } from 'express';
import * as ctrl from './reviews.controller.js';
import { verifyToken } from '../../middleware/auth.js';
import { requireRole, requireEventContext } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import {
  createAssignmentSchema,
  removeAssignmentSchema,
  submitReviewSchema,
  paperIdParamSchema,
} from './reviews.validator.js';

const router = Router();
router.use(verifyToken, requireEventContext);

// ── Endpoints del REVISOR ─────────────────────────────────────
// Ver mis asignaciones en el evento activo
router.get('/my-assignments',
  requireRole('REVIEWER'),
  ctrl.myAssignments
);

// Enviar evaluación
router.post('/submit',
  requireRole('REVIEWER'),
  validate(submitReviewSchema),
  ctrl.submitReview
);

// ── Endpoints del EDITOR / ADMIN ──────────────────────────────
// Asignar revisor a artículo
router.post('/assignments',
  requireRole('EDITOR', 'ADMIN'),
  validate(createAssignmentSchema),
  ctrl.createAssignment
);

// Ver asignaciones de un artículo
router.get('/assignments/:paperId',
  validate(paperIdParamSchema, 'params'),
  requireRole('EDITOR', 'ADMIN'),
  ctrl.listAssignmentsByPaper
);

// Cancelar asignación
router.delete('/assignments',
  requireRole('EDITOR', 'ADMIN'),
  validate(removeAssignmentSchema),
  ctrl.cancelAssignment
);

// ── Evaluaciones de un artículo (EDITOR ve todo; AUTHOR ve el suyo sin revisor) ──
router.get('/paper/:paperId',
  validate(paperIdParamSchema, 'params'),
  requireRole('AUTHOR', 'EDITOR', 'ADMIN'),
  ctrl.listReviewsByPaper
);

// ── Retrasos en revisiones (US-2246) — solo EDITOR/ADMIN ──
router.get('/delayed',
  requireRole('EDITOR', 'ADMIN'),
  ctrl.getDelayedAssignments
);

export default router;
