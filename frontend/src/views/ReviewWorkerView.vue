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
import { papersApi } from '../api/index.js';
import ReviewFormDialog from '../components/ReviewFormDialog.vue';
import WebViewer from '@pdftron/webviewer'; // Importamos la librería

const route = useRoute();
const router = useRouter();
const store = useReviewsStore();

const assignmentId = parseInt(route.params.id);
const assignment = ref(null);
const pdfBlobUrl = ref('');

// --- NUEVAS VARIABLES PARA WEBVIEWER ---
const viewerRef = ref(null);
const wvInstance = ref(null);
const annotatedPdf = ref(null); // Aquí guardaremos el PDF dibujado
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

// --- FUNCIÓN MODIFICADA PARA EXTRAER EL PDF ---
const openRubric = async () => {
  isExtractingPdf.value = true;
  
  try {
    if (wvInstance.value) {
      const { documentViewer, annotationManager } = wvInstance.value.Core;
      const doc = documentViewer.getDocument();
      
      if (doc) {
        // 1. Extraemos las anotaciones y las fusionamos con el PDF
        const xfdfString = await annotationManager.exportAnnotations();
        const data = await doc.getFileData({ xfdfString });
        
        // 2. Convertimos el resultado a un Blob para enviarlo al backend
        const arr = new Uint8Array(data);
        annotatedPdf.value = new Blob([arr], { type: 'application/pdf' });
        console.log("PDF con anotaciones extraído correctamente");
      }
    }
  } catch (error) {
    console.error("Error al extraer el PDF anotado:", error);
  } finally {
    isExtractingPdf.value = false;
    showRubric.value = true; // Abrimos el modal aunque falle el PDF
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

  if (assignment.value.paper?.documentUrl) {
    try {
      pdfBlobUrl.value = await papersApi.downloadPdf(assignment.value.paper.documentUrl);
      
      // --- INICIALIZAMOS WEBVIEWER ---
      WebViewer(
        {
          path: '/webviewer', 
          initialDoc: pdfBlobUrl.value, // Le pasamos el BlobURL 
        },
        viewerRef.value
      ).then((instance) => {
        wvInstance.value = instance;
        
        instance.UI.setLanguage('es'); // Interfaz en español
        instance.UI.setToolbarGroup('Annotate'); // Mostrar herramientas de dibujo por defecto
        
        // Cambiar al modo oscuro 
        instance.UI.setTheme('dark'); 
      });

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