import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Conectamos directamente al Prisma Client compilado del backend
let PrismaClient;
let prisma;
try {
  PrismaClient = require('../../backend/node_modules/@prisma/client').PrismaClient;
  prisma = new PrismaClient();
} catch (error) {
  console.warn('⚠️ No se pudo cargar PrismaClient desde el backend en los tests. Asegúrate de compilar el backend.', error.message);
  // Fallback vacío para que Playwright no explote si se corre antes del setup
  prisma = null;
}

export default prisma;
