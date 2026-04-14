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
          Selecciona un manuscrito pendiente para leerlo detenidamente y omitir una evaluación justificada.
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

    <!-- Modal de Evaluación (Vuetify Native) -->
    <v-dialog v-model="mostrarModal" max-width="650" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl overflow-hidden elevation-10 border-card">
        <v-toolbar color="white" flat class="border-b">
          <v-toolbar-title class="text-grey-darken-4 font-weight-black text-h6">
            Dictamen: {{ articuloActual?.titulo }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="grey-darken-2" @click="cerrarModal" :disabled="enviando"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-6">
          <v-form @submit.prevent="enviarEvaluacion" id="eval-form">
            <p class="text-body-2 font-weight-medium text-grey-darken-1 mb-4">
              Por favor revisa detenidamente el manuscrito. Tu veredicto será confidencial hasta que el editor consolide todos los reportes.
            </p>

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
              rows="5"
              bg-color="grey-lighten-4"
              class="font-weight-medium"
              required
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 d-flex gap-2 bg-grey-lighten-5">
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
  comentarios: ''
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
            comentarios: evaluacion.comentarios
        })
     });

     if (res.ok) {
         mensajeExito.value = "Tu dictamen fue remitido al Editor con éxito.";
         cerrarModal();
         await cargarArticulos(); // Recargar panel tras evaluar
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