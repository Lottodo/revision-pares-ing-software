// backend/server-poc.js
import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors()); // Permite que el frontend hable con el backend

const SECRET_KEY = "mi_clave_super_secreta_sprint1";

// 1. Endpoint Público: Iniciar Sesión (Soporta Autor y Revisor)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === "autor1" && password === "1234") {
        const token = jwt.sign({ id: 1, username: username, role: "autor" }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ mensaje: "Login exitoso", token: token, role: "autor" });
    } 
    // NUEVO: Agregamos un usuario revisor de prueba
    else if (username === "revisor1" && password === "1234") {
        const token = jwt.sign({ id: 2, username: username, role: "revisor" }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ mensaje: "Login exitoso", token: token, role: "revisor" });
    } 
    else {
        res.status(401).json({ error: "Credenciales inválidas" });
    }
});

// Middleware para proteger rutas
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No hay token, acceso denegado." });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token inválido." });
        req.user = decoded;
        next();
    });
};

// 2. Endpoint: Mis Artículos (Autor)
app.get('/api/mis-articulos', verificarToken, (req, res) => {
    if (req.user.role !== 'autor') return res.status(403).json({ error: "Acceso solo para autores" });
    res.json([
        { id: 101, titulo: "El impacto de la IA en la educación moderna", fecha: "2026-03-20", estado: "En Revisión" },
        { id: 98, titulo: "Nuevas metodologías ágiles en 2026", fecha: "2026-03-15", estado: "Aceptado" }
    ]);
});

// 3. Endpoint (TAREA 2317): Acceder a Artículos Asignados (Revisor)
app.get('/api/articulos-asignados', verificarToken, (req, res) => {
    // Validamos que sea un revisor
    if (req.user.role !== 'revisor') return res.status(403).json({ error: "Acceso solo para revisores" });
    
    res.json([
        { id: 105, titulo: "Optimización de bases de datos NoSQL", fechaAsignacion: "2026-04-01", estado: "Pendiente" },
        { id: 110, titulo: "Seguridad en APIs RESTful", fechaAsignacion: "2026-04-02", estado: "Pendiente" }
    ]);
});

app.listen(3000, () => console.log('Servidor PoC corriendo en http://localhost:3000'));