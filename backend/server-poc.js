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
import { connectDB, Usuario, Articulo, AsignacionRevision, Evaluacion } from './models/index.js';
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

// Cargar variables de entorno
const __envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: __envPath });

// ─── Montar rutas de autenticación ───────────────────
app.use('/api/auth', authRoutes);

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


// 2. Endpoint: Mis Artículos (Autor)
app.get('/api/mis-articulos', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('autor')) return res.status(403).json({ error: "Acceso solo para autores" });

    try {
        const articulos = await Articulo.find({ autorId: req.user.id })
                                        .sort({ createdAt: -1 });

        const resultado = articulos.map((articulo) => ({
            id: articulo._id,
            titulo: articulo.titulo,
            fecha: new Date(articulo.createdAt).toISOString().split('T')[0],
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
    if (!req.user.roles || !req.user.roles.includes('autor')) return res.status(403).json({ error: "Acceso solo para autores" });

    try {
        const { titulo, resumen } = req.body;
        const archivo = req.file;

        if (!titulo || !resumen || !archivo) {
            return res.status(400).json({ error: 'Faltan datos requeridos o archivo PDF.' });
        }

        const nuevoArticulo = new Articulo({
            titulo: String(titulo).trim(),
            resumen: String(resumen).trim(),
            documentoUrl: `/uploads/${archivo.filename}`,
            estado: 'recibido',
            autorId: req.user.id
        });
        
        await nuevoArticulo.save();

        return res.status(201).json({
            mensaje: 'Articulo creado con exito.',
            articuloId: nuevoArticulo._id
        });
    } catch (error) {
        console.error('Error al crear articulo:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// 4. Endpoint (TAREA 2317): Acceder a Artículos Asignados (Revisor)
app.get('/api/articulos-asignados', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('revisor')) return res.status(403).json({ error: "Acceso solo para revisores" });

    try {
        const asignaciones = await AsignacionRevision.find({ revisorId: req.user.id })
                                                     .populate('articuloId')
                                                     .sort({ createdAt: -1 });

        const resultado = asignaciones.map((asignacion) => ({
            id: asignacion.articuloId?._id,
            titulo: asignacion.articuloId?.titulo,
            fechaAsignacion: new Date(asignacion.createdAt).toISOString().split('T')[0],
            estado: estadoAsignacionDbToUi[asignacion.estado] || asignacion.estado
        })).filter((a) => a.id);

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo articulos asignados:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// N1. Endpoint: Ver TODOS los artículos (Editor)
app.get('/api/articulos', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const articulos = await Articulo.find().sort({ createdAt: -1 });
        
        // Populate revisores for each article to show in the UI
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
                revisores: revisoresData
            };
        }));

        return res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo panel de editor:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});

// N2. Endpoint: Obtener lista de Revisores disponibles (Editor)
app.get('/api/revisores', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        // En un esquema híbrido, cualquier usuario activo (incluyendo 'autor') es candidato potencial para ser promovido a revisor de forma automática.
        const revisores = await Usuario.find({ activo: true }).select('username _id roles');
        
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

// N3. Endpoint: Asignar un revisor a un artículo (Editor)
app.post('/api/asignaciones', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const { articuloId, revisorId } = req.body;
        if (!articuloId || !revisorId) return res.status(400).json({ error: 'Data invalida' });

        const existe = await AsignacionRevision.findOne({ articuloId, revisorId, estado: { $ne: 'cancelado' } });
        if (existe) return res.status(400).json({ error: 'Este revisor ya está asignado al artículo.' });

        const asignacion = new AsignacionRevision({ articuloId, revisorId, estado: 'pendiente' });
        await asignacion.save();

        // LÓGICA AUTOMÁTICA HYBRIDA: Si el asignado no tiene rol 'revisor', otorgárselo como consecuencia de la asignación.
        const usuarioRevisor = await Usuario.findById(revisorId);
        if (usuarioRevisor && !usuarioRevisor.roles.includes('revisor')) {
            usuarioRevisor.roles.push('revisor');
            await usuarioRevisor.save();
        }

        // Si tiene al menos 2 revisores, pasar a en_revision
        const cuentaRevisores = await AsignacionRevision.countDocuments({ articuloId, estado: { $ne: 'cancelado'} });
        if (cuentaRevisores >= 2) {
            await Articulo.findByIdAndUpdate(articuloId, { estado: 'en_revision' });
        }

        return res.status(201).json({ mensaje: 'Revisor asignado con éxito.' });
    } catch (error) {
        console.error('Error asignando revisor:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});

// N4. Endpoint: Quitar Asignacion (Editor)
app.delete('/api/asignaciones', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const { articuloId, revisorId } = req.body;
        if (!articuloId || !revisorId) return res.status(400).json({ error: 'Data invalida' });

        await AsignacionRevision.findOneAndUpdate({ articuloId, revisorId, estado: { $ne: 'evaluado' } }, { estado: 'cancelado' });

        return res.status(200).json({ mensaje: 'Asignación removida.' });
    } catch (error) {
        return res.status(500).json({ error: 'Error al quitar revisión.' });
    }
});

// N5. Endpoint: Decidir status final articulo (Editor)
app.put('/api/articulos/:id/estado', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const { id } = req.params;
        const { estado } = req.body; // 'Aceptado' o 'Rechazado' -> lo pasamos a db form
        let estadoDb = 'recibido';
        if (estado === 'Aceptado') estadoDb = 'aceptado';
        if (estado === 'Rechazado') estadoDb = 'rechazado';

        await Articulo.findByIdAndUpdate(id, { estado: estadoDb });
        return res.status(200).json({ mensaje: 'Decisión registrada correctamente.' });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno de decision.' });
    }
});

// N6. Endpoint: Modificar roles manualmente (Editor)
app.put('/api/usuarios/:id/roles', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });

    try {
        const { id } = req.params;
        const { roles } = req.body;
        
        if (!Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ error: 'Debes proveer un arreglo válido de roles.' });
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

// N7. Endpoint: Listar todos los usuarios para gestión (Editor)
app.get('/api/usuarios', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('editor')) return res.status(403).json({ error: "Acceso solo para editores" });
    try {
        const usuarios = await Usuario.find({ activo: true }).select('username email roles createdAt');
        return res.json(usuarios);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        return res.status(500).json({ error: 'Error interno.' });
    }
});

// 5. Endpoint (TAREA 2313): Enviar Evaluación de Artículo (Revisor)
app.post('/api/evaluar', verificarToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('revisor')) return res.status(403).json({ error: "Acceso solo para revisores" });
    try {
        const { articuloId, veredicto, comentarios } = req.body;
        const veredictoDb = veredictoUiToDb[veredicto] || String(veredicto || '').toLowerCase().replace(/\s+/g, '_');

        if (!articuloId || !veredictoDb || !comentarios) {
            return res.status(400).json({ error: 'Faltan datos requeridos para la evaluación.' });
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
            comentarios
        });
        
        await evaluacion.save();
        await AsignacionRevision.findByIdAndUpdate(asignacion._id, { estado: 'evaluado' });

        return res.json({ mensaje: "Evaluación enviada con éxito. El editor ha sido notificado." });
    } catch (error) {
        console.error('Error al guardar evaluación:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

const iniciarServidor = async () => {
    try {
        await connectDB();
        app.listen(3000, () => console.log('[Servidor] Backend corriendo en http://localhost:3000'));
    } catch (error) {
        console.error('No se pudo iniciar el backend:', error);
        process.exit(1);
    }
};

iniciarServidor();