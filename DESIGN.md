# Propuesta de Diseño — Sistema PeerReview UABC FIM

## Visión General

Rediseño profesional de la interfaz del Sistema de Revisión por Pares, orientado a una experiencia limpia, moderna y funcional para el contexto académico de la UABC Facultad de Ingeniería Mexicali.

---

## Paleta de Colores

| Nombre | Hex | Uso |
|---|---|---|
| Verde UABC | `#1a5c3a` | Headers, botones primarios, acentos |
| Verde Claro | `#2d8a5e` | Gradientes, hover states |
| Verde Suave | `#e8f5e9` | Fondos de secciones, badges de éxito |
| Gris Oscuro | `#1f2937` | Texto principal |
| Gris Medio | `#6b7280` | Texto secundario, placeholders |
| Gris Claro | `#f3f4f6` | Fondos de cards y secciones |
| Blanco | `#ffffff` | Fondo base, cards |
| Rojo Error | `#dc2626` | Mensajes de error, estados rechazados |
| Amarillo Warning | `#f59e0b` | Revisiones pendientes, cambios menores |
| Azul Info | `#3b82f6` | Estados en progreso |

---

## Tipografía

- **Fuente principal**: `Inter` (Google Fonts) — moderna, legible, profesional
- **Fallback**: `system-ui, -apple-system, sans-serif`
- **Escala**:
  - h1: 1.75rem / 700
  - h2: 1.35rem / 600
  - h3: 1.1rem / 600
  - body: 0.95rem / 400
  - small: 0.8rem / 400

---

## Componentes Propuestos

### 1. Layout Principal (AppLayout)

```
┌──────────────────────────────────────────────────┐
│  🎓 PeerReview              [Nav Links]  [Perfil]│
├──────────────────────────────────────────────────┤
│  Sidebar (solo escritorio)  │  Contenido         │
│  ┌──────────────────┐       │                    │
│  │ 📤 Subir Artículo│       │  ┌──────────────┐  │
│  │ 📊 Ver Estado    │       │  │  Card/Vista  │  │
│  │ 📋 Revisiones    │       │  │  principal   │  │
│  │ 🗂️ Panel Editor  │       │  │              │  │
│  └──────────────────┘       │  └──────────────┘  │
│                             │                    │
└──────────────────────────────────────────────────┘
```

- **Sidebar colapsable** en escritorio, hamburger en móvil
- El sidebar muestra solo las opciones por rol del usuario
- Indicador visual del link activo (borde izquierdo verde)
- Avatar del usuario + nombre en la esquina superior derecha

### 2. Página de Login (ya implementada)

- Fondo con gradiente verde institucional
- Card centrada con sombra prominente
- Header con branding UABC FIM
- Campos con iconos inline
- Validación en tiempo real
- Spinner de carga

### 3. Dashboard por Rol

#### Dashboard Autor
```
┌─────────────────────────────────────────────┐
│  👋 Bienvenido, [nombre]                    │
├─────────────┬───────────┬───────────────────┤
│  📄 Total   │  ✅ Acep. │  ⏳ Pendientes    │
│     12      │     3     │       5           │
├─────────────┴───────────┴───────────────────┤
│  Mis Artículos Recientes                    │
│  ┌────────────────────────────────────────┐ │
│  │ Título          │ Estado    │ Fecha    │ │
│  │ Artículo IA...  │ 🟢 Acept │ 08/04/26│ │
│  │ Análisis de...  │ 🟡 Rev.  │ 05/04/26│ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Dashboard Revisor
- Tarjetas de artículos asignados con estado visual
- Badges de prioridad/urgencia
- Acceso rápido al formulario de evaluación

#### Dashboard Editor
- Vista de gestión: todos los artículos del sistema
- Asignación de revisores con autocomplete
- Estadísticas con gráficos simples (contadores, barras)

### 4. Cards de Artículo

```css
/* Estilo propuesto */
.article-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 1.25rem;
  transition: box-shadow 0.2s, transform 0.15s;
}
.article-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
```

- Badge de estado con color según el valor (verde=aceptado, amarillo=revisión, rojo=rechazado)
- Fecha y autor en texto secundario
- Botones de acción en la esquina inferior derecha

### 5. Formulario de Evaluación

- Selector visual de veredicto (botones tipo radio, no dropdown)
- Textarea con contador de caracteres
- Preview del artículo en panel lateral (o modal)
- Confirmación antes de enviar

### 6. Badges de Estado

| Estado | Color | Badge |
|---|---|---|
| Recibido | `#6b7280` (gris) | Fondo gris claro, texto gris |
| En Revisión | `#3b82f6` (azul) | Fondo azul claro, texto azul |
| Cambios Menores | `#f59e0b` (amarillo) | Fondo amarillo claro, texto naranja |
| Cambios Mayores | `#f97316` (naranja) | Fondo naranja claro, texto naranja oscuro |
| Aceptado | `#22c55e` (verde) | Fondo verde claro, texto verde |
| Rechazado | `#ef4444` (rojo) | Fondo rojo claro, texto rojo |

---

## Responsive

| Breakpoint | Diseño |
|---|---|
| `< 640px` | Móvil: sidebar como drawer, cards en columna |
| `640px – 1024px` | Tablet: sidebar colapsada, grid de 2 columnas |
| `> 1024px` | Escritorio: sidebar abierta, grid de 3 columnas |

---

## Animaciones y Transiciones

- **Transición de ruta**: fade de 200ms entre vistas
- **Cards**: `transform: translateY(-2px)` en hover
- **Botones**: `transform: translateY(-1px)` + aumento de box-shadow
- **Modales**: fade in + scale desde 0.95
- **Loading states**: spinners animados + skeleton loaders para tablas
- **Notificaciones toast**: slide in desde arriba con auto-dismiss a 4s

---

## Estructura de Archivos Propuesta

```
src/
├── assets/
│   └── styles/
│       ├── variables.css     ← tokens de diseño (colores, espaciado, tipografía)
│       ├── base.css          ← reset + estilos globales
│       └── utilities.css     ← clases helper (.text-center, .mt-1, etc)
├── components/
│   ├── layout/
│   │   ├── AppSidebar.vue    ← sidebar con links por rol
│   │   ├── AppHeader.vue     ← header con perfil y logout
│   │   └── AppLayout.vue     ← wrapper con sidebar + header + slot
│   ├── ui/
│   │   ├── BaseButton.vue    ← botón reutilizable (variants: primary, danger, ghost)
│   │   ├── BaseCard.vue      ← card con sombra y hover
│   │   ├── BaseBadge.vue     ← badge de estado con color dinámico
│   │   ├── BaseInput.vue     ← input con label, icono y error
│   │   ├── BaseModal.vue     ← modal con overlay y transición
│   │   └── ToastNotification.vue
│   └── features/
│       ├── ArticleCard.vue   ← tarjeta de artículo con badge
│       ├── EvaluationForm.vue← formulario de evaluación
│       └── StatsCounter.vue  ← contador con icono y label
├── composables/
│   ├── useAuth.js            ← (ya existe)
│   └── useToast.js           ← manejo de notificaciones
├── views/
│   ├── LoginView.vue         ← (ya existe)
│   ├── DashboardAutor.vue
│   ├── DashboardRevisor.vue
│   └── DashboardEditor.vue
└── router/
    └── index.js              ← (ya existe)
```

---

## Prioridad de Implementación

1. **Fase 1** — Design system base (variables.css, BaseButton, BaseCard, BaseBadge, BaseInput)
2. **Fase 2** — Layout (AppLayout, AppSidebar, AppHeader) + transiciones de ruta
3. **Fase 3** — Refactor vistas existentes para usar los nuevos componentes
4. **Fase 4** — Dashboards diferenciados por rol
5. **Fase 5** — Animaciones, toasts, skeleton loaders, pulido final

---

## Notas Técnicas

- No se agrega ninguna dependencia CSS externa (todo vanilla CSS)
- Las variables de diseño se centralizan en `variables.css` usando CSS custom properties
- Los componentes UI son genéricos y reutilizables (no tienen lógica de negocio)
- El layout se adapta automáticamente al rol del usuario (sidebar muestra solo lo permitido)
