<template>
  <v-dialog :model-value="modelValue" max-width="480" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
        <v-icon class="mr-2">mdi-account-plus</v-icon>
        Asignar Rol en Evento
      </v-card-title>

      <v-card-text class="pa-5">
        <v-alert v-if="user" type="info" variant="tonal" density="compact" class="mb-4">
          Asignando rol a: <strong>{{ user.username }}</strong>
        </v-alert>

        <v-select
          v-model="form.eventId"
          :items="events"
          item-title="name"
          item-value="id"
          label="Evento *"
          variant="outlined"
          class="mb-3"
          :rules="[v => !!v || 'Selecciona un evento']"
        />

        <v-select
          v-model="form.role"
          :items="roleOptions"
          item-title="label"
          item-value="value"
          label="Rol *"
          variant="outlined"
          class="mb-3"
          :rules="[v => !!v || 'Selecciona un rol']"
        />

        <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          :loading="loading"
          rounded="lg"
          :disabled="!form.eventId || !form.role"
          @click="assign"
        >Asignar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { usersApi } from '../api/index.js';

const props = defineProps({ modelValue: Boolean, user: Object, events: Array });
const emit  = defineEmits(['update:modelValue', 'assigned']);

const loading = ref(false);
const error   = ref('');
const form    = reactive({ eventId: null, role: null });

const roleOptions = [
  { label: 'Autor',          value: 'AUTHOR'   },
  { label: 'Revisor',        value: 'REVIEWER' },
  { label: 'Editor',         value: 'EDITOR'   },
  { label: 'Administrador',  value: 'ADMIN'    },
];

// Pre-seleccionar evento si viene del contexto de evento
watch(() => props.user, (u) => {
  if (u?.preselectedEventId) form.eventId = u.preselectedEventId;
});

const close = () => {
  form.eventId = null;
  form.role = null;
  error.value = '';
  emit('update:modelValue', false);
};

const assign = async () => {
  if (!props.user || !form.eventId || !form.role) return;
  loading.value = true; error.value = '';
  try {
    await usersApi.assignRole({ userId: props.user.id, eventId: form.eventId, role: form.role });
    emit('assigned');
    close();
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al asignar rol';
  } finally { loading.value = false; }
};
</script>
