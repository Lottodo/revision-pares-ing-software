<template>
  <v-container fluid class="pa-md-8 pa-4 max-width-container">
    <v-card class="elevation-3 w-100 rounded-xl overflow-hidden border-card">
      <v-toolbar color="white" flat class="border-b px-4">
        <v-toolbar-title class="text-grey-darken-4 font-weight-black text-h5">
          <v-icon start size="28" class="mr-2 text-green-darken-4">mdi-text-box-search-outline</v-icon>
          Panel de Evaluación (Revisor)
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pa-md-8 pa-6 bg-white">
        <p class="text-body-1 text-grey-darken-2 mb-8 font-weight-medium">
          Selecciona un manuscrito pendiente para leerlo detenidamente y emitir una evaluación justificada con rúbrica.
        </p>

        <v-alert v-if="mensajeError" type="error" variant="tonal" class="mb-4 rounded-lg font-weight-medium" density="compact">{{ mensajeError }}</v-alert>
        <v-alert v-if="mensajeExito" type="success" variant="tonal" class="mb-4 rounded-lg text-green-darken-4 font-weight-medium" density="compact">{{ mensajeExito }}</v-alert>

        <v-row v-if="cargando">
          <v-col cols="12" class="d-flex justify-center pa-10">
            <v-progress-circular indeterminate color="green-darken-3" size="64" width="4"></v-progress-circular>
          </v-col>
        </v-row>

        <div v-else class="border rounded-xl overflow-hidden">
          <v-data-table
            :headers="headers"
            :items="articulos"
            class="elevation-0 bg-transparent"
            hover
            density="comfortable"
          >
            <template v-slot:item.titulo="{ item }">
              <span class="font-weight-black text-grey-darken-4">{{ item.titulo }}</span>
            </template>
            <template v-slot:item.fechaAsignacion="{ item }">
              <span class="font-weight-bold text-grey-darken-1">{{ item.fechaAsignacion }}</span>
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
              <v-btn
                v-if="item.estado.toLowerCase() !== 'evaluado'"
                color="green-darken-3"
                size="small"
                variant="flat"
                class="text-white font-weight-bold rounded-pill shadow-sm px-4"
                @click="abrirModal(item)"
              >
                <v-icon start size="16">mdi-pencil-outline</v-icon>
                Evaluar
              </v-btn>
              <v-chip v-else color="grey-lighten-2" variant="flat" size="small" class="font-weight-bold text-grey-darken-2 cursor-not-allowed">
                Cerrado
              </v-chip>
            </template>

            <template #no-data>
              <div class="pa-8 d-flex flex-column align-center justify-center">
                <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-coffee-outline</v-icon>
                <div class="text-h6 text-grey-darken-2 font-weight-medium">No tienes manuscritos asignados pendientes.</div>
              </div>
            </template>
          </v-data-table>
        </div>
      </v-card-text>
    </v-card>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- Modal de Evaluación: Visor PDF + Rúbrica Estructurada -->
    <!-- ══════════════════════════════════════════════════════ -->
    <v-dialog v-model="mostrarModal" max-width="1200" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl overflow-hidden elevation-10 border-card">
        <v-toolbar color="white" flat class="border-b">
          <v-toolbar-title class="text-grey-darken-4 font-weight-black text-h6">
            Dictamen: {{ articuloActual?.titulo }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="grey-darken-2" @click="cerrarModal" :disabled="enviando"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-0">
          <v-row no-gutters>
            <!-- COLUMNA IZQUIERDA: Visor PDF -->
            <v-col cols="12" md="6" class="border-e">
              <div class="pa-4 bg-grey-lighten-5 border-b d-flex align-center">
                <v-icon class="mr-2" color="red-darken-2" size="22">mdi-file-pdf-box</v-icon>
                <span class="font-weight-bold text-grey-darken-3 text-body-2">Vista previa del manuscrito</span>
              </div>
              <div class="pdf-viewer-container">
                <iframe
                  v-if="articuloActual?.documentoUrl"
                  :src="articuloActual.documentoUrl"
                  class="pdf-iframe"
                  frameborder="0"
                ></iframe>
                <div v-else class="d-flex align-center justify-center pa-10" style="height: 100%;">
                  <div class="text-center">
                    <v-icon size="64" color="grey-lighten-2" class="mb-3">mdi-file-alert-outline</v-icon>
                    <p class="text-grey-darken-1 font-weight-medium">Documento no disponible</p>
                  </div>
                </div>
              </div>
            </v-col>

            <!-- COLUMNA DERECHA: Formulario de Evaluación con Rúbrica -->
            <v-col cols="12" md="6">
              <div class="pa-6 eval-form-scroll">
                <v-form @submit.prevent="enviarEvaluacion" id="eval-form">
                  <p class="text-body-2 font-weight-medium text-grey-darken-1 mb-5">
                    Por favor revisa detenidamente el manuscrito. Tu veredicto será confidencial hasta que el editor consolide todos los reportes.
                  </p>

                  <!-- ── Rúbrica Estructurada ── -->
                  <div class="bg-grey-lighten-4 pa-4 rounded-lg border mb-5">
                    <p class="text-caption text-uppercase font-weight-bold text-grey-darken-2 mb-3 tracking-wide">Rúbrica de Evaluación</p>

                    <div class="mb-3">
                      <div class="d-flex align-center justify-space-between">
                        <span class="text-body-2 font-weight-bold text-grey-darken-3">Originalidad</span>
                        <v-rating v-model="evaluacion.originalidad" length="5" size="24" color="amber-darken-2" active-color="amber-darken-2" hover density="compact"></v-rating>
                      </div>
                    </div>
                    <v-divider class="mb-3"></v-divider>

                    <div class="mb-3">
                      <div class="d-flex align-center justify-space-between">
                        <span class="text-body-2 font-weight-bold text-grey-darken-3">Rigor Metodológico</span>
                        <v-rating v-model="evaluacion.rigorMetodologico" length="5" size="24" color="amber-darken-2" active-color="amber-darken-2" hover density="compact"></v-rating>
                      </div>
                    </div>
                    <v-divider class="mb-3"></v-divider>

                    <div class="mb-3">
                      <div class="d-flex align-center justify-space-between">
                        <span class="text-body-2 font-weight-bold text-grey-darken-3">Calidad de Redacción</span>
                        <v-rating v-model="evaluacion.calidadRedaccion" length="5" size="24" color="amber-darken-2" active-color="amber-darken-2" hover density="compact"></v-rating>
                      </div>
                    </div>
                    <v-divider class="mb-3"></v-divider>

                    <div>
                      <div class="d-flex align-center justify-space-between">
                        <span class="text-body-2 font-weight-bold text-grey-darken-3">Relevancia</span>
                        <v-rating v-model="evaluacion.relevancia" length="5" size="24" color="amber-darken-2" active-color="amber-darken-2" hover density="compact"></v-rating>
                      </div>
                    </div>
                  </div>

                  <v-select
                    v-model="evaluacion.veredicto"
                    :items="opcionesVeredicto"
                    label="Veredicto Sugerido"
                    variant="outlined"
                    class="mb-4 font-weight-medium"
                    bg-color="grey-lighten-4"
                    density="comfortable"
                    required
                  ></v-select>

                  <v-textarea
                    v-model.trim="evaluacion.comentarios"
                    label="Argumentos y Observaciones"
                    placeholder="Justifica tu decisión o describe las correcciones recomendadas..."
                    variant="outlined"
                    rows="4"
                    bg-color="grey-lighten-4"
                    class="font-weight-medium"
                    required
                  ></v-textarea>
                </v-form>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 d-flex gap-2 bg-grey-lighten-5 border-t">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-2"
            variant="text"
            class="font-weight-bold rounded-pill px-6"
            @click="cerrarModal"
            :disabled="enviando"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="green-darken-3"
            variant="flat"
            class="font-weight-bold shadow-sm text-white rounded-pill px-6"
            type="submit"
            form="eval-form"
            :loading="enviando"
          >
            Someter Dictamen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';

const articulos = ref([]);
const cargando = ref(true);
const enviando = ref(false);
const mensajeError = ref('');
const mensajeExito = ref('');
const mostrarModal = ref(false);
const articuloActual = ref(null);

const evaluacion = reactive({
  veredicto: '',
  comentarios: '',
  originalidad: 3,
  rigorMetodologico: 3,
  calidadRedaccion: 3,
  relevancia: 3,
});

const opcionesVeredicto = [
  'Aceptar',
  'Cambios Menores',
  'Cambios Mayores',
  'Rechazar'
];

const headers = [
  { title: 'Manuscrito', key: 'titulo', align: 'start' },
  { title: 'Fecha de Ingreso', key: 'fechaAsignacion', align: 'center' },
  { title: 'Estado', key: 'estado', align: 'center' },
  { title: 'Resolución', key: 'acciones', align: 'center', sortable: false }
];

const getColorEstado = (estado) => {
  switch (estado?.toLowerCase()) {
    case 'pendiente': return 'grey-darken-1';
    case 'en progreso': return 'blue-darken-2';
    case 'evaluado': return 'green-darken-3';
    case 'cancelado': return 'red-darken-3';
    default: return 'black';
  }
};

const cargarArticulos = async () => {
    cargando.value = true;
    mensajeError.value = '';
    
    try {
        const token = localStorage.getItem('token');
        if(!token) throw new Error("Sin token");

        const res = await fetch('/api/articulos-asignados', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            articulos.value = await res.json();
        } else {
            mensajeError.value = "Error al recuperar panel.";
        }
    } catch(e) {
        mensajeError.value = "Imposible conectar con el servidor.";
    } finally {
        cargando.value = false;
    }
};

const abrirModal = (articulo) => {
  articuloActual.value = articulo;
  evaluacion.veredicto = '';
  evaluacion.comentarios = '';
  evaluacion.originalidad = 3;
  evaluacion.rigorMetodologico = 3;
  evaluacion.calidadRedaccion = 3;
  evaluacion.relevancia = 3;
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
  articuloActual.value = null;
};

const enviarEvaluacion = async () => {
  if (!evaluacion.veredicto || !evaluacion.comentarios.trim()) {
    alert("Revisa que los campos no estén vacíos");
    return;
  }

  enviando.value = true;
  mensajeError.value = '';
  mensajeExito.value = '';

  try {
     const token = localStorage.getItem('token');
     const res = await fetch('/api/evaluar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            articuloId: articuloActual.value.id || articuloActual.value._id,
            veredicto: evaluacion.veredicto,
            comentarios: evaluacion.comentarios,
            originalidad: evaluacion.originalidad,
            rigorMetodologico: evaluacion.rigorMetodologico,
            calidadRedaccion: evaluacion.calidadRedaccion,
            relevancia: evaluacion.relevancia,
        })
     });

     if (res.ok) {
         mensajeExito.value = "Tu dictamen fue remitido al Editor con éxito.";
         cerrarModal();
         await cargarArticulos();
     } else {
         const data = await res.json();
         mensajeError.value = data.error || "Fallo en el servidor al clasificar evaluación.";
         cerrarModal();
     }
  } catch(e) {
     mensajeError.value = "Fallo de conexión enviando evaluación.";
     cerrarModal();
  } finally {
      enviando.value = false;
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

.tracking-wide {
  letter-spacing: 0.08em;
}

.pdf-viewer-container {
  height: 550px;
  background: #e0e0e0;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.eval-form-scroll {
  max-height: 600px;
  overflow-y: auto;
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
.cursor-not-allowed {
  cursor: not-allowed !important;
}
</style>