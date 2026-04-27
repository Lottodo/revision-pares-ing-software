<template>
  <v-app class="bg-background">
    <!-- Cargar interfaz corporativa solo si hay usuario Y NO está en la sala de selección inmersiva -->
    <template v-if="auth.isAuthenticated && $route.name !== 'select-event'">
      
      <!-- TOPBAR ELEGANTE -->
      <v-app-bar :absolute="$vuetify.display.mdAndDown" elevation="0" color="surface" border="b" height="60" class="px-0">
        <!-- Contenedor Wrapper de Scroll Horizontal Inyectado -->
        <div class="d-flex align-center w-100 h-100 px-2 overflow-x-auto hide-scrollbar">
          <!-- Botón Universal de Drawer -->
          <v-btn
            icon
            class="mr-1 flex-shrink-0"
            color="medium-emphasis"
            @click="drawer = !drawer"
          >
            <v-icon size="28">mdi-menu</v-icon>
            <v-tooltip activator="parent" location="bottom">
              Alternar Menú
            </v-tooltip>
          </v-btn>

          <!-- Identificador del Congreso Activo -->
          <div v-if="auth.eventId" class="d-flex align-center ml-2 bg-background px-4 py-2 rounded-xl flex-shrink-0">
            <v-icon color="secondary" size="20" class="mr-2">mdi-domain</v-icon>
            <div class="d-flex flex-column" style="line-height: 1.1;">
              <span class="text-caption font-weight-bold text-medium-emphasis text-uppercase" style="font-size: 0.65rem !important;">Congreso Activo</span>
              <span class="font-weight-black text-high-emphasis text-truncate text-body-2" style="max-width: 140px;">
                {{ auth.activeEvent?.event?.name || 'Selecciona un congreso' }}
              </span>
            </div>
            <!-- Selector de evento -->
            <v-btn icon size="small" variant="text" class="ml-2" color="secondary" @click="showEventSelector = true">
              <v-icon>mdi-swap-horizontal</v-icon>
              <v-tooltip activator="parent">Cambiar evento</v-tooltip>
            </v-btn>
          </div>

          <v-spacer class="flex-grow-1"></v-spacer>

          <!-- Chips de roles activos (Cambiaron de lugar para agruparse a la derecha) -->
          <div class="d-flex align-center mr-4 flex-shrink-0" v-if="auth.eventId">
            <v-chip
              v-for="role in auth.roles"
              :key="role"
              :color="roleColor(role)"
              size="small"
              class="mr-1 font-weight-bold"
              variant="flat"
            >
              {{ roleLabel(role) }}
            </v-chip>
          </div>

          <!-- Selector de Tema Visual -->
          <v-menu transition="slide-y-transition" rounded="xl">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" class="mr-2 flex-shrink-0" color="medium-emphasis">
                <v-icon>mdi-palette-outline</v-icon>
                <v-tooltip activator="parent" location="bottom">Cambiar Tema</v-tooltip>
              </v-btn>
            </template>
            <v-card class="pa-2 rounded-xl elevation-3 border-card" min-width="180">
              <div class="px-3 py-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">Temas Profesionales</div>
              <v-list density="compact" class="bg-transparent">
                <v-list-item
                  v-for="item in availableThemes"
                  :key="item.value"
                  @click="changeTheme(item.value)"
                  rounded="lg"
                  class="mb-1"
                  :active="theme.global.name.value === item.value"
                  active-color="primary"
                >
                  <template v-slot:prepend>
                    <v-icon :color="item.color" class="mr-2">{{ item.icon }}</v-icon>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ item.title }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>

          <!-- Menú de Usuario -->
          <v-menu transition="slide-y-transition" rounded="xl">
            <template #activator="{ props }">
              <v-btn v-bind="props" class="text-none font-weight-bold px-2 rounded-pill flex-shrink-0" height="48" variant="text">
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="36" class="mr-3 text-white elevation-1">
                    <span class="text-subtitle-1 font-weight-black">{{ auth.user?.username?.[0]?.toUpperCase() || 'U' }}</span>
                  </v-avatar>
                  <div class="d-flex flex-column align-start text-left d-none d-sm-flex mr-1">
                    <span class="text-body-2 font-weight-bold text-high-emphasis" style="line-height:1;">{{ auth.user?.username }}</span>
                    <span class="text-caption text-medium-emphasis">Cuenta Activa</span>
                  </div>
                  <v-icon size="20" color="medium-emphasis">mdi-chevron-down</v-icon>
                </div>
              </v-btn>
            </template>
            
            <v-card min-width="260" class="rounded-xl border-card elevation-4 mt-2 bg-surface">
              <v-list class="pa-2 bg-transparent">
                <v-list-item class="rounded-lg mb-1">
                  <template #prepend>
                    <v-avatar color="primary" size="44" class="text-white">
                      <span class="text-h6 font-weight-black">{{ auth.user?.username?.[0]?.toUpperCase() || 'U' }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-bold">{{ auth.user?.username }}</v-list-item-title>
                  <v-list-item-subtitle>{{ auth.user?.email }}</v-list-item-subtitle>
                </v-list-item>
                <v-divider class="my-2"></v-divider>
                <v-list-item prepend-icon="mdi-logout" class="text-error rounded-lg" @click="handleLogout">
                  <v-list-item-title class="font-weight-bold">Cerrar Sesión</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </v-app-bar>

      <!-- SIDEBAR LATERAL PROFESIONAL -->
      <!-- Usa rail y clases nativas con transiciones fluídas en CSS base flexbox -->
      <v-navigation-drawer
        v-model="drawer"
        :absolute="$vuetify.display.mdAndDown"
        :rail="!isPinned && !$vuetify.display.mdAndDown"
        :rail-width="76"
        color="surface"
        class="border-r transition-width"
        width="280"
        elevation="0"
      >
        <v-list density="compact" class="pa-2 smooth-rail">
          <v-list-item 
            class="mt-1 rounded-lg" 
            @click="$router.push('/')"
            prepend-icon="mdi-book-open-page-variant"
            base-color="primary"
          >
            <v-list-item-title class="text-h6 font-weight-black text-primary">
              StudioPeer
            </v-list-item-title>
            <v-list-item-subtitle class="text-overline text-medium-emphasis font-weight-bold" style="line-height:1;">
              Review System
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider class="mx-4 my-2 opacity-50 smooth-opacity"></v-divider>

        <v-list density="compact" nav class="px-2 pt-0 smooth-rail overflow-y-auto">
          <!-- Subheader se colapsa en rail con la clase subtitle-transition -->
          <v-list-subheader class="text-caption font-weight-bold tracking-wide pl-2 text-truncate subtitle-transition" style="min-height: 0; overflow: hidden;">
            <span>Funcionalidades</span>
          </v-list-subheader>
          
          <v-list-item
            v-if="auth.isAuthor || auth.isAdmin"
            :to="{ name: 'author' }"
            prepend-icon="mdi-file-document-edit"
            color="primary"
            class="rounded-lg mb-1"
            active-class="bg-primary-lighten-5 font-weight-bold"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">Mis Artículos</v-list-item-title>
            <!-- Tooltip nativo reacomodado -->
            <v-tooltip activator="parent" location="right" v-if="!isPinned && !$vuetify.display.mdAndDown">Mis Artículos</v-tooltip>
          </v-list-item>

          <v-list-item
            v-if="auth.isReviewer"
            :to="{ name: 'reviewer' }"
            prepend-icon="mdi-clipboard-check-multiple"
            color="primary"
            class="rounded-lg mb-1"
            active-class="bg-primary-lighten-5 font-weight-bold"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">Revisiones Pendientes</v-list-item-title>
            <v-tooltip activator="parent" location="right" v-if="!isPinned && !$vuetify.display.mdAndDown">Revisiones Pendientes</v-tooltip>
          </v-list-item>
          
          <v-list-item
            v-if="auth.isEditor || auth.isAdmin"
            :to="{ name: 'editor' }"
            prepend-icon="mdi-view-dashboard-outline"
            color="primary"
            class="rounded-lg mb-1"
            active-class="bg-primary-lighten-5 font-weight-bold"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">Panel Editorial</v-list-item-title>
            <v-tooltip activator="parent" location="right" v-if="!isPinned && !$vuetify.display.mdAndDown">Panel Editorial</v-tooltip>
          </v-list-item>

          <v-list-item
            v-if="auth.isAdmin"
            :to="{ name: 'admin' }"
            prepend-icon="mdi-shield-crown"
            color="error"
            class="rounded-lg mb-1"
            active-class="bg-red-lighten-5 font-weight-bold text-error"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">Administración</v-list-item-title>
            <v-tooltip activator="parent" location="right" v-if="!isPinned && !$vuetify.display.mdAndDown">Administración</v-tooltip>
          </v-list-item>
        </v-list>
        
        <template v-slot:append>
          <v-list density="compact" nav class="px-2 pb-3 smooth-rail">
             <!-- Pin Button (Desktop) recuperado por instrucción explícita -->
             <v-list-item
               v-if="!$vuetify.display.mdAndDown"
               variant="text" 
               color="primary"
               class="rounded-lg mb-2 pin-btn-item d-none d-md-flex"
               @click.stop="togglePin"
             >
               <template v-slot:prepend>
                 <v-icon :class="{ 'pin-icon-active': isPinned }" color="medium-emphasis">
                   {{ isPinned ? 'mdi-pin' : 'mdi-pin-outline' }}
                 </v-icon>
               </template>
               <v-list-item-title class="font-weight-bold text-medium-emphasis">
                 {{ isPinned ? 'Desanclar Panel' : 'Anclar Panel' }}
               </v-list-item-title>
               <v-tooltip activator="parent" location="right" v-if="!isPinned">{{ isPinned ? 'Desanclar' : 'Anclar' }}</v-tooltip>
             </v-list-item>
             
             <!-- Configuración: resaltado sutil, no parecido a "activo" -->
             <v-list-item
               class="rounded-lg config-btn"
               prepend-icon="mdi-cog-outline"
             >
               <v-list-item-title class="text-body-2 font-weight-bold">Configuración</v-list-item-title>
               <v-tooltip activator="parent" location="right" v-if="!isPinned && !$vuetify.display.mdAndDown">Configuración</v-tooltip>
             </v-list-item>
          </v-list>
        </template>
      </v-navigation-drawer>
    </template>

    <!-- Dialog selector de evento global -->
    <EventSelectorDialog v-model="showEventSelector" />

    <!-- MAIN CONTENT (FLUID) -->
    <v-main class="bg-background d-flex flex-column h-100 transition-main">
      <div class="flex-grow-1 position-relative">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth.js';
import { useDisplay, useTheme } from 'vuetify';

import EventSelectorDialog from './components/EventSelectorDialog.vue';

const auth    = useAuthStore();
const router  = useRouter();
const display = useDisplay();
const theme   = useTheme();

const availableThemes = [
  { title: 'Claro (Clásico)', value: 'light', icon: 'mdi-white-balance-sunny', color: '#F59E0B' },
  { title: 'Oscuro (Nocturno)', value: 'dark', icon: 'mdi-weather-night', color: '#818CF8' },
  { title: 'Profundo (Ocean)', value: 'ocean', icon: 'mdi-water', color: '#38BDF8' },
  { title: 'Orgánico (Emerald)', value: 'emerald', icon: 'mdi-leaf', color: '#34D399' },
];

const changeTheme = (newTheme) => {
  theme.global.name.value = newTheme;
  localStorage.setItem('studiopeer-theme', newTheme);
};

const drawer = ref(true);
const isPinned = ref(true); 
const showEventSelector = ref(false);

const roleColor = (role) => ({ ADMIN: 'error', EDITOR: 'secondary', REVIEWER: 'warning', AUTHOR: 'primary' }[role] || 'grey');
const roleLabel = (role) => ({ ADMIN: 'Admin', EDITOR: 'Editor', REVIEWER: 'Revisor', AUTHOR: 'Autor' }[role] || role);

onMounted(() => {
  const storedPin = localStorage.getItem('studiopeer-sidebar-pinned');
  if (storedPin !== null) {
    isPinned.value = storedPin === 'true';
  }
});

const togglePin = () => {
  isPinned.value = !isPinned.value;
  localStorage.setItem('studiopeer-sidebar-pinned', isPinned.value);
};

watchEffect(() => {
  if (display.mdAndDown.value) {
    drawer.value = false;
  } else {
    drawer.value = true;
  }
});

const handleLogout = async () => {
  await auth.logout();
  router.push({ name: 'login' });
};
</script>

<style>
/* CLASES GLOBALES DE ESTILO DEL PROYECTO */
.border-card {
  border: 1px solid rgba(120, 120, 120, 0.15);
}
.tracking-wide {
  letter-spacing: 0.05em;
}
.bg-primary-lighten-5 {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}
.bg-red-lighten-5 {
  background-color: rgba(var(--v-theme-error), 0.1) !important;
}

/* Colapsar subheader en modo rail: íconos empiezan desde el divisor */
.v-navigation-drawer--rail .subtitle-transition {
  min-height: 0 !important;
  height: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
  transition: height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease, min-height 0.4s !important;
}

/* =========================================================
   ANIMACIONES SUAVES DEL SIDEBAR NATIVAS - AISLAMIENTO DE FLUJO
   ========================================================= */

/* Contenedores principales (v-main y sidebar) - Animación del contenedor */
.v-navigation-drawer,
.v-navigation-drawer__content,
.v-main {
  transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), padding-left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.4s ease !important;
}

/* Forzamos que cada botón sea relativo y de ancho dinámico fluido */
.smooth-rail .v-list-item {
  position: relative !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  overflow: hidden !important;
  padding-left: 16px !important;
  padding-right: 16px !important;
  width: 100% !important;
  max-width: 300px !important;
  margin-bottom: 2px !important;
  transition:
    max-width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
    padding-left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
    padding-right 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
    margin-bottom 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
    margin-left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
    margin-right 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
    min-height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
}

/* EL SECRETO: Hacemos que los contenedores de íconos no reaccionen a márgenes externos */
.smooth-rail .v-list-item__prepend {
  flex-shrink: 0 !important;
  width: 24px !important;
  height: 24px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  margin: 0 !important; 
  padding: 0 !important;
}



/* AISLAMIENTO CSS: Extraemos los textos del flujo Flex para que no "tiren" de la caja al desaparecer */
.smooth-rail .v-list-item__content,
.smooth-rail .v-list-item__spacer,
.smooth-rail .v-list-item__append {
  position: absolute !important;
  left: 56px !important; /* Distancia segura desde el borde izquierdo esquivando el icono */
  width: max-content !important;
  opacity: 1 !important;
  transition: opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  transform: translateX(0);
}



/* Títulos sueltos como "Funcionalidades" */
.subtitle-transition {
  transition: opacity 0.3s ease !important;
}

/* =========================================================
   ESTADO DESANCLADO (RAIL MODE) - ENCOGIMIENTO Y CENTRADO COMPENSADO
   ========================================================= */

.v-navigation-drawer--rail .smooth-rail .v-list-item {
  max-width: 52px !important;
  min-height: 44px !important;
  padding-left: 14px !important;
  padding-right: 14px !important;
  margin-left: auto !important;
  margin-right: auto !important;
  margin-bottom: 2px !important; /* comprimido: los iconos suben juntos */
}



/* Desvanecer suavemente el contenido ahora que ya no empuja la caja */
.v-navigation-drawer--rail .smooth-rail .v-list-item__content,
.v-navigation-drawer--rail .smooth-rail .v-list-item__spacer,
.v-navigation-drawer--rail .smooth-rail .v-list-item__append,
.v-navigation-drawer--rail .subtitle-transition {
  opacity: 0 !important;
  transform: translateX(-8px); /* Ligero desliz de desvanecimiento hacia atrás */
  pointer-events: none !important;
}

/* Extras: Animación del PIN Icon */
.pin-icon-active {
  transform: rotate(45deg);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.4s;
}

/* Configuración: borde sutil izquierdo sin parecer seleccionado */
.config-btn {
  border-left: 3px solid rgba(var(--v-theme-primary), 0.25) !important;
  background: transparent !important;
  transition: border-color 0.2s ease, background 0.2s ease !important;
}
.config-btn:hover {
  border-left-color: rgba(var(--v-theme-primary), 0.6) !important;
  background: rgba(var(--v-theme-primary), 0.05) !important;
}

/* Router Views Transition */
.transition-main {
  transition: padding-left 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
