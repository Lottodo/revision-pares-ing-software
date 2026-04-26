<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="4" rounded="xl">
          <v-card-item class="bg-primary pa-6">
            <v-card-title class="text-white text-h5">Selecciona un Congreso</v-card-title>
            <v-card-subtitle class="text-white opacity-80">
              Hola, {{ auth.user?.username }}. ¿En qué congreso deseas trabajar?
            </v-card-subtitle>
          </v-card-item>

          <v-card-text class="pa-4">
            <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

            <h3 class="text-subtitle-1 font-weight-bold mb-3">Tus Congresos Inscritos</h3>
            <v-row v-if="auth.userEvents.length">
              <v-col v-for="ev in auth.userEvents" :key="ev.event.id" cols="12" sm="6">
                <v-card variant="outlined" rounded="lg" :loading="switching === ev.event.id" hover @click="select(ev.event.id)">
                  <v-card-item>
                    <template #prepend>
                      <v-avatar color="primary" variant="tonal" size="42">
                        <v-icon>mdi-school</v-icon>
                      </v-avatar>
                    </template>
                    <v-card-title class="text-body-1 font-weight-bold">{{ ev.event.name }}</v-card-title>
                    <v-card-subtitle>{{ ev.event.slug }}</v-card-subtitle>
                  </v-card-item>
                  <v-card-text>
                    <v-chip
                      v-for="role in ev.roles"
                      :key="role"
                      :color="roleColor(role)"
                      size="small"
                      variant="tonal"
                      class="mr-1 mb-1"
                    >{{ roleLabel(role) }}</v-chip>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <v-alert v-else type="info" variant="tonal" class="mb-4">
              No estás inscrito en ningún congreso. Ingresa el código de acceso abajo para unirte a uno.
            </v-alert>

            <v-divider class="my-6" />

            <h3 class="text-subtitle-1 font-weight-bold mb-3">Unirse a un Nuevo Congreso</h3>
            <v-form @submit.prevent="joinEvent">
              <v-text-field
                v-model="accessCode"
                label="Código de Acceso (Ej. 2026-04-COMPUTACION-MADRID)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-key"
                :rules="[v => !!v || 'Requerido']"
                required
              />
              <v-btn type="submit" color="primary" block rounded="lg" :loading="joining" :disabled="!accessCode">
                Ingresar al Congreso
              </v-btn>
            </v-form>

          </v-card-text>

          <v-card-actions class="pa-4">
            <v-btn variant="text" color="error" prepend-icon="mdi-logout" @click="handleLogout">
              Cerrar sesión
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
    // Recargar perfil para obtener los nuevos eventos
    await auth.fetchMe();
    // Limpiar campo
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
