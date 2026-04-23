<template>
  <!-- PaperCard -->
  <v-card rounded="xl" elevation="2" hover>
    <v-card-item>
      <template #prepend>
        <v-avatar :color="statusColor(paper.status)" variant="tonal" size="40">
          <v-icon size="20">{{ statusIcon(paper.status) }}</v-icon>
        </v-avatar>
      </template>
      <v-card-title class="text-body-1 font-weight-bold" style="white-space:normal">
        {{ paper.title }}
      </v-card-title>
      <v-card-subtitle>
        Versión {{ paper.versions?.length ?? 1 }} · {{ formatDate(paper.createdAt) }}
      </v-card-subtitle>
      <template #append>
        <v-chip :color="statusColor(paper.status)" size="small" variant="tonal">
          {{ statusLabel(paper.status) }}
        </v-chip>
      </template>
    </v-card-item>

    <v-card-text>
      <p class="text-body-2 text-medium-emphasis" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">
        {{ paper.abstract }}
      </p>
    </v-card-text>

    <v-card-actions class="pa-3">
      <v-btn
        :href="paper.documentUrl"
        target="_blank"
        size="small"
        variant="text"
        prepend-icon="mdi-file-pdf-box"
        color="error"
      >Ver PDF</v-btn>
      <v-spacer />
      <v-btn
        v-if="canUploadVersion(paper.status)"
        size="small"
        variant="tonal"
        color="warning"
        prepend-icon="mdi-upload"
        @click="$emit('new-version', paper)"
      >Nueva versión</v-btn>
      <v-btn size="small" variant="text" prepend-icon="mdi-eye" @click="$emit('view', paper)">
        Detalle
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({ paper: Object });
defineEmits(['view', 'new-version']);

const canUploadVersion = (status) => ['MINOR_CHANGES', 'MAJOR_CHANGES'].includes(status);

const statusColor = (s) => ({
  RECEIVED: 'info', UNDER_REVIEW: 'warning', MINOR_CHANGES: 'orange',
  MAJOR_CHANGES: 'deep-orange', ACCEPTED: 'success', REJECTED: 'error',
}[s] || 'grey');

const statusIcon = (s) => ({
  RECEIVED: 'mdi-inbox', UNDER_REVIEW: 'mdi-magnify', MINOR_CHANGES: 'mdi-pencil',
  MAJOR_CHANGES: 'mdi-alert-circle', ACCEPTED: 'mdi-check-circle', REJECTED: 'mdi-close-circle',
}[s] || 'mdi-file');

const statusLabel = (s) => ({
  RECEIVED: 'Recibido', UNDER_REVIEW: 'En revisión', MINOR_CHANGES: 'Cambios menores',
  MAJOR_CHANGES: 'Cambios mayores', ACCEPTED: 'Aceptado', REJECTED: 'Rechazado',
}[s] || s);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : '';
</script>
