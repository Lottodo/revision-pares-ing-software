// backend/server-poc.js
import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { connectDB, Usuario, Articulo, AsignacionRevision, Evaluacion, HistorialArticulo } from './models/index.js';
import authRoutes from './routes/auth.js';
import { verificarToken } from './middleware/auth.js';

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
app.use(cors());
app.use('/uploads', express.static(uploadsDir));

// ── Servir frontend compilado (producción / ngrok) ──
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    console.log('[Servidor] Sirviendo frontend compilado desde /dist');
}

// Cargar variables de entorno
const __envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: __envPath });

// ─── Montar rutas de autenticación ───────────────────
app.use('/api/auth', authRoutes);

// ═══════════════════════════════════════════════════════
// Helper: Registrar evento en el historial de un artículo
// ═══════════════════════════════════════════════════════
const registrarHistorial = async (articuloId, evento, detalle = '', usuarioId = null) => {
    try {
        await new HistorialArticulo({ articuloId, evento, detalle, usuarioId }).save();
    } catch (e) {
        console.error('[Historial] Error registrando evento:', e.message);
    }
};

// Helper objects UI to DB
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


// ═══════════════════════════════════════════════════════
// ENDPOINTS DE AUTOR
// ═══════════════════════════════════════════════════════

// 1. Mis Artículos (Autor)
app.get('/api/mis-articulos', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('autor')) return res.status(403).json({ error: "Acceso solo para autores" });

    try {
        const articulos = await Articulo.find({ autorId: req.user.id })
                                        .sort({ createdAt: -1 });

        const resultado = articulos.map((articulo) => ({
            id: articulo._id,
            titulo: articulo.titulo,
            fecha: new Date(articulo.createdAt).toISOString().split('T')[0],
            estado: estadoArticuloDbToUi[articulo.estado] || articulo.estado,
            versiones: articulo.versiones || [],
            documentoUrl: articulo.documentoUrl,
        }));

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo articulos del autor:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// 2. Subir Artículo (Autor) — Versión 1
app.post('/api/articulos', verificarToken, upload.single('documento'), async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('autor')) return res.status(403).json({ error: "Acceso solo para autores" });

    try {
        const { titulo, resumen } = req.body;
        const archivo = req.file;

        if (!titulo || !resumen || !archivo) {
            return res.status(400).json({ error: 'Faltan datos requeridos o archivo PDF.' });
        }

        const urlArchivo = `/uploads/${archivo.filename}`;

        const nuevoArticulo = new Articulo({
            titulo: String(titulo).trim(),
            resumen: String(resumen).trim(),
            documentoUrl: urlArchivo,
            versiones: [{ numero: 1, url: urlArchivo, fecha: new Date() }],
            estado: 'recibido',
            autorId: req.user.id
        });
        
        await nuevoArticulo.save();
        await registrarHistorial(nuevoArticulo._id, 'Manuscrito recibido', `V1 subida por el autor.`, req.user.id);

        return res.status(201).json({
            mensaje: 'Articulo creado con exito.',
            articuloId: nuevoArticulo._id
        });
    } catch (error) {
        console.error('Error al crear articulo:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// 3. Subir nueva versión de un artículo (Autor) — V2, V3...
app.post('/api/articulos/:id/versiones', verificarToken, upload.single('documento'), async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('autor')) return res.status(403).json({ error: "Acceso solo para autores" });

    try {
        const { id } = req.params;
        const archivo = req.file;
        if (!archivo) return res.status(400).json({ error: 'Falta el archivo PDF.' });

        const articulo = await Articulo.findById(id);
        if (!articulo) return res.status(404).json({ error: 'Artículo no encontrado.' });

        // Solo el autor original puede subir una nueva versión
        if (String(articulo.autorId) !== String(req.user.id)) {
            return res.status(403).json({ error: 'No eres el autor de este artículo.' });
        }

        // Solo se permite re-subir si el estado es cambios_menores o cambios_mayores
        if (!['cambios_menores', 'cambios_mayores'].includes(articulo.estado)) {
            return res.status(400).json({ error: 'Solo puedes subir una nueva versión cuando el artículo requiere correcciones.' });
        }

        const urlArchivo = `/uploads/${archivo.filename}`;
        const nuevoNumero = (articulo.versiones?.length || 0) + 1;

        articulo.versiones.push({ numero: nuevoNumero, url: urlArchivo, fecha: new Date() });
        articulo.documentoUrl = urlArchivo;
        articulo.estado = 'recibido'; // Regresa al inicio del ciclo
        await articulo.save();

        await registrarHistorial(articulo._id, `Nueva versión subida (V${nuevoNumero})`, `El autor subió una versión corregida.`, req.user.id);

        return res.json({ mensaje: `Versión ${nuevoNumero} subida con éxito. El artículo regresa a revisión.` });
    } catch (error) {
        console.error('Error subiendo nueva versión:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});


// ═══════════════════════════════════════════════════════
// ENDPOINTS DE REVISOR
// ═══════════════════════════════════════════════════════

// 4. Artículos Asignados (Revisor)
app.get('/api/articulos-asignados', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('revisor')) return res.status(403).json({ error: "Acceso solo para revisores" });

    try {
        const asignaciones = await AsignacionRevision.find({ revisorId: req.user.id })
                                                     .populate('articuloId')
                                                     .sort({ createdAt: -1 });

        const resultado = asignaciones.map((asignacion) => ({
            id: asignacion.articuloId?._id,
            titulo: asignacion.articuloId?.titulo,
            documentoUrl: asignacion.articuloId?.documentoUrl,
            fechaAsignacion: new Date(asignacion.createdAt).toISOString().split('T')[0],
            estado: estadoAsignacionDbToUi[asignacion.estado] || asignacion.estado
        })).filter((a) => a.id);

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo articulos asignados:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// 5. Enviar Evaluación con Rúbrica (Revisor)
app.post('/api/evaluar', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('revisor')) return res.status(403).json({ error: "Acceso solo para revisores" });
    try {
        const { articuloId, veredicto, comentarios, originalidad, rigorMetodologico, calidadRedaccion, relevancia } = req.body;
        const veredictoDb = veredictoUiToDb[veredicto] || String(veredicto || '').toLowerCase().replace(/\s+/g, '_');

        if (!articuloId || !veredictoDb || !comentarios) {
            return res.status(400).json({ error: 'Faltan datos requeridos para la evaluación.' });
        }

        // Validar rúbricas
        const rubricaValida = [originalidad, rigorMetodologico, calidadRedaccion, relevancia].every(v => v >= 1 && v <= 5);
        if (!rubricaValida) {
            return res.status(400).json({ error: 'Todas las calificaciones de la rúbrica deben estar entre 1 y 5.' });
        }

        const asignacion = await AsignacionRevision.findOne({
            articuloId,
            revisorId: req.user.id,
            estado: { $ne: 'cancelado' }
        });

        if (!asignacion) {
            return res.status(403).json({ error: 'El artículo no está asignado a este revisor o fue cancelado.' });
        }

        const evaluacion = new Evaluacion({
            articuloId,
            revisorId: req.user.id,
            veredicto: veredictoDb,
            originalidad,
            rigorMetodologico,
            calidadRedaccion,
            relevancia,
            comentarios
        });
        
        await evaluacion.save();
        await AsignacionRevision.findByIdAndUpdate(asignacion._id, { estado: 'evaluado' });

        await registrarHistorial(articuloId, 'Dictamen emitido', `Un revisor emitió su evaluación: ${veredicto}.`, req.user.id);

        return res.json({ mensaje: "Evaluación enviada con éxito. El editor ha sido notificado." });
    } catch (error) {
        console.error('Error al guardar evaluación:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// ═══════════════════════════════════════════════════════
// ENDPOINTS DE EDITOR
// ═══════════════════════════════════════════════════════

// 6. Ver TODOS los artículos (Editor)
app.get('/api/articulos', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const articulos = await Articulo.find().sort({ createdAt: -1 });
        
        const resultado = await Promise.all(articulos.map(async (art) => {
            const asignaciones = await AsignacionRevision.find({ articuloId: art._id, estado: { $ne: 'cancelado' } });
            const revisoresData = asignaciones.map(a => ({
                id: a.revisorId,
                revisor: a.revisorId,
                completado: a.estado === 'evaluado'
            }));
            
            return {
                _id: art._id,
                titulo: art.titulo,
                estado: estadoArticuloDbToUi[art.estado] || art.estado,
                area: 'General',
                documentoUrl: art.documentoUrl,
                versiones: art.versiones || [],
                revisores: revisoresData
            };
        }));

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo panel de editor:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});

// 7. Obtener lista de Revisores disponibles (Editor)
//    SOLO retorna usuarios que YA tienen el rol 'revisor' pre-aprobado por un Admin.
app.get('/api/revisores', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const revisores = await Usuario.find({ activo: true, roles: 'revisor' }).select('username _id roles');
        
        const resultado = await Promise.all(revisores.map(async (rev) => {
            const cargaAgregada = await AsignacionRevision.countDocuments({ revisorId: rev._id, estado: { $in: ['pendiente', 'en_progreso'] } });
            return {
                id: rev._id,
                nombre: rev.username,
                carga: cargaAgregada
            };
        }));

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo panel de revisores:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});

// 8. Asignar un revisor a un artículo (Editor)
//    Ya NO otorga roles automáticamente.
app.post('/api/asignaciones', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const { articuloId, revisorId } = req.body;
        if (!articuloId || !revisorId) return res.status(400).json({ error: 'Data invalida' });

        // Verificar que el usuario destino realmente tenga rol de revisor
        const usuarioRevisor = await Usuario.findById(revisorId);
        if (!usuarioRevisor || !usuarioRevisor.roles.includes('revisor')) {
            return res.status(400).json({ error: 'El usuario seleccionado no tiene el rol de revisor aprobado por un Administrador.' });
        }

        const existe = await AsignacionRevision.findOne({ articuloId, revisorId, estado: { $ne: 'cancelado' } });
        if (existe) return res.status(400).json({ error: 'Este revisor ya está asignado al artículo.' });

        const asignacion = new AsignacionRevision({ articuloId, revisorId, estado: 'pendiente' });
        await asignacion.save();

        // Si tiene al menos 2 revisores, pasar a en_revision
        const cuentaRevisores = await AsignacionRevision.countDocuments({ articuloId, estado: { $ne: 'cancelado'} });
        if (cuentaRevisores >= 2) {
            await Articulo.findByIdAndUpdate(articuloId, { estado: 'en_revision' });
        }

        await registrarHistorial(articuloId, 'Revisor asignado', `Revisor ${usuarioRevisor.username} vinculado por el editor.`, req.user.id);

        return res.status(201).json({ mensaje: 'Revisor asignado con éxito.' });
    } catch (error) {
        console.error('Error asignando revisor:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});

// 9. Quitar Asignacion (Editor)
app.delete('/api/asignaciones', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const { articuloId, revisorId } = req.body;
        if (!articuloId || !revisorId) return res.status(400).json({ error: 'Data invalida' });

        await AsignacionRevision.findOneAndUpdate({ articuloId, revisorId, estado: { $ne: 'evaluado' } }, { estado: 'cancelado' });

        await registrarHistorial(articuloId, 'Revisor removido', `Un revisor fue desvinculado por el editor.`, req.user.id);

        return res.status(200).json({ mensaje: 'Asignación removida.' });
    } catch (error) {
        return res.status(500).json({ error: 'Error al quitar revisión.' });
    }
});

// 10. Decidir status final articulo (Editor)
app.put('/api/articulos/:id/estado', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const { id } = req.params;
        const { estado } = req.body;
        let estadoDb = 'recibido';
        if (estado === 'Aceptado') estadoDb = 'aceptado';
        if (estado === 'Rechazado') estadoDb = 'rechazado';
        if (estado === 'Cambios Menores') estadoDb = 'cambios_menores';
        if (estado === 'Cambios Mayores') estadoDb = 'cambios_mayores';

        await Articulo.findByIdAndUpdate(id, { estado: estadoDb });

        await registrarHistorial(id, `Decisión editorial: ${estado}`, `El editor dictaminó el artículo como "${estado}".`, req.user.id);

        return res.status(200).json({ mensaje: 'Decisión registrada correctamente.' });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno de decision.' });
    }
});

// 11. Obtener evaluaciones de un artículo (Editor)
app.get('/api/articulos/:id/evaluaciones', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const evaluaciones = await Evaluacion.find({ articuloId: req.params.id })
            .populate('revisorId', 'username')
            .sort({ createdAt: -1 });

        const resultado = evaluaciones.map(e => ({
            _id: e._id,
            revisor: e.revisorId?.username || 'Anónimo',
            veredicto: e.veredicto,
            originalidad: e.originalidad,
            rigorMetodologico: e.rigorMetodologico,
            calidadRedaccion: e.calidadRedaccion,
            relevancia: e.relevancia,
            comentarios: e.comentarios,
            fecha: new Date(e.createdAt).toISOString().split('T')[0],
        }));

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo evaluaciones:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});


// ═══════════════════════════════════════════════════════
// ENDPOINTS DE ADMINISTRADOR
// ═══════════════════════════════════════════════════════

// 12. Listar todos los usuarios para gestión (Administrador)
app.get('/api/usuarios', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('administrador')) return res.status(403).json({ error: "Acceso solo para administradores" });
    try {
        const usuarios = await Usuario.find({ activo: true }).select('username email roles createdAt');
        return res.json(usuarios);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});

// 13. Modificar roles de un usuario (Administrador)
app.put('/api/usuarios/:id/roles', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('administrador')) return res.status(403).json({ error: "Acceso solo para administradores" });

    try {
        const { id } = req.params;
        const { roles } = req.body;
        
        if (!Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ error: 'Debes proveer un arreglo válido de roles.' });
        }

        // Validar que solo se asignen roles válidos
        const rolesValidos = ['autor', 'revisor', 'editor', 'administrador'];
        const rolesInvalidos = roles.filter(r => !rolesValidos.includes(r));
        if (rolesInvalidos.length > 0) {
            return res.status(400).json({ error: `Roles inválidos: ${rolesInvalidos.join(', ')}` });
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, { roles }, { new: true });
        if (!usuarioActualizado) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        return res.status(200).json({ mensaje: 'Roles actualizados exitosamente.', roles: usuarioActualizado.roles });
    } catch (error) {
        console.error('Error al editar roles:', error);
        return res.status(500).json({ error: 'Error interno de decision.' });
    }
});


// ═══════════════════════════════════════════════════════
// ENDPOINT COMPARTIDO: HISTORIAL
// ═══════════════════════════════════════════════════════

// 14. Historial de un artículo (Autor del artículo, Editor, o Admin)
app.get('/api/articulos/:id/historial', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const roles = req.user.roles || [];

        // El autor solo puede ver historial de sus propios artículos
        if (roles.includes('autor') && !roles.includes('editor') && !roles.includes('administrador')) {
            const articulo = await Articulo.findById(id);
            if (!articulo || String(articulo.autorId) !== String(req.user.id)) {
                return res.status(403).json({ error: 'No tienes permiso para ver este historial.' });
            }
        }

        const historial = await HistorialArticulo.find({ articuloId: id }).sort({ createdAt: 1 });

        const resultado = historial.map(h => ({
            _id: h._id,
            evento: h.evento,
            detalle: h.detalle,
            fecha: h.createdAt,
        }));

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});


// ═══════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════

const autoSeed = async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const count = await Usuario.countDocuments();
    if (count > 0) {
        console.log(`[AutoSeed] Base de datos ya tiene ${count} usuarios. Omitiendo seed.`);
        return;
    }
    console.log('[AutoSeed] Base de datos vacía. Creando usuarios de prueba...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('1234', salt);
    const usuarios = [
        { username: 'admin', email: 'admin@uabc.edu.mx', passwordHash, roles: ['administrador'] },
        { username: 'autor1', email: 'autor1@uabc.edu.mx', passwordHash, roles: ['autor'] },
        { username: 'revisor1', email: 'revisor1@uabc.edu.mx', passwordHash, roles: ['revisor'] },
        { username: 'revisor2', email: 'revisor2@uabc.edu.mx', passwordHash, roles: ['revisor'] },
        { username: 'editor1', email: 'editor1@uabc.edu.mx', passwordHash, roles: ['editor'] },
        { username: 'multiusuario', email: 'multiusuario@uabc.edu.mx', passwordHash, roles: ['autor', 'revisor', 'editor'] },
    ];
    await Usuario.insertMany(usuarios);
    console.log('[AutoSeed] Usuarios creados correctamente.');
};

// ── Catch-all SPA: devolver index.html para rutas del frontend ──
if (fs.existsSync(distDir)) {
    app.use((req, res, next) => {
        // Solo interceptar GETs que no sean API ni uploads
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            return res.sendFile(path.join(distDir, 'index.html'));
        }
        next();
    });
}

const iniciarServidor = async () => {
    try {
        await connectDB();
        await autoSeed();
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, '0.0.0.0', () => console.log(`[Servidor] Backend corriendo en http://0.0.0.0:${PORT}`));
    } catch (error) {
        console.error('No se pudo iniciar el backend:', error);
        process.exit(1);
    }
};

iniciarServidor();