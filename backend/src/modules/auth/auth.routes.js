// src/modules/auth/auth.routes.js
import { Router } from 'express';
import * as controller from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { verifyToken } from '../../middleware/auth.js';
import { registerSchema, loginSchema, switchEventSchema } from './auth.validator.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), controller.register);

// POST /api/auth/login
// eventId opcional: si se envía, el token incluirá roles de ese evento
router.post('/login', validate(loginSchema), controller.login);

// POST /api/auth/switch-event  [AUTH requerido]
// Cambia el contexto de evento y reemite el token
router.post('/switch-event', verifyToken, validate(switchEventSchema), controller.switchEvent);

// GET /api/auth/me  [AUTH requerido]
router.get('/me', verifyToken, controller.me);

// POST /api/auth/logout  [AUTH requerido]
router.post('/logout', verifyToken, controller.logout);

export default router;
