<template>
  <v-container class="pa-6" max-width="1200">
    <div class="d-flex align-center mb-6">
      <v-icon color="secondary" size="32" class="mr-3">mdi-view-dashboard</v-icon>
      <div>
        <h1 class="text-h5 font-weight-bold">Panel del Editor</h1>
        <p class="text-body-2 text-medium-emphasis">{{ auth.activeEvent?.event?.name }}</p>
      </div>
      <v-spacer />
      <v-btn-toggle v-model="viewMode" variant="outlined" density="compact" mandatory class="mr-3">
        <v-btn value="papers" prepend-icon="mdi-file-document-multiple">Artículos</v-btn>
        <v-btn value="metrics" prepend-icon="mdi-chart-bar">Métricas</v-btn>
      </v-btn-toggle>
    </div>

    <!-- Alertas de retrasos (US-2246) — siempre visible -->
    <DelayAlerts ref="delayAlertsRef" @cancel="handleCancelDelayed" />

    <!-- Vista de Métricas (US-2245) -->
    <template v-if="viewMode === 'metrics'">
      <EditorMetricsDashboard ref="metricsDashRef" />
    </template>

    <!-- Vista de Artículos -->
    <template v-else>
      <!-- Stats rápidas -->
      <v-row class="mb-6">
        <v-col v-for="stat in stats" :key="stat.label" cols="6" sm="3">
          <v-card rounded="xl" :color="stat.color" variant="tonal" class="pa-4 text-center">
            <p class="text-h4 font-weight-bold">{{ stat.value }}</p>
            <p class="text-caption">{{ stat.label }}</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filtro de estado -->
      <div class="d-flex align-center mb-4 ga-3">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          label="Filtrar por estado"
          variant="outlined"
          density="compact"
          clearable
          style="max-width:220px"
        />
        <v-checkbox
          v-model="showDelayedOnly"
          label="Solo con retraso"
          density="compact"
          hide-details
          color="error"
        />
      </div>

      <v-progress-linear v-if="store.loading" indeterminate color="secondary" class="mb-4" />

      <!-- Tabla de artículos -->
      <v-card rounded="xl" elevation="2">
        <v-data-table
          :headers="headers"
          :items="filteredPapers"
          :loading="store.loading"
          rounded="xl"
          hover
        >
          <template #item.title="{ item }">
            <span class="font-weight-medium" style="white-space:normal;max-width:300px;display:block">
              {{ item.title }}
            </span>
            <span class="text-caption text-medium-emphasis">{{ item.author?.username }}</span>
          </template>

          <template #item.status="{ item }">
            <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
              {{ statusLabel(item.status) }}
            </v-chip>
            <!-- Badge "Listo para decisión" (US-2242) -->
            <v-chip
              v-if="isReadyForDecision(item)"
              color="secondary"
              size="x-small"
              variant="tonal"
              class="ml-1"
            >
              <v-icon start size="10">mdi-gavel</v-icon>
              Listo
            </v-chip>
          </template>

          <template #item.assignments="{ item }">
            <v-chip
              v-for="a in item.assignments"
              :key="a.id"
              size="x-small"
              :color="getAssignmentColor(a)"
              variant="tonal"
              class="mr-1"
            >
              <v-icon start size="10">{{ getAssignmentIcon(a) }}</v-icon>
              {{ a.reviewer?.username }}
            </v-chip>
            <span v-if="!item.assignments?.length" class="text-caption text-medium-emphasis">Sin asignar</span>
          </template>

          <template #item.actions="{ item }">
            <v-btn
              v-if="isReadyForDecision(item)"
              size="small"
              color="secondary"
              variant="tonal"
              class="mr-1"
              @click="openDecisionPanel(item)"
            >
              <v-icon start size="16">mdi-gavel</v-icon>
              Decidir
            </v-btn>
            <v-btn size="small" icon variant="text" @click="openPaper(item)">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- Drawer de detalle / gestión del paper -->
    <EditorPaperDrawer v-model="drawer" :paper="selectedPaper" @updated="refreshAll" />

    <!-- Panel de Decisión (US-2242) -->
    <DecisionPanel
      v-model="showDecision"
      :paperId="decisionPaperId"
      @decided="refreshAll"
    />

    <!-- Snackbar de confirmaciones -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { usePapersStore } from '../stores/papers.js';
import { useReviewsStore } from '../stores/reviews.js';
import EditorPaperDrawer from '../components/EditorPaperDrawer.vue';
import EditorMetricsDashboard from '../components/EditorMetricsDashboard.vue';
import DelayAlerts from '../components/DelayAlerts.vue';
import DecisionPanel from '../components/DecisionPanel.vue';

const auth  = useAuthStore();
const store = usePapersStore();
const reviewsStore = useReviewsStore();

const drawer           = ref(false);
const selectedPaper    = ref(null);
const statusFilter     = ref(null);
const showDelayedOnly  = ref(false);
const viewMode         = ref('papers');
const showDecision     = ref(false);
const decisionPaperId  = ref(null);
const delayAlertsRef   = ref(null);
const metricsDashRef   = ref(null);

const snackbar = ref({ show: false, text: '', color: 'success' });

const statusOptions = [
  { label: 'Recibido',         value: 'RECEIVED' },
  { label: 'En revisión',      value: 'UNDER_REVIEW' },
  { label: 'Cambios menores',  value: 'MINOR_CHANGES' },
  { label: 'Cambios mayores',  value: 'MAJOR_CHANGES' },
  { label: 'Aceptado',         value: 'ACCEPTED' },
  { label: 'Rechazado',        value: 'REJECTED' },
];

const headers = [
  { title: 'Título / Autor', key: 'title',       sortable: false },
  { title: 'Estado',         key: 'status',      sortable: true  },
  { title: 'Revisores',      key: 'assignments', sortable: false },
  { title: '',               key: 'actions',     sortable: false, align: 'end' },
];

const filteredPapers = computed(() => {
  let result = store.papers;
  if (statusFilter.value) {
    result = result.filter((p) => p.status === statusFilter.value);
  }
  if (showDelayedOnly.value && delayAlertsRef.value?.delayed?.length) {
    const delayedPaperIds = new Set(delayAlertsRef.value.delayed.map(d => d.paper?.id));
    result = result.filter((p) => delayedPaperIds.has(p.id));
  }
  return result;
});

const stats = computed(() => [
  { label: 'Total',       value: store.papers.length,                                                    color: 'grey'    },
  { label: 'En revisión', value: store.papers.filter((p) => p.status === 'UNDER_REVIEW').length,         color: 'warning' },
  { label: 'Aceptados',   value: store.papers.filter((p) => p.status === 'ACCEPTED').length,             color: 'success' },
  { label: 'Rechazados',  value: store.papers.filter((p) => p.status === 'REJECTED').length,             color: 'error'   },
]);

const statusColor = (s) => ({ RECEIVED: 'info', UNDER_REVIEW: 'warning', MINOR_CHANGES: 'orange', MAJOR_CHANGES: 'deep-orange', ACCEPTED: 'success', REJECTED: 'error' }[s] || 'grey');
const statusLabel = (s) => ({ RECEIVED: 'Recibido', UNDER_REVIEW: 'En revisión', MINOR_CHANGES: 'Cambios menores', MAJOR_CHANGES: 'Cambios mayores', ACCEPTED: 'Aceptado', REJECTED: 'Rechazado' }[s] || s);

// US-2242: Determinar si un artículo está listo para decisión
const isReadyForDecision = (paper) => {
  if (paper.status !== 'UNDER_REVIEW') return false;
  const assignments = paper.assignments || [];
  if (assignments.length === 0) return false;
  const activeAssignments = assignments.filter(a => a.status !== 'CANCELLED');
  const evaluatedCount = activeAssignments.filter(a => a.status === 'EVALUATED').length;
  return evaluatedCount > 0 && evaluatedCount === activeAssignments.length;
};

// US-2246: Colores e iconos de asignación con detección de retraso
const getAssignmentColor = (a) => {
  if (a.status === 'EVALUATED') return 'success';
  if (a.status === 'CANCELLED') return 'grey';
  if (a.deadline && new Date(a.deadline) < new Date()) return 'error';
  return 'warning';
};

const getAssignmentIcon = (a) => {
  if (a.status === 'EVALUATED') return 'mdi-check';
  if (a.status === 'CANCELLED') return 'mdi-close';
  if (a.deadline && new Date(a.deadline) < new Date()) return 'mdi-clock-alert';
  return 'mdi-clock';
};

const openPaper = (paper) => {
  selectedPaper.value = paper;
  drawer.value = true;
};

const openDecisionPanel = (paper) => {
  decisionPaperId.value = paper.id;
  showDecision.value = true;
};

const handleCancelDelayed = async (assignment) => {
  try {
    await reviewsStore.cancelAssignment(assignment.paper.id, assignment.reviewer.id);
    snackbar.value = { show: true, text: 'Asignación cancelada. Puedes reasignar un nuevo revisor.', color: 'info' };
    refreshAll();
  } catch (e) {
    snackbar.value = { show: true, text: 'Error al cancelar asignación.', color: 'error' };
  }
};

const refreshAll = () => {
  store.fetchAll();
  delayAlertsRef.value?.fetchDelayed();
  metricsDashRef.value?.fetchMetrics?.();
};

onMounted(() => store.fetchAll());
</script>
