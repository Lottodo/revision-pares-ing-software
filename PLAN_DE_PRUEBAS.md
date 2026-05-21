# Plan de Pruebas: Sistema de Revisión de Congresos por Pares (PWA)

## 1. Introducción y Propósito
El presente documento describe el Plan de Pruebas para el **Sistema de Revisión de Congresos**. El objetivo principal es asegurar la calidad, seguridad y fiabilidad del sistema antes de su liberación, validando específicamente el flujo de revisión de doble ciego, la gestión de roles (RBAC) y la integridad de la base de datos dentro de un entorno contenedorizado.

## 2. Alcance de las Pruebas (Scope)

### 2.1 Elementos a Probar (In-Scope)
- **Gestión de Identidad y Acceso:** Autenticación de usuarios, registro y asignación de roles dinámicos (Administrador, Autor, Editor, Revisor, Asistente) por evento.
- **Flujos de Trabajo Core:**
  - Subida de artículos (PDF) por parte de los Autores.
  - Asignación de Revisores por parte de los Editores.
  - Evaluación y emisión de dictámenes por parte de los Revisores (garantizando el Doble Ciego).
  - Veredicto final emitido por el Editor.
- **Seguridad e Integridad de Datos:** Validaciones para evitar colisión de roles (ej. un autor no puede revisar su propio artículo) e integridad de relaciones en MySQL.
- **Progresive Web App (PWA):** Verificación del Service Worker y almacenamiento caché para la carga inicial offline.
- **Infraestructura:** Verificación del correcto despliegue de los contenedores Docker (Frontend, Backend, MySQL) y sus comunicaciones en red.

### 2.2 Elementos Fuera del Alcance (Out-of-Scope)
- Pruebas de estrés masivo o concurrencia extrema (pruebas de carga).
- Pruebas de compatibilidad exhaustivas en dispositivos móviles muy antiguos.
- Auditorías de seguridad de penetración (Pen-Testing) avanzadas de terceros.

---

## 3. Estrategia de Pruebas
La estrategia combina pruebas automatizadas a nivel de interfaz de usuario y a nivel de servicios web (API).

1. **Pruebas de Interfaz de Usuario y Flujo (End-to-End):**
   - Automatizan el navegador para simular las acciones de un usuario real. Se evalúa que los elementos del DOM respondan correctamente según el rol del usuario conectado.
   - *Herramienta:* Playwright (Node.js).

2. **Pruebas de Integración y API:**
   - Envían peticiones HTTP directas a los endpoints del Backend para asegurar que la lógica de negocio, las respuestas JSON y los códigos de estado HTTP sean los esperados, de forma independiente al Frontend.
   - *Herramienta:* Python (librería `requests`).

3. **Pruebas de Infraestructura y Despliegue:**
   - Comprueban que los servicios Docker estén vivos y corriendo con las políticas correctas (`unless-stopped`, volúmenes de persistencia).
   - *Herramienta:* Python (librería `subprocess` interactuando con Docker CLI).

---

## 4. Entorno de Pruebas
Las pruebas se ejecutarán en un entorno controlado y aislado (Localhost/QA), utilizando **Docker Compose** para garantizar la replicabilidad del entorno de producción.

- **Frontend:** Vue 3 / Vite PWA (Expuesto en el puerto 5173).
- **Backend:** Node.js / Express / Prisma ORM (Expuesto en el puerto 3000).
- **Base de Datos:** MySQL 8 (Expuesto en el puerto 3306).
- **Mecanismo de Limpieza:** Antes de cada suite de pruebas, se ejecutará el script `scripts/seed.js` para limpiar y pre-poblar la base de datos con un estado basal conocido.

---

## 5. Escenarios de Prueba Críticos

| ID | Módulo | Descripción del Escenario | Resultado Esperado |
|---|---|---|---|
| **CP-01** | Autenticación | Login con credenciales válidas e inválidas. | El sistema genera el JWT correctamente o devuelve error 401. |
| **CP-02** | Autor | Subir un nuevo artículo (PDF) a un evento público. | El archivo se guarda en servidor, el registro en DB se crea con estado "Pendiente". |
| **CP-03** | Editor | Asignar un artículo a un usuario con rol de Revisor. | El Revisor recibe la invitación. Se genera el registro de "Asignación". |
| **CP-04** | Seguridad (RBAC) | Intentar acceder a un artículo ajeno o a un menú de administrador siendo Autor. | El sistema (UI y API) deniega el acceso y devuelve un error 403 Forbidden. |
| **CP-05** | Doble Ciego | Un revisor abre un artículo asignado para evaluación. | La interfaz NO debe mostrar el nombre del Autor en ninguna parte del flujo. |
| **CP-06** | Conflicto Rol | El editor intenta asignar un artículo al mismo usuario que lo escribió. | El backend rechaza la operación por colisión de intereses (Error HTTP 409). |
| **CP-07** | Offline (PWA) | Desconectar red y recargar la aplicación en el navegador. | El Service Worker debe devolver la interfaz desde caché sin mostrar el "Dinosaurio" de Chrome. |

---

## 6. Criterios de Aceptación y Suspensión

- **Criterios de Aceptación (Éxito):**
  - El 100% de las pruebas End-to-End (E2E) descritas en la suite de Playwright finalizan con éxito.
  - Los scripts de integración de Python no reportan fallos de servidor (HTTP 500).
  - La base de datos mantiene su integridad referencial tras todos los flujos de prueba.

- **Criterios de Suspensión (Detención de Pruebas):**
  - La base de datos MySQL no logra inicializarse en Docker.
  - El sistema de autenticación central (JWT) falla, bloqueando los accesos.
  - Fallos críticos que provoquen que la página se quede en blanco de manera consistente en los pasos iniciales.

---

## 7. Herramientas y Tecnologías Utilizadas
- **Framework E2E:** Playwright Test.
- **Validación de API e Infraestructura:** Entorno virtual de Python 3, `requests` y `subprocess`.
- **Base de Datos de Prueba:** MySQL 8 vía Docker.
- **Generación de Reportes:** Reporte HTML nativo de Playwright y reportes HTML generados vía script de Python (`test_report.html`).
