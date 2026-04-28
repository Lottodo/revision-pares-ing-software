<template>
  <v-navigation-drawer
    :model-value="modelValue"
    location="right"
    width="480"
    temporary
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-toolbar color="secondary" density="compact">
      <v-toolbar-title class="text-white text-body-2">Gestión del Artículo</v-toolbar-title>
      <v-btn icon color="white" @click="$emit('update:modelValue', false)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <div v-if="paper" class="pa-4">
      <!-- Título y estado actual -->
      <p class="text-subtitle-2 font-weight-bold mb-1">{{ paper.title }}</p>
      <p class="text-caption text-medium-emphasis mb-1">Autor: {{ paper.author?.username }}</p>
      <v-chip :color="statusColor(paper.status)" size="small" variant="tonal" class="mb-4">
        {{ statusLabel(paper.status) }}
      </v-chip>

      <!-- Ver documento -->
      <v-btn color="info" variant="tonal" block rounded="lg" class="mb-4" :href="pdfBlobUrl" target="_blank" prepend-icon="mdi-file-pdf-box" :loading="loadingPdf">
        Ver PDF Original
      </v-btn>

      <v-divider class="mb-4" />

      <!-- Cambiar estado (US-2241: transiciones válidas + comentario obligatorio) -->
      <p class="text-subtitle-2 font-weight-bold mb-2">
        <v-icon size="18" class="mr-1">mdi-state-machine</v-icon>
        Cambiar Estado
      </p>

      <!-- Indicador de transiciones válidas -->
      <v-alert
        v-if="validTransitions.length === 0"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-2"
      >
        Este artículo está en estado terminal. No se permiten más transiciones.
      </v-alert>

      <v-select
        v-model="newStatus"
        :items="availableStatusOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        class="mb-2"
        :disabled="validTransitions.length === 0"
      />
      <v-textarea
        v-model="editorComment"
        :label="requiresComment ? 'Comentario al autor (obligatorio)' : 'Comentarios al Autor (opcional)'"
        variant="outlined"
        density="compact"
        rows="2"
        class="mb-2"
        :placeholder="commentPlaceholder"
        :rules="requiresComment ? [v => !!v?.trim() || 'El comentario es obligatorio para este estado'] : []"
      />
      <v-btn
        color="secondary"
        :loading="updatingStatus"
        block
        rounded="lg"
        class="mb-4"
        :disabled="!canApplyStatus"
        @click="changeStatus"
      >
        Aplicar Decisión
      </v-btn>

      <v-divider class="mb-4" />

      <!-- Asignar revisor (US-2240: deadline + sugerencias + confirmación) -->
      <p class="text-subtitle-2 font-weight-bold mb-2">
        <v-icon size="18" class="mr-1">mdi-account-plus</v-icon>
        Asignar Revisor
      </p>
      <v-select
        v-model="selectedReviewer"
        :items="availableReviewers"
        item-title="displayName"
        item-value="id"
        variant="outlined"
        density="compact"
        :loading="loadingReviewers"
        placeholder="Seleccionar revisor"
        class="mb-2"
      >
        <template #item="{ props: p, item }">
          <v-list-item v-bind="p">
            <template #prepend>
              <v-icon
                :color="item.raw.workload <= 2 ? 'success' : item.raw.workload <= 4 ? 'warning' : 'error'"
                size="small"
                class="mr-2"
              >
                {{ item.raw.workload <= 2 ? 'mdi-star' : 'mdi-account' }}
              </v-icon>
            </template>
            <template #append>
              <v-chip size="x-small" :color="item.raw.workload <= 2 ? 'success' : 'info'" variant="tonal">
                Carga: {{ item.raw.workload }}
              </v-chip>
            </template>
          </v-list-item>
        </template>
      </v-select>

      <!-- Deadline picker (US-2240) -->
      <v-text-field
        v-model="assignmentDeadline"
        type="date"
        label="Fecha límite (opcional)"
        variant="outlined"
        density="compact"
        class="mb-2"
        :min="todayDate"
        prepend-inner-icon="mdi-calendar"
      />

      <v-btn
        color="primary"
        :loading="assigning"
        block
        rounded="lg"
        class="mb-4"
        :disabled="!selectedReviewer"
        @click="assignReviewer"
      >
        <v-icon start>mdi-account-plus</v-icon>
        Asignar Revisor
      </v-btn>

      <!-- Asignaciones actuales -->
      <div v-if="reviewStore.paperAssignments.length">
        <p class="text-subtitle-2 font-weight-bold mb-2">Revisores Asignados</p>
        <v-list density="compact" rounded="lg" border class="mb-4">
          <v-list-item
            v-for="a in reviewStore.paperAssignments"
            :key="a.id"
            :title="a.reviewer?.username"
          >
            <template #subtitle>
              <v-chip :color="assignStatusColor(a.status)" size="x-small" variant="tonal" class="mr-1">
                {{ assignStatusLabel(a.status) }}
              </v-chip>
              <span v-if="a.deadline" :class="{'text-error font-weight-bold': isDelayed(a.deadline) && a.status !== 'EVALUATED' && a.status !== 'CANCELLED'}">
                · {{ getTimeRemaining(a.deadline) }}
              </span>
            </template>
            <template #append>
              <v-icon
                v-if="a.status !== 'EVALUATED' && a.status !== 'CANCELLED'"
                color="error"
                size="18"
                style="cursor:pointer"
                @click="cancelReviewer(a)"
              >mdi-close</v-icon>
              <v-icon v-else-if="a.status === 'EVALUATED'" color="success" size="18">mdi-check-circle</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <v-divider class="mb-4" />

      <!-- Evaluaciones -->
      <p class="text-subtitle-2 font-weight-bold mb-2">Evaluaciones Recibidas</p>
      <div v-if="reviewStore.paperReviews.length">
        <v-card
          v-for="r in reviewStore.paperReviews"
          :key="r.id"
          variant="outlined"
          rounded="lg"
          class="mb-3 pa-3"
        >
          <div class="d-flex align-center mb-2">
            <v-chip :color="verdictColor(r.verdict)" size="small" variant="tonal" class="mr-2">
              {{ verdictLabel(r.verdict) }}
            </v-chip>
            <span class="text-caption text-medium-emphasis">{{ r.reviewer?.username }}</span>
          </div>
          <v-row dense class="mb-2">
            <v-col v-for="(val, key) in rubric(r)" :key="key" cols="6">
              <p class="text-caption text-medium-emphasis">{{ key }}</p>
              <v-rating :model-value="val" :length="5" color="warning" density="compact" readonly size="14" />
            </v-col>
          </v-row>
          <p class="text-caption">{{ r.comments }}</p>
        </v-card>
      </div>
      <p v-else class="text-caption text-medium-emphasis">Sin evaluaciones aún.</p>

      <v-divider class="mb-4" />

      <!-- Añadir Comentario al Historial (US-2241) -->
      <p class="text-subtitle-2 font-weight-bold mb-2">Añadir Nota al Historial</p>
      <v-textarea
        v-model="newHistoryNote"
        label="Escribe una nota interna o respuesta..."
        variant="outlined"
        density="compact"
        rows="2"
        class="mb-2"
        hide-details
      />
      <v-btn color="primary" variant="tonal" :loading="sendingNote" block rounded="lg" class="mb-4" :disabled="!newHistoryNote.trim()" @click="addNote">
        Agregar Nota
      </v-btn>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>

      <!-- Snackbar de confirmación (US-2240) -->
      <v-snackbar v-model="showSnackbar" color="success" rounded="lg" timeout="3000">
        {{ snackbarText }}
      </v-snackbar>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { usePapersStore } from '../stores/papers.js';
import { useReviewsStore } from '../stores/reviews.js';
import { usersApi, papersApi } from '../api/index.js';
import { useAuthStore } from '../stores/auth.js';

const props = defineProps({ modelValue: Boolean, paper: Object });
const emit  = defineEmits(['update:modelValue', 'updated']);

const papersStore = usePapersStore();
const reviewStore = useReviewsStore();
const auth        = useAuthStore();

const newStatus         = ref(null);
const editorComment     = ref('');
const selectedReviewer  = ref(null);
const reviewers         = ref([]);
const loadingReviewers  = ref(false);
const updatingStatus    = ref(false);
const assigning         = ref(false);
const error             = ref('');
const pdfBlobUrl        = ref('');
const loadingPdf        = ref(false);
const newHistoryNote    = ref('');
const sendingNote       = ref(false);
const assignmentDeadline = ref('');
const showSnackbar      = ref(false);
const snackbarText      = ref('');

const todayDate = new Date().toISOString().split('T')[0];

// US-2241: Transiciones de estado válidas
const VALID_TRANSITIONS = {
  RECEIVED:      ['UNDER_REVIEW'],
  UNDER_REVIEW:  ['ACCEPTED', 'REJECTED', 'MINOR_CHANGES', 'MAJOR_CHANGES'],
  MINOR_CHANGES: ['RECEIVED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'],
  MAJOR_CHANGES: ['RECEIVED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'],
  ACCEPTED:      [],
  REJECTED:      ['UNDER_REVIEW'],
};

const STATUS_LABELS_MAP = {
  RECEIVED: 'Recibido', UNDER_REVIEW: 'En revisión',
  MINOR_CHANGES: 'Cambios menores', MAJOR_CHANGES: 'Cambios mayores',
  ACCEPTED: 'Aceptado', REJECTED: 'Rechazado',
};

const validTransitions = computed(() => {
  if (!props.paper) return [];
  return VALID_TRANSITIONS[props.paper.status] || [];
});

const availableStatusOptions = computed(() =>
  validTransitions.value.map(v => ({ label: STATUS_LABELS_MAP[v], value: v }))
);

// US-2241: Comentario obligatorio para MINOR_CHANGES y MAJOR_CHANGES
const requiresComment = computed(() =>
  ['MINOR_CHANGES', 'MAJOR_CHANGES'].includes(newStatus.value)
);

const commentPlaceholder = computed(() =>
  requiresComment.value
    ? 'Describe los cambios requeridos para el autor...'
    : 'Ej. Se requieren ajustes en la metodología...'
);

const canApplyStatus = computed(() => {
  if (!newStatus.value || validTransitions.value.length === 0) return false;
  if (!validTransitions.value.includes(newStatus.value)) return false;
  if (requiresComment.value && !editorComment.value?.trim()) return false;
  return true;
});

// US-2240: Filtrar revisores ya asignados
const availableReviewers = computed(() => {
  const assignedIds = new Set(reviewStore.paperAssignments
    .filter(a => a.status !== 'CANCELLED')
    .map(a => a.reviewerId));
  return reviewers.value
    .filter(r => !assignedIds.has(r.id))
    .map(r => ({
      ...r,
      displayName: r.workload <= 2 ? `⭐ ${r.username}` : r.username,
    }));
});

watch(() => props.paper, async (p) => {
  if (!p) return;
  newStatus.value = null;
  editorComment.value = '';
  newHistoryNote.value = '';
  assignmentDeadline.value = '';
  error.value = '';
  // Cargar asignaciones y evaluaciones del paper
  await Promise.all([
    reviewStore.fetchAssignmentsByPaper(p.id),
    reviewStore.fetchReviewsByPaper(p.id),
  ]);

  // Cargar PDF Blob URL
  if (p.documentUrl) {
    loadingPdf.value = true;
    try {
      if (pdfBlobUrl.value) window.URL.revokeObjectURL(pdfBlobUrl.value);
      pdfBlobUrl.value = await papersApi.downloadPdf(p.documentUrl);
    } catch (e) {
      console.error('Error cargando PDF:', e);
    } finally {
      loadingPdf.value = false;
    }
  }

  // Cargar revisores disponibles
  loadingReviewers.value = true;
  try {
    const { data } = await usersApi.reviewersByEvent(auth.eventId, p.id);
    reviewers.value = data.data;
  } finally { loadingReviewers.value = false; }
}, { immediate: true });

const changeStatus = async () => {
  if (!canApplyStatus.value || !props.paper) return;
  updatingStatus.value = true; error.value = '';
  try {
    await papersStore.updateStatus(props.paper.id, newStatus.value, editorComment.value);
    showSnackbar.value = true;
    snackbarText.value = `Estado actualizado a "${STATUS_LABELS_MAP[newStatus.value]}"`;
    emit('updated');
  } catch (e) { error.value = e.response?.data?.error || 'Error al cambiar estado'; }
  finally { updatingStatus.value = false; }
};

// US-2240: Asignar con deadline
const assignReviewer = async () => {
  if (!selectedReviewer.value || !props.paper) return;
  assigning.value = true; error.value = '';
  try {
    const payload = {
      paperId: props.paper.id,
      reviewerId: selectedReviewer.value,
    };
    if (assignmentDeadline.value) {
      payload.deadline = new Date(assignmentDeadline.value).toISOString();
    }
    await reviewStore.createAssignment(props.paper.id, selectedReviewer.value, assignmentDeadline.value || undefined);
    selectedReviewer.value = null;
    assignmentDeadline.value = '';
    showSnackbar.value = true;
    snackbarText.value = 'Revisor asignado exitosamente';
    emit('updated');
  } catch (e) { error.value = e.response?.data?.error || 'Error al asignar revisor'; }
  finally { assigning.value = false; }
};

const cancelReviewer = async (assignment) => {
  try {
    await reviewStore.cancelAssignment(props.paper.id, assignment.reviewerId);
    showSnackbar.value = true;
    snackbarText.value = 'Asignación cancelada';
    emit('updated');
  } catch (e) { error.value = e.response?.data?.error || 'Error al cancelar'; }
};

const addNote = async () => {
  if (!newHistoryNote.value.trim() || !props.paper) return;
  sendingNote.value = true;
  try {
    await papersApi.addHistoryNote(props.paper.id, newHistoryNote.value);
    newHistoryNote.value = '';
    error.value = '';
    showSnackbar.value = true;
    snackbarText.value = 'Nota agregada al historial';
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al enviar nota';
  } finally {
    sendingNote.value = false;
  }
};

const statusColor = (s) => ({ RECEIVED: 'info', UNDER_REVIEW: 'warning', MINOR_CHANGES: 'orange', MAJOR_CHANGES: 'deep-orange', ACCEPTED: 'success', REJECTED: 'error' }[s] || 'grey');
const statusLabel = (s) => STATUS_LABELS_MAP[s] || s;
const assignStatusLabel = (s) => ({ PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', EVALUATED: 'Evaluado', CANCELLED: 'Cancelado' }[s] || s);
const assignStatusColor = (s) => ({ PENDING: 'info', IN_PROGRESS: 'warning', EVALUATED: 'success', CANCELLED: 'grey' }[s] || 'grey');
const verdictColor = (v) => ({ ACCEPT: 'success', MINOR_CHANGES: 'warning', MAJOR_CHANGES: 'deep-orange', REJECT: 'error' }[v]);
const verdictLabel = (v) => ({ ACCEPT: 'Aceptar', MINOR_CHANGES: 'Cambios Menores', MAJOR_CHANGES: 'Cambios Mayores', REJECT: 'Rechazar' }[v] || v);
const rubric = (r) => ({
  'Originalidad': r.originality,
  'Rigor Metod.': r.methodologicalRigor,
  'Redacción':    r.writingQuality,
  'Relevancia':   r.relevance,
});
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : '';
const isDelayed = (d) => d ? new Date(d) < new Date() : false;
const getTimeRemaining = (d) => {
  if (!d) return '';
  const diff = new Date(d) - new Date();
  const days = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
  return diff < 0 ? `Vencido hace ${days} día${days !== 1 ? 's' : ''}` : `Faltan ${days} día${days !== 1 ? 's' : ''}`;
};
</script>
