<template>
  <v-dialog :model-value="modelValue" max-width="540" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon class="mr-2">{{ isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ isEdit ? 'Editar Evento' : 'Nuevo Evento' }}
      </v-card-title>

      <v-card-text class="pa-5">
        <v-form ref="formRef">
          <v-text-field
            v-model="form.name"
            label="Nombre del evento *"
            variant="outlined"
            :rules="[v => !!v || 'Requerido', v => v?.length >= 3 || 'Mínimo 3 caracteres']"
            class="mb-3"
          />
          <v-text-field
            v-model="form.slug"
            label="Slug (identificador URL) *"
            variant="outlined"
            hint="Solo minúsculas, números y guiones. Ej: congreso-ia-2025"
            persistent-hint
            :rules="[v => !!v || 'Requerido', v => /^[a-z0-9-]+$/.test(v) || 'Solo minúsculas, números y guiones']"
            class="mb-3"
          />
          <v-textarea
            v-model="form.description"
            label="Descripción"
            variant="outlined"
            rows="3"
            class="mb-3"
          />
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="form.startDate"
                label="Fecha inicio"
                type="date"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.endDate"
                label="Fecha fin"
                type="date"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">{{ error }}</v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-spacer />
        <v-btn color="primary" :loading="loading" rounded="lg" @click="save">
          {{ isEdit ? 'Guardar cambios' : 'Crear evento' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { eventsApi } from '../api/index.js';

const props = defineProps({ modelValue: Boolean, event: Object });
const emit  = defineEmits(['update:modelValue', 'saved']);

const formRef = ref(null);
const loading = ref(false);
const error   = ref('');
const isEdit  = computed(() => !!props.event?.id);

const form = reactive({ name: '', slug: '', description: '', startDate: '', endDate: '' });

watch(() => props.event, (ev) => {
  if (ev) {
    form.name        = ev.name || '';
    form.slug        = ev.slug || '';
    form.description = ev.description || '';
    form.startDate   = ev.startDate ? ev.startDate.split('T')[0] : '';
    form.endDate     = ev.endDate   ? ev.endDate.split('T')[0]   : '';
  } else {
    Object.assign(form, { name: '', slug: '', description: '', startDate: '', endDate: '' });
  }
});

const close = () => {
  error.value = '';
  emit('update:modelValue', false);
};

const save = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  loading.value = true; error.value = '';
  try {
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      startDate: form.startDate || undefined,
      endDate:   form.endDate   || undefined,
    };
    if (isEdit.value) {
      await eventsApi.update(props.event.id, payload);
    } else {
      await eventsApi.create(payload);
    }
    emit('saved');
    close();
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al guardar evento';
  } finally { loading.value = false; }
};
</script>
