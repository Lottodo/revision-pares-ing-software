// src/modules/papers/papers.routes.js
import { Router } from 'express';
import * as ctrl from './papers.controller.js';
import { verifyToken } from '../../middleware/auth.js';
import { requireRole, requireEventContext } from '../../middleware/roles.js';
import { validate } from '../../middleware/validate.js';
import { uploadPdf } from '../../middleware/upload.js';
import { createPaperSchema, updateStatusSchema, paperIdParamSchema } from './papers.validator.js';

const router = Router();
// Todos los endpoints de papers requieren token Y contexto de evento
router.use(verifyToken, requireEventContext);

// Listar — cada rol ve lo que le corresponde (lógica en service)
router.get('/',
  requireRole('AUTHOR', 'REVIEWER', 'EDITOR', 'ADMIN'),
  ctrl.listByEvent
);

// Ver uno — con control doble ciego en service
router.get('/:id',
  validate(paperIdParamSchema, 'params'),
  requireRole('AUTHOR', 'REVIEWER', 'EDITOR', 'ADMIN'),
  ctrl.getById
);

// Subir artículo — solo AUTHOR
router.post('/',
  requireRole('AUTHOR'),
  uploadPdf,
  validate(createPaperSchema),
  ctrl.create
);

// Subir nueva versión — solo AUTHOR (con estado correcto validado en service)
router.post('/:id/versions',
  validate(paperIdParamSchema, 'params'),
  requireRole('AUTHOR'),
  uploadPdf,
  ctrl.addVersion
);

// Cambiar estado — solo EDITOR o ADMIN
router.patch('/:id/status',
  validate(paperIdParamSchema, 'params'),
  requireRole('EDITOR', 'ADMIN'),
  validate(updateStatusSchema),
  ctrl.updateStatus
);

// Historial — AUTHOR (solo el suyo) o EDITOR/ADMIN
router.get('/:id/history',
  validate(paperIdParamSchema, 'params'),
  requireRole('AUTHOR', 'EDITOR', 'ADMIN'),
  ctrl.getHistory
);

export default router;
