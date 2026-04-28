<template>
  <div v-if="delayed.length">
    <v-alert
      type="error"
      variant="tonal"
      rounded="xl"
      class="mb-4"
      prominent
      closable
    >
      <template #prepend>
        <v-icon size="28">mdi-clock-alert</v-icon>
      </template>
      <v-alert-title class="text-body-1 font-weight-bold">
        ⚠️ {{ delayed.length }} revisión{{ delayed.length !== 1 ? 'es' : '' }} con retraso o próxima{{ delayed.length !== 1 ? 's' : '' }} a vencer
      </v-alert-title>
      <span class="text-body-2">Las siguientes asignaciones requieren atención inmediata.</span>

      <v-expansion-panels variant="accordion" class="mt-3" rounded="lg">
        <v-expansion-panel
          v-for="a in delayed"
          :key="a.id"
          :bg-color="a.severity === 'critical' ? 'red-lighten-5' : 'orange-lighten-5'"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center" style="width:100%">
              <v-icon
                :color="a.severity === 'critical' ? 'error' : 'warning'"
                size="20"
                class="mr-2"
              >
                {{ a.severity === 'critical' ? 'mdi-alert-circle' : 'mdi-alert' }}
              </v-icon>
              <div class="flex-grow-1">
                <span class="text-body-2 font-weight-bold">{{ a.paper?.title }}</span>
                <span class="text-caption text-medium-emphasis ml-2">— {{ a.reviewer?.username }}</span>
              </div>
              <v-chip
                :color="a.severity === 'critical' ? 'error' : 'warning'"
                size="small"
                variant="tonal"
                class="ml-2"
              >
                {{ a.daysRemaining < 0 ? `Vencido hace ${a.daysOverdue} día${a.daysOverdue !== 1 ? 's' : ''}` : `${a.daysRemaining} día${a.daysRemaining !== 1 ? 's' : ''}` }}
              </v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="d-flex align-center justify-space-between flex-wrap">
              <div>
                <p class="text-caption text-medium-emphasis">
                  <v-icon size="14" class="mr-1">mdi-account</v-icon>
                  Revisor: <strong>{{ a.reviewer?.username }}</strong> ({{ a.reviewer?.email }})
                </p>
                <p class="text-caption text-medium-emphasis">
                  <v-icon size="14" class="mr-1">mdi-calendar</v-icon>
                  Deadline: <strong>{{ formatDate(a.deadline) }}</strong>
                </p>
                <p class="text-caption text-medium-emphasis">
                  <v-icon size="14" class="mr-1">mdi-tag</v-icon>
                  Estado: <strong>{{ assignStatusLabel(a.status) }}</strong>
                </p>
              </div>
              <div class="d-flex ga-2 mt-2">
                <v-btn
                  size="small"
                  color="error"
                  variant="tonal"
                  prepend-icon="mdi-close-circle"
                  @click="$emit('cancel', a)"
                >
                  Cancelar y Reasignar
                </v-btn>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-alert>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { reviewsApi } from '../api/index.js';

defineEmits(['cancel']);
const delayed = ref([]);
const loading = ref(false);

const fetchDelayed = async () => {
  loading.value = true;
  try {
    const { data } = await reviewsApi.getDelayedAssignments();
    delayed.value = data.data;
  } catch (e) {
    console.error('Error cargando retrasos:', e);
  } finally {
    loading.value = false;
  }
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : '';
const assignStatusLabel = (s) => ({ PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', EVALUATED: 'Evaluado', CANCELLED: 'Cancelado' }[s] || s);

onMounted(() => fetchDelayed());

defineExpose({ fetchDelayed, delayed });
</script>
