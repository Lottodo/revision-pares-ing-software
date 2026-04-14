# Historial de Cambios (Post-Jeffrey Increment)

**Fecha:** Abril 2026

Partiendo del incremento "Avance_Jeffrey.md" (Migración a Mongo Atlas, Docker base y Autenticación), este documento consolida todas las mejoras, optimizaciones y funcionalidades críticas adheridas al proyecto en esta nueva iteración:

## 1. Diseño Minimalista y Profesional (UI/UX)
- Se erradicaron los degradados (*gradients*) que acaparaban mucho espacio y saturaban la vista con verde encendido para brindar un espacio sobrio.
- **Transición de color e identidad:** El sistema visual migró a un esquema `Flat y Outlined`, implementando el color acento "Verde Oscuro Corporativo" (`green-darken-4`).
- **Tipografía Externa:** Se importó e implementó globalmente en el archivo base de CSS la familia de fuentes `Inter` en sustitución a Roboto y Arial, priorizando la legibilidad (estándar Start-up y Silicon Valley).
- Se agregaron efectos sutiles como `shadow-sm` al flotar sobre partes activas (tarjetas, botones interactivos) para indicar enfoque sin usar 3D ni pesadez.

## 2. Refactorización de Convenciones e Importaciones
- Se corrigió la deuda técnica del nomenclador de archivos (Mezcla inconsistente de nombres). 
- **Modelos Backend**: Renombrados a estructura estricta `PascalCase` (`Articulo.js`, `Usuario.js`, `Evaluacion.js`, `AsignacionRevision.js`) y corregidas todas sus exportaciones en `models/index.js` y `server-poc.js`.
- **Componentes Vue**: Todos los componentes principales en la carpeta Frontend Views se refactorizaron al estándar recomendado `[Nombre]View.vue` y sus rutas y directivas se actualizaron concisamente.

## 3. Sistema de Roles y Permisos (Administrador, Editor, Revisor, Autor)
Se reestructuró completamente el modelo de permisos para reflejar un entorno de revisión por pares realista y coherente:
- **Nuevo rol `administrador`:** Se introdujo la figura del Administrador del sistema, que es el único capaz de otorgar y revocar roles a los usuarios. El Editor ya no tiene privilegios para gestionar roles, separando así las responsabilidades de manera profesional.
- La arquitectura en el esquema de MongoDB (`Usuario.js`) soporta el array `roles: [String]` con los valores válidos: `autor`, `revisor`, `editor` y `administrador`.
- Se creó el panel exclusivo `AdminDashboardView.vue` con checkboxes por usuario y botón "Aplicar" que persiste los cambios en la base de datos vía API REST.
- La barra de navegación (`App.vue`) y el router soportan la detección del nuevo rol, mostrando el botón "Admin" solo cuando corresponde.
- La lógica de redirección post-login prioriza: `administrador > editor > revisor > autor`.

## 4. Visor de PDF Integrado (Split Screen)
- El panel del Revisor (`ArticulosAsignadosView.vue`) ahora muestra el manuscrito PDF embebido a la izquierda y el formulario de evaluación a la derecha al presionar "Evaluar", eliminando la necesidad de descargar archivos manualmente.
- El panel del Editor (`PanelEditorView.vue`) incorpora un botón "Ver Manuscrito" que abre el PDF en un modal con selector de versión (V1, V2...).
- Se configuró el proxy de Vite (`vite.config.js`) para servir transparentemente los archivos estáticos de `/uploads` desde el backend.

## 5. Rúbricas Estructuradas de Evaluación
- El modelo `Evaluacion.js` fue ampliado con 4 métricas cuantitativas (escala 1-5): **Originalidad**, **Rigor Metodológico**, **Calidad de Redacción** y **Relevancia**.
- El modal de evaluación del Revisor reemplaza la antigua caja de texto plana por un cuestionario visual con componente `v-rating` (estrellas) para cada criterio, más el campo de observaciones textuales.
- El Editor puede consultar el desglose completo de cada evaluación mediante el botón "Ver Evaluaciones Detalladas", que muestra las estrellas otorgadas por cada revisor y sus comentarios.

## 6. Línea de Vida Cronológica (Audit Timeline)
- Se creó el modelo `HistorialArticulo.js` para registrar automáticamente cada evento significativo del ciclo de vida de un artículo (subida, asignación de revisores, dictámenes, decisiones editoriales, nuevas versiones).
- Todos los endpoints críticos del backend inyectan registros de historial automáticamente mediante la función helper `registrarHistorial()`.
- El autor puede consultar la cronología visual de cada manuscrito mediante el botón "Historial" en `EstadoArticulosView.vue`, utilizando el componente nativo `<v-timeline>` de Vuetify.

## 7. Versionamiento de Manuscritos (V1, V2...)
- El modelo `Articulo.js` ahora incluye un sub-esquema `versiones: [{ numero, url, fecha }]` que permite almacenar múltiples iteraciones del documento sin crear artículos nuevos.
- Cuando el Editor dictamina "Cambios Menores" o "Cambios Mayores", al autor le aparece un botón "Subir V2" (o V3, etc.) directamente en su tabla de manuscritos.
- El nuevo endpoint `POST /api/articulos/:id/versiones` gestiona la carga de la nueva versión, actualiza el `documentoUrl` principal al archivo más reciente, y regresa el artículo al estado `recibido` para reanudar el ciclo de revisión.
- El visor del Editor permite conmutar entre versiones mediante un dropdown.

## 8. Decisiones Editoriales Expandidas
- El panel del Editor ahora ofrece 4 opciones de decisión: **Aceptar**, **Rechazar**, **Cambios Menores** y **Cambios Mayores** (antes solo existían Aceptar/Rechazar).
- Las opciones de "Cambios" activan automáticamente el flujo de versionamiento, notificando al autor que debe subir una corrección.

## 9. Estabilización de DevOps y Contenedores (Docker)
- Se solucionó el error de resolución DNS entre contenedores (`ENOTFOUND backend`) creando una red bridge explícita (`app-net`) en `docker-compose.yml`.
- Se eliminó la dependencia obligatoria de MongoDB Atlas: el `docker-compose.yml` ahora levanta un MongoDB local (`mongo:7`), permitiendo desarrollo completamente offline.
- Se implementó **Auto-Seed** en el servidor: al arrancar, si la base de datos está vacía, crea automáticamente los usuarios de prueba sin necesidad de ejecutar `npm run seed` manualmente.
- Se eliminó el atributo obsoleto `version` del `docker-compose.yml`.

## 10. Corrección de Errores Críticos
- **Ruta de importación rota** en `models/index.js`: la ruta relativa a `config/mongodb.js` estaba mal (`./config/` en vez de `../config/`), causando crash al iniciar el backend.
- **Redirección post-login defectuosa** en `LoginView.vue`: usaba `userData.rol` (singular, inexistente) en vez del arreglo `userData.roles`, lo que hacía que todos los usuarios fueran redirigidos a "Subir Artículo" sin importar su rol.
- **Falta de `passwordHash`** en la ruta de registro (`routes/auth.js`): la creación de usuario no incluía el hash de la contraseña, haciendo imposible el registro.
- **Variable `rol` indefinida** en `auth.js` línea 69: referenciaba una variable que no existía, corregida a `roles`.
