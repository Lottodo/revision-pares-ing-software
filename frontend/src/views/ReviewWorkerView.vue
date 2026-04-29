<template>
  <v-container fluid class="pa-0 fill-height" style="background: #f4f6f8">
    <v-row no-gutters class="fill-height">
      <v-col cols="12" md="8" class="fill-height d-flex flex-column border-e">
        <v-toolbar color="primary" density="compact">
          <v-btn icon="mdi-arrow-left" variant="text" @click="router.push({ name: 'reviewer' })"></v-btn>
          <v-toolbar-title class="text-body-1 font-weight-bold">
            {{ assignment?.paper?.title || 'Cargando documento...' }}
          </v-toolbar-title>
        </v-toolbar>
        
        <div class="flex-grow-1 position-relative bg-grey-darken-3">
          <div ref="viewerRef" style="height: 100%; width: 100%;"></div>
        </div>
      </v-col>

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
            :loading="isExtractingPdf"
            @click="openRubric"
          >
            Emitir Dictamen Final
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <ReviewFormDialog 
      v-model="showRubric" 
      :assignment="assignment" 
      :prefilledNotes="notes"
      :annotatedPdf="annotatedPdf" 
      @submitted="onReviewSubmitted" 
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReviewsStore } from '../stores/reviews.js';
import { papersApi, reviewsApi } from '../api/index.js'; // 1. Agregamos reviewsApi
import ReviewFormDialog from '../components/ReviewFormDialog.vue';
import WebViewer from '@pdftron/webviewer';

const route = useRoute();
const router = useRouter();
const store = useReviewsStore();

const assignmentId = parseInt(route.params.id);
const assignment = ref(null);
const pdfBlobUrl = ref('');

const viewerRef = ref(null);
const wvInstance = ref(null);
const annotatedPdf = ref(null); 
const isExtractingPdf = ref(false);

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

// --- FUNCIÓN PARA EXTRAER EL PDF ACTUAL (CON DIBUJOS) ---
const preparePdfForReview = async () => {
  if (!wvInstance.value) return null;
  
  const { documentViewer, annotationManager } = wvInstance.value.Core;
  const doc = documentViewer.getDocument();
  
  if (doc) {
    const xfdfString = await annotationManager.exportAnnotations();
    const data = await doc.getFileData({ xfdfString });
    const arr = new Uint8Array(data);
    return new Blob([arr], { type: 'application/pdf' });
  }
  return null;
};

const openRubric = async () => {
  isExtractingPdf.value = true;
  try {
    // 2. Extraemos el PDF justo antes de abrir el modal
    annotatedPdf.value = await preparePdfForReview();
    console.log("PDF con anotaciones preparado");
  } catch (error) {
    console.error("Error al extraer el PDF:", error);
  } finally {
    isExtractingPdf.value = false;
    showRubric.value = true;
  }
};

const onReviewSubmitted = () => {
  localStorage.removeItem(`offline_notes_${assignmentId}`);
  router.push({ name: 'reviewer' });
};

onMounted(async () => {
  window.addEventListener('online', checkOnlineStatus);
  window.addEventListener('offline', checkOnlineStatus);

  if (!store.assignments.length) {
    await store.fetchMyAssignments();
  }
  assignment.value = store.assignments.find(a => a.id === assignmentId);
  
  if (!assignment.value) {
    router.push({ name: 'reviewer' });
    return;
  }

  // 3. Lógica de carga inteligente
  try {
    let urlToDownload = assignment.value.paper?.documentUrl;

    // Consultamos si ya existe una revisión (borrador) guardada
    const { data: reviewRes } = await reviewsApi.getReviewByAssignment(assignmentId);
    const draft = reviewRes.data;

    // Si el borrador ya tiene un PDF con rayones, usamos ese
    if (draft && draft.annotatedPdfUrl) {
      urlToDownload = draft.annotatedPdfUrl;
      console.log("Cargando borrador previo con anotaciones...");
    }

    if (urlToDownload) {
      pdfBlobUrl.value = await papersApi.downloadPdf(urlToDownload);
      
      WebViewer(
        {
          path: '/webviewer', 
          initialDoc: pdfBlobUrl.value, 
        },
        viewerRef.value
      ).then((instance) => {
        wvInstance.value = instance;
        instance.UI.setLanguage('es');
        instance.UI.setToolbarGroup('Annotate');
        instance.UI.setTheme('dark'); 
      });
    }
  } catch (e) {
    console.error('Error al inicializar el visor:', e);
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