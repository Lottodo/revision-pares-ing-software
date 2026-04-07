<template>
  <div class="contenedor-editor">
    <h2>🗂️ Panel del Editor</h2>
    <p class="instrucciones">
      Asigna al menos 2 revisores a cada artículo. La decisión final solo estará disponible cuando
      todos los revisores hayan completado su revisión.
    </p>

    <div v-if="cargando" class="cargando">Cargando datos...</div>

    <div v-else class="layout-dos-columnas">

      <!-- ════════════════════════════════════
           COLUMNA IZQUIERDA: Artículos
      ════════════════════════════════════ -->
      <div class="columna-articulos">
        <h3 class="subtitulo-seccion">Artículos activos</h3>

        <div
          v-for="articulo in articulos"
          :key="articulo.id"
          class="tarjeta-articulo"
          :class="{ seleccionado: articuloSeleccionado?.id === articulo.id }"
          @click="seleccionarArticulo(articulo)"
        >
          <!-- Encabezado: título + estado -->
          <div class="tarjeta-encabezado">
            <span class="tarjeta-titulo">{{ articulo.titulo }}</span>
            <span :class="['etiqueta-estado', claseEstado(articulo.estado)]">
              {{ articulo.estado }}
            </span>
          </div>

          <div class="tarjeta-area">{{ articulo.area }}</div>

          <!-- Chips de revisores con estado individual -->
          <div class="tarjeta-revisores">
            <span v-if="articulo.revisores.length === 0" class="sin-revisores">
              Sin revisores asignados
            </span>
            <span
              v-for="rev in articulo.revisores"
              :key="rev.id"
              :class="['chip-revisor', rev.completado ? 'chip-ok' : 'chip-pendiente']"
            >
              {{ nombreRevisor(rev.id) }}
              <span class="chip-icono">{{ rev.completado ? '✔' : '⏳' }}</span>
              <button
                class="btn-quitar"
                :disabled="articuloDecidido(articulo)"
                @click.stop="quitarRevisor(articulo, rev.id)"
              >×</button>
            </span>
          </div>

          <!-- Indicador de asignados -->
          <div class="indicador-asignados">
            <span v-if="articulo.revisores.length >= 2" class="asignados-ok">
              Asignados: {{ articulo.revisores.length }} ✔
            </span>
            <span v-else class="asignados-pendiente">
              Asignados: {{ articulo.revisores.length }} (mínimo: 2)
            </span>
          </div>

          <!-- ── Zona de decisión final ── -->
          <div class="zona-decision" @click.stop>

            <!-- Estado: artículo ya decidido -->
            <template v-if="articuloDecidido(articulo)">
              <span :class="['decision-tomada', articulo.estado === 'Aceptado' ? 'decision-aceptado' : 'decision-rechazado']">
                Decisión registrada: <strong>{{ articulo.estado }}</strong>
              </span>
            </template>

            <!-- Estado: menos de 2 revisores -->
            <template v-else-if="articulo.revisores.length < 2">
              <span class="mensaje-guia advertencia">
                ⚠ Se requieren al menos 2 revisores
              </span>
              <div class="botones-decision">
                <button class="btn-aceptar" disabled>✅ Aceptar</button>
                <button class="btn-rechazar" disabled>❌ Rechazar</button>
              </div>
            </template>

            <!-- Estado: revisores asignados pero no todos completaron -->
            <template v-else-if="!puedeDecidir(articulo)">
              <span class="mensaje-guia bloqueado">
                🔒 {{ conteoRevisiones(articulo) }} — esperando a {{ revisoresPendientes(articulo) }}
              </span>
              <div class="botones-decision">
                <button class="btn-aceptar" disabled>✅ Aceptar</button>
                <button class="btn-rechazar" disabled>❌ Rechazar</button>
              </div>
            </template>

            <!-- Estado: listo para decidir -->
            <template v-else>
              <span class="mensaje-guia listo">
                ✅ Todas las revisiones completadas. Puedes tomar una decisión.
              </span>
              <div class="botones-decision">
                <button class="btn-aceptar" @click="decidirArticulo(articulo, 'Aceptado')">✅ Aceptar</button>
                <button class="btn-rechazar" @click="decidirArticulo(articulo, 'Rechazado')">❌ Rechazar</button>
              </div>
            </template>

          </div>
          <!-- ── Fin zona de decisión ── -->

        </div>
      </div>

      <!-- ════════════════════════════════════
           COLUMNA DERECHA: Panel de asignación
      ════════════════════════════════════ -->
      <div class="columna-revisores">
        <h3 class="subtitulo-seccion">Revisores disponibles</h3>

        <div v-if="!articuloSeleccionado" class="sin-seleccion">
          Selecciona un artículo para gestionar sus revisores.
        </div>

        <div v-else>
          <p class="articulo-activo">
            Gestionando: <strong>{{ articuloSeleccionado.titulo }}</strong>
          </p>

          <!-- Barra de progreso de revisiones -->
          <div v-if="articuloSeleccionado.revisores.length > 0" class="barra-progreso-wrap">
            <span class="barra-label">
              Revisiones: {{ revisionesCompletadas(articuloSeleccionado) }} de {{ articuloSeleccionado.revisores.length }}
            </span>
            <div class="barra-progreso">
              <div
                v-for="rev in articuloSeleccionado.revisores"
                :key="rev.id"
                :class="['barra-segmento', rev.completado ? 'segmento-ok' : 'segmento-pendiente']"
              ></div>
            </div>
          </div>

          <p v-if="mensajeError" class="error">{{ mensajeError }}</p>
          <p v-if="mensajeExito" class="exito">{{ mensajeExito }}</p>

          <!-- Bloqueo si el artículo ya fue decidido -->
          <p v-if="articuloDecidido(articuloSeleccionado)" class="aviso-bloqueado">
            🔒 Este artículo ya tiene una decisión final y no puede modificarse.
          </p>

          <table v-else class="tabla-revisores">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Revisiones activas</th>
                <th>Estado aquí</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="revisor in revisores"
                :key="revisor.id"
                :class="{ 'fila-asignado': estaAsignado(articuloSeleccionado, revisor.id) }"
              >
                <td>{{ revisor.nombre }}</td>
                <td>{{ revisor.especialidad }}</td>
                <td>
                  <span :class="['etiqueta-carga', claseCarga(revisor.carga)]">
                    {{ revisor.carga }}
                  </span>
                </td>
                <!-- Estado del revisor en este artículo -->
                <td>
                  <template v-if="estaAsignado(articuloSeleccionado, revisor.id)">
                    <span v-if="estadoRevision(articuloSeleccionado, revisor.id)" class="estado-rev-ok">✔ Completa</span>
                    <button v-else class="btn-marcar" @click="marcarCompleta(articuloSeleccionado, revisor.id)">
                      Marcar completa
                    </button>
                  </template>
                  <span v-else class="estado-rev-na">—</span>
                </td>
                <td>
                  <button
                    v-if="!estaAsignado(articuloSeleccionado, revisor.id)"
                    class="btn-asignar"
                    @click="asignarRevisor(revisor)"
                  >
                    Asignar
                  </button>
                  <button
                    v-else
                    class="btn-quitar-tabla"
                    @click="quitarRevisor(articuloSeleccionado, revisor.id)"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// ─── Estado global ───────────────────────────────────────
const articulos            = ref([]);
const revisores            = ref([]);
const cargando             = ref(true);
const articuloSeleccionado = ref(null);
const mensajeError         = ref('');
const mensajeExito         = ref('');

// ─── Helpers de consulta ──────────────────────────────────

const nombreRevisor = (id) => {
  const r = revisores.value.find(rv => rv.id === id);
  return r ? r.nombre.split(' ').slice(-1)[0] : '—';
};

const estaAsignado = (articulo, revisorId) =>
  articulo.revisores.some(r => r.id === revisorId);

const estadoRevision = (articulo, revisorId) =>
  articulo.revisores.find(r => r.id === revisorId)?.completado ?? false;

const revisionesCompletadas = (articulo) =>
  articulo.revisores.filter(r => r.completado).length;

// Condición principal: ≥2 revisores Y todos completaron
const puedeDecidir = (articulo) =>
  articulo.revisores.length >= 2 &&
  articulo.revisores.every(r => r.completado);

const articuloDecidido = (articulo) =>
  articulo.estado === 'Aceptado' || articulo.estado === 'Rechazado';

const conteoRevisiones = (articulo) => {
  const total    = articulo.revisores.length;
  const completas = revisionesCompletadas(articulo);
  return `${completas} de ${total} revisiones completadas`;
};

const revisoresPendientes = (articulo) =>
  articulo.revisores
    .filter(r => !r.completado)
    .map(r => nombreRevisor(r.id))
    .join(', ');

// ─── Clases CSS dinámicas ─────────────────────────────────

const claseEstado = (estado) => ({
  'Pendiente':   'estado-pendiente',
  'En Revisión': 'estado-revision',
  'Aceptado':    'estado-aceptado',
  'Rechazado':   'estado-rechazado',
}[estado] ?? 'estado-default');

const claseCarga = (carga) => {
  if (carga <= 1) return 'carga-baja';
  if (carga <= 3) return 'carga-media';
  return 'carga-alta';
};

// ─── Acciones ─────────────────────────────────────────────

const seleccionarArticulo = (articulo) => {
  if (articuloDecidido(articulo)) return;
  articuloSeleccionado.value = articulo;
  mensajeError.value = '';
  mensajeExito.value = '';
};

const asignarRevisor = (revisor) => {
  const art = articuloSeleccionado.value;
  if (!art) return;

  art.revisores.push({ id: revisor.id, completado: false });
  revisor.carga++;
  if (art.revisores.length >= 2) art.estado = 'En Revisión';

  // TODO: POST /api/asignaciones { articuloId: art.id, revisorId: revisor.id }

  mensajeError.value = '';
  mensajeExito.value = `${revisor.nombre} asignado correctamente.`;
};

const quitarRevisor = (articulo, revisorId) => {
  const revisor = revisores.value.find(r => r.id === revisorId);
  if (revisor) revisor.carga = Math.max(0, revisor.carga - 1);

  articulo.revisores = articulo.revisores.filter(r => r.id !== revisorId);
  if (articulo.revisores.length < 2) articulo.estado = 'Pendiente';

  // TODO: DELETE /api/asignaciones { articuloId: articulo.id, revisorId }

  mensajeError.value = '';
  mensajeExito.value = '';
};

// Marca la revisión de un revisor como completada (flujo sin backend)
const marcarCompleta = (articulo, revisorId) => {
  const rev = articulo.revisores.find(r => r.id === revisorId);
  if (rev) rev.completado = true;

  // TODO: PATCH /api/revisiones { articuloId: articulo.id, revisorId, completado: true }
};

// Decisión final: solo si puedeDecidir()
const decidirArticulo = (articulo, decision) => {
  if (!puedeDecidir(articulo)) return;
  articulo.estado = decision;

  // TODO: PATCH /api/articulos/:id/decision { estado: decision }
};

// ─── Carga inicial ────────────────────────────────────────

onMounted(async () => {
  try {
    const token = localStorage.getItem('jwt_token');
    const [resArts, resRevs] = await Promise.all([
      fetch('http://localhost:3000/api/articulos', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('http://localhost:3000/api/revisores',  { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    if (resArts.ok && resRevs.ok) {
      articulos.value = await resArts.json();
      revisores.value = await resRevs.json();
    } else throw new Error('Backend no listo');

  } catch {
    console.warn('Backend no disponible. Usando datos de prueba.');

    articulos.value = [
      { id: 1, titulo: 'Red neuronal para detección de anomalías en tráfico', area: 'IA / ML',       estado: 'Pendiente',   revisores: [] },
      { id: 2, titulo: 'Protocolo seguro de IoT basado en blockchain',        area: 'Seguridad',     estado: 'Pendiente',   revisores: [] },
      { id: 3, titulo: 'Framework de pruebas para microservicios reactivos',  area: 'Ing. Software', estado: 'En Revisión', revisores: [
        { id: 2, completado: true  },
        { id: 4, completado: false },
      ]},
    ];

    revisores.value = [
      { id: 1, nombre: 'Dra. Ana Flores',   especialidad: 'IA / ML',        carga: 1 },
      { id: 2, nombre: 'Dr. Roberto Luna',  especialidad: 'Bases de Datos', carga: 2 },
      { id: 3, nombre: 'Mtra. Sofía Reyes', especialidad: 'IA / ML',        carga: 0 },
      { id: 4, nombre: 'Dr. Carlos Ibáñez', especialidad: 'Seguridad',      carga: 1 },
      { id: 5, nombre: 'Dra. Laura Chávez', especialidad: 'Ing. Software',  carga: 2 },
      { id: 6, nombre: 'Dr. Miguel Cruz',   especialidad: 'Redes',          carga: 4 },
    ];
  } finally {
    cargando.value = false;
  }
});
</script>

<style scoped>
.contenedor-editor {
  max-width: 1100px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  color: #000;
}

.instrucciones {
  color: #333;
  margin-bottom: 20px;
}

.cargando {
  color: #000;
  font-weight: bold;
  margin-top: 20px;
}

/* ── Layout ── */
.layout-dos-columnas {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.columna-articulos,
.columna-revisores {
  flex: 1;
  min-width: 0;
}

.subtitulo-seccion {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #2c3e50;
  border-bottom: 2px solid #2c3e50;
  padding-bottom: 6px;
}

/* ── Tarjeta de artículo ── */
.tarjeta-articulo {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px 15px;
  margin-bottom: 10px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  transition: border-color 0.2s;
}
.tarjeta-articulo:hover       { border-color: #2c3e50; }
.tarjeta-articulo.seleccionado { border: 2px solid #007bff; }

.tarjeta-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 6px;
}

.tarjeta-titulo {
  font-weight: bold;
  font-size: 0.9rem;
  color: #000;
  line-height: 1.3;
}

.tarjeta-area {
  font-size: 0.8rem;
  color: #555;
  margin-bottom: 8px;
}

/* ── Chips de revisores ── */
.tarjeta-revisores {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.sin-revisores {
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
}

.chip-revisor {
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #333;
}

.chip-ok        { background-color: #d4edda; }
.chip-pendiente { background-color: #e9ecef; }
.chip-icono     { font-size: 0.75rem; }

.btn-quitar {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  line-height: 1;
}
.btn-quitar:hover    { color: #dc3545; }
.btn-quitar:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Indicador de asignados ── */
.indicador-asignados  { font-size: 0.8rem; margin-top: 4px; }
.asignados-ok         { color: #28a745; font-weight: bold; }
.asignados-pendiente  { color: #f39c12; font-weight: bold; }

/* ── Zona de decisión ── */
.zona-decision {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.mensaje-guia {
  display: block;
  font-size: 0.78rem;
  margin-bottom: 8px;
  font-style: italic;
}
.mensaje-guia.advertencia { color: #e67e22; }
.mensaje-guia.bloqueado   { color: #6c757d; }
.mensaje-guia.listo       { color: #28a745; font-style: normal; font-weight: bold; }

.botones-decision {
  display: flex;
  gap: 8px;
}

.btn-aceptar {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 5px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: background-color 0.2s;
}
.btn-aceptar:hover    { background-color: #1e7e34; }
.btn-aceptar:disabled { background-color: #a8d5b5; cursor: not-allowed; }

.btn-rechazar {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: background-color 0.2s;
}
.btn-rechazar:hover    { background-color: #c82333; }
.btn-rechazar:disabled { background-color: #f0a8ae; cursor: not-allowed; }

.decision-tomada    { font-size: 0.82rem; font-style: italic; }
.decision-aceptado  { color: #28a745; }
.decision-rechazado { color: #dc3545; }

/* ── Columna derecha ── */
.sin-seleccion {
  color: #888;
  font-style: italic;
  margin-top: 20px;
}

.articulo-activo {
  font-size: 0.88rem;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.4;
}

/* ── Barra de progreso ── */
.barra-progreso-wrap { margin-bottom: 14px; }

.barra-label {
  font-size: 0.8rem;
  color: #555;
  display: block;
  margin-bottom: 5px;
}

.barra-progreso {
  display: flex;
  gap: 4px;
  height: 8px;
}

.barra-segmento       { flex: 1; border-radius: 4px; }
.segmento-ok          { background-color: #28a745; }
.segmento-pendiente   { background-color: #dee2e6; }

.aviso-bloqueado {
  font-size: 0.88rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 10px 14px;
  margin-top: 8px;
}

/* ── Tabla de revisores ── */
.tabla-revisores {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.tabla-revisores th,
.tabla-revisores td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  color: #000;
  font-size: 0.88rem;
}

.tabla-revisores th {
  background-color: #f4f4f4;
  font-weight: bold;
}

.fila-asignado { background-color: #f0fff4; }

/* ── Etiquetas de estado ── */
.etiqueta-estado {
  padding: 4px 9px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: bold;
  color: white;
  white-space: nowrap;
}
.estado-pendiente { background-color: #6c757d; }
.estado-revision  { background-color: #f39c12; }
.estado-aceptado  { background-color: #28a745; }
.estado-rechazado { background-color: #dc3545; }
.estado-default   { background-color: #000; }

/* ── Etiquetas de carga ── */
.etiqueta-carga {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: bold;
  color: white;
}
.carga-baja  { background-color: #28a745; }
.carga-media { background-color: #f39c12; }
.carga-alta  { background-color: #dc3545; }

/* ── Estado de revisión en tabla ── */
.estado-rev-ok { font-size: 0.82rem; color: #28a745; font-weight: bold; }
.estado-rev-na { font-size: 0.82rem; color: #aaa; }

.btn-marcar {
  background-color: #fff;
  color: #555;
  border: 1px solid #ccc;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.78rem;
  transition: background-color 0.2s;
}
.btn-marcar:hover { background-color: #f0fff4; border-color: #28a745; color: #28a745; }

/* ── Botones de tabla ── */
.btn-asignar {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: background-color 0.3s;
}
.btn-asignar:hover { background-color: #0056b3; }

.btn-quitar-tabla {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: background-color 0.3s;
}
.btn-quitar-tabla:hover { background-color: #c82333; }

.error { color: #dc3545; font-weight: bold; font-size: 0.88rem; margin-bottom: 10px; }
.exito { color: #28a745; font-weight: bold; font-size: 0.88rem; margin-bottom: 10px; }
</style>