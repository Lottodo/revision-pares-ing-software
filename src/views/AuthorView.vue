<template>
  <v-container class="pa-6" max-width="1100">
    <div class="d-flex align-center mb-6">
      <v-icon color="primary" size="32" class="mr-3">mdi-file-document-multiple</v-icon>
      <div>
        <h1 class="text-h5 font-weight-bold">Mis Artículos</h1>
        <p class="text-body-2 text-medium-emphasis">{{ auth.activeEvent?.event?.name }}</p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="showUpload = true">
        Subir Artículo
      </v-btn>
    </div>

    <!-- Lista de artículos -->
    <v-progress-linear v-if="store.loading" indeterminate color="primary" class="mb-4" />

    <v-alert v-if="store.error" type="error" variant="tonal" class="mb-4" closable @click:close="store.clearError()">
      {{ store.error }}
    </v-alert>

    <v-row v-if="store.papers.length">
      <v-col v-for="paper in store.papers" :key="paper.id" cols="12" md="6">
        <PaperCard :paper="paper" @view="openDetail" @new-version="openNewVersion" />
      </v-col>
    </v-row>

    <v-card v-else-if="!store.loading" variant="outlined" rounded="xl" class="pa-8 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-file-outline</v-icon>
      <p class="text-h6 text-medium-emphasis">Aún no has subido artículos</p>
      <p class="text-body-2 text-medium-emphasis mb-4">Sube tu primer manuscrito para comenzar el proceso de revisión.</p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showUpload = true">Subir Artículo</v-btn>
    </v-card>

    <!-- Dialog: subir artículo -->
    <UploadPaperDialog v-model="showUpload" @uploaded="store.fetchAll()" />

    <!-- Dialog: nueva versión -->
    <NewVersionDialog v-model="showNewVersion" :paper-id="selectedPaperId" @uploaded="store.fetchAll()" />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { usePapersStore } from '../stores/papers.js';
import PaperCard from '../components/PaperCard.vue';
import UploadPaperDialog from '../components/UploadPaperDialog.vue';
import NewVersionDialog from '../components/NewVersionDialog.vue';
import { useRouter } from 'vue-router';

const auth  = useAuthStore();
const store = usePapersStore();
const router = useRouter();

const showUpload     = ref(false);
const showNewVersion = ref(false);
const selectedPaperId = ref(null);

const openDetail = (paper) => {
  router.push({ name: 'paper-detail', params: { id: paper.id } });
};
const openNewVersion = (paper) => {
  selectedPaperId.value = paper.id;
  showNewVersion.value = true;
};

onMounted(() => store.fetchAll());
</script>
