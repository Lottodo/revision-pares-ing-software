<template>
  <v-container class="pa-6" max-width="1000">
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" class="mr-3" @click="router.back()"></v-btn>
      <div>
        <h1 class="text-h5 font-weight-bold">Detalle del Artículo</h1>
      </div>
      <v-spacer />
      <v-chip :color="statusColor(paper?.status)" variant="tonal">{{ statusLabel(paper?.status) }}</v-chip>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <template v-else-if="paper">
      <v-card rounded="xl" elevation="2" class="mb-6 pa-4">
        <v-card-title class="text-h6" style="white-space:normal">{{ paper.title }}</v-card-title>
        <v-card-text>
          <p class="text-body-1 text-medium-emphasis mb-4">{{ paper.abstract }}</p>
          <v-btn color="error" variant="tonal" prepend-icon="mdi-file-pdf-box" @click="handlePdf(paper.documentUrl, false)" :loading="loadingPdf">
            Ver Documento Original
          </v-btn>
        </v-card-text>
      </v-card>

      <h2 class="text-h6 font-weight-bold mb-4">Evaluaciones Recibidas</h2>
      <div v-if="reviews.length">
        <v-card v-for="(r, i) in reviews" :key="r.id" variant="outlined" rounded="xl" class="mb-4 pa-4">
          <div class="d-flex align-center mb-3">
            <v-chip :color="verdictColor(r.verdict)" variant="tonal" class="mr-3">
              {{ verdictLabel(r.verdict) }}
            </v-chip>
            <span class="text-body-2 font-weight-bold text-medium-emphasis">Revisor {{ i + 1 }}</span>
          </div>
          
          <v-row dense class="mb-3">
            <v-col v-for="(val, key) in rubric(r)" :key="key" cols="12" sm="6" md="3">
              <p class="text-caption text-medium-emphasis mb-1">{{ key }}</p>
              <v-rating :model-value="val" :length="5" color="warning" density="compact" readonly size="18" />
            </v-col>
          </v-row>

          <v-divider class="mb-3" />
          <p class="text-body-2 mb-3">{{ r.comments }}</p>

          <div v-if="r.annotatedPdfUrl" class="d-flex flex-wrap mt-2">
            <v-btn
              color="info"
              variant="tonal"
              size="small"
              class="mr-3 mb-2"
              prepend-icon="mdi-eye"
              @click="handlePdf(r.annotatedPdfUrl, false)"
              :loading="loadingPdf"
            >
              Ver correcciones
            </v-btn>

            <v-btn
              color="secondary"
              variant="tonal"
              size="small"
              class="mb-2"
              prepend-icon="mdi-download"
              @click="handlePdf(r.annotatedPdfUrl, true)"
              :loading="loadingPdf"
            >
              Descargar
            </v-btn>
          </div>
        </v-card>
      </div>
      <v-card v-else variant="outlined" rounded="xl" class="pa-6 text-center bg-grey-lighten-4">
        <v-icon size="48" color="grey" class="mb-3">mdi-clipboard-text-outline</v-icon>
        <p class="text-body-1 text-medium-emphasis">Aún no hay evaluaciones publicadas para este artículo.</p>
      </v-card>

      <h2 class="text-h6 font-weight-bold mb-4 mt-6">Historial del Artículo</h2>
      <v-card rounded="xl" elevation="2" class="pa-4 mb-6">
        <v-timeline v-if="history.length" density="compact" align="start" class="mb-4">
          <v-timeline-item
            v-for="h in history"
            :key="h.id"
            :dot-color="getHistoryColor(h.event)"
            size="small"
          >
            <div class="mb-1">
              <strong>{{ h.event }}</strong>
              <span class="text-caption text-medium-emphasis ml-2">{{ new Date(h.createdAt).toLocaleString('es-MX') }}</span>
            </div>
            <p class="text-body-2 text-medium-emphasis">{{ h.detail }}</p>
          </v-timeline-item>
        </v-timeline>
        <p v-else class="text-body-2 text-medium-emphasis text-center mb-4">No hay historial disponible.</p>

        <v-divider class="mb-4" />
        <p class="text-subtitle-2 font-weight-bold mb-2">Añadir Comentario</p>
        <div class="d-flex align-start">
          <v-textarea
            v-model="newHistoryNote"
            variant="outlined"
            density="compact"
            rows="2"
            placeholder="Escribe un comentario o respuesta para el editor/revisores..."
            hide-details
            class="mr-3"
          />
          <v-btn color="primary" rounded="lg" :loading="sendingNote" :disabled="!newHistoryNote.trim()" @click="addNote">Enviar</v-btn>
        </div>
      </v-card>

    </template>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { papersApi, reviewsApi } from '../api/index.js';

const route = useRoute();
const router = useRouter();

const paper = ref(null);
const reviews = ref([]);
const history = ref([]);
const loading = ref(false);
const loadingPdf = ref(false);
const newHistoryNote = ref('');
const sendingNote = ref(false);

const loadData = async () => {
  loading.value = true;
  try {
    const [pRes, rRes, hRes] = await Promise.all([
      papersApi.getById(route.params.id),
      reviewsApi.listByPaper(route.params.id),
      papersApi.getHistory(route.params.id).catch(() => ({ data: { data: [] } }))
    ]);
    paper.value = pRes.data.data;
    reviews.value = rRes.data.data;
    history.value = hRes.data.data;
  } catch (e) {
    console.error('Error cargando detalles:', e);
  } finally {
    loading.value = false;
  }
};

// Función unificada simple y directa
const handlePdf = async (url, forceDownload = false) => {
  // 1. Vemos si el botón realmente responde al clic y qué URL recibe
  console.log("👉 1. Botón clickeado. URL recibida:", url); 

  if (!url) {
    console.warn("🛑 2. ERROR: La URL llegó vacía, nula o indefinida. Abortando misión.");
    return;
  }

  console.log("⏳ 3. Activando estado de carga...");
  loadingPdf.value = true;
  
  try {
    console.log("📡 4. Llamando a la API (papersApi.downloadPdf)...");
    const blobUrl = await papersApi.downloadPdf(url);
    
    console.log("✅ 5. Respuesta de la API recibida:", blobUrl);
    
    if (forceDownload) {
      console.log("📥 6. MODO DESCARGA: Creando enlace fantasma...");
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = url.split('/').pop() || 'documento_revision.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("🎉 7. MODO DESCARGA: Terminado.");
    } else {
      console.log("👁️ 6. MODO VER: Abriendo con link invisible...");
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank'; // Abrir en pestaña nueva
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("🎉 7. MODO VER: Abierto con éxito.");
    }
    
  } catch (e) {
    console.error('❌ 8. ERROR en el proceso:', e);
    alert("Error al descargar: " + (e.response?.data?.error || e.message));
  } finally {
    console.log("🛑 9. Apagando estado de carga.");
    loadingPdf.value = false;
  }
};

const addNote = async () => {
  if (!newHistoryNote.value.trim() || !paper.value) return;
  sendingNote.value = true;
  try {
    await papersApi.addHistoryNote(paper.value.id, newHistoryNote.value);
    newHistoryNote.value = '';
    const hRes = await papersApi.getHistory(paper.value.id);
    history.value = hRes.data.data;
  } catch (e) {
    console.error('Error enviando nota:', e);
  } finally {
    sendingNote.value = false;
  }
};

const statusColor = (s) => ({ RECEIVED: 'info', UNDER_REVIEW: 'warning', MINOR_CHANGES: 'orange', MAJOR_CHANGES: 'deep-orange', ACCEPTED: 'success', REJECTED: 'error' }[s] || 'grey');
const statusLabel = (s) => ({ RECEIVED: 'Recibido', UNDER_REVIEW: 'En revisión', MINOR_CHANGES: 'Cambios menores', MAJOR_CHANGES: 'Cambios mayores', ACCEPTED: 'Aceptado', REJECTED: 'Rechazado' }[s] || s);
const verdictColor = (v) => ({ ACCEPT: 'success', MINOR_CHANGES: 'warning', MAJOR_CHANGES: 'deep-orange', REJECT: 'error' }[v]);
const verdictLabel = (v) => ({ ACCEPT: 'Aceptar', MINOR_CHANGES: 'Cambios Menores', MAJOR_CHANGES: 'Cambios Mayores', REJECT: 'Rechazar' }[v] || v);
const rubric = (r) => ({
  'Originalidad': r.originality,
  'Rigor Metod.': r.methodologicalRigor,
  'Redacción':    r.writingQuality,
  'Relevancia':   r.relevance,
});

const getHistoryColor = (event) => {
  const e = event.toLowerCase();
  if (e.includes('recibido') || e.includes('versión')) return 'info';
  if (e.includes('revisión')) return 'warning';
  if (e.includes('completado') || e.includes('aceptado')) return 'success';
  if (e.includes('rechazado')) return 'error';
  return 'primary';
};

onMounted(() => loadData());
</script>