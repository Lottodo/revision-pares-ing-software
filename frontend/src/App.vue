<template>
  <v-app>
    <!-- Barra de contexto de evento (solo si autenticado y con evento) -->
    <v-app-bar v-if="auth.isAuthenticated && auth.eventId" color="primary" elevation="2">
      <v-app-bar-title>
        <span class="text-body-2 opacity-70">Congreso</span>
        <span class="ml-2 font-weight-bold">{{ auth.activeEvent?.event?.name }}</span>
      </v-app-bar-title>

      <!-- Chips de roles activos -->
      <v-chip
        v-for="role in auth.roles"
        :key="role"
        :color="roleColor(role)"
        size="small"
        class="mr-1"
        variant="tonal"
      >
        {{ roleLabel(role) }}
      </v-chip>

      <v-spacer />

      <!-- Selector de evento -->
      <v-btn icon @click="showEventSelector = true">
        <v-icon>mdi-swap-horizontal</v-icon>
        <v-tooltip activator="parent">Cambiar evento</v-tooltip>
      </v-btn>

      <!-- Navegación por rol -->
      <template v-if="auth.isAuthor || auth.isAdmin">
        <v-btn :to="{ name: 'author' }" variant="text" prepend-icon="mdi-file-upload">Mis Artículos</v-btn>
      </template>
      <template v-if="auth.isReviewer">
        <v-btn :to="{ name: 'reviewer' }" variant="text" prepend-icon="mdi-clipboard-check">Revisiones</v-btn>
      </template>
      <template v-if="auth.isEditor || auth.isAdmin">
        <v-btn :to="{ name: 'editor' }" variant="text" prepend-icon="mdi-view-dashboard">Panel Editor</v-btn>
      </template>
      <template v-if="auth.isAdmin">
        <v-btn :to="{ name: 'admin' }" variant="text" prepend-icon="mdi-shield-account">Admin</v-btn>
      </template>

      <!-- Menú de usuario -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn icon v-bind="props" class="ml-2">
            <v-avatar color="secondary" size="32">
              <span class="text-caption font-weight-bold">{{ auth.user?.username?.[0]?.toUpperCase() }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item :subtitle="auth.user?.email" :title="auth.user?.username" />
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" title="Cerrar sesión" @click="handleLogout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Dialog selector de evento -->
    <EventSelectorDialog v-model="showEventSelector" />

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth.js';
import EventSelectorDialog from './components/EventSelectorDialog.vue';

const auth    = useAuthStore();
const router  = useRouter();
const showEventSelector = ref(false);

const roleColor = (role) => ({ ADMIN: 'error', EDITOR: 'secondary', REVIEWER: 'warning', AUTHOR: 'accent' }[role] || 'grey');
const roleLabel = (role) => ({ ADMIN: 'Admin', EDITOR: 'Editor', REVIEWER: 'Revisor', AUTHOR: 'Autor' }[role] || role);

const handleLogout = async () => {
  await auth.logout();
  router.push({ name: 'login' });
};
</script>
