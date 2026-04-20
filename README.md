# Sistema de Revisión de Congresos — PWA

Plataforma de gestión de congresos académicos con revisión por pares doble ciego.  
**Stack:** Node.js · Express · Prisma · MySQL 8 · Vue 3 · Vuetify · Docker

---

## Arquitectura

```
project/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express: middlewares + rutas
│   │   ├── server.js               # Punto de entrada HTTP
│   │   ├── config/
│   │   │   ├── prisma.js           # Singleton cliente Prisma
│   │   │   └── env.js              # Validación de variables de entorno
│   │   ├── middleware/
│   │   │   ├── auth.js             # verifyToken (JWT)
│   │   │   ├── roles.js            # requireRole(), requireEventContext()
│   │   │   ├── validate.js         # Wrapper Zod genérico
│   │   │   ├── upload.js           # Multer — PDFs hasta 10MB
│   │   │   └── errorHandler.js     # Catch global de Express
│   │   ├── modules/
│   │   │   ├── auth/               # Login, register, switch-event, /me
│   │   │   ├── users/              # CRUD usuarios, roles por evento
│   │   │   ├── events/             # CRUD congresos, stats
│   │   │   ├── papers/             # Artículos con doble ciego
│   │   │   └── reviews/            # Asignaciones + evaluaciones
│   │   └── shared/
│   │       ├── response.js         # Helpers HTTP (ok, fail, created…)
│   │       └── history.js          # logHistory()
│   ├── prisma/
│   │   └── schema.prisma           # Esquema relacional completo
│   └── scripts/
│       └── seed.js                 # Seed con 3 eventos, 11 usuarios, reviews
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # Módulos Axios por recurso
│   │   ├── stores/                 # Pinia: auth, papers, reviews
│   │   ├── router/                 # Guards por rol y contexto de evento
│   │   ├── views/                  # Login, EventSelector, Author, Reviewer, Editor, Admin
│   │   └── components/             # Diálogos, cards, drawers reutilizables
│   └── vite.config.js              # PWA + proxy de desarrollo
│
└── docker-compose.yml
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Docker      | 24+            |
| Docker Compose | v2 (`docker compose`) |

> Para desarrollo local sin Docker también necesitas: Node.js 20+, MySQL 8

---

## Levantar con Docker (recomendado)

```bash
# 1. Clonar y entrar al proyecto
git clone <repo-url>
cd project

# 2. Arrancar todo (MySQL + backend + frontend)
docker compose up --build

# La primera vez el backend:
#   - Ejecuta migraciones de Prisma
#   - Corre el seed automáticamente
#   - Arranca el servidor

# Esperar ~30 segundos hasta ver:
#   [Server] Backend corriendo en http://0.0.0.0:3000
#   [Seed] ✅ Seed completado exitosamente.
```

### URLs de acceso

| Servicio  | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:5173      |
| Backend   | http://localhost:3000      |
| API Health| http://localhost:3000/api/health |

### Detener

```bash
docker compose down          # detener contenedores
docker compose down -v       # detener + borrar volúmenes (reset de BD)
```

---

## Desarrollo local (sin Docker)

### Backend

```bash
cd backend

# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de MySQL local

# 2. Instalar dependencias
npm install

# 3. Crear la base de datos en MySQL
mysql -u root -p -e "CREATE DATABASE peerreview;"

# 4. Ejecutar migraciones
npx prisma migrate dev --name init

# 5. Cargar datos de prueba
npm run seed

# 6. Iniciar en modo desarrollo (con --watch)
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Cuentas de prueba

> Todas usan **password: `1234`**

| Usuario       | Rol en Congreso IA 2025 | Rol en Simposio SW 2025 |
|---------------|------------------------|------------------------|
| `admin`       | ADMIN                  | ADMIN                  |
| `editor_ia`   | EDITOR                 | —                      |
| `editor_sw`   | —                      | EDITOR                 |
| `revisor1`    | REVIEWER               | —                      |
| `revisor2`    | REVIEWER               | REVIEWER               |
| `revisor3`    | —                      | REVIEWER               |
| `autor1`      | AUTHOR                 | AUTHOR                 |
| `autor2`      | AUTHOR                 | AUTHOR                 |
| `autor3`      | AUTHOR                 | AUTHOR                 |
| `multiusuario`| AUTHOR                 | REVIEWER               |

---

## API — Referencia rápida

### Autenticación

```
POST   /api/auth/register          Registro de usuario
POST   /api/auth/login             Login { username, password, eventId? }
POST   /api/auth/switch-event      Cambiar evento activo → nuevo token
GET    /api/auth/me                Perfil del usuario autenticado
POST   /api/auth/logout
```

### Eventos

```
GET    /api/events                 Listar todos
GET    /api/events/:id             Detalle
GET    /api/events/:id/stats       Stats (ADMIN/EDITOR)
POST   /api/events                 Crear (ADMIN)
PATCH  /api/events/:id             Editar (ADMIN)
DELETE /api/events/:id             Desactivar (ADMIN)
```

### Usuarios y roles

```
GET    /api/users                           Listar (ADMIN)
PATCH  /api/users/:id                       Editar (ADMIN)
POST   /api/users/roles/assign              Asignar rol en evento (ADMIN)
DELETE /api/users/roles/remove              Remover rol (ADMIN)
GET    /api/users/by-event/:eventId         Miembros de un evento
GET    /api/users/reviewers/:eventId        Revisores disponibles con carga
```

### Artículos (requieren token con eventId)

```
GET    /api/papers                    Ver los que corresponden según rol
GET    /api/papers/:id                Detalle (con doble ciego para REVIEWER)
POST   /api/papers                    Subir artículo PDF (AUTHOR)
POST   /api/papers/:id/versions       Nueva versión PDF (AUTHOR)
PATCH  /api/papers/:id/status         Cambiar estado (EDITOR/ADMIN)
GET    /api/papers/:id/history        Historial de eventos
```

### Revisiones (requieren token con eventId)

```
GET    /api/reviews/my-assignments    Mis asignaciones (REVIEWER)
POST   /api/reviews/submit            Enviar evaluación (REVIEWER)
POST   /api/reviews/assignments       Asignar revisor (EDITOR/ADMIN)
DELETE /api/reviews/assignments       Cancelar asignación (EDITOR/ADMIN)
GET    /api/reviews/assignments/:pid  Asignaciones de un artículo
GET    /api/reviews/paper/:pid        Evaluaciones (editor ve revisor; autor no)
```

---

## Flujo de trabajo completo

```
1. ADMIN crea evento
2. ADMIN asigna roles a usuarios en ese evento
3. AUTHOR sube artículo (PDF) → estado: RECEIVED
4. EDITOR asigna 2 revisores → estado: UNDER_REVIEW
5. REVIEWER lee PDF y envía evaluación con rúbrica
6. EDITOR ve ambas evaluaciones y decide estado final
7. AUTHOR recibe notificación de estado y puede subir nueva versión
   si el estado es MINOR_CHANGES o MAJOR_CHANGES
```

---

## Comandos útiles

```bash
# Ver logs del backend en tiempo real
docker compose logs -f backend

# Resetear la base de datos y re-sembrar
docker compose exec backend npx prisma migrate reset --force

# Abrir Prisma Studio (explorador visual de la BD)
cd backend && npx prisma studio

# Re-correr solo el seed
docker compose exec backend node scripts/seed.js

# Inspeccionar la BD directamente
docker compose exec mysql mysql -u appuser -papppass peerreview
```

---

## Variables de entorno del backend

| Variable       | Valor por defecto                        | Descripción                   |
|----------------|------------------------------------------|-------------------------------|
| `DATABASE_URL` | —                                        | **Obligatoria.** MySQL DSN    |
| `JWT_SECRET`   | —                                        | **Obligatoria.** Clave JWT    |
| `PORT`         | `3000`                                   | Puerto del servidor           |
| `NODE_ENV`     | `development`                            | Entorno                       |
| `UPLOADS_DIR`  | `./uploads`                              | Directorio de PDFs            |
| `FRONTEND_URL` | `http://localhost:5173`                  | Origen permitido en CORS      |

---

## Para el equipo de desarrollo

### Flujo Git recomendado

```
main          → producción (Docker)
develop       → integración
feature/auth  → módulo auth
feature/papers→ módulo papers
```

### Agregar un nuevo módulo

```
src/modules/nuevo-modulo/
├── nuevo-modulo.routes.js      # rutas + middlewares
├── nuevo-modulo.controller.js  # solo HTTP
├── nuevo-modulo.service.js     # lógica de negocio + Prisma
└── nuevo-modulo.validator.js   # schemas Zod
```

Luego montar en `src/app.js`:
```js
import nuevoRoutes from './modules/nuevo-modulo/nuevo-modulo.routes.js';
app.use('/api/nuevo-modulo', nuevoRoutes);
```

### Convenciones de código

- **Services:** no conocen `req`/`res`. Devuelven datos o lanzan `Error` con `.status`
- **Controllers:** solo extraen datos del request, llaman al service, devuelven respuesta
- **Validators:** schemas Zod exportados, aplicados con el middleware `validate()`
- **Todos los datos filtrados por `eventId`** — nunca exponer datos entre eventos
- **Doble ciego:** `authorId` nunca se incluye en respuestas a revisores
