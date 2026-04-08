# Avance del Proyecto (Revisión de Pares - Frontend & Backend)

**Autor:** Jeffrey Yoon
**Fecha de Reporte:** Sprint Actual (Integración Final). 8 de abril del 2026

Aquí está todo lo que implementé para el sprint actual:

---

## 🔑 Credenciales de Acceso (Base de Datos Inicial)
Para probar el sistema sin necesidad de crearlos manualmente, la base de datos funciona con los siguientes usuarios de prueba (el administrador fue omitido por seguridad):
- **Autor**: `autor1` | Contraseña: `1234`
- **Revisor**: `revisor1` | Contraseña: `1234`
- **Editor**: `editor1` | Contraseña: `1234`

---

## 1. Migración de Base de Datos (Secuela -> MongoDB Atlas)
El mayor cambio infraestructural fue deshacernos de MySQL (Sequelize) local y apuntar el Backend hacia la Nube usando **MongoDB Atlas**.
- Se eliminaron dependencias obsoletas (`sequelize`, `mysql2`).
- Se instaló y configuró `mongoose`.
- Todos los modelos (`Usuario`, `Articulo`, `AsignacionRevision`, `Evaluacion`) fueron reconstruidos en esquemas de Mongoose con claves `ObjectId`.
- Se configuró el `backend/scripts/seed.js` que puede correrse con `npm run seed`. **OJO:** Para propósitos de calificación, el usuario `admin` fue omitido del Seeder a petición de seguridad; los usuarios operativos son: `autor1`, `revisor1`, `editor1` (Todos con pass `1234`).

## 2. Refactorización de Autenticación (JWT + Bcrypt)
Se modernizó y aseguró el acceso a la plataforma.
- **Backend:** Las contraseñas en MongoDB ahora se encriptan con `bcryptjs`. Los logins verificados devuelven un **Token JWT**.
- **Frontend:** Se creó un composable Global (`src/composables/useAuth.js`) que encapsula la sesión. Toda petición a las rutas REST `/api/*` automáticamente inyecta el header `Authorization: Bearer <token>`.
- Las viejas llamadas _hardcodeadas_ como `hacerLoginAutomatico()` fueron purgadas de las vistas.

## 3. Rediseño Absoluto UI/UX (Constraint "Pro Max")
Para alinearse con un estándar formal de nivel de aplicación empresarial (y respetando convenciones UABC):
- El Frontend se unificó utilizando reglas **Flat Material Design** con Vuetify 3.
- Se eliminaron **por completo** todos los `Emojis` (✅, ❌, 📋, etc.) en favor de SVG Icons (`@mdi/font`) para brindar sobriedad.
- Se depuraron los `Mockups` de Front. Si el backend cae, la UI indicará el error de conexión en lugar de fingir artículos de prueba.
- **Router Navigation Guards:** La Barra de Navegación (`App.vue`) ahora es responsiva a los roles. Un autor no puede ver los paneles del editor. Si no hay token, el `router/index.js` no te dejará entrar a `/estado-articulos`.

## 4. Orquestación y Dockerización
Dado que el proyecto se compone de un stack _Node.js + Vue.js_, y la DB ya vive en la nube, se provee el sistema de contenedores para evitar problemas de compatibilidad locales.
- **Dockerfile** genérico para compilar entornos Node.
- **docker-compose.yml** listo. Inicia 2 contenedores:
    - **Backend:** Escuchando en el `3000`.
    - **Frontend:** Ejecuta Vite expuesto en `0.0.0.0` sobre el `5173`.
Los compañeros solo necesitan ejecutar `docker-compose up -d` y todo el ecosistema local se levantará.

---

## 5. Historial de Commits (Log)
Registro de mis intervenciones sobre la rama `feature/jeffrey-jaeho`:
- `54fbc41` style: aplicar diseno plano y consistente (google stitch / material)
- `7dae71f` docs: agregar propuesta de diseno visual del sistema
- `93045e6` feat(router): agregar guards de autenticacion y boton de logout
- `ae6ad1b` feat(auth): agregar composable useAuth para manejo de sesion
- `9093fba` feat(frontend): agregar pagina de login con branding uabc
- `d4bf63c` feat(seed): agregar seeder de usuario admin editor
- `49b5007` refactor(auth): extract verificarToken middleware to its own module
- `f679f97` feat(auth): add backend auth routes (register, login, logout, me)
- (La migración a MongoDB y Dockerización se registrará en el próximo Push final).

---

### Siguientes pasos (Hand-off)
1. Pueden correr `npm run dev` y `npm run start:backend` (en terminales separadas) para probar los cambios en caliente.
2. Todas las rutas de Express y Vue aprovechan Vite Proxy para que no existan errores de CORS.
3. El frontend y backend ya no fallan durante las cargas de `formData` para los PDFs debido a correcciones en el interceptor de tokens.
