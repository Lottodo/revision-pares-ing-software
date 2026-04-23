// src/server.js
// Punto de entrada: conecta a la DB e inicia el servidor HTTP.
// Solo responsabilidad: arrancar. Nada más.

import './config/env.js'; // Valida variables de entorno primero
import app from './app.js';
import prisma from './config/prisma.js';
import { env } from './config/env.js';

const start = async () => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('[DB] Conexión a MySQL establecida correctamente.');

    app.listen(env.port, '0.0.0.0', () => {
      console.log(`[Server] Backend corriendo en http://0.0.0.0:${env.port}`);
      console.log(`[Server] Entorno: ${env.nodeEnv}`);
      console.log(`[Server] Health: http://0.0.0.0:${env.port}/api/health`);
    });
  } catch (err) {
    console.error('[Server] Error al iniciar:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Cierre limpio
process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });

start();
