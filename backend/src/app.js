// src/app.js
// Configura Express: middlewares globales, montaje de rutas, error handler.
// No conoce nada de la DB ni del servidor HTTP — eso vive en server.js.

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Rutas de módulos
import authRoutes    from './modules/auth/auth.routes.js';
import usersRoutes   from './modules/users/users.routes.js';
import eventsRoutes  from './modules/events/events.routes.js';
import papersRoutes  from './modules/papers/papers.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
  origin: env.frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos
app.use('/uploads', express.static(env.uploadsDir));

// ── Health check (no requiere auth) ──────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rutas de módulos ──────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/users',   usersRoutes);
app.use('/api/events',  eventsRoutes);
app.use('/api/papers',  papersRoutes);
app.use('/api/reviews', reviewsRoutes);

// ── 404 para rutas de API desconocidas ────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint no encontrado.' });
});

// ── Error handler global (siempre al final) ───────────────────
app.use(errorHandler);

export default app;
