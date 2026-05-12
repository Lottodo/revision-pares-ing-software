// src/modules/events/events.routes.js
import { Router } from 'express';
import * as ctrl from './events.controller.js';
import { verifyToken } from '../../middleware/auth.js';
import { requireRole, requireGlobalAdmin } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import { createEventSchema, updateEventSchema, eventIdParamSchema } from './events.validator.js';

const router = Router();
router.use(verifyToken);

// Cualquier usuario autenticado puede listar eventos
router.get('/',              ctrl.listAll);
router.get('/slug/:slug',    ctrl.getBySlug);
router.get('/:id',           validate(eventIdParamSchema, 'params'), ctrl.getById);
router.get('/:id/stats',     validate(eventIdParamSchema, 'params'), requireRole('ADMIN', 'EDITOR'), ctrl.getStats);

// Unirse a un evento por código de acceso
router.post('/join', ctrl.joinEvent);

// Solo ADMIN puede crear/editar/borrar eventos
router.post('/',             requireGlobalAdmin, validate(createEventSchema), ctrl.create);
router.patch('/:id',         requireRole('ADMIN'), validate(eventIdParamSchema, 'params'), validate(updateEventSchema), ctrl.update);
router.delete('/:id',        requireRole('ADMIN'), validate(eventIdParamSchema, 'params'), ctrl.remove);

export default router;
