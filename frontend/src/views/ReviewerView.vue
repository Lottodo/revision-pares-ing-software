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
              <span v-if="a.deadline"> · Límite: {{ formatDate(a.deadline) }}</span>
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
              :href="a.paper?.documentUrl"
              target="_blank"
              size="small"
              variant="text"
              prepend-icon="mdi-file-pdf-box"
              color="error"
            >Leer PDF</v-btn>
            <v-spacer />
            <v-btn
              v-if="a.status !== 'EVALUATED' && a.status !== 'CANCELLED'"
              size="small"
              color="warning"
              variant="tonal"
              prepend-icon="mdi-send"
              @click="openReviewForm(a)"
            >Evaluar</v-btn>
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

    <!-- Dialog de evaluación -->
    <ReviewFormDialog v-model="showReviewForm" :assignment="selectedAssignment" @submitted="store.fetchMyAssignments()" />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useReviewsStore } from '../stores/reviews.js';
import ReviewFormDialog from '../components/ReviewFormDialog.vue';

const auth  = useAuthStore();
const store = useReviewsStore();

const showReviewForm      = ref(false);
const selectedAssignment  = ref(null);

const openReviewForm = (assignment) => {
  selectedAssignment.value = assignment;
  showReviewForm.value = true;
};

const assignStatusColor = (s) => ({ PENDING: 'info', IN_PROGRESS: 'warning', EVALUATED: 'success', CANCELLED: 'grey' }[s]);
const assignStatusIcon  = (s) => ({ PENDING: 'mdi-clock', IN_PROGRESS: 'mdi-magnify', EVALUATED: 'mdi-check-circle', CANCELLED: 'mdi-cancel' }[s]);
const assignStatusLabel = (s) => ({ PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', EVALUATED: 'Evaluado', CANCELLED: 'Cancelado' }[s] || s);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : '';

onMounted(() => store.fetchMyAssignments());
</script>
