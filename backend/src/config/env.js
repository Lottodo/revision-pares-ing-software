// src/config/env.js
// Valida que todas las variables de entorno requeridas estén presentes al iniciar.

import dotenv from 'dotenv';
dotenv.config();

const required = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[Config] Falta variable de entorno obligatoria: ${key}`);
    process.exit(1);
  }
}

// Validaciones adicionales útiles (evita errores comunes con Prisma/MySQL)
if (!process.env.DATABASE_URL.startsWith('mysql://')) {
  console.error('[Config] DATABASE_URL debe usar protocolo mysql://');
  process.exit(1);
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  isDev: process.env.NODE_ENV !== 'production',
};
