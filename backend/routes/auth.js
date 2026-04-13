// backend/routes/auth.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';

const router = Router();

// ─── Helpers ────────────────────────────────────────────────
const JWT_SECRET = () => process.env.JWT_SECRET || 'mi_clave_super_secreta_sprint1';

const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const fail = (res, error, status = 400) =>
  res.status(status).json({ success: false, error });

// ─── Validaciones ───────────────────────────────────────────
const validateRegisterInput = ({ username, email, password }) => {
  const errors = [];
  if (!username || username.length < 3 || username.length > 50) {
    errors.push('El username debe tener entre 3 y 50 caracteres.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('El email no es válido.');
  }
  if (!password || password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres.');
  }
  return errors;
};

const validateLoginInput = ({ username, password }) => {
  const errors = [];
  if (!username) errors.push('El username es requerido.');
  if (!password) errors.push('La contraseña es requerida.');
  return errors;
};

// ─── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;

    // Validar inputs
    const errors = validateRegisterInput({ username, email, password });
    if (errors.length > 0) {
      return fail(res, errors.join(' '), 400);
    }

    // Verificar si ya existe el usuario o el email
    const existente = await Usuario.findOne({ username });
    if (existente) {
      return fail(res, 'El username ya está en uso.', 409);
    }

    const emailExistente = await Usuario.findOne({ email });
    if (emailExistente) {
      return fail(res, 'El email ya está registrado.', 409);
    }

    // Hashear password y crear usuario
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      roles: rol || roles || ['autor']
    });
    
    await nuevoUsuario.save();

    return ok(res, {
      id: nuevoUsuario._id,
      username: nuevoUsuario.username,
      email: nuevoUsuario.email,
      roles: nuevoUsuario.roles
    }, 201);
  } catch (error) {
    console.error('Error en registro:', error);
    return fail(res, 'Error interno del servidor.', 500);
  }
});

// ─── POST /api/auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar inputs
    const errors = validateLoginInput({ username, password });
    if (errors.length > 0) {
      return fail(res, errors.join(' '), 400);
    }

    // Buscar usuario activo
    const usuario = await Usuario.findOne({ username, activo: true });
    
    if (!usuario) {
      return fail(res, 'Credenciales inválidas.', 401);
    }

    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValido) {
      return fail(res, 'Credenciales inválidas.', 401);
    }

    // Generar JWT
    const token = jwt.sign(
      { id: usuario._id, username: usuario.username, roles: usuario.roles },
      JWT_SECRET(),
      { expiresIn: '24h' }
    );

    return ok(res, {
      token,
      user: {
        id: usuario._id,
        username: usuario.username,
        email: usuario.email,
        roles: usuario.roles
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return fail(res, 'Error interno del servidor.', 500);
  }
});

// ─── POST /api/auth/logout ──────────────────────────────────
router.post('/logout', (_req, res) => {
  return ok(res, { message: 'Sesión cerrada. Elimina el token del cliente.' });
});

// ─── GET /api/auth/me ───────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return fail(res, 'No hay token, acceso denegado.', 403);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET());
    } catch {
      return fail(res, 'Token inválido o expirado.', 401);
    }

    // Obtener datos frescos del usuario
    const usuario = await Usuario.findById(decoded.id).select('-passwordHash');

    if (!usuario || !usuario.activo) {
      return fail(res, 'Usuario no encontrado o inactivo.', 404);
    }

    return ok(res, {
      id: usuario._id,
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles
    });
  } catch (error) {
    console.error('Error en /me:', error);
    return fail(res, 'Error interno del servidor.', 500);
  }
});

export default router;
