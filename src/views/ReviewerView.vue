<template>
  <v-container class="pa-6" max-width="1100">
    <div class="d-flex align-center mb-6">
      <v-icon color="warning" size="32" class="mr-3">mdi-clipboard-check</v-icon>
      <div>
        <h1 class="text-h5 font-weight-bold">Mis Asignaciones</h1>
        <p class="text-body-2 text-medium-emphasis">{{ auth.activeEvent?.event?.name }}</p>
      </div>
    </div>

    <v-progress-linear v-if="store.loading" indeterminate color="warning" class="mb-4" />

    <v-row v-if="store.assignments.length">
      <v-col v-for="a in store.assignments" :key="a.id" cols="12" md="6">
        <v-card rounded="xl" elevation="2" hover>
          <v-card-item>
            <template #prepend>
              <v-avatar :color="assignStatusColor(a.status)" variant="tonal" size="40">
                <v-icon size="20">{{ assignStatusIcon(a.status) }}</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-bold" style="white-space:normal">
              {{ a.paper?.title }}
            </v-card-title>
            <v-card-subtitle>
              Asignado: {{ formatDate(a.createdAt) }}
              <span v-if="a.deadline" :class="{'text-error': isDelayed(a.deadline) && a.status === 'IN_PROGRESS'}">
                · {{ getTimeRemaining(a.deadline) }} ({{ formatDate(a.deadline) }})
              </span>
            </v-card-subtitle>
            <template #append>
              <v-chip :color="assignStatusColor(a.status)" size="small" variant="tonal">
                {{ assignStatusLabel(a.status) }}
              </v-chip>
            </template>
          </v-card-item>

          <v-card-text>
            <p class="text-body-2 text-medium-emphasis" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">
              {{ a.paper?.abstract }}
            </p>
          </v-card-text>

          <v-card-actions class="pa-3">
            <v-btn
              :loading="loadingPdf === a.id"
              size="small"
              variant="text"
              prepend-icon="mdi-file-pdf-box"
              color="error"
              @click="openPdf(a.paper?.documentUrl, a.id)"
            >Leer PDF</v-btn>
            <v-spacer />
            
            <template v-if="a.status === 'PENDING'">
              <v-btn size="small" color="success" variant="tonal" prepend-icon="mdi-check" @click="respondAssignment(a.id, true)" :loading="responding === a.id">Aceptar</v-btn>
              <v-btn size="small" color="error" variant="text" prepend-icon="mdi-close" @click="respondAssignment(a.id, false)" :loading="responding === a.id" class="ml-2">Rechazar</v-btn>
            </template>
            
            <v-btn
              v-else-if="a.status === 'IN_PROGRESS'"
              size="small"
              color="warning"
              variant="tonal"
              prepend-icon="mdi-notebook-edit"
              @click="openReviewWorker(a)"
            >Evaluar / Notas</v-btn>
            
            <v-chip v-else-if="a.status === 'EVALUATED'" color="success" size="small" variant="tonal">
              <v-icon start>mdi-check</v-icon>Evaluado
            </v-chip>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else-if="!store.loading" variant="outlined" rounded="xl" class="pa-8 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clipboard-outline</v-icon>
      <p class="text-h6 text-medium-emphasis">No tienes asignaciones en este congreso</p>
    </v-card>

    <!-- Snackbar de resultado -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="top">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useReviewsStore } from '../stores/reviews.js';
import { useRouter } from 'vue-router';
import { papersApi } from '../api/index.js';

const auth   = useAuthStore();
const store  = useReviewsStore();
const router = useRouter();

const loadingPdf = ref(null);
const responding = ref(null);
const snackbar   = ref({ show: false, text: '', color: 'success' });

const showMsg = (text, color = 'success') => { snackbar.value = { show: true, text, color }; };

const openPdf = async (url, assignmentId) => {
  if (!url) return;
  loadingPdf.value = assignmentId;
  try {
    const blobUrl = await papersApi.downloadPdf(url);
    window.open(blobUrl, '_blank');
  } catch (e) {
    console.error('Error abriendo PDF:', e);
  } finally {
    loadingPdf.value = null;
  }
};

const respondAssignment = async (assignmentId, accept) => {
  responding.value = assignmentId;
  try {
    await store.respondToAssignment(assignmentId, accept);
    await store.fetchMyAssignments();
    showMsg(accept ? '✅ Invitación aceptada. Tienes 5 días para evaluar.' : '❌ Invitación rechazada.', accept ? 'success' : 'info');
  } catch (e) {
    const msg = e.response?.data?.error || 'Error al responder la asignación';
    showMsg(`Error: ${msg}`, 'error');
    console.error('Error respondiendo asignación:', e);
  } finally {
    responding.value = null;
  }
};

const openReviewWorker = (assignment) => {
  router.push({ name: 'review-worker', params: { id: assignment.id } });
};

const assignStatusColor = (s) => ({ PENDING: 'info', IN_PROGRESS: 'warning', EVALUATED: 'success', CANCELLED: 'grey', REJECTED: 'error' }[s]);
const assignStatusIcon  = (s) => ({ PENDING: 'mdi-clock', IN_PROGRESS: 'mdi-magnify', EVALUATED: 'mdi-check-circle', CANCELLED: 'mdi-cancel', REJECTED: 'mdi-close-circle' }[s]);
const assignStatusLabel = (s) => ({ PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', EVALUATED: 'Evaluado', CANCELLED: 'Cancelado', REJECTED: 'Rechazado' }[s] || s);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : '';
const isDelayed = (d) => d ? new Date(d) < new Date() : false;
const getTimeRemaining = (d) => {
  if (!d) return '';
  const diff = new Date(d) - new Date();
  const days = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
  return diff < 0 ? `Vencido hace ${days} día${days !== 1 ? 's' : ''}` : `Faltan ${days} día${days !== 1 ? 's' : ''}`;
};

onMounted(() => store.fetchMyAssignments());
</script>
