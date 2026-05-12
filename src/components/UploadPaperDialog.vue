<template>
  <v-dialog :model-value="modelValue" max-width="600" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon class="mr-2">mdi-file-upload</v-icon>
        Subir Artículo
      </v-card-title>

      <v-card-text class="pa-5">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.title"
            label="Título del artículo *"
            variant="outlined"
            :rules="[v => !!v || 'Requerido', v => v?.length >= 5 || 'Mínimo 5 caracteres']"
            class="mb-3"
          />
          <v-textarea
            v-model="form.abstract"
            label="Resumen / Abstract *"
            variant="outlined"
            rows="4"
            :rules="[v => !!v || 'Requerido', v => v?.length >= 50 || 'Mínimo 50 caracteres']"
            counter
            class="mb-3"
          />
          <v-file-input
            v-model="form.file"
            label="Documento PDF *"
            prepend-icon="mdi-file-pdf-box"
            accept=".pdf"
            variant="outlined"
            :rules="[v => (v && v.length !== 0) || 'Se requiere un archivo PDF']"
            class="mb-1"
          />

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-spacer />
        <v-btn color="primary" :loading="loading" rounded="lg" @click="handleSubmit">
          Subir Artículo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { usePapersStore } from '../stores/papers.js';

const props = defineProps({ modelValue: Boolean });
const emit  = defineEmits(['update:modelValue', 'uploaded']);
const store = usePapersStore();

const formRef = ref(null);
const loading = ref(false);
const error   = ref('');
const form    = reactive({ title: '', abstract: '', file: null });

const close = () => {
  Object.assign(form, { title: '', abstract: '', file: null });
  error.value = '';
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  error.value = '';
  try {
    const fd = new FormData();
    fd.append('title',    form.title);
    fd.append('abstract', form.abstract);
    
    // Vuetify puede devolver un File único o un Array de Files
    const fileObj = Array.isArray(form.file) ? form.file[0] : form.file;
    fd.append('document', fileObj);
    
    await store.submit(fd);
    emit('uploaded');
    close();
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al subir el artículo';
  } finally {
    loading.value = false;
  }
};
</script>
