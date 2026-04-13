<template>
  <v-container fluid class="pa-md-8 pa-4 max-width-container">
    <v-card class="elevation-3 w-100 rounded-xl overflow-hidden border-card">
      <v-toolbar color="transparent" flat class="bg-gradient-header px-4">
        <v-toolbar-title class="text-white font-weight-black text-h5">
          <v-icon start size="28" class="mr-2">mdi-text-box-check-outline</v-icon>
          Estado de tus Manuscritos
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pa-md-8 pa-6">
        <p class="text-body-1 text-grey-darken-2 mb-8 font-weight-medium">
          Rastrea el progreso de tus postulaciones. Nuestro staff revisa cada manuscrito bajo la estricta política de doble ciego.
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
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const articulos = ref([]);
const cargando = ref(true);
const mensajeError = ref('');

const encabezados = [
  { title: 'Fecha de Envio', align: 'start', key: 'fecha' },
  { title: 'Título', align: 'start', key: 'titulo' },
  { title: 'Estado Actual', align: 'start', key: 'estado' },
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

onMounted(async () => {
  cargando.value = true;
  mensajeError.value = '';
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      mensajeError.value = 'Sesión expirada. Por favor, inicia sesión de nuevo.';
      cargando.value = false;
      return;
    }

    const respuesta = await fetch('/api/mis-articulos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (respuesta.ok) {
      const data = await respuesta.json();
      articulos.value = data;
    } else {
      mensajeError.value = "Error al cargar la información del servidor.";
    }
  } catch (error) {
    console.error("Error cargando artículos:", error);
    mensajeError.value = "Hubo un error de conexión con la base de datos.";
  } finally {
    cargando.value = false;
  }
});
</script>

<style scoped>
.bg-gradient-header {
  background: linear-gradient(135deg, #0f3e2b 0%, #1a5c3a 100%);
}

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