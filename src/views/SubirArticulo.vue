<template>
  <v-container fluid class="pa-md-8 pa-4 d-flex justify-center flex-grow-1 align-center max-width-container">
    <v-card class="elevation-4 w-100 rounded-xl overflow-hidden border-card" max-width="700">
      <v-toolbar color="transparent" flat class="bg-gradient-header px-4">
        <v-toolbar-title class="text-white font-weight-black text-h5">
          <v-icon start size="28" class="mr-2">mdi-cloud-upload-outline</v-icon>
          Subir Manuscrito
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pa-md-10 pa-6">
        <p class="text-body-1 text-grey-darken-2 mb-8 font-weight-medium">
          Diligencia el formulario de postulación. Asegúrate de que el documento adjunto no contenga firmas ni datos incrustados que vulneren el ciego doble.
        </p>

        <v-form @submit.prevent="enviarArticulo" id="upload-form">
          <v-text-field
            v-model.trim="titulo"
            label="Título del Artículo"
            placeholder="Ej. El impacto de redes bayesianas..."
            variant="outlined"
            density="comfortable"
            class="mb-4 text-body-1"
            bg-color="grey-lighten-4"
            required
            hide-details="auto"
          ></v-text-field>

          <v-textarea
            v-model.trim="resumen"
            label="Resumen (Abstract)"
            placeholder="Introduce los preceptos y metodología clave..."
            variant="outlined"
            density="comfortable"
            rows="5"
            class="mb-4 text-body-1"
            bg-color="grey-lighten-4"
            required
            hide-details="auto"
          ></v-textarea>

          <v-file-input
            v-model="archivoPdf"
            label="Archivo del Manuscrito (Solo PDF, Máx 5MB)"
            accept="application/pdf"
            variant="outlined"
            density="comfortable"
            show-size
            bg-color="white"
            prepend-icon=""
            prepend-inner-icon="mdi-file-pdf-box"
            class="mb-2 text-body-1"
            :error-messages="mensajeError"
            @change="mensajeError = ''"
            required
          ></v-file-input>

          <!-- Alertas animadas -->
          <v-slide-y-transition>
            <div v-if="mensajeError" class="mt-4">
              <v-alert type="error" variant="tonal" class="rounded-lg font-weight-medium text-body-2" density="compact">
                {{ mensajeError }}
              </v-alert>
            </div>
          </v-slide-y-transition>

          <v-slide-y-transition>
            <div v-if="mensajeExito" class="mt-4">
              <v-alert type="success" variant="tonal" class="rounded-lg font-weight-medium text-green-darken-4 text-body-2" density="compact">
                {{ mensajeExito }}
              </v-alert>
            </div>
          </v-slide-y-transition>

          <v-btn
            type="submit"
            color="green-darken-3"
            class="font-weight-black mt-8 text-white rounded-pill px-8"
            size="x-large"
            block
            :loading="cargando"
            elevation="2"
          >
            Enviar Postulación
            <v-icon end size="20" class="ml-2">mdi-send</v-icon>
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';

const titulo = ref('');
const resumen = ref('');
const archivoPdf = ref(null); // Will hold the File object or array of files via Vuetify
const mensajeError = ref('');
const mensajeExito = ref('');
const cargando = ref(false);

const enviarArticulo = async () => {
  mensajeError.value = '';
  mensajeExito.value = '';

  // Vuetify v-file-input stores files in an array or directly if single.
  const archivo = Array.isArray(archivoPdf.value) ? archivoPdf.value[0] : archivoPdf.value;

  if (!archivo || !titulo.value || !resumen.value) {
    mensajeError.value = "Por favor completa todos los campos y adjunta un archivo.";
    return;
  }

  // Validación 1: Que sea PDF
  if (archivo.type !== 'application/pdf') {
    mensajeError.value = 'El archivo debe ser un PDF.';
    return;
  }
  
  // Validación 2: Tamaño menor a 5MB
  if (archivo.size > 5242880) {
    mensajeError.value = 'El archivo es muy pesado. Máximo 5MB.';
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    mensajeError.value = 'Sesión inválida o expirada. Por favor, inicia sesión de nuevo.';
    return;
  }

  cargando.value = true;

  try {
    const formData = new FormData();
    formData.append('titulo', titulo.value.trim());
    formData.append('resumen', resumen.value.trim());
    formData.append('documento', archivo);

    // Utilizamos la ruta relativa aprovechando el proxy configurado en vite.config.js
    const respuesta = await fetch('/api/articulos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const isJson = respuesta.headers.get('content-type')?.includes('application/json');
    let data = null;
    
    if (isJson) {
        data = await respuesta.json();
    }

    if (respuesta.ok) {
      mensajeExito.value = '¡Artículo enviado con éxito para su revisión!';
      titulo.value = '';
      resumen.value = '';
      archivoPdf.value = null;
    } else {
      mensajeError.value = data?.error || 'Error del servidor al procesar el archivo.';
    }
  } catch (error) {
    console.error("Error al enviar artículo:", error);
    mensajeError.value = 'No se pudo conectar con el servidor o el proxy falló.';
  } finally {
    cargando.value = false;
  }
};
</script>