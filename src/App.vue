<template>
  <v-app id="app-container" theme="light">
    <v-app-bar v-if="isAuthenticated" color="rgba(255, 255, 255, 0.85)" class="glass-nav" elevation="1">
      <v-app-bar-title class="font-weight-black text-green-darken-4 text-h5 ml-4">
        Studio<span class="text-black">Peer</span>
      </v-app-bar-title>
      
      <v-spacer></v-spacer>

      <div class="d-flex align-center mr-4 gap-2">
        <template v-if="userRoles.includes('autor')">
          <v-btn variant="text" prepend-icon="mdi-upload" to="/subir-articulo" class="text-grey-darken-3 font-weight-medium rounded-pill me-1" active-class="bg-grey-lighten-4 text-green-darken-4">Subir Artículo</v-btn>
          <v-btn variant="text" prepend-icon="mdi-format-list-checks" to="/estado-articulos" class="text-grey-darken-3 font-weight-medium rounded-pill me-1" active-class="bg-grey-lighten-4 text-green-darken-4">Tus Manuscritos</v-btn>
        </template>

        <template v-if="userRoles.includes('revisor')">
          <v-btn variant="text" prepend-icon="mdi-text-box-search-outline" to="/articulos-asignados" class="text-grey-darken-3 font-weight-medium rounded-pill me-1" active-class="bg-grey-lighten-4 text-green-darken-4">Tareas Revisor</v-btn>
        </template>

        <template v-if="userRoles.includes('editor')">
          <v-btn variant="text" prepend-icon="mdi-view-dashboard-outline" to="/editor" class="text-grey-darken-3 font-weight-medium rounded-pill me-1" active-class="bg-grey-lighten-4 text-green-darken-4">Panel Editor</v-btn>
        </template>

        <v-btn variant="flat" color="blue-grey-darken-4" class="rounded-pill font-weight-bold px-6 ml-2 shadow-sm" prepend-icon="mdi-logout" @click="handleLogout">Salir</v-btn>
      </div>
    </v-app-bar>

    <v-main class="bg-surface">
      <v-container :class="{ 'py-10': isAuthenticated, 'pa-4': true }" fluid class="max-width-container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, token, logout } = useAuth()

const isAuthenticated = computed(() => !!token.value)
// Dynamic role calculation that respects the ref user object and falls back to storage if needed
const userRoles = computed(() => {
  let roles = [];
  
  if (user.value?.roles) roles = user.value.roles;
  else if (user.value?.rol) roles = [user.value.rol];
  else if (user.value?.role) roles = [user.value.role];
  else {
    try {
      const defaultData = JSON.parse(localStorage.getItem('user') || '{}');
      if (defaultData.roles) roles = defaultData.roles;
      else if (defaultData.rol) roles = [defaultData.rol];
      else if (defaultData.role) roles = [defaultData.role];
    } catch {
      // do nothing
    }
  }

  return Array.isArray(roles) ? roles : [roles];
})

const handleLogout = () => {
  logout()
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #FAFAFA; 
}

/* Glassmorphism nav */
.glass-nav {
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.max-width-container {
  max-width: 1400px;
  margin: 0 auto;
}

.bg-surface {
  background-color: #FAFAFA;
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>