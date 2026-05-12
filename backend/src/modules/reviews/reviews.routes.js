import { Router } from 'express';
import * as ctrl from './reviews.controller.js';
import { verifyToken } from '../../middleware/auth.js';
import { requireRole, requireEventContext } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import {
  createAssignmentSchema,
  removeAssignmentSchema,
  submitReviewSchema,
  saveDraftSchema, // <-- Importamos el nuevo esquema
  paperIdParamSchema,
  assignmentIdParamSchema, // <-- Importamos para validar el GET
} from './reviews.validator.js';
import { upload } from '../../middleware/upload.js';

const router = Router();
router.use(verifyToken, requireEventContext);

// ── Endpoints del REVISOR ─────────────────────────────────────
// Ver mis asignaciones en el evento activo
router.get('/my-assignments',
  requireRole('REVIEWER'),
  ctrl.myAssignments
);

// Aceptar o rechazar invitación
router.put('/assignments/:id/respond',
  requireRole('REVIEWER'),
  ctrl.respondToAssignment
);

// NUEVO: Obtener la revisión actual de una asignación (para cargar borradores)
router.get('/assignment/:assignmentId',
  requireRole('REVIEWER'),
  validate(assignmentIdParamSchema, 'params'),
  ctrl.getReviewByAssignment
);

// NUEVO: Guardar borrador
router.post('/draft',
  requireRole('REVIEWER'),
  upload.single('annotatedPdf'),
  validate(saveDraftSchema), // Usa el validador permisivo
  ctrl.saveDraft
);

// Enviar evaluación final
router.post('/submit',
  requireRole('REVIEWER'),
  upload.single('annotatedPdf'),
  validate(submitReviewSchema), // Usa el validador estricto
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

export default router;