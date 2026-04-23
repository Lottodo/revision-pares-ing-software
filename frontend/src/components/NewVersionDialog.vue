<template>
  <v-dialog :model-value="modelValue" max-width="500" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-4 bg-warning text-white d-flex align-center">
        <v-icon class="mr-2">mdi-upload</v-icon>
        Subir Nueva Versión
      </v-card-title>
      <v-card-text class="pa-5">
        <v-alert type="info" variant="tonal" density="compact" class="mb-4">
          El artículo regresará a estado <strong>Recibido</strong> para reiniciar el ciclo de revisión.
        </v-alert>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-file-input
            v-model="form.file"
            label="Nuevo PDF *"
            prepend-icon="mdi-file-pdf-box"
            accept=".pdf"
            variant="outlined"
            :rules="[v => !!v?.[0] || 'Se requiere un PDF']"
            class="mb-3"
          />
          <v-text-field
            v-model="form.note"
            label="Nota de cambios (opcional)"
            variant="outlined"
            placeholder="Ej: Se incorporaron las correcciones del revisor 1"
          />
        </v-form>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancelar</v-btn>
        <v-spacer />
        <v-btn color="warning" :loading="loading" rounded="lg" @click="handleSubmit">Subir Versión</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { usePapersStore } from '../stores/papers.js';

const props = defineProps({ modelValue: Boolean, paperId: Number });
const emit  = defineEmits(['update:modelValue', 'uploaded']);
const store = usePapersStore();
const formRef = ref(null);
const loading = ref(false);
const error   = ref('');
const form    = reactive({ file: null, note: '' });

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid || !props.paperId) return;
  loading.value = true; error.value = '';
  try {
    const fd = new FormData();
    fd.append('document', form.file[0]);
    if (form.note) fd.append('note', form.note);
    await store.addVersion(props.paperId, fd);
    emit('uploaded');
    emit('update:modelValue', false);
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al subir versión';
  } finally { loading.value = false; }
};
</script>
