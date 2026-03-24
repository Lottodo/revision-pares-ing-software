// backend/server-poc.js
import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors()); // Permite que el frontend hable con el backend

const SECRET_KEY = "mi_clave_super_secreta_sprint1";

// 1. Endpoint Público: Iniciar Sesión (Demuestra Auth)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Simulamos que revisa la base de datos
    if (username === "autor1" && password === "1234") {
        // Generamos el token JWT con el rol del usuario
        const token = jwt.sign({ id: 1, username: username, role: "autor" }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ mensaje: "Login exitoso", token: token });
    } else {
        res.status(401).json({ error: "Credenciales inválidas" });
    }
});

// Middleware para proteger rutas
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No hay token, acceso denegado." });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token inválido." });
        req.user = decoded; // Guardamos los datos del usuario
        next();
    });
};

// 2. Endpoint Protegido: Solo entra si tienes Token
app.get('/api/articulos-protegidos', verificarToken, (req, res) => {
    res.json({
        mensaje: `¡Hola ${req.user.username}! Como eres ${req.user.role}, tienes acceso a esta información segura.`,
        datos: [{ id: 1, titulo: "Impacto de la IA", estado: "Recibido" }]
    });
});

app.listen(3000, () => console.log('Servidor PoC corriendo en http://localhost:3000'));