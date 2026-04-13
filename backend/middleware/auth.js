// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * Middleware que verifica el JWT del header Authorization.
 * Extrae el token de "Bearer <token>" y decodifica el payload en req.user.
 */
export const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(403).json({ error: 'No hay token, acceso denegado.' });
  }

  const secret = process.env.JWT_SECRET || 'mi_clave_super_secreta_sprint1';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      console.error('Error al verificar token:', err.message);
      return res.status(401).json({ error: 'Token inválido.' });
    }
    req.user = decoded;
    next();
  });
};

/**
 * HOF que retorna un middleware para verificar si el rol del usuario
 * está dentro de los roles permitidos.
 *
 * Uso: router.get('/ruta', verificarToken, verificarRol('editor', 'admin'), handler)
 */
export const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}.`
      });
    }

    next();
  };
};
