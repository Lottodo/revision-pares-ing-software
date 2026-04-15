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

## 3. Gestor de Multiroles (Sistema Híbrido)
Se expandió radicalmente el modelo de asignación de seguridad que limitaba a un usuario a un solo rol general. 
- La arquitectura en el esquema de MongoDB (`Usuario.js`) mutó el atributo `rol: String` a un array `roles: [String]`.
- Se programó un **"Gestor de Roles"** manual incrustado en el `PanelEditorView.vue`, el cual le permite al Editor en turno marcar o revocar los roles de cada usuario existente del sistema de manera dinámica (mediante botones Checkbox incrustados conectados por API rest) haciendo posible que el `autor1` pueda funcionar a su vez como Revisor.
- La barra de navegación de `App.vue` soporta leer los permisos híbridos del array JWT para asegurar el portal globalmente.

## 4. Estabilización de DevOps y Contenedores (Docker)
- **Mitigación de la Caída de Monolitos:** Se solucionó el riesgo nativo donde conectar a MongoDB (Tardanza de Booting) causaba que la Aplicación Node.JS (*Backend*) colapsara de inmediato antes de que el servidor pudiera atender peticiones.
- Eliminados los fantasmas de contenedores experimentales tras pruebas de Arquitectura Orientada a Servicios.
- Manejo limpio de red, puertos de comunicación `5173` y `3000` operando localmente vía Docker Network sin exponer host colindante.

## 5. Corrección Silenciosa de Errores Críticos
- Durante una de las intervenciones del template de Login de Vite, se produjo un `Internal Server Error` severo por un atributo VUE repetido (`prepend-inner-icon`) en el mismo bloque `v-text-field`, rompiendo todo el Frontend en el DOM. Fue parchado con rapidez devolviendo el portal a un estado verde estable.
