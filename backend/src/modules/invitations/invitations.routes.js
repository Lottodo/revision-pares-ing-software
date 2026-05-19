// src/modules/invitations/invitations.routes.js
import { Router } from 'express';
import * as ctrl from './invitations.controller.js';
import { verifyToken } from '../../middleware/auth.js';
import { requireRole, requireGlobalAdmin } from '../../middleware/roles.js';

const router = Router();
router.use(verifyToken);

// ── Cualquier usuario autenticado ─────────────────────────────
// Ver mis invitaciones pendientes
router.get('/my', ctrl.myInvitations);

// Aceptar o rechazar una invitación (por token único)
router.patch('/:token/respond', ctrl.respond);

// ── Solo Admin ────────────────────────────────────────────────
// Enviar una invitación
router.post('/', requireRole('ADMIN'), ctrl.sendInvitation);

// Listar invitaciones de un evento
router.get('/event/:eventId', requireRole('ADMIN', 'EDITOR'), ctrl.listByEvent);

// Cancelar una invitación pendiente
router.delete('/:id', requireRole('ADMIN'), ctrl.cancelInvitation);

export default router;
