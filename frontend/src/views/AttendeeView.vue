<template>
  <v-container class="pa-6" max-width="800">
    <div class="text-center mb-8">
      <v-avatar color="grey-lighten-3" size="80" class="mb-4 elevation-2">
        <v-icon size="40" color="primary">mdi-ticket-account</v-icon>
      </v-avatar>
      <h1 class="text-h4 font-weight-bold">Bienvenido a {{ auth.activeEvent?.event?.name }}</h1>
      <p class="text-subtitle-1 text-medium-emphasis mt-2">
        Actualmente eres un <strong>Asistente</strong> (Espectador) de este congreso.
      </p>
    </div>

    <v-card class="rounded-xl pa-6 mb-6 text-center elevation-2" color="primary" variant="tonal">
      <h2 class="text-h5 font-weight-bold mb-2">¿Quieres enviar un artículo?</h2>
      <p class="mb-6 opacity-80">
        Para poder enviar trabajos y participar activamente, necesitas solicitar el rol de <strong>Autor</strong>. El comité organizador revisará tu solicitud.
      </p>
      <v-btn
        color="primary"
        size="large"
        rounded="pill"
        elevation="2"
        prepend-icon="mdi-hand-back-right"
        @click="showRequestDialog = true"
        :loading="loading"
        :disabled="hasPendingRequest"
      >
        {{ hasPendingRequest ? 'Solicitud en revisión...' : 'Solicitar ser Autor' }}
      </v-btn>
    </v-card>

    <v-card class="rounded-xl pa-0 elevation-1">
      <v-card-title class="pa-4 bg-grey-lighten-4">
        <v-icon start>mdi-file-document-multiple</v-icon> Artículos Públicos
      </v-card-title>
      <v-card-text class="pa-8 text-center text-medium-emphasis">
        <v-icon size="48" class="mb-2 opacity-50">mdi-lock-outline</v-icon>
        <p>Los artículos en revisión son confidenciales.</p>
        <p class="text-caption">Solo podrás ver los artículos aquí una vez que sean aceptados y publicados oficialmente por el congreso.</p>
      </v-card-text>
    </v-card>

    <!-- Dialog para enviar solicitud -->
    <v-dialog v-model="showRequestDialog" max-width="500">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 d-flex justify-space-between align-center">
          Solicitar Permiso de Autor
          <v-btn icon="mdi-close" variant="text" @click="showRequestDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="pt-2">
          <p class="mb-4">Escribe un breve mensaje para el comité organizador (opcional).</p>
          <v-textarea
            v-model="requestMessage"
            label="Mensaje para el comité"
            variant="outlined"
            rows="3"
            placeholder="Hola, soy investigador de la universidad..."
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showRequestDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="px-6" @click="sendRequest" :loading="loading">
            Enviar Solicitud
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { eventsApi } from '../api/index.js';

const auth = useAuthStore();
const showRequestDialog = ref(false);
const requestMessage = ref('');
const loading = ref(false);
const hasPendingRequest = ref(false);

const checkPendingStatus = async () => {
  // En una app real, guardaríamos este estado en el backend
  // Por ahora asumimos que si no hay error de "ya existe", se envía bien.
};

const sendRequest = async () => {
  loading.value = true;
  try {
    await eventsApi.requestAccess(auth.eventId, requestMessage.value);
    hasPendingRequest.value = true;
    showRequestDialog.value = false;
    alert('Tu solicitud ha sido enviada al comité organizador.');
  } catch (e) {
    alert(e.response?.data?.error || 'Error al enviar solicitud.');
  } finally {
    loading.value = false;
  }
};

onMounted(checkPendingStatus);
</script>
