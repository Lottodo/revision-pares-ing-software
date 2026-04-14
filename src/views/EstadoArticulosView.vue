<template>
  <v-container fluid class="pa-md-8 pa-4 max-width-container">
    <v-card class="elevation-3 w-100 rounded-xl overflow-hidden border-card">
      <v-toolbar color="white" flat class="border-b px-4">
        <v-toolbar-title class="text-grey-darken-4 font-weight-black text-h5">
          <v-icon start size="28" class="mr-2 text-green-darken-4">mdi-text-box-check-outline</v-icon>
          Estado de tus Manuscritos
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pa-md-8 pa-6 bg-white">
        <p class="text-body-1 text-grey-darken-2 mb-8 font-weight-medium">
          Rastrea el progreso de tus postulaciones. Haz clic en un artículo para ver su línea de vida cronológica.
        </p>

        <v-row v-if="cargando">
          <v-col cols="12" class="d-flex justify-center pa-10">
            <v-progress-circular indeterminate color="green-darken-3" size="64" width="4"></v-progress-circular>
          </v-col>
        </v-row>

        <v-slide-y-transition>
          <v-alert v-if="mensajeError" type="error" variant="tonal" class="mb-4 rounded-lg font-weight-medium" density="compact">
            {{ mensajeError }}
          </v-alert>
        </v-slide-y-transition>

        <div class="border rounded-xl overflow-hidden">
          <v-data-table
            v-if="!cargando && !mensajeError"
            :headers="encabezados"
            :items="articulos"
            class="elevation-0 bg-transparent font-weight-medium"
            hover
            density="comfortable"
          >
            <template v-slot:item.fecha="{ item }">
              <span class="text-grey-darken-2 font-weight-bold">{{ item.fecha }}</span>
            </template>
            
            <template v-slot:item.titulo="{ item }">
              <span class="text-grey-darken-4 font-weight-black">{{ item.titulo }}</span>
            </template>

            <template v-slot:item.estado="{ item }">
              <v-chip
                :color="getColorEstado(item.estado)"
                variant="flat"
                class="font-weight-bold text-white shadow-sm"
                size="small"
              >
                {{ item.estado }}
              </v-chip>
            </template>

            <template v-slot:item.acciones="{ item }">
              <div class="d-flex gap-2">
                <v-btn
                  size="small"
                  variant="tonal"
                  color="blue-darken-2"
                  class="font-weight-bold rounded-pill px-3"
                  @click="verTimeline(item)"
                >
                  <v-icon start size="16">mdi-timeline-clock-outline</v-icon>
                  Historial
                </v-btn>
                <v-btn
                  v-if="item.estado === 'Cambios Menores' || item.estado === 'Cambios Mayores'"
                  size="small"
                  variant="flat"
                  color="orange-darken-2"
                  class="font-weight-bold text-white rounded-pill px-3"
                  @click="abrirResubir(item)"
                >
                  <v-icon start size="16">mdi-file-upload-outline</v-icon>
                  Subir V{{ (item.versiones?.length || 1) + 1 }}
                </v-btn>
              </div>
            </template>
            
            <template #no-data>
              <div class="pa-8 d-flex flex-column align-center justify-center">
                <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-file-hidden</v-icon>
                <div class="text-h6 text-grey-darken-2 font-weight-medium">No has postulado ningún artículo aún.</div>
              </div>
            </template>
          </v-data-table>
        </div>
      </v-card-text>
    </v-card>

    <!-- ══════════ Dialog: Timeline / Historial ══════════ -->
    <v-dialog v-model="mostrarTimeline" max-width="650" transition="dialog-bottom-transition">
      <v-card class="rounded-xl overflow-hidden elevation-10 border-card">
        <v-toolbar color="white" flat class="border-b">
          <v-toolbar-title class="text-grey-darken-4 font-weight-black text-h6">
            <v-icon start color="blue-darken-2" class="mr-1">mdi-timeline-clock-outline</v-icon>
            Línea de Vida: {{ articuloTimeline?.titulo }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="grey-darken-2" @click="mostrarTimeline = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <v-row v-if="cargandoTimeline">
            <v-col cols="12" class="d-flex justify-center pa-6">
              <v-progress-circular indeterminate color="blue-darken-2" size="40" width="3"></v-progress-circular>
            </v-col>
          </v-row>

          <div v-else-if="historial.length === 0" class="text-center pa-6">
            <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-history</v-icon>
            <p class="text-grey-darken-1 font-weight-medium">Sin eventos registrados aún.</p>
          </div>

          <v-timeline v-else density="compact" side="end" line-color="blue-lighten-4">
            <v-timeline-item
              v-for="(evento, idx) in historial"
              :key="idx"
              :dot-color="getTimelineDotColor(evento.evento)"
              size="small"
            >
              <div class="mb-1">
                <span class="font-weight-bold text-grey-darken-4 text-body-2">{{ evento.evento }}</span>
              </div>
              <div v-if="evento.detalle" class="text-caption text-grey-darken-1 mb-1">{{ evento.detalle }}</div>
              <div class="text-caption text-grey-lighten-1 font-weight-medium">
                {{ formatFecha(evento.fecha) }}
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ══════════ Dialog: Re-subir versión ══════════ -->
    <v-dialog v-model="mostrarResubir" max-width="550" persistent>
      <v-card class="rounded-xl overflow-hidden elevation-10 border-card">
        <v-toolbar color="white" flat class="border-b">
          <v-toolbar-title class="text-grey-darken-4 font-weight-black text-h6">
            Subir versión corregida
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="grey-darken-2" @click="mostrarResubir = false" :disabled="subiendoVersion"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <v-alert type="info" variant="tonal" class="mb-4 rounded-lg font-weight-medium" density="compact">
            Tu manuscrito "<strong>{{ articuloResubir?.titulo }}</strong>" requiere correcciones. Sube la nueva versión aquí.
          </v-alert>
          <v-file-input
            v-model="archivoNuevaVersion"
            label="Archivo Corregido (PDF, Máx 5MB)"
            accept="application/pdf"
            variant="outlined"
            density="comfortable"
            show-size
            prepend-icon=""
            prepend-inner-icon="mdi-file-pdf-box"
            class="mb-2"
          ></v-file-input>
          <v-alert v-if="errorResubir" type="error" variant="tonal" class="mb-2 rounded-lg font-weight-medium" density="compact">{{ errorResubir }}</v-alert>
          <v-alert v-if="exitoResubir" type="success" variant="tonal" class="mb-2 rounded-lg font-weight-medium" density="compact">{{ exitoResubir }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-2" variant="text" class="font-weight-bold rounded-pill px-6" @click="mostrarResubir = false" :disabled="subiendoVersion">Cancelar</v-btn>
          <v-btn color="orange-darken-2" variant="flat" class="font-weight-bold text-white rounded-pill px-6" :loading="subiendoVersion" @click="subirNuevaVersion">Subir Corrección</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const articulos = ref([]);
const cargando = ref(true);
const mensajeError = ref('');

// Timeline
const mostrarTimeline = ref(false);
const cargandoTimeline = ref(false);
const articuloTimeline = ref(null);
const historial = ref([]);

// Re-subir versión
const mostrarResubir = ref(false);
const articuloResubir = ref(null);
const archivoNuevaVersion = ref(null);
const subiendoVersion = ref(false);
const errorResubir = ref('');
const exitoResubir = ref('');

const encabezados = [
  { title: 'Fecha de Envio', align: 'start', key: 'fecha' },
  { title: 'Título', align: 'start', key: 'titulo' },
  { title: 'Estado Actual', align: 'start', key: 'estado' },
  { title: 'Acciones', align: 'center', key: 'acciones', sortable: false },
];

const getColorEstado = (estado) => {
  switch (estado?.toLowerCase()) {
    case 'recibido': return 'grey-lighten-1';
    case 'pendiente': return 'grey-darken-1';
    case 'en revisión': return 'blue-darken-2';
    case 'cambios menores': return 'teal-darken-1';
    case 'cambios mayores': return 'purple-darken-2';
    case 'aceptado': return 'green-darken-3';
    case 'rechazado': return 'red-darken-3';
    default: return 'black';
  }
};

const getTimelineDotColor = (evento) => {
  if (evento.includes('recibido') || evento.includes('Recibido')) return 'blue-darken-2';
  if (evento.includes('asignado') || evento.includes('Asignado')) return 'teal-darken-1';
  if (evento.includes('Dictamen') || evento.includes('emitido')) return 'orange-darken-2';
  if (evento.includes('Aceptado')) return 'green-darken-3';
  if (evento.includes('Rechazado')) return 'red-darken-3';
  if (evento.includes('versión') || evento.includes('Versión')) return 'purple-darken-2';
  return 'grey-darken-1';
};

const formatFecha = (fechaStr) => {
  try {
    return new Date(fechaStr).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return fechaStr; }
};

const cargarArticulos = async () => {
  cargando.value = true;
  mensajeError.value = '';
  try {
    const token = localStorage.getItem('token');
    if (!token) { mensajeError.value = 'Sesión expirada.'; cargando.value = false; return; }
    const respuesta = await fetch('/api/mis-articulos', { headers: { 'Authorization': `Bearer ${token}` } });
    if (respuesta.ok) {
      articulos.value = await respuesta.json();
    } else {
      mensajeError.value = "Error al cargar la información del servidor.";
    }
  } catch (error) {
    console.error("Error cargando artículos:", error);
    mensajeError.value = "Hubo un error de conexión con la base de datos.";
  } finally {
    cargando.value = false;
  }
};

const verTimeline = async (articulo) => {
  articuloTimeline.value = articulo;
  historial.value = [];
  mostrarTimeline.value = true;
  cargandoTimeline.value = true;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/articulos/${articulo.id}/historial`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      historial.value = await res.json();
    }
  } catch (e) {
    console.error('Error cargando historial:', e);
  } finally {
    cargandoTimeline.value = false;
  }
};

const abrirResubir = (articulo) => {
  articuloResubir.value = articulo;
  archivoNuevaVersion.value = null;
  errorResubir.value = '';
  exitoResubir.value = '';
  mostrarResubir.value = true;
};

const subirNuevaVersion = async () => {
  errorResubir.value = '';
  exitoResubir.value = '';
  const archivo = Array.isArray(archivoNuevaVersion.value) ? archivoNuevaVersion.value[0] : archivoNuevaVersion.value;

  if (!archivo) { errorResubir.value = 'Selecciona un archivo PDF.'; return; }
  if (archivo.type !== 'application/pdf') { errorResubir.value = 'Solo se aceptan PDFs.'; return; }
  if (archivo.size > 5242880) { errorResubir.value = 'Máximo 5MB.'; return; }

  subiendoVersion.value = true;
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('documento', archivo);

    const res = await fetch(`/api/articulos/${articuloResubir.value.id}/versiones`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      exitoResubir.value = data.mensaje || '¡Versión subida con éxito!';
      await cargarArticulos();
      setTimeout(() => { mostrarResubir.value = false; }, 1500);
    } else {
      errorResubir.value = data.error || 'Error al subir la versión.';
    }
  } catch (e) {
    errorResubir.value = 'Fallo de conexión.';
  } finally {
    subiendoVersion.value = false;
  }
};

onMounted(() => {
  cargarArticulos();
});
</script>

<style scoped>
.border-card {
  border: 1px solid rgba(0,0,0,0.06);
}

.shadow-sm {
  box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
}

:deep(.v-data-table__th) {
  text-transform: uppercase;
  font-size: 0.70rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.05em;
  color: #78909c !important;
  background-color: transparent !important;
  border-bottom: 2px solid #eceff1 !important;
}
:deep(.v-data-table__tr) {
  transition: background-color 0.2s ease;
}
:deep(.v-data-table__tr:hover) {
  background-color: #f8fafc !important;
}
</style>