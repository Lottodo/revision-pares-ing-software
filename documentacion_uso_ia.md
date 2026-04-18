# Documentación de Uso de IA en el Proyecto

**Herramienta Empleada:** Antigravity (Google DeepMind)
**Propósito:** Asistencia de programación de nivel arquitectónico, rediseño de interfaces, implementación de funcionalidades avanzadas y DevOps asistido.

El uso de Inteligencia Artificial (IA) en este proyecto no se limitó a la simple generación de código aislado (como lo haría un autocompletado en un IDE), sino que la IA actuó como un ingeniero de software en pareja ("Pair Programmer") con agente autónomo, trabajando directamente sobre el árbol de archivos, la terminal de Docker y el repositorio Git del estudiante.

### Casos de Uso Específicos de la IA en este Sprint:

1. **Refactorización de Arquitectura Compleja (Prueba y Error):**
   - La IA fue instruida para fracturar la arquitectura monolítica de `server-poc.js` hacia un entorno de microservicios, comunicados mediante un bróker de mensajería (RabbitMQ).
   - La IA reescribió `docker-compose.yml`, orquestó los puertos y expuso un API Gateway.
   - *Toma de Decisiones:* Cuando se instruyó dar marcha atrás por complejidad, la IA revirtió dinámicamente los contenedores y saneó la infraestructura en tiempo real.

2. **Diagnóstico y DevOps en Tiempo Real:**
   - La IA manipuló activamente los contenedores atrapados (zombies) causados por caídas de red del usuario (`TLS handshake timeout`).
   - Diagnosticó mediante subcomandos (`docker ps`, `docker logs`) puertos bloqueados y purgó manualmente las imágenes colgadas (`docker rm -f`).
   - Configuró redes bridge explícitas de Docker para resolver problemas de DNS interno entre contenedores en Docker Desktop para Windows.

3. **Modernización de UI/UX Automática:**
   - En base a directivas puramente abstractas como *"Quiero un diseño que no parezca hecho por IA, sino clean y corporativo con acentos verdes oscuros"*, el agente leyó el código CSS viejo de Vue.
   - Editó de manera quirúrgica los componentes (`.vue`), quitando gradientes de colores anticuados, aplicando variables de diseño plano (*flat*) e inyectando Google Fonts (`Inter`).
   - Reparó inmediatamente un error de compilación de Vite ("Duplicate attribute") causado durante la reescritura.

4. **Homogeneización del Repositorio:**
   - Realizó de forma autónoma una purga de convenciones mixtas, actualizando todos los nombres de los esquemas de bases de datos y vistas de VueJS hacia `PascalCase`.

5. **Diseño e Implementación de Funcionalidades Avanzadas de Revisión por Pares:**
   - La IA propuso 4 opciones técnicas de mejora (Visor PDF, Rúbricas, Timeline, Versionamiento) y, tras aprobación del estudiante, implementó todas de corrido.
   - **Visor de PDF Integrado**: Diseñó un modal Split Screen que embebe el manuscrito PDF a la izquierda y el formulario de evaluación a la derecha, eliminando la descarga manual de archivos. Configuró el proxy de Vite para servir archivos estáticos `/uploads` desde el backend.
   - **Rúbricas Estructuradas**: Amplió el esquema de base de datos `Evaluacion.js` con 4 criterios cuantitativos (1-5) y reescribió el formulario del revisor con componentes `v-rating` de Vuetify.
   - **Línea de Vida Cronológica (Audit Trail)**: Creó un modelo nuevo (`HistorialArticulo.js`), inyectó registros automáticos en todos los endpoints críticos, e implementó una visualización con `v-timeline` de Vuetify.
   - **Versionamiento de Manuscritos**: Modificó el modelo `Articulo.js` para soportar un arreglo de versiones, creó el endpoint `POST /api/articulos/:id/versiones`, y habilitó al autor a re-subir correcciones cuando el Editor dicta "Cambios Menores/Mayores".

6. **Reestructuración del Sistema de Roles y Permisos:**
   - La IA analizó que el esquema donde el Editor gestionaba roles no era coherente con un sistema real. Propuso y ejecutó la separación de responsabilidades creando el rol `administrador`.
   - Creó el panel exclusivo `AdminDashboardView.vue`, migró la lógica del gestor de roles fuera del Editor, modificó los endpoints para exigir el rol `administrador` en operaciones de gestión de usuarios, y eliminó la auto-promoción automática de roles que existía al asignar revisores.

7. **Gestión de Control de Versiones (Git) y Despliegue:**
   - La IA ejecutó operaciones avanzadas de Git: inicializó el repositorio local, configuró el remote, resolvió conflictos de historial con `git fetch` + `git reset`, y realizó múltiples commits semánticos y pushes al branch `feature/yael-armenta` del repositorio GitHub del equipo.
   - Configuró el `.env` y la cadena de conexión para apuntar a la base de datos MongoDB Atlas del equipo (`RevisionPares`) y ejecutó el script de seed para poblar datos de prueba en la nube.

8. **Debugging y Corrección Autónoma de Errores:**
   - **Ruta de importación rota** (`models/index.js`): La IA detectó que la ruta relativa a `config/mongodb.js` estaba mal construida y la corrigió.
   - **Redirección post-login defectuosa** (`LoginView.vue`): Identificó que el código usaba `userData.rol` (singular, inexistente) en vez de `userData.roles` (arreglo), causando que el administrador fuera redirigido a la página equivocada.
   - **Registro de usuario incompleto** (`routes/auth.js`): Detectó una variable indefinida (`rol`) y la ausencia del campo `passwordHash` en la creación de usuarios.
   - **Auto-Seed en Docker**: Implementó una función que detecta si la BD está vacía al arrancar y crea automáticamente los usuarios de prueba, eliminando la necesidad de correr el seed manualmente.

### Conclusión
La IA asumió el rol de desarrollador full-stack avanzado y SysAdmin, automatizando tareas DevOps (Docker, Git, MongoDB Atlas) arduas, diseñando e implementando funcionalidades completas de la lógica de negocio (visor de PDFs, rúbricas, audit trail, versionamiento), y depurando errores de manera autónoma. Esto permitió enfocar el rigor académico del estudiante en dictar la visión, el diseño del sistema y la toma de decisiones arquitecturales al agente, en lugar del tecleo manual masivo.
