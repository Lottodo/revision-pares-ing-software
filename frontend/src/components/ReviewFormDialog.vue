<template>
  <v-dialog :model-value="modelValue" max-width="700" persistent scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-4 bg-warning text-white">
        <v-icon class="mr-2">mdi-star-check</v-icon>
        Formulario de Evaluación
      </v-card-title>

      <v-card-text class="pa-5" style="max-height:75vh;overflow-y:auto">
        <v-alert type="info" variant="tonal" density="compact" class="mb-5">
          <strong>Revisión doble ciego.</strong> Tu identidad no será revelada al autor.
        </v-alert>

        <!-- Rúbrica -->
        <p class="text-subtitle-2 font-weight-bold mb-3">Rúbrica de Evaluación (1 = Deficiente · 5 = Excelente)</p>
        <v-row class="mb-2">
          <v-col v-for="field in rubricFields" :key="field.key" cols="12" sm="6">
            <p class="text-body-2 mb-1">{{ field.label }}</p>
            <v-rating
              v-model="form[field.key]"
              :length="5"
              color="warning"
              active-color="warning"
              hover
              half-increments
              size="28"
            />
            <p class="text-caption text-medium-emphasis">{{ form[field.key] > 0 ? form[field.key] + '/5' : 'Sin calificar' }}</p>
          </v-col>
        </v-row>

        <v-divider class="mb-5" />

        <!-- Veredicto -->
        <p class="text-subtitle-2 font-weight-bold mb-3">Veredicto Final *</p>
        <v-btn-toggle v-model="form.verdict" mandatory color="primary" rounded="lg" class="mb-5 flex-wrap" style="height:auto">
          <v-btn value="ACCEPT" color="success" variant="tonal" size="small">
            <v-icon start>mdi-check-circle</v-icon>Aceptar
          </v-btn>
          <v-btn value="MINOR_CHANGES" color="warning" variant="tonal" size="small">
            <v-icon start>mdi-pencil</v-icon>Cambios Menores
          </v-btn>
          <v-btn value="MAJOR_CHANGES" color="deep-orange" variant="tonal" size="small">
            <v-icon start>mdi-alert-circle</v-icon>Cambios Mayores
          </v-btn>
          <v-btn value="REJECT" color="error" variant="tonal" size="small">
            <v-icon start>mdi-close-circle</v-icon>Rechazar
          </v-btn>
        </v-btn-toggle>

        <!-- Comentarios -->
        <v-textarea
          v-model="form.comments"
          label="Comentarios al autor * (mínimo 20 caracteres)"
          variant="outlined"
          rows="5"
          counter
          :rules="[v => !!v || 'Requerido', v => v?.length >= 20 || 'Mínimo 20 caracteres']"
        />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancelar</v-btn>
        <v-spacer />
        <v-btn color="warning" :loading="loading" rounded="lg" :disabled="!isValid" @click="handleSubmit">
          Enviar Evaluación
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useReviewsStore } from '../stores/reviews.js';

const props = defineProps({ modelValue: Boolean, assignment: Object });
const emit  = defineEmits(['update:modelValue', 'submitted']);
const store = useReviewsStore();

const loading = ref(false);
const error   = ref('');

const form = reactive({
  verdict: null,
  originality: 0,
  methodologicalRigor: 0,
  writingQuality: 0,
  relevance: 0,
  comments: '',
});

const rubricFields = [
  { key: 'originality',         label: 'Originalidad' },
  { key: 'methodologicalRigor', label: 'Rigor Metodológico' },
  { key: 'writingQuality',      label: 'Calidad de Redacción' },
  { key: 'relevance',           label: 'Relevancia' },
];

const isValid = computed(() =>
  form.verdict &&
  form.originality > 0 &&
  form.methodologicalRigor > 0 &&
  form.writingQuality > 0 &&
  form.relevance > 0 &&
  form.comments.length >= 20
);

const handleSubmit = async () => {
  if (!isValid.value || !props.assignment) return;
  loading.value = true; error.value = '';
  try {
    await store.submitReview({ assignmentId: props.assignment.id, ...form });
    emit('submitted');
    emit('update:modelValue', false);
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al enviar evaluación';
  } finally { loading.value = false; }
};
</script>
