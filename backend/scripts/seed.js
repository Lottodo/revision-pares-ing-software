import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';

// Si ejecutamos "node backend/scripts/seed.js" desde root, el env está en "backend/.env"
// Si ejecutamos "node scripts/seed.js" desde "backend/", el env está en "./.env"
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/peerreview';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[Seed] Conectado a MongoDB en ${MONGO_URI}`);

    // Limpiar usuarios existentes
    await Usuario.deleteMany({});
    console.log('[Seed] Tabla de usuarios limpiada.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('1234', salt);

    const usuariosPrueba = [
      {
        username: 'autor1',
        email: 'autor1@uabc.edu.mx',
        passwordHash,
        roles: ['autor'],
      },
      {
        username: 'revisor1',
        email: 'revisor1@uabc.edu.mx',
        passwordHash,
        roles: ['revisor'],
      },
      {
        username: 'editor1',
        email: 'editor1@uabc.edu.mx',
        passwordHash,
        roles: ['editor'],
      },
      {
        username: 'multiusuario',
        email: 'multiusuario@uabc.edu.mx',
        passwordHash,
        roles: ['autor', 'revisor', 'editor'],
      }
    ];

    await Usuario.insertMany(usuariosPrueba);
    console.log('[Seed] Usuarios insertados exitosamente (sin el admin).');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error populando la base de datos:', error);
    process.exit(1);
  }
};

seedDatabase();
