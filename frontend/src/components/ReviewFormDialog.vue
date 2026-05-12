<template>
  <v-dialog :model-value="modelValue" max-width="700" persistent scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-4 bg-warning text-white d-flex align-center">
        <v-icon class="mr-2">mdi-star-check</v-icon>
        Formulario de Evaluación
        <v-spacer />
        <v-chip v-if="isDraftLoaded" size="x-small" color="white" variant="outlined">Borrador cargado</v-chip>
      </v-card-title>

      <v-card-text class="pa-5" style="max-height:75vh;overflow-y:auto">
        <v-alert type="info" variant="tonal" density="compact" class="mb-5">
          <strong>Revisión doble ciego.</strong> Tu identidad no será revelada al autor.
        </v-alert>

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

        <p class="text-subtitle-2 font-weight-bold mb-3">Veredicto Final *</p>
        <v-btn-toggle v-model="form.verdict" color="primary" rounded="lg" class="mb-5 flex-wrap" style="height:auto">
          <v-btn value="ACCEPT" color="success" variant="tonal" size="small">
            <v-icon start>mdi-check-circle</v-icon>Aceptar
          </v-btn>
          <v-btn value="MINOR_CHANGES" color="warning" variant="tonal" size="small">
            <v-icon start>mdi-pencil</v-icon>M. Menores
          </v-btn>
          <v-btn value="MAJOR_CHANGES" color="deep-orange" variant="tonal" size="small">
            <v-icon start>mdi-alert-circle</v-icon>M. Mayores
          </v-btn>
          <v-btn value="REJECT" color="error" variant="tonal" size="small">
            <v-icon start>mdi-close-circle</v-icon>Rechazar
          </v-btn>
        </v-btn-toggle>

        <v-textarea
          v-model="form.comments"
          label="Comentarios al autor * (mínimo 20 caracteres)"
          variant="outlined"
          rows="5"
          counter
          :rules="[v => v?.length >= 20 || 'Mínimo 20 caracteres para envío final']"
        />

        <v-alert v-if="props.annotatedPdf" type="success" variant="tonal" density="compact" class="mt-2" icon="mdi-file-check">
          Se adjuntará automáticamente el PDF con tus anotaciones.
        </v-alert>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-5">{{ error }}</v-alert>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancelar</v-btn>
        <v-spacer />
        
        <v-btn 
          color="grey-darken-1" 
          variant="text" 
          prepend-icon="mdi-content-save-outline"
          :loading="draftLoading" 
          @click="handleAction(true)"
        >
          Guardar Borrador
        </v-btn>

        <v-btn 
          color="warning" 
          :loading="loading" 
          variant="elevated"
          rounded="lg" 
          :disabled="!isValid" 
          @click="handleAction(false)"
        >
          Enviar Evaluación
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useReviewsStore } from '../stores/reviews.js';
import { reviewsApi } from '../api/index.js'; // Importar API directamente para el GET del borrador

const props = defineProps({ 
  modelValue: Boolean, 
  assignment: Object, 
  prefilledNotes: String,
  annotatedPdf: Blob 
});

const emit  = defineEmits(['update:modelValue', 'submitted']);
const store = useReviewsStore();

const loading = ref(false);
const draftLoading = ref(false);
const isDraftLoaded = ref(false);
const error   = ref('');

const form = reactive({
  verdict: null,
  originality: 0,
  methodologicalRigor: 0,
  writingQuality: 0,
  relevance: 0,
  comments: ''
});

const rubricFields = [
  { key: 'originality',         label: 'Originalidad' },
  { key: 'methodologicalRigor', label: 'Rigor Metodológico' },
  { key: 'writingQuality',      label: 'Calidad de Redacción' },
  { key: 'relevance',           label: 'Relevancia' },
];

// Lógica de carga de datos al abrir
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.assignment) {
    error.value = '';
    isDraftLoaded.value = false;
    
    try {
      // Intentamos recuperar borrador del servidor
      const res = await reviewsApi.getReviewByAssignment(props.assignment.id);
      if (res.data.data) {
        const d = res.data.data;
        form.verdict = d.verdict;
        form.originality = d.originality || 0;
        form.methodologicalRigor = d.methodologicalRigor || 0;
        form.writingQuality = d.writingQuality || 0;
        form.relevance = d.relevance || 0;
        form.comments = d.comments || '';
        isDraftLoaded.value = true;
      } else {
        // Valores por defecto si no hay borrador
        resetForm();
      }
    } catch (e) {
      resetForm();
    }
  }
});

const resetForm = () => {
  form.verdict = null;
  form.originality = 0;
  form.methodologicalRigor = 0;
  form.writingQuality = 0;
  form.relevance = 0;
  form.comments = props.prefilledNotes ? props.prefilledNotes + '\n\n' : '';
};

// Validación solo para ENVÍO FINAL
const isValid = computed(() =>
  form.verdict &&
  form.originality > 0 &&
  form.methodologicalRigor > 0 &&
  form.writingQuality > 0 &&
  form.relevance > 0 &&
  form.comments.length >= 20
);

// Función unificada para Draft o Submit
const handleAction = async (isDraft) => {
  if (!props.assignment) return;
  
  if (isDraft) draftLoading.value = true;
  else loading.value = true;
  
  error.value = '';
  
  try {
    const fd = new FormData();
    fd.append('assignmentId', props.assignment.id);
    if (form.verdict) fd.append('verdict', form.verdict);
    fd.append('originality', form.originality);
    fd.append('methodologicalRigor', form.methodologicalRigor);
    fd.append('writingQuality', form.writingQuality);
    fd.append('relevance', form.relevance);
    fd.append('comments', form.comments);
    
    if (props.annotatedPdf) {
      fd.append('annotatedPdf', props.annotatedPdf, `revision_${isDraft ? 'draft' : 'final'}_${props.assignment.id}.pdf`);
    }

    if (isDraft) {
      await store.saveDraft(fd); // Necesitarás crear este método en tu Store
      isDraftLoaded.value = true;
      // Podrías mostrar un toast o mensaje pequeño aquí
    } else {
      await store.submitReview(fd);
      emit('submitted');
      emit('update:modelValue', false);
    }
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al procesar la solicitud';
  } finally { 
    loading.value = false; 
    draftLoading.value = false;
  }
};
</script>