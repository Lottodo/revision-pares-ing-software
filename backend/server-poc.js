// backend/server-poc.js
import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Op } from 'sequelize';
import { testDatabaseConnection } from './config/database.js';
import { initModels, Usuario, Articulo, AsignacionRevision, Evaluacion } from './models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const cleanName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${timestamp}-${cleanName}`);
    }
});

const upload = multer({ storage });

const app = express();
app.use(express.json());
app.use(cors()); // Permite que el frontend hable con el backend
app.use('/uploads', express.static(uploadsDir));

const SECRET_KEY = "mi_clave_super_secreta_sprint1";

const estadoArticuloDbToUi = {
    recibido: 'Recibido',
    en_revision: 'En Revisión',
    cambios_menores: 'Cambios Menores',
    cambios_mayores: 'Cambios Mayores',
    aceptado: 'Aceptado',
    rechazado: 'Rechazado'
};

const estadoAsignacionDbToUi = {
    pendiente: 'Pendiente',
    en_progreso: 'En Progreso',
    evaluado: 'Evaluado',
    cancelado: 'Cancelado'
};

const veredictoUiToDb = {
    'Aceptar': 'aceptar',
    'Cambios Menores': 'cambios_menores',
    'Cambios Mayores': 'cambios_mayores',
    'Rechazar': 'rechazar'
};

// 1. Endpoint Público: Iniciar Sesión (Soporta Autor y Revisor)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const usuario = await Usuario.findOne({ where: { username, activo: true } });

        if (!usuario) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
        if (!passwordValido) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const token = jwt.sign(
            { id: usuario.id, username: usuario.username, role: usuario.rol },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        return res.json({ mensaje: "Login exitoso", token, role: usuario.rol });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Middleware para proteger rutas
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

    if (!token) return res.status(403).json({ error: "No hay token, acceso denegado." });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token inválido." });
        req.user = decoded;
        next();
    });
};

// 2. Endpoint: Mis Artículos (Autor)
app.get('/api/mis-articulos', verificarToken, async (req, res) => {
    if (req.user.role !== 'autor') return res.status(403).json({ error: "Acceso solo para autores" });

    try {
        const articulos = await Articulo.findAll({
            where: { autorId: req.user.id },
            order: [['fechaEnvio', 'DESC']]
        });

        const resultado = articulos.map((articulo) => ({
            id: articulo.id,
            titulo: articulo.titulo,
            fecha: new Date(articulo.fechaEnvio).toISOString().split('T')[0],
            estado: estadoArticuloDbToUi[articulo.estado] || articulo.estado
        }));

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo articulos del autor:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// 3. Endpoint: Subir Artículo (Autor)
app.post('/api/articulos', verificarToken, upload.single('documento'), async (req, res) => {
    if (req.user.role !== 'autor') return res.status(403).json({ error: "Acceso solo para autores" });

    try {
        const { titulo, resumen } = req.body;
        const archivo = req.file;

        if (!titulo || !resumen || !archivo) {
            return res.status(400).json({ error: 'Faltan datos requeridos o archivo PDF.' });
        }

        const nuevoArticulo = await Articulo.create({
            titulo: String(titulo).trim(),
            resumen: String(resumen).trim(),
            documentoUrl: `/uploads/${archivo.filename}`,
            estado: 'recibido',
            autorId: req.user.id
        });

        return res.status(201).json({
            mensaje: 'Articulo creado con exito.',
            articuloId: nuevoArticulo.id
        });
    } catch (error) {
        console.error('Error al crear articulo:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// 4. Endpoint (TAREA 2317): Acceder a Artículos Asignados (Revisor)
app.get('/api/articulos-asignados', verificarToken, async (req, res) => {
    // Validamos que sea un revisor
    if (req.user.role !== 'revisor') return res.status(403).json({ error: "Acceso solo para revisores" });

    try {
        const asignaciones = await AsignacionRevision.findAll({
            where: { revisorId: req.user.id },
            include: [{ model: Articulo, as: 'articulo', attributes: ['id', 'titulo'] }],
            order: [['fechaAsignacion', 'DESC']]
        });

        const resultado = asignaciones.map((asignacion) => ({
            id: asignacion.articulo?.id,
            titulo: asignacion.articulo?.titulo,
            fechaAsignacion: new Date(asignacion.fechaAsignacion).toISOString().split('T')[0],
            estado: estadoAsignacionDbToUi[asignacion.estado] || asignacion.estado
        })).filter((a) => a.id);

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo articulos asignados:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// 5. Endpoint (TAREA 2313): Enviar Evaluación de Artículo (Revisor)
app.post('/api/evaluar', verificarToken, async (req, res) => {
    if (req.user.role !== 'revisor') return res.status(403).json({ error: "Acceso solo para revisores" });
    try {
        const { articuloId, veredicto, comentarios } = req.body;
        const veredictoDb = veredictoUiToDb[veredicto] || String(veredicto || '').toLowerCase().replace(/\s+/g, '_');

        if (!articuloId || !veredictoDb || !comentarios) {
            return res.status(400).json({ error: 'Faltan datos requeridos para la evaluación.' });
        }

        const asignacion = await AsignacionRevision.findOne({
            where: {
                articuloId,
                revisorId: req.user.id,
                estado: { [Op.ne]: 'cancelado' }
            }
        });

        if (!asignacion) {
            return res.status(403).json({ error: 'El artículo no está asignado a este revisor.' });
        }

        await Evaluacion.create({
            articuloId,
            revisorId: req.user.id,
            veredicto: veredictoDb,
            comentarios
        });

        await asignacion.update({ estado: 'evaluado' });

        return res.json({ mensaje: "Evaluación enviada con éxito. El editor ha sido notificado." });
    } catch (error) {
        console.error('Error al guardar evaluación:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

const iniciarServidor = async () => {
    try {
        initModels();
        await testDatabaseConnection();
        app.listen(3000, () => console.log('Servidor backend corriendo en http://localhost:3000'));
    } catch (error) {
        console.error('No se pudo iniciar el backend:', error);
        process.exit(1);
    }
};

iniciarServidor();