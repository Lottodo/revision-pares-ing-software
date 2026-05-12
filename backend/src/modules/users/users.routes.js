// src/modules/users/users.routes.js
import { Router } from 'express';
import * as ctrl from './users.controller.js';
import { verifyToken } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import { assignRoleSchema, removeRoleSchema, updateUserSchema, userIdParamSchema } from './users.validator.js';

const router = Router();
// Todos los endpoints de usuarios requieren estar autenticado
router.use(verifyToken);

// ── Gestión de roles por evento (solo ADMIN) ──────────────────
router.post('/roles/assign',        requireRole('ADMIN'), validate(assignRoleSchema), ctrl.assignRole);
router.delete('/roles/remove',      requireRole('ADMIN'), validate(removeRoleSchema), ctrl.removeRole);

// ── Miembros de un evento (ADMIN o EDITOR) ────────────────────
router.get('/by-event/:eventId',    requireRole('ADMIN', 'EDITOR'), ctrl.getUsersByEvent);
router.get('/reviewers/:eventId',   requireRole('ADMIN', 'EDITOR'), ctrl.getReviewersByEvent);

// ── Gestión de usuarios (solo ADMIN) — SIEMPRE AL FINAL ───────
router.get('/',                     requireRole('ADMIN'), ctrl.listAll);
router.get('/:id',                  requireRole('ADMIN'), validate(userIdParamSchema, 'params'), ctrl.getById);
router.patch('/:id',                requireRole('ADMIN'), validate(userIdParamSchema, 'params'), validate(updateUserSchema), ctrl.updateUser);

export default router;
