<template>
  <v-dialog :model-value="modelValue" max-width="800" @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-toolbar color="secondary" density="compact">
        <v-toolbar-title class="text-white text-body-2 font-weight-bold">
          Panel de Decisión Editorial
        </v-toolbar-title>
        <v-btn icon color="white" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-progress-linear v-if="loading" indeterminate color="secondary" class="mb-4" />

        <template v-if="summary">
          <!-- Info del artículo -->
          <p class="text-subtitle-1 font-weight-bold mb-1">{{ summary.paper.title }}</p>
          <v-chip :color="statusColor(summary.paper.status)" size="small" variant="tonal" class="mb-4">
            {{ statusLabel(summary.paper.status) }}
          </v-chip>

          <!-- Sin evaluaciones -->
          <v-alert v-if="!summary.summary" type="info" variant="tonal" class="mb-4">
            No hay evaluaciones completadas. Asigna revisores y espera sus dictámenes antes de tomar una decisión.
          </v-alert>

          <template v-if="summary.summary">
            <!-- Estado de revisores -->
            <v-alert
              v-if="!summary.summary.allComplete"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              <v-icon start>mdi-alert</v-icon>
              {{ summary.summary.totalEvaluated }}/{{ summary.summary.totalActive }} evaluaciones completadas.
              Algunos revisores aún no han emitido su dictamen.
            </v-alert>

            <!-- Tabla comparativa de evaluaciones -->
            <p class="text-subtitle-2 font-weight-bold mb-2">
              <v-icon size="18" class="mr-1">mdi-compare</v-icon>
              Comparativa de Evaluaciones
            </p>
            <v-table density="compact" class="mb-4 rounded-lg" hover>
              <thead>
                <tr>
                  <th>Criterio</th>
                  <th v-for="(r, i) in summary.reviews" :key="r.id" class="text-center">
                    Revisor {{ i + 1 }}
                  </th>
                  <th class="text-center font-weight-bold">Promedio</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(label, key) in criteriaLabels" :key="key">
                  <td class="text-caption">{{ label }}</td>
                  <td v-for="r in summary.reviews" :key="r.id" class="text-center">
                    <v-rating
                      :model-value="r[key]"
                      :length="5"
                      color="warning"
                      density="compact"
                      readonly
                      size="12"
                    />
                  </td>
                  <td class="text-center">
                    <v-chip size="x-small" color="info" variant="tonal">
                      {{ summary.summary.averages[key] }}
                    </v-chip>
                  </td>
                </tr>
                <tr class="bg-grey-lighten-4">
                  <td class="font-weight-bold text-caption">Veredicto</td>
                  <td v-for="r in summary.reviews" :key="r.id" class="text-center">
                    <v-chip :color="verdictColor(r.verdict)" size="x-small" variant="tonal">
                      {{ verdictLabel(r.verdict) }}
                    </v-chip>
                  </td>
                  <td class="text-center">
                    <v-chip size="x-small" color="secondary" variant="tonal">
                      {{ summary.summary.overallAverage }} / 5
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <!-- Comentarios -->
            <p class="text-subtitle-2 font-weight-bold mb-2">
              <v-icon size="18" class="mr-1">mdi-comment-text-multiple</v-icon>
              Comentarios de Revisores
            </p>
            <v-card
              v-for="(r, i) in summary.reviews"
              :key="r.id"
              variant="outlined"
              rounded="lg"
              class="mb-2 pa-3"
            >
              <div class="d-flex align-center mb-1">
                <v-chip :color="verdictColor(r.verdict)" size="x-small" variant="tonal" class="mr-2">
                  {{ verdictLabel(r.verdict) }}
                </v-chip>
                <span class="text-caption text-medium-emphasis">Revisor {{ i + 1 }}</span>
              </div>
              <p class="text-caption">{{ r.comments }}</p>
            </v-card>

            <v-divider class="my-4" />

            <!-- Sugerencia del sistema -->
            <v-alert
              :type="suggestionType"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              <template #prepend>
                <v-icon>mdi-robot</v-icon>
              </template>
              <strong>Sugerencia del sistema:</strong> {{ verdictLabel(summary.suggestion) }}
              <span class="text-caption ml-2">(basada en los veredictos de los revisores)</span>
            </v-alert>

            <!-- Decisión final -->
            <p class="text-subtitle-2 font-weight-bold mb-2">
              <v-icon size="18" class="mr-1">mdi-gavel</v-icon>
              Aplicar Decisión
            </p>
            <v-select
              v-model="selectedDecision"
              :items="decisionOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
              class="mb-2"
            />
            <v-textarea
              v-model="justification"
              label="Justificación de la decisión (obligatorio)"
              variant="outlined"
              density="compact"
              rows="3"
              class="mb-2"
              :rules="[v => !!v?.trim() || 'La justificación es obligatoria']"
            />
          </template>
        </template>
      </v-card-text>

      <v-card-actions v-if="summary?.summary" class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn
          color="secondary"
          variant="flat"
          :loading="applying"
          :disabled="!selectedDecision || !justification?.trim()"
          @click="applyDecision"
        >
          <v-icon start>mdi-check</v-icon>
          Confirmar Decisión
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { papersApi } from '../api/index.js';
import { usePapersStore } from '../stores/papers.js';

const props = defineProps({ modelValue: Boolean, paperId: Number });
const emit = defineEmits(['update:modelValue', 'decided']);

const papersStore = usePapersStore();

const summary = ref(null);
const loading = ref(false);
const applying = ref(false);
const selectedDecision = ref(null);
const justification = ref('');

const criteriaLabels = {
  originality: 'Originalidad',
  methodologicalRigor: 'Rigor Metodológico',
  writingQuality: 'Calidad de Redacción',
  relevance: 'Relevancia',
};

const decisionOptions = [
  { label: '✅ Aceptar', value: 'ACCEPTED' },
  { label: '❌ Rechazar', value: 'REJECTED' },
  { label: '🔄 Cambios Menores', value: 'MINOR_CHANGES' },
  { label: '⚠️ Cambios Mayores', value: 'MAJOR_CHANGES' },
];

const statusColor = (s) => ({ RECEIVED: 'info', UNDER_REVIEW: 'warning', MINOR_CHANGES: 'orange', MAJOR_CHANGES: 'deep-orange', ACCEPTED: 'success', REJECTED: 'error' }[s] || 'grey');
const statusLabel = (s) => ({ RECEIVED: 'Recibido', UNDER_REVIEW: 'En revisión', MINOR_CHANGES: 'Cambios menores', MAJOR_CHANGES: 'Cambios mayores', ACCEPTED: 'Aceptado', REJECTED: 'Rechazado' }[s] || s);
const verdictColor = (v) => ({ ACCEPT: 'success', MINOR_CHANGES: 'warning', MAJOR_CHANGES: 'deep-orange', REJECT: 'error' }[v] || 'grey');
const verdictLabel = (v) => ({ ACCEPT: 'Aceptar', MINOR_CHANGES: 'Cambios Menores', MAJOR_CHANGES: 'Cambios Mayores', REJECT: 'Rechazar', ACCEPTED: 'Aceptado', REJECTED: 'Rechazado' }[v] || v);

const suggestionType = ref('info');

watch(() => props.paperId, async (id) => {
  if (!id) return;
  loading.value = true;
  selectedDecision.value = null;
  justification.value = '';
  try {
    const { data } = await papersApi.getDecisionSummary(id);
    summary.value = data.data;
    if (summary.value?.suggestion) {
      selectedDecision.value = summary.value.suggestion === 'ACCEPT' ? 'ACCEPTED' :
        summary.value.suggestion === 'REJECT' ? 'REJECTED' : summary.value.suggestion;
      suggestionType.value = summary.value.suggestion === 'ACCEPT' ? 'success' :
        summary.value.suggestion === 'REJECT' ? 'error' : 'warning';
    }
  } catch (e) {
    console.error('Error cargando resumen:', e);
  } finally {
    loading.value = false;
  }
}, { immediate: true });

const applyDecision = async () => {
  if (!selectedDecision.value || !justification.value?.trim()) return;
  applying.value = true;
  try {
    await papersStore.updateStatus(props.paperId, selectedDecision.value, justification.value);
    emit('decided');
    emit('update:modelValue', false);
  } catch (e) {
    console.error('Error aplicando decisión:', e);
  } finally {
    applying.value = false;
  }
};
</script>
