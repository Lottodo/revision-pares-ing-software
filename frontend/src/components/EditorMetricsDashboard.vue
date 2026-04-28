<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate color="secondary" class="mb-4" />

    <template v-if="metrics">
      <!-- KPI Cards -->
      <v-row class="mb-4">
        <v-col cols="6" sm="3">
          <v-card rounded="xl" color="primary" variant="tonal" class="pa-4 text-center">
            <p class="text-h4 font-weight-bold">{{ metrics.papers.total }}</p>
            <p class="text-caption">Total Artículos</p>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="xl" color="success" variant="tonal" class="pa-4 text-center">
            <p class="text-h4 font-weight-bold">{{ metrics.rates.acceptanceRate }}%</p>
            <p class="text-caption">Tasa de Aceptación</p>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="xl" color="warning" variant="tonal" class="pa-4 text-center">
            <p class="text-h4 font-weight-bold">{{ metrics.reviews.overallAverage || '—' }}</p>
            <p class="text-caption">Promedio Evaluación</p>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="xl" color="info" variant="tonal" class="pa-4 text-center">
            <p class="text-h4 font-weight-bold">{{ metrics.timeline.avgDaysToReview || '—' }}</p>
            <p class="text-caption">Días Prom. Revisión</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- Pipeline y Distribución -->
      <v-row class="mb-4">
        <!-- Pipeline editorial -->
        <v-col cols="12" md="7">
          <v-card rounded="xl" elevation="2" class="pa-4">
            <p class="text-subtitle-2 font-weight-bold mb-3">
              <v-icon size="18" class="mr-1">mdi-chart-timeline-variant-shimmer</v-icon>
              Pipeline Editorial
            </p>
            <div v-for="stage in pipelineStages" :key="stage.label" class="mb-3">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>{{ stage.label }}</span>
                <span class="font-weight-bold">{{ stage.count }}</span>
              </div>
              <v-progress-linear
                :model-value="metrics.papers.total ? (stage.count / metrics.papers.total) * 100 : 0"
                :color="stage.color"
                rounded
                height="8"
              />
            </div>
          </v-card>
        </v-col>

        <!-- Tasas -->
        <v-col cols="12" md="5">
          <v-card rounded="xl" elevation="2" class="pa-4">
            <p class="text-subtitle-2 font-weight-bold mb-3">
              <v-icon size="18" class="mr-1">mdi-percent-outline</v-icon>
              Tasas del Proceso
            </p>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon color="success" size="20">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title>Aceptación</v-list-item-title>
                <template #append>
                  <v-chip color="success" size="small" variant="tonal">{{ metrics.rates.acceptanceRate }}%</v-chip>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="error" size="20">mdi-close-circle</v-icon>
                </template>
                <v-list-item-title>Rechazo</v-list-item-title>
                <template #append>
                  <v-chip color="error" size="small" variant="tonal">{{ metrics.rates.rejectionRate }}%</v-chip>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="info" size="20">mdi-progress-check</v-icon>
                </template>
                <v-list-item-title>Decisiones Tomadas</v-list-item-title>
                <template #append>
                  <v-chip color="info" size="small" variant="tonal">{{ metrics.rates.decisionRate }}%</v-chip>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="warning" size="20">mdi-clock-alert-outline</v-icon>
                </template>
                <v-list-item-title>Pendientes</v-list-item-title>
                <template #append>
                  <v-chip color="warning" size="small" variant="tonal">{{ metrics.rates.pendingRate }}%</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Asignaciones y Retrasos -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-card rounded="xl" elevation="2" class="pa-4">
            <p class="text-subtitle-2 font-weight-bold mb-3">
              <v-icon size="18" class="mr-1">mdi-account-group</v-icon>
              Estado de Asignaciones
            </p>
            <v-row dense>
              <v-col cols="6">
                <div class="text-center pa-2">
                  <p class="text-h5 font-weight-bold" style="color: #2196F3">{{ metrics.assignments.pending }}</p>
                  <p class="text-caption">Pendientes</p>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center pa-2">
                  <p class="text-h5 font-weight-bold" style="color: #FF9800">{{ metrics.assignments.inProgress }}</p>
                  <p class="text-caption">En Progreso</p>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center pa-2">
                  <p class="text-h5 font-weight-bold" style="color: #4CAF50">{{ metrics.assignments.evaluated }}</p>
                  <p class="text-caption">Evaluadas</p>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center pa-2">
                  <p class="text-h5 font-weight-bold" style="color: #9E9E9E">{{ metrics.assignments.cancelled }}</p>
                  <p class="text-caption">Canceladas</p>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="xl" elevation="2" class="pa-4">
            <p class="text-subtitle-2 font-weight-bold mb-3">
              <v-icon size="18" class="mr-1">mdi-star-half-full</v-icon>
              Promedios de Evaluación
            </p>
            <div v-if="Object.keys(metrics.reviews.averages).length">
              <div v-for="(val, key) in criteriaLabels" :key="key" class="mb-2">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span>{{ val }}</span>
                  <span class="font-weight-bold">{{ metrics.reviews.averages[key] || 0 }} / 5</span>
                </div>
                <v-progress-linear
                  :model-value="((metrics.reviews.averages[key] || 0) / 5) * 100"
                  color="warning"
                  rounded
                  height="6"
                />
              </div>
            </div>
            <p v-else class="text-caption text-medium-emphasis text-center">Sin evaluaciones aún.</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- Alerta de retrasos -->
      <v-alert
        v-if="metrics.delays.overdue > 0"
        type="warning"
        variant="tonal"
        rounded="xl"
        class="mb-4"
        prominent
      >
        <template #prepend>
          <v-icon size="28">mdi-alert-circle</v-icon>
        </template>
        <v-alert-title class="text-body-1 font-weight-bold">
          {{ metrics.delays.overdue }} revisión{{ metrics.delays.overdue !== 1 ? 'es' : '' }} con retraso
        </v-alert-title>
        <span class="text-body-2">Hay asignaciones con deadline vencido que requieren atención.</span>
      </v-alert>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { eventsApi } from '../api/index.js';

const auth = useAuthStore();
const metrics = ref(null);
const loading = ref(false);

const criteriaLabels = {
  originality: 'Originalidad',
  methodologicalRigor: 'Rigor Metodológico',
  writingQuality: 'Calidad de Redacción',
  relevance: 'Relevancia',
};

const pipelineStages = computed(() => {
  if (!metrics.value) return [];
  const byStatus = metrics.value.papers.byStatus || {};
  return [
    { label: 'Recibidos', count: byStatus.RECEIVED || 0, color: 'info' },
    { label: 'En Revisión', count: byStatus.UNDER_REVIEW || 0, color: 'warning' },
    { label: 'Cambios Menores', count: byStatus.MINOR_CHANGES || 0, color: 'orange' },
    { label: 'Cambios Mayores', count: byStatus.MAJOR_CHANGES || 0, color: 'deep-orange' },
    { label: 'Aceptados', count: byStatus.ACCEPTED || 0, color: 'success' },
    { label: 'Rechazados', count: byStatus.REJECTED || 0, color: 'error' },
  ];
});

const fetchMetrics = async () => {
  if (!auth.eventId) return;
  loading.value = true;
  try {
    const { data } = await eventsApi.getEditorMetrics(auth.eventId);
    metrics.value = data.data;
  } catch (e) {
    console.error('Error cargando métricas:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => fetchMetrics());

defineExpose({ fetchMetrics });
</script>
