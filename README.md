# Sistema de Revisión de Congresos — PWA

Plataforma de gestión de congresos académicos con **revisión por pares doble ciego**.  
**Stack:** Node.js · Express · Prisma ORM · MySQL 8 · Vue 3 · Vuetify 3 · Vite · Docker

---

## 1. Requisitos Previos

### Opción A: Con Docker ✅ (Recomendado)
Solo necesitas **una** herramienta:
- **Docker Desktop**: [Descargar aquí](https://www.docker.com/products/docker-desktop/)  
  Asegúrate de que la aplicación esté abierta y corriendo antes de continuar.

> Docker empaqueta automáticamente la base de datos, el backend y el frontend. No necesitas instalar Node.js, MySQL ni nada más.

### Opción B: Sin Docker (Manual)
Instala cada componente por separado:
- **Node.js 20+**: [Descargar](https://nodejs.org/)
- **MySQL 8**: [Descargar](https://dev.mysql.com/downloads/mysql/)
- **Git**: [Descargar](https://git-scm.com/downloads)

---

## 2. Puesta en Marcha

### Paso 1 — Descargar el proyecto

**Con Git:**
```bash
git clone <url-del-repositorio>
cd revision-pares-ing-software
```

**Sin Git:** Descarga el ZIP desde GitHub → *Code → Download ZIP*, extráelo y abre una terminal dentro de la carpeta.

---

### Paso 2 — Compilar y ejecutar

#### ▶ Opción A: Docker (Recomendado)

```bash
docker compose up --build
```

- **Primera vez:** tarda 5–10 minutos (descarga imágenes de Node y MySQL).
- **Siguientes veces:** `docker compose up` (sin `--build`) es mucho más rápido.

Cuando veas esto en la terminal, todo está listo:

```
congress_mysql    | ready for connections.
congress_backend  | Server running on port 3000
congress_frontend | Local: http://localhost:5173/
```

> ⚠️ No cierres la terminal mientras uses la aplicación.

---

#### ▶ Opción B: Manual (Sin Docker)

**1. Crear la base de datos en MySQL:**
```sql
CREATE DATABASE peerreview;
```

**2. Configurar el backend:**
```bash
cd backend
npm install
```

Copia el archivo de configuración y ajusta tus credenciales de MySQL:
```bash
# En Windows (PowerShell):
Copy-Item .env.example .env
# En macOS/Linux:
cp .env.example .env
```

Abre el archivo `.env` y edita la línea `DATABASE_URL` con tu usuario y contraseña de MySQL:
```
DATABASE_URL="mysql://root:TU_CONTRASEÑA@localhost:3306/peerreview"
```

Ejecuta las migraciones e inserta los datos de prueba:
```bash
npx prisma migrate dev --name init
npm run seed
```

Inicia el servidor backend *(déjalo corriendo)*:
```bash
npm run dev
```

**3. Configurar e iniciar el frontend** *(en una nueva terminal)*:
```bash
cd frontend
npm install
npm run dev
```

---

## 3. Acceso a la Aplicación

Una vez levantado (con cualquier opción), abre el navegador en:

| Servicio | URL |
|---|---|
| **Aplicación Web** | [http://localhost:5173](http://localhost:5173) |
| **API Backend** | [http://localhost:3000](http://localhost:3000) |

---

## 4. Cuentas de Prueba

El seed crea automáticamente **100 usuarios** con la contraseña `1234` para todos.  
Las dos cuentas principales para probar el sistema son:

> ⚠️ Para iniciar sesión, utiliza el nombre de usuario (username), no el correo electrónico.

### 👤 Cuentas principales

| Tipo de cuenta | Usuario | Contraseña | Descripción |
|---|---|---|---|
| **Admin Global** | `admin_root` | `1234` | Acceso total al sistema. Puede crear eventos, asignar roles y ver todos los datos. |
| **Multiusuario** | `multi_user` | `1234` | Tiene **roles distintos según el congreso**: Autor en el 1°, Revisor en el 2°, Editor en el 3°. Ideal para probar el cambio de contexto. |

### 👥 Usuarios generados automáticamente

El seed genera 98 usuarios adicionales con el patrón:

- **Email:** `nombre.apellido##@test.com`  *(ej: `ana.garcia1@test.com`)*
- **Contraseña:** `1234` (igual para todos)
- **Roles:** distribuidos aleatoriamente entre Autor, Revisor y Editor en cada congreso

> 💡 **Tip:** Para ver todos los usuarios y sus roles, abre Prisma Studio:
> ```bash
> # Con Docker:
> docker compose exec backend npx prisma studio
> # Sin Docker (desde la carpeta backend/):
> npx prisma studio
> ```
> Luego abre [http://localhost:5555](http://localhost:5555)

---

## 5. Roles y Permisos

El sistema implementa **revisión doble ciego** por congreso. Cada usuario puede tener un rol diferente en cada evento.

| Rol | Qué puede hacer |
|---|---|
| **Admin Global** | Crear/editar eventos, asignar cualquier rol, ver todo el sistema |
| **Editor** | Ver todos los artículos del congreso, asignar revisores, cambiar estados, ver dictámenes |
| **Revisor** | Ver solo los artículos que le fueron asignados (sin saber quién los escribió), enviar su evaluación con rúbrica |
| **Autor** | Subir artículos en PDF, consultar el estado de su artículo (sin saber quién lo revisa) |

---

## 6. Estructura del Proyecto

```
revision-pares-ing-software/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express: middlewares + rutas
│   │   ├── server.js           # Punto de entrada HTTP
│   │   ├── config/             # Configuración de Prisma y entorno
│   │   ├── middleware/         # JWT (auth), roles, Multer (uploads)
│   │   ├── modules/            # Módulos: auth, users, events, papers, reviews
│   │   └── shared/             # Helpers compartidos
│   ├── prisma/
│   │   ├── schema.prisma       # Esquema de base de datos
│   │   └── migrations/         # Migraciones automáticas de Prisma
│   ├── scripts/
│   │   └── seed.js             # Genera 100 usuarios + congresos + artículos de prueba
│   ├── uploads/                # PDFs subidos por los autores
│   ├── .env.example            # Plantilla de variables de entorno
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Llamadas Axios al backend
│   │   ├── stores/             # Estado global con Pinia
│   │   ├── router/             # Rutas protegidas por rol
│   │   ├── views/              # Páginas principales
│   │   └── components/         # Componentes Vuetify reutilizables
│   ├── vite.config.js          # Config de Vite + PWA
│   └── Dockerfile
│
├── PAPERS/                     # PDFs reales para el seed (opcionales)
├── docker-compose.yml          # Orquestación de los 3 servicios
└── README.md
```

---

## 7. Comandos Útiles

### Con Docker

```bash
# Iniciar todo (primera vez o tras cambios de código)
docker compose up --build

# Iniciar sin reconstruir (más rápido)
docker compose up

# Detener sin borrar datos
docker compose down

# Detener Y borrar la base de datos (reset completo)
docker compose down -v

# Ver logs del backend en tiempo real
docker compose logs -f backend

# Reiniciar la base de datos y volver a insertar datos de prueba
docker compose exec backend npx prisma migrate reset --force

# Abrir Prisma Studio (interfaz visual de la base de datos)
docker compose exec backend npx prisma studio
# → Luego abrir http://localhost:5555
```

### Sin Docker (desde la carpeta `backend/`)

```bash
# Aplicar migraciones pendientes
npx prisma migrate deploy

# Regenerar el cliente de Prisma tras cambios en el schema
npx prisma generate

# Insertar datos de prueba
npm run seed

# Ver la base de datos visualmente
npx prisma studio
```

---

## 8. API — Referencia Rápida

El backend expone una API RESTful en `http://localhost:3000`.  
Todos los endpoints (excepto login y registro) requieren el header:
```
Authorization: Bearer <token>
```
El token se obtiene al hacer login y el frontend lo gestiona automáticamente.

| Módulo | Endpoints principales |
|---|---|
| **Autenticación** | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/switch-event`, `GET /api/auth/me` |
| **Eventos** | `GET/POST /api/events`, `GET/PUT/DELETE /api/events/:id` |
| **Usuarios** | `GET /api/users`, `POST /api/users/roles/assign` |
| **Artículos** | `GET/POST /api/papers`, `GET/PATCH /api/papers/:id` |
| **Revisiones** | `GET /api/reviews/my-assignments`, `POST /api/reviews/submit`, `GET /api/reviews/assignments` |

---

## 9. Solución de Problemas Frecuentes

### ❌ `port is already allocated` o `address already in use`
El puerto 3000 o 5173 está ocupado por otro proceso.
```bash
docker compose down
docker compose up --build
```

### ❌ `docker daemon is not running`
Docker Desktop no está abierto. Ábrelo desde el menú de inicio y espera a que el ícono de la ballena esté estable antes de volver a ejecutar comandos.

### ❌ La app carga pero el login falla / no hay datos
El seed no se ejecutó. Fórzalo manualmente:
```bash
docker compose exec backend npx prisma migrate reset --force
```

### ❌ `Can't connect to MySQL` (Opción Manual)
Verifica que MySQL esté corriendo y que la `DATABASE_URL` en tu archivo `.env` tenga las credenciales correctas de tu instalación.

### ❌ `PrismaClientInitializationError: Access denied`
El usuario o contraseña en `.env` es incorrecto. Revisa y corrige la `DATABASE_URL`.

### ❌ La app se queda "cargando" y no avanza
Borra los datos temporales y reinicia limpio:
```bash
docker compose down -v
docker compose up --build
```
