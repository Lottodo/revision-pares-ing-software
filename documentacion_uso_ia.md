# Documentación de Uso de IA en el Proyecto

**Herramienta Empleada:** Antigravity (Google DeepMind)
**Propósito:** Asistencia de programación de nivel arquitectónico, rediseño de interfaces y DevOps asistido.

El uso de Inteligencia Artificial (IA) en este proyecto no se limitó a la simple generación de código aislado (como lo haría un autocompletado en un IDE), sino que la IA actuó como un ingeniero de software en pareja ("Pair Programmer") con agente autónomo, trabajando directamente sobre el árbol de archivos y la terminal de Docker del estudiante.

### Casos de Uso Específicos de la IA en este Sprint:

1. **Refactorización de Arquitectura Compleja (Prueba y Error):**
   - La IA fue instruida para fracturar la arquitectura monolítica de `server-poc.js` hacia un entorno de microservicios, comunicados mediante un bróker de mensajería (RabbitMQ).
   - La IA reescribió `docker-compose.yml`, orquestó los puertos y expuso un API Gateway.
   - *Toma de Decisiones:* Cuando se instruyó dar marcha atrás por complejidad, la IA revirtió dinámicamente los contenedores y saneó la infraestructura en tiempo real.

2. **Diagnóstico y DevOps en Tiempo Real:**
   - La IA manipuló activamente los contenedores atrapados (zombies) causados por caídas de red del usuario (`TLS handshake timeout`).
   - Diagnosticó mediante subcomandos (`docker ps`, `docker logs`) puertos bloqueados y purgó manualmente las imágenes colgadas (`docker rm -f`).

3. **Modernización de UI/UX Automática:**
   - En base a directivas puramente abstractas como *"Quiero un diseño que no parezca hecho por IA, sino clean y corporativo con acentos verdes oscuros"*, el agente leyó el código CSS viejo de Vue.
   - Editó de manera quirúrgica los componentes (`.vue`), quitando gradientes de colores anticuados, aplicando variables de diseño plano (*flat*) e inyectando Google Fonts (`Inter`).
   - Reparó inmediatamente un error de compilación de Vite ("Duplicate attribute") causado durante la reescritura.

4. **Homogeneización del Repositorio:**
   - Realizó de forma autónoma una purga de convenciones mixtas, actualizando todos los nombres de los esquemas de bases de datos y vistas de VueJS hacia `PascalCase`.

### Conclusión
La IA asumió el rol de desarrollador de frontend avanzado y SysAdmin, automatizando tareas devOps (Docker) arduas y agilizando las pruebas y refactorización, lo que permitió enfocar el rigor académico en dictar la lógica y diseño del sistema al agente en lugar del tecleo manual masivo.
