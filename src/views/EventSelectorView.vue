<template>
  <div class="immersive-layout d-flex flex-column">
    
    <!-- Decoración abstracta (mismas blobs del login para consistencia branding) -->
    <div class="blob-1"></div>
    <div class="blob-2"></div>

    <!-- Mini-Topbar Flotante Minimalista -->
    <div class="d-flex justify-space-between align-center pa-6 z-10">
      <div class="d-flex align-center">
        <v-avatar color="white" size="48" class="elevation-4 mr-4" rounded="xl">
          <v-icon color="primary" size="24">mdi-book-open-page-variant</v-icon>
        </v-avatar>
        <span class="text-h5 font-weight-black text-white tracking-wide d-none d-sm-block">StudioPeer</span>
      </div>

      <div class="glassmap d-flex align-center px-4 py-2 rounded-pill elevation-4">
        <div class="d-flex flex-column align-end mr-3 d-none d-sm-flex text-white">
          <span class="text-body-2 font-weight-bold" style="line-height:1;">{{ auth.user?.username }}</span>
          <span class="text-caption opacity-80">Cuenta Activa</span>
        </div>
        <v-avatar color="primary" size="36" class="mr-3 text-white elevation-2">
          <span class="text-subtitle-1 font-weight-black">{{ auth.user?.username?.[0]?.toUpperCase() || 'U' }}</span>
        </v-avatar>
        <v-divider vertical class="mx-2 bg-white opacity-40"></v-divider>
        <v-btn icon size="small" variant="text" color="white" class="ml-1" @click="handleLogout">
          <v-icon>mdi-logout</v-icon>
          <v-tooltip activator="parent" location="bottom">Cerrar sesión</v-tooltip>
        </v-btn>
      </div>
    </div>

    <!-- Contenido Principal Centrado -->
    <v-main class="d-flex align-center justify-center z-10 flex-grow-1 mb-10">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8">
            <div class="text-center mb-10 text-white">
              <h2 class="text-h4 font-weight-medium mb-0">Entornos de Trabajo</h2>
            </div>

            <v-progress-linear v-if="loading" indeterminate color="white" class="mb-4 rounded-pill" height="6"></v-progress-linear>

            <v-row v-if="auth.userEvents.length">
              <v-col v-for="ev in auth.userEvents" :key="ev.event.id" cols="12" sm="6">
                <!-- Tarjeta Glassmorphism -->
                <v-card 
                  class="glass-card rounded-xl overflow-hidden hover-lift p-1 transition-all" 
                  :loading="switching === ev.event.id" 
                  @click="select(ev.event.id)"
                  elevation="0"
                >
                  <div class="pa-6">
                    <div class="d-flex align-center mb-4">
                      <v-avatar color="rgba(255,255,255,0.2)" size="48" class="mr-4 rounded-lg">
                        <v-icon color="white" size="24">mdi-school-outline</v-icon>
                      </v-avatar>
                      <div>
                        <h3 class="text-h6 font-weight-bold text-white mb-1" style="line-height:1.2;">{{ ev.event.name }}</h3>
                        <span class="text-caption text-white opacity-70">{{ ev.event.slug }}</span>
                      </div>
                    </div>
                    
                    <div class="d-flex flex-wrap gap-2 mt-4">
                      <v-chip
                        v-for="role in ev.roles"
                        :key="role"
                        color="white"
                        size="small"
                        variant="outlined"
                        class="font-weight-bold px-3 opacity-80"
                      >
                        {{ roleLabel(role) }}
                      </v-chip>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
            <div v-else class="text-center my-8">
              <v-icon size="48" color="white" class="opacity-30 mb-2">mdi-folder-open-outline</v-icon>
              <h3 class="text-body-1 text-white font-weight-light opacity-50">Sin entornos asignados</h3>
            </div>

            <!-- Separador limpio -->
            <div class="my-8"></div>

            <!-- Formulario Minimalista Integrado -->
            <v-card max-width="500" class="mx-auto glass-card rounded-xl pa-2 elevation-0">
              <v-form @submit.prevent="joinEvent" class="d-flex align-center">
                <v-text-field
                  v-model="accessCode"
                  placeholder="Código de Invitación..."
                  variant="plain"
                  color="white"
                  bg-color="transparent"
                  class="ml-2 mt-0 text-white custom-placeholder"
                  density="compact"
                  prepend-inner-icon="mdi-key"
                  hide-details
                  style="flex: 1;"
                ></v-text-field>
                <v-btn 
                  type="submit" 
                  color="white" 
                  variant="outlined"
                  class="rounded-lg font-weight-bold px-6 ml-2 opacity-80" 
                  height="44" 
                  :loading="joining" 
                  :disabled="!accessCode"
                >
                  Unirse
                </v-btn>
              </v-form>
            </v-card>

          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { eventsApi } from '../api/index.js';

const auth     = useAuthStore();
const router   = useRouter();
const loading  = ref(false);
const switching = ref(null);
const joining  = ref(false);
const accessCode = ref('');

const roleColor = (role) => ({ ADMIN: 'error', EDITOR: 'secondary', REVIEWER: 'warning', AUTHOR: 'accent' }[role]);
const roleLabel = (role) => ({ ADMIN: 'Admin', EDITOR: 'Editor', REVIEWER: 'Revisor', AUTHOR: 'Autor' }[role] || role);

const select = async (eventId) => {
  switching.value = eventId;
  try {
    await auth.switchEvent(eventId);
    if (auth.isAdmin || auth.isEditor) router.push({ name: 'editor' });
    else if (auth.isReviewer) router.push({ name: 'reviewer' });
    else router.push({ name: 'author' });
  } catch (e) {
    console.error(e);
  } finally {
    switching.value = null;
  }
};

const joinEvent = async () => {
  if (!accessCode.value) return;
  joining.value = true;
  try {
    const { data } = await eventsApi.joinEvent(accessCode.value);
    alert(data.data.message);
    await auth.fetchMe();
    accessCode.value = '';
  } catch (e) {
    alert(e.response?.data?.error || 'Error al unirse al congreso');
  } finally {
    joining.value = false;
  }
};

const handleLogout = async () => {
  await auth.logout();
  router.push({ name: 'login' });
};
</script>

<style scoped>
.immersive-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
  position: relative;
  overflow-x: hidden;
  font-family: 'Inter', sans-serif;
}

.z-10 {
  z-index: 10;
  position: relative;
}

/* Bolas de color de fondo del branding */
.blob-1 {
  position: absolute;
  top: -10%;
  left: -10%;
  width: 600px;
  height: 600px;
  background: rgba(255, 255, 255, 0.02);
  filter: blur(100px);
  border-radius: 50%;
  pointer-events: none;
}
.blob-2 {
  position: absolute;
  bottom: -20%;
  right: -10%;
  width: 700px;
  height: 700px;
  background: rgba(148, 163, 184, 0.02);
  filter: blur(120px);
  border-radius: 50%;
  pointer-events: none;
}

/* Efecto Cristal puro */
.glassmap {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.2) !important;
}

.hover-lift {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.3s ease, border-color 0.3s ease;
  cursor: pointer;
}
.hover-lift:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.3);
}

.tracking-wide {
  letter-spacing: 0.05em;
}

.gap-2 {
  gap: 8px;
}

/* Placeholder claro para input fondo oscuro */
.custom-placeholder :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}
</style>
