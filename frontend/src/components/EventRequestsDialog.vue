<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="800">
    <v-card rounded="xl">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-white text-body-1">
          Solicitudes para: <strong>{{ event?.name }}</strong>
        </v-toolbar-title>
        <v-btn icon="mdi-close" color="white" variant="text" @click="close"></v-btn>
      </v-toolbar>
      
      <v-card-text class="pa-0">
        <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>
        <v-data-table
          :headers="headers"
          :items="requests"
          :loading="loading"
          hover
        >
          <template #item.user.username="{ item }">
            <div class="font-weight-bold">{{ item.user.username }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.user.email }}</div>
          </template>
          
          <template #item.message="{ item }">
            <div class="text-caption font-italic">{{ item.message || 'Sin mensaje' }}</div>
          </template>

          <template #item.status="{ item }">
            <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
              {{ item.status }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex gap-2" v-if="item.status === 'PENDING'">
              <v-btn size="small" color="success" variant="tonal" @click="respond(item.id, true)">Aprobar</v-btn>
              <v-btn size="small" color="error" variant="tonal" @click="respond(item.id, false)">Rechazar</v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { eventsApi } from '../api/index.js';

const props = defineProps({
  modelValue: Boolean,
  event: Object,
});

const emit = defineEmits(['update:modelValue']);
const loading = ref(false);
const requests = ref([]);

const headers = [
  { title: 'Usuario', key: 'user.username' },
  { title: 'Mensaje', key: 'message' },
  { title: 'Estado',  key: 'status' },
  { title: 'Acciones', key: 'actions', align: 'end' },
];

const statusColor = (status) => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' }[status] || 'grey');

const loadRequests = async () => {
  if (!props.event) return;
  loading.value = true;
  try {
    const { data } = await eventsApi.listRequests(props.event.id);
    requests.value = data.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const respond = async (requestId, approve) => {
  try {
    await eventsApi.respondRequest(requestId, approve);
    await loadRequests();
  } catch (e) {
    alert(e.response?.data?.error || 'Error al procesar solicitud');
  }
};

watch(() => props.modelValue, (val) => {
  if (val) loadRequests();
});

const close = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>
