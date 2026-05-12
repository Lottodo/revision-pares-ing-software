<template>
  <v-container class="pa-6" max-width="1200">
    <div class="d-flex align-center mb-6">
      <v-icon color="secondary" size="32" class="mr-3">mdi-view-dashboard</v-icon>
      <div>
        <h1 class="text-h5 font-weight-bold">Panel del Editor</h1>
        <p class="text-body-2 text-medium-emphasis">{{ auth.activeEvent?.event?.name }}</p>
      </div>
      <v-spacer />
      <!-- Filtro de estado -->
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
    </div>

    <!-- Stats rápidas -->
    <v-row class="mb-6">
      <v-col v-for="stat in stats" :key="stat.label" cols="6" sm="3">
        <v-card rounded="xl" :color="stat.color" variant="tonal" class="pa-4 text-center">
          <p class="text-h4 font-weight-bold">{{ stat.value }}</p>
          <p class="text-caption">{{ stat.label }}</p>
        </v-card>
      </v-col>
    </v-row>

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
        </template>

        <template #item.assignments="{ item }">
          <v-chip
            v-for="a in item.assignments"
            :key="a.id"
            size="x-small"
            :color="a.completado ? 'success' : 'warning'"
            variant="tonal"
            class="mr-1"
          >
            <v-icon start size="10">{{ a.completado ? 'mdi-check' : 'mdi-clock' }}</v-icon>
            {{ a.reviewer?.username }}
          </v-chip>
          <span v-if="!item.assignments?.length" class="text-caption text-medium-emphasis">Sin asignar</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn size="small" icon variant="text" @click="openPaper(item)">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Drawer de detalle / gestión del paper -->
    <EditorPaperDrawer v-model="drawer" :paper="selectedPaper" @updated="store.fetchAll()" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { usePapersStore } from '../stores/papers.js';
import EditorPaperDrawer from '../components/EditorPaperDrawer.vue';

const auth  = useAuthStore();
const store = usePapersStore();

const drawer         = ref(false);
const selectedPaper  = ref(null);
const statusFilter   = ref(null);

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

const filteredPapers = computed(() =>
  statusFilter.value
    ? store.papers.filter((p) => p.status === statusFilter.value)
    : store.papers
);

const stats = computed(() => [
  { label: 'Total',       value: store.papers.length,                                                    color: 'grey'    },
  { label: 'En revisión', value: store.papers.filter((p) => p.status === 'UNDER_REVIEW').length,         color: 'warning' },
  { label: 'Aceptados',   value: store.papers.filter((p) => p.status === 'ACCEPTED').length,             color: 'success' },
  { label: 'Rechazados',  value: store.papers.filter((p) => p.status === 'REJECTED').length,             color: 'error'   },
]);

const statusColor = (s) => ({ RECEIVED: 'info', UNDER_REVIEW: 'warning', MINOR_CHANGES: 'orange', MAJOR_CHANGES: 'deep-orange', ACCEPTED: 'success', REJECTED: 'error' }[s] || 'grey');
const statusLabel = (s) => ({ RECEIVED: 'Recibido', UNDER_REVIEW: 'En revisión', MINOR_CHANGES: 'Cambios menores', MAJOR_CHANGES: 'Cambios mayores', ACCEPTED: 'Aceptado', REJECTED: 'Rechazado' }[s] || s);

const openPaper = (paper) => {
  selectedPaper.value = paper;
  drawer.value = true;
};

onMounted(() => store.fetchAll());
</script>
