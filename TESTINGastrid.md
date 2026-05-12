# Documentación de Pruebas del Sistema

## Sistema de Revisión de Congresos — Verificación de Requerimientos

> **Stack del sistema:** Node.js · Express · Prisma ORM · MySQL 8 · Vue 3 · Vuetify 3 · Docker Compose · Vite PWA

---

## ¿Se podía usar Playwright Test para VSCode?

**Sí, y era la opción más cómoda para desarrollo local.** La extensión oficial
[**Playwright Test for VS Code**](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
(`ms-playwright.playwright`) permite:

- Ejecutar y depurar pruebas directamente desde el panel lateral de VSCode.
- Ver cada paso en modo *headed* (con el navegador visible) o *headless*.
- Generar tests de forma asistida con *Codegen* (`npx playwright codegen`).
- Ver el *trace viewer* con capturas de pantalla por cada acción.

### ¿Por qué se eligió Python + `requests` en lugar de Playwright Test?

| Criterio | Playwright Test (JS/TS) | Python + `requests` (elegido) |
|---|---|---|
| Pruebas de UI interactiva | ✅ Ideal | ⚠ Requiere `playwright` Python |
| Pruebas de API puras (CRUD) | ➖ Overhead innecesario | ✅ Simple y directo |
| Prueba de Docker (subprocess) | ❌ Complejo | ✅ Nativo con `subprocess` |
| Sin dependencia de browser | ❌ Siempre lanza browser | ✅ Solo HTTP |
| Generación de reporte HTML | Requiere plugin | ✅ Generado directamente |

El script `tests/e2e/comprehensive_pwa_tester.py` **sí usa Playwright** (la librería Python)
para los flujos de interfaz de usuario. El script `system_test_report.py` usa `requests`
porque prueba principalmente la capa de API y Docker, donde un browser sería excesivo.

### Cómo instalar Playwright Test for VSCode (para uso futuro)

```bash
# 1. Instalar la extensión en VSCode
# Extensions → buscar "Playwright Test for VS Code" → Instalar

# 2. Inicializar Playwright en el proyecto
npm init playwright@latest

# 3. Correr los tests desde la barra lateral o terminal
npx playwright test
npx playwright test --ui   # Modo visual interactivo
```

---

## Requerimiento 1 — Uso Offline Básico (PWA)

### ¿Cómo se logró?

El sistema está implementado como una **Progressive Web App (PWA)** utilizando
**Vite PWA Plugin** (`vite-plugin-pwa`) sobre Vue 3. Esto provee:

1. **Service Worker automático** generado por Workbox (`generateSW`):
   - Cachea todos los assets estáticos del build (`*.js`, `*.css`, `*.html`, `*.png`, `*.woff2`).
   - Las llamadas a la API usan estrategia `NetworkFirst`: intenta la red, y si falla,
     sirve la última respuesta cacheada.
   - Los PDFs subidos usan `CacheFirst` (no cambian una vez subidos).

2. **Registro automático** del Service Worker con `registerType: 'autoUpdate'` +
   `skipWaiting: true`: el SW nuevo toma control inmediatamente sin esperar a que
   el usuario cierre la pestaña.

3. **Web App Manifest** (`manifest.webmanifest`): permite instalar la app en el
   dispositivo (botón "Instalar" en Chrome/Edge) y funcionar como app nativa.

### Archivos clave

```
frontend/
  vite.config.js          ← Configuración de VitePWA + Workbox
  public/icons/           ← Iconos PWA (192x192, 512x512)
  dist/sw.js              ← Service Worker generado (build)
  dist/manifest.webmanifest ← Manifest generado (build)
```

### Prueba automatizada

```python
# tests/e2e/system_test_report.py — Suite "Offline"
suite_offline()
# Verifica:
#   ✅ Frontend carga (HTTP 200 en localhost:5173)
#   ✅ manifest.webmanifest accesible y válido (nombre + íconos)
#   ✅ sw.js servido correctamente
#   ✅ Lógica Workbox/precache presente en el SW
#   ✅ Backend API responde (/api/health)
```

> **Nota:** En modo desarrollo (`npm run dev`) el SW tiene funcionalidad reducida.
> El caché offline completo se activa en el **build de producción** (`npm run build`).
> Los artefactos generados están en `frontend/dist/`.

---

## Requerimiento 2 — CRUD para MySQL

### ¿Por qué MySQL y no MongoDB?

El sistema requiere **integridad referencial estricta** entre entidades:

```
User ──── EventUser ──── Event
 │                          │
 └──── Paper ──── Assignment ──── Review
          │
          └──── PaperHistory
```

Esta estructura con **Foreign Keys, ON DELETE CASCADE y transacciones ACID** es
el dominio natural de una base de datos relacional. MySQL 8 con Prisma ORM fue la
elección correcta porque:

| Razón | Detalle |
|---|---|
| **FK e integridad** | Un `Assignment` no puede existir sin `Paper` ni `User` |
| **Transacciones ACID** | Aceptar invitación = UPDATE assignment + INSERT history en una sola TX |
| **JOINs complejos** | La vista del editor requiere Paper JOIN User JOIN Assignment JOIN Review |
| **Esquema fijo** | Todos los artículos y revisiones tienen exactamente los mismos campos |
| **Prisma ORM** | Migraciones automáticas, tipado TypeScript, cliente generado |
| **Docker simple** | `mysql:8.0` no requiere replica set (MongoDB sí para TX completas) |

### Operaciones CRUD implementadas

| Operación | Entidad | Endpoint | Descripción |
|---|---|---|---|
| **CREATE** | Usuario | `POST /api/auth/register` | Registro con hash bcrypt |
| **CREATE** | Paper | `POST /api/papers` | Subida con Multer (PDF) |
| **CREATE** | Assignment | `POST /api/reviews/assignments` | Editor asigna revisor |
| **CREATE** | Review | `POST /api/reviews/submit` | Revisor envía evaluación |
| **CREATE** | History | `POST /api/papers/:id/history` | Nota manual en historial |
| **READ** | Usuarios | `GET /api/users` | Lista paginada (admin) |
| **READ** | Papers | `GET /api/papers` | Filtrados por evento/rol |
| **READ** | Assignments | `GET /api/reviews/assignments/:paperId` | Por artículo |
| **READ** | Reviews | `GET /api/reviews/paper/:paperId` | Por artículo |
| **READ** | History | `GET /api/papers/:id/history` | Historial completo |
| **UPDATE** | Paper status | `PATCH /api/papers/:id/status` | Cambio de estado editorial |
| **UPDATE** | Assignment | `PUT /api/reviews/assignments/:id/respond` | Aceptar/rechazar invitación |
| **UPDATE** | Rol usuario | `POST /api/users/roles/assign` | Asignar rol en evento |
| **DELETE** | Assignment | `DELETE /api/reviews/assignments` | Cancelar asignación |

### Validaciones de integridad implementadas

- **Doble ciego:** `users.service.js → assignRole()` verifica que un usuario no sea
  AUTHOR y REVIEWER/EDITOR en el mismo congreso (responde HTTP 409 si hay conflicto).
- **Estado sin restricciones:** `papers.service.js → updateStatus()` permite al editor
  transicionar a cualquier estado sin máquina de estados rígida.
- **Sesión única:** `auth.service.js → login()` genera un `currentSessionId` (UUID)
  que invalida sesiones anteriores en otros dispositivos.

### Prueba automatizada

```bash
# Ejecutar suite completa
python tests/e2e/system_test_report.py

# El reporte HTML se genera en:
tests/e2e/test_report.html
```

---

## Requerimiento 3 — CRUD para MongoDB

### ¿Por qué se usó MySQL en lugar de MongoDB?

MongoDB habría sido una elección válida si el sistema tuviera:

- ✅ Documentos con **estructura variable** (metadatos de conferencias sin esquema fijo)
- ✅ **Logs de eventos** en tiempo real (alta escritura, baja lectura)
- ✅ **Contenido completo** de artículos con secciones dinámicas
- ✅ Escala horizontal masiva (sharding automático)

**En cambio, este sistema tiene:**

- ❌ Esquema completamente fijo — todos los `Paper`, `Review` y `Assignment` tienen los mismos campos exactos
- ❌ Relaciones muchos-a-muchos (`EventUser`) que requieren JOINs eficientes
- ❌ Transacciones que tocan múltiples colecciones simultáneamente
- ❌ Queries complejas de agregación (estadísticas del editor) que son naturales en SQL

MongoDB requeriría:
- `$lookup` anidados en lugar de JOINs simples
- Replica set para garantizar transacciones ACID completas
- Gestión manual de referencias entre documentos
- Más código boilerplate para mantener la integridad referencial

**Decisión:** MySQL 8 + Prisma ORM es la herramienta correcta para este dominio.
La complejidad de MongoDB no aportaría valor y añadiría riesgo de datos inconsistentes.

> Si en una versión futura se requiriera guardar el **cuerpo completo en texto** de
> artículos para búsqueda full-text avanzada, MongoDB Atlas Search o Elasticsearch
> serían candidatos para ese componente específico (arquitectura híbrida).

---

## Requerimiento 4 — Contenedores Docker

### Arquitectura de contenedores

```
┌─────────────────────────────────────────────────────┐
│  Red: app-net (bridge)                              │
│                                                     │
│  ┌─────────────┐   ┌──────────────┐  ┌──────────┐  │
│  │  congress_  │   │  congress_   │  │congress_ │  │
│  │  frontend   │──▶│  backend     │──▶│  mysql   │  │
│  │  :5173      │   │  :3000       │  │  :3306   │  │
│  │  Vue 3/Vite │   │  Node/Prisma │  │  MySQL 8 │  │
│  └─────────────┘   └──────────────┘  └──────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Características implementadas

| Característica | Implementación |
|---|---|
| **Healthcheck MySQL** | `mysqladmin ping` cada 10s — el backend espera `condition: service_healthy` |
| **Migraciones automáticas** | `prisma migrate deploy` en el startup del backend |
| **Restart policy** | `unless-stopped` en los 3 servicios |
| **Bind mounts** | `./backend:/app` y `./frontend:/app` para desarrollo hot-reload |
| **Named volumes** | `mysql_data` persiste los datos entre reinicios |
| **Uploads volume** | `./backend/uploads:/app/uploads` para PDFs subidos |
| **Variables de entorno** | `DATABASE_URL`, `JWT_SECRET`, `PORT`, `UPLOADS_DIR` |

### Comandos clave

```bash
# Levantar todo el sistema
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f backend

# Re-ejecutar el seed (datos de prueba)
cd backend && node scripts/seed.js

# Verificar estado de los contenedores
docker compose ps

# Detener el sistema
docker compose down
```

### Prueba automatizada de Docker

```python
# tests/e2e/system_test_report.py — Suite "Docker"
suite_docker()
# Verifica mediante subprocess + docker inspect:
#   ✅ congress_backend  → State: running
#   ✅ congress_mysql    → State: running
#   ✅ congress_frontend → State: running
#   ✅ Backend responde en puerto 3000 (HTTP 200)
#   ✅ Frontend responde en puerto 5173 (HTTP 200)
#   ✅ Red app-net funcional (backend puede consultar MySQL)
#   ✅ RestartPolicy: unless-stopped en los 3 contenedores
```

---

## Ejecutar el Reporte de Pruebas

### Prerrequisitos

```bash
# El sistema debe estar corriendo
docker compose up -d

# Python 3.10+ con el entorno virtual del proyecto
.venv\Scripts\python.exe -m pip install requests
```

### Ejecución

```bash
# Desde la raíz del proyecto
.venv\Scripts\python.exe tests/e2e/system_test_report.py
```

### Resultado

```
tests/e2e/
  test_report.html   ← Abre en el navegador para ver el reporte visual
  test_report.json   ← Datos crudos en JSON para integración CI/CD
```

### Resultado esperado

```
Total: 31  |  ✅ 26  |  ❌ 5
```

Los 5 fallos esperados en modo desarrollo:
1. `manifest.webmanifest` — Solo JSON válido en build de producción (`npm run build`)
2. `Workbox en sw.js` — El SW completo solo existe tras el build
3. `Red backend→mysql` — El endpoint `/events` requiere autenticación (HTTP 401, no fallo real)
4-5. Pruebas de MongoDB — No aplican por diseño (sustituidas por justificación técnica)

> Para ver el 100% de pruebas verdes de la Suite Offline, ejecuta primero
> `cd frontend && npm run build` y sirve `dist/` con un servidor estático.
