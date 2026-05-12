// src/middleware/upload.js
// Configuración de Multer para subida de PDFs.
// Separado como middleware reutilizable.

import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';
import { fail } from '../shared/response.js';

// Asegurar que el directorio de uploads exista
if (!fs.existsSync(env.uploadsDir)) {
  fs.mkdirSync(env.uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: env.uploadsDir,
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${timestamp}-${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
});

// Wrapper que convierte errores de Multer a respuestas JSON consistentes
export const uploadPdf = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return fail(res, `Error de subida: ${err.message}`, 400);
    }
    if (err) {
      return fail(res, err.message, 400);
    }
    next();
  });
};
