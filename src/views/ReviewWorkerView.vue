<template>
  <v-container fluid class="pa-0 fill-height" style="background: #f4f6f8">
    <v-row no-gutters class="fill-height">
      <!-- PANEL IZQUIERDO: VISOR DE PDF -->
      <v-col cols="12" md="8" class="fill-height d-flex flex-column border-e">
        <v-toolbar color="primary" density="compact">
          <v-btn icon="mdi-arrow-left" variant="text" @click="router.push({ name: 'reviewer' })"></v-btn>
          <v-toolbar-title class="text-body-1 font-weight-bold">
            {{ assignment?.paper?.title || 'Cargando documento...' }}
          </v-toolbar-title>
        </v-toolbar>
        
        <div class="flex-grow-1 position-relative bg-grey-darken-3">
          <iframe 
            v-if="pdfBlobUrl"
            :src="pdfBlobUrl"
            width="100%" 
            height="100%" 
            style="border: none;"
          ></iframe>
          <div v-else class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
        </div>
      </v-col>

      <!-- PANEL DERECHO: NOTAS OFFLINE -->
      <v-col cols="12" md="4" class="fill-height d-flex flex-column bg-surface">
        <v-toolbar color="surface" density="compact" class="border-b">
          <v-icon color="warning" class="mr-2 ml-4">mdi-notebook-edit</v-icon>
          <v-toolbar-title class="text-body-1 font-weight-bold">Mis Notas de Revisión</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-chip size="small" :color="isOnline ? 'success' : 'error'" variant="tonal" class="mr-4">
            <v-icon start size="16">{{ isOnline ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
            {{ isOnline ? 'Online' : 'Offline' }}
          </v-chip>
        </v-toolbar>

        <div class="pa-4 flex-grow-1 overflow-y-auto">
          <v-alert type="info" variant="tonal" class="mb-4" density="compact" text="Tus notas se guardan automáticamente en tu dispositivo. Puedes trabajar sin internet."></v-alert>
          
          <v-textarea
            v-model="notes"
            label="Escribe tus apuntes, observaciones y retroalimentación aquí..."
            variant="outlined"
            auto-grow
            hide-details
            rows="15"
            bg-color="white"
            @update:model-value="saveNotesLocally"
          ></v-textarea>

          <div class="d-flex align-center mt-2 text-caption text-medium-emphasis">
            <v-icon size="16" class="mr-1">mdi-content-save-outline</v-icon>
            <span v-if="lastSaved">Último guardado: {{ lastSaved }}</span>
            <span v-else>No hay notas guardadas</span>
          </div>
        </div>

        <div class="pa-4 border-t bg-grey-lighten-4">
          <v-btn 
            color="primary" 
            block 
            prepend-icon="mdi-send-check" 
            size="large"
            rounded="lg"
            @click="openRubric"
          >
            Emitir Dictamen Final
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Dialog para la Rúbrica Final (Reutiliza tu ReviewFormDialog) -->
    <ReviewFormDialog 
      v-model="showRubric" 
      :assignment="assignment" 
      :prefilledNotes="notes"
      @submitted="onReviewSubmitted" 
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReviewsStore } from '../stores/reviews.js';
import { papersApi } from '../api/index.js';
import ReviewFormDialog from '../components/ReviewFormDialog.vue';

const route = useRoute();
const router = useRouter();
const store = useReviewsStore();

const assignmentId = parseInt(route.params.id);
const assignment = ref(null);
const pdfBlobUrl = ref('');

const notes = ref('');
const lastSaved = ref('');
const isOnline = ref(navigator.onLine);
const showRubric = ref(false);

const checkOnlineStatus = () => { isOnline.value = navigator.onLine; };

const loadLocalNotes = () => {
  const saved = localStorage.getItem(`offline_notes_${assignmentId}`);
  if (saved) {
    notes.value = saved;
    lastSaved.value = 'Recuperado de sesión anterior';
  }
};

const saveNotesLocally = () => {
  localStorage.setItem(`offline_notes_${assignmentId}`, notes.value);
  lastSaved.value = new Date().toLocaleTimeString();
};

const openRubric = () => {
  showRubric.value = true;
};

const onReviewSubmitted = () => {
  localStorage.removeItem(`offline_notes_${assignmentId}`);
  router.push({ name: 'reviewer' });
};

onMounted(async () => {
  window.addEventListener('online', checkOnlineStatus);
  window.addEventListener('offline', checkOnlineStatus);

  // Cargar asignación actual
  if (!store.assignments.length) {
    await store.fetchMyAssignments();
  }
  assignment.value = store.assignments.find(a => a.id === assignmentId);
  
  if (!assignment.value) {
    router.push({ name: 'reviewer' });
    return;
  }

  // Descargar PDF de forma segura
  if (assignment.value.paper?.documentUrl) {
    try {
      pdfBlobUrl.value = await papersApi.downloadPdf(assignment.value.paper.documentUrl);
    } catch (e) {
      console.error('Error al cargar PDF:', e);
    }
  }

  loadLocalNotes();
});

onUnmounted(() => {
  window.removeEventListener('online', checkOnlineStatus);
  window.removeEventListener('offline', checkOnlineStatus);
  if (pdfBlobUrl.value) {
    window.URL.revokeObjectURL(pdfBlobUrl.value);
  }
});
</script>
