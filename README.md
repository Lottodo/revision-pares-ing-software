# Sistema de Revisión de Congresos — PWA

Plataforma de gestión de congresos académicos con revisión por pares doble ciego.  
**Stack:** Node.js · Express · Prisma · MySQL 8 · Vue 3 · Vuetify · Docker

---

## 1. Requisitos Previos

Para poder compilar y ejecutar este proyecto, necesitas tener instaladas las siguientes herramientas en tu computadora. Las instrucciones están pensadas para que cualquier persona, sin importar su experiencia previa, pueda seguirlas.

### Opción A: Usando Docker (Recomendado y más fácil)
Docker es una herramienta que empaqueta todo el software necesario (base de datos, backend, frontend) para que no tengas que instalar o configurar cada cosa por separado en tu sistema.
- **Docker Desktop**: [Descargar e instalar Docker Desktop](https://www.docker.com/products/docker-desktop/).
  - *Nota*: Asegúrate de que la aplicación Docker Desktop esté abierta y ejecutándose en segundo plano antes de continuar.
- **Git**: [Descargar Git](https://git-scm.com/downloads) para poder descargar el código fuente.

### Opción B: Instalación Manual (Sin Docker)
Si prefieres no usar Docker, deberás instalar cada componente individualmente:
- **Node.js**: [Descargar Node.js (Versión 20 o superior)](https://nodejs.org/). La instalación incluye `npm`, que es el gestor de paquetes que usaremos.
- **MySQL 8**: [Descargar MySQL Community Server](https://dev.mysql.com/downloads/mysql/). Durante la instalación, asegúrate de recordar la contraseña que le asignes al usuario `root`.
- **Git**: [Descargar Git](https://git-scm.com/downloads).

---

## 2. Instrucciones de Compilación Paso a Paso

Sigue estos pasos cuidadosamente para poner en marcha el proyecto en tu máquina local.

### Paso 1: Descargar el proyecto
Abre la terminal de tu computadora (Símbolo del sistema, PowerShell en Windows o Terminal en macOS/Linux) y ejecuta los siguientes comandos para descargar y entrar a la carpeta del proyecto:
```bash
git clone <url-del-repositorio>
cd revision-pares-ing-software
```

### Paso 2: Compilar y ejecutar (Elige una opción)

#### Opción A: Ejecución con Docker (Recomendado)
Esta es la forma más rápida y con menos probabilidades de error para hacer funcionar el proyecto.

1. Asegúrate de tener **Docker Desktop** abierto y ejecutándose.
2. En la terminal, dentro de la carpeta del proyecto, ejecuta el siguiente comando:
   ```bash
   docker compose up --build
   ```
3. **¡Listo!** Ahora solo debes esperar. La primera vez que ejecutes esto, Docker descargará todo lo necesario, creará la base de datos automáticamente, insertará datos de prueba y encenderá los servidores.
4. El proceso termina cuando veas mensajes en la terminal indicando que los servicios están listos. No cierres esta terminal mientras quieras usar la aplicación.

#### Opción B: Ejecución Manual (Sin Docker)
Si elegiste instalar Node.js y MySQL por tu cuenta, sigue estos pasos:

**1. Configurar la Base de Datos (MySQL)**
Abre la terminal o tu gestor de MySQL (como MySQL Workbench) y crea la base de datos ejecutando este comando SQL:
```sql
CREATE DATABASE peerreview;
```

**2. Iniciar el Backend (Servidor de la API)**
Abre una terminal y navega a la carpeta del backend:
```bash
cd backend
```
Instala todas las librerías necesarias:
```bash
npm install
```
Configura la conexión a la base de datos:
1. En la carpeta `backend`, busca el archivo llamado `.env.example`.
2. Haz una copia de ese archivo y renómbrala a `.env`.
3. Abre el nuevo archivo `.env` con cualquier editor de texto y busca la línea que dice `DATABASE_URL`.
4. Modifica esa línea para que tenga tu usuario y contraseña de MySQL. Por ejemplo, si tu contraseña de root es "secreta", la línea debería verse así:
   `DATABASE_URL="mysql://root:secreta@localhost:3306/peerreview"`

Prepara la base de datos y llénala con datos de prueba:
```bash
npx prisma migrate dev --name init
npm run seed
```
Inicia el servidor backend:
```bash
npm run dev
```
*(El backend quedará corriendo en esta terminal. Déjala abierta y no la cierres).*

**3. Iniciar el Frontend (La interfaz visual)**
Abre **una nueva ventana o pestaña** en tu terminal y navega a la carpeta del frontend:
```bash
cd frontend
```
Instala las librerías necesarias:
```bash
npm install
```
Inicia la aplicación web:
```bash
npm run dev
```

---

## 3. Direcciones de Acceso y Uso

Una vez que hayas completado el Paso 2 (ya sea con Docker o Manual), abre tu navegador web favorito (Chrome, Firefox, Edge, etc.) y visita las siguientes direcciones:

- **Aplicación Web (Frontend):** [http://localhost:5173](http://localhost:5173)
- **Servidor de Datos (Backend):** [http://localhost:3000](http://localhost:3000)

### Cuentas de prueba para iniciar sesión
La aplicación ya viene con cuentas creadas para que puedas probarla inmediatamente.  
**La contraseña para todas las cuentas es:** `1234`

| Usuario       | Rol en Congreso IA 2025 | Rol en Simposio SW 2025 |
|---------------|------------------------|------------------------|
| `admin`       | Administrador          | Administrador          |
| `editor_ia`   | Editor                 | —                      |
| `editor_sw`   | —                      | Editor                 |
| `revisor1`    | Revisor                | —                      |
| `revisor2`    | Revisor                | Revisor                |
| `autor1`      | Autor                  | Autor                  |
| `multiusuario`| Autor                  | Revisor                |

---

## 4. Errores Comunes y Notas Adicionales

Aquí tienes soluciones a los problemas más frecuentes que podrían ocurrir al intentar compilar o ejecutar el proyecto:

### ❌ Error: `port is already allocated` o `address already in use`
- **Causa:** El puerto 3000 (usado por el Backend) o el puerto 5173 (usado por el Frontend) ya está siendo ocupado por otro programa en tu computadora o por un intento anterior de correr este mismo proyecto que no se cerró correctamente.
- **Solución:** Cierra todas las ventanas de terminal que tengas abiertas. Si estás usando Docker, ejecuta el comando `docker compose down` para forzar la detención de cualquier contenedor que haya quedado en segundo plano, y luego vuelve a intentar arrancar el proyecto.

### ❌ Error en Docker: `docker daemon is not running` o `error during connect`
- **Causa:** La aplicación de Docker no está encendida en tu computadora.
- **Solución:** Abre la aplicación **Docker Desktop** desde tu menú de inicio y espera unos segundos hasta que el ícono (usualmente una ballena) indique que el motor está corriendo ("Engine running") antes de ejecutar los comandos en la terminal.

### ❌ Error (Manual): `Can't connect to MySQL server on 'localhost'`
- **Causa:** El servidor MySQL no está encendido en tu computadora, o los datos en tu archivo `.env` no apuntan al puerto correcto.
- **Solución:** Verifica que el servicio de MySQL esté corriendo (En Windows, puedes buscar "Servicios" en el menú de inicio, buscar MySQL y darle a Iniciar).

### ❌ Error (Manual): `PrismaClientInitializationError: Access denied for user`
- **Causa:** La contraseña o el usuario de la base de datos en tu archivo `.env` son incorrectos.
- **Solución:** Abre el archivo `.env` que creaste dentro de la carpeta `backend` y verifica cuidadosamente que la parte de la `DATABASE_URL` contenga el usuario y la contraseña correctos de tu instalación de MySQL.

### ❌ Error en Docker: La aplicación se queda "cargando" y no avanza
- **Causa:** Puede haber un conflicto con archivos temporales antiguos o una instalación previa corrupta.
- **Solución:** Detén todo, borra los datos temporales e inicia de nuevo limpiamente ejecutando estos dos comandos:
  ```bash
  docker compose down -v
  docker compose up --build
  ```

---

## 5. Detalles Técnicos y Arquitectura (Para Desarrolladores)

Si deseas modificar el código o entender cómo funciona por dentro, aquí tienes la información técnica del proyecto.

### Arquitectura de Carpetas
```
project/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express: middlewares + rutas principales
│   │   ├── server.js               # Punto de entrada HTTP
│   │   ├── config/                 # Configuración de Prisma y Entorno
│   │   ├── middleware/             # Seguridad (Autenticación JWT, Roles) y subidas (Multer)
│   │   ├── modules/                # Módulos de negocio (Auth, Users, Events, Papers, Reviews)
│   │   └── shared/                 # Helpers compartidos
│   ├── prisma/
│   │   └── schema.prisma           # Esquema de la base de datos
│   └── scripts/
│       └── seed.js                 # Script para llenar la base de datos con datos de prueba
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # Conexiones Axios al backend
│   │   ├── stores/                 # Gestión de estado global (Pinia)
│   │   ├── router/                 # Rutas y protección de pantallas por rol
│   │   ├── views/                  # Vistas principales de la aplicación
│   │   └── components/             # Componentes visuales reutilizables (Vuetify)
│   └── vite.config.js              # Configuración del empaquetador Vite y PWA
│
└── docker-compose.yml              # Configuración de infraestructura Docker
```

### Comandos de utilidad en Docker
```bash
# Ver los registros (logs) del backend en tiempo real
docker compose logs -f backend

# Reiniciar por completo la base de datos y volver a insertar los datos de prueba
docker compose exec backend npx prisma migrate reset --force

# Abrir Prisma Studio (Una interfaz web para ver y editar la base de datos directamente)
cd backend && npx prisma studio
```

### API — Referencia rápida
El backend expone una API RESTful. La mayoría de los endpoints (excepto login/registro) requieren un token JWT válido que se envía en el header `Authorization: Bearer <token>`.

- **Autenticación**: `/api/auth/register`, `/api/auth/login`, `/api/auth/switch-event`, `/api/auth/me`
- **Eventos**: `/api/events` (CRUD completo para administradores)
- **Usuarios**: `/api/users`, `/api/users/roles/assign`
- **Artículos (Papers)**: `/api/papers` (Sube PDFs, gestiona versiones y estados)
- **Revisiones**: `/api/reviews/my-assignments`, `/api/reviews/submit`, `/api/reviews/assignments`
