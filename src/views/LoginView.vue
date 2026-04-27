<template>
  <div class="immersive-layout d-flex align-center justify-center">
    
    <!-- Decoración sutil abstracta trasera -->
    <div class="blob-1"></div>
    <div class="blob-2"></div>

    <!-- Contenedor central flotante -->
    <v-card class="bg-white rounded-xl pa-8 pa-sm-12 z-10 elevation-4 mx-4" width="100%" max-width="480">
      
      <!-- Marca y Branding Limpio (Sin contenedor extra ni borde) -->
      <div class="text-center mb-10">
        <v-icon color="grey-darken-4" size="64" class="mb-4">mdi-book-open-page-variant</v-icon>
        <h1 class="text-h4 font-weight-medium text-grey-darken-4 tracking-wide mb-1">StudioPeer</h1>
      </div>

      <v-form @submit.prevent="handleLogin" v-model="isFormValid">
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-6 rounded-lg font-weight-medium"
          closable
        >
          {{ error }}
        </v-alert>

        <div class="mb-4">
          <span class="text-subtitle-2 font-weight-bold text-grey-darken-2 ml-1">Usuario</span>
          <v-text-field
            v-model="username"
            placeholder="jrodriguez"
            variant="outlined"
            bg-color="transparent"
            color="grey-darken-4"
            class="mt-1 rounded-lg custom-input"
            density="comfortable"
            prepend-inner-icon="mdi-account-outline"
            hide-details="auto"
            :rules="[v => !!v || 'Requerido']"
            required
          ></v-text-field>
        </div>

        <div class="mb-6">
          <span class="text-subtitle-2 font-weight-bold text-grey-darken-2 ml-1">Clave</span>
          <v-text-field
            v-model="password"
            placeholder="••••••••"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            bg-color="transparent"
            color="grey-darken-4"
            class="mt-1 rounded-lg custom-input"
            density="comfortable"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            hide-details="auto"
            :rules="[v => !!v || 'Requerida']"
            required
          ></v-text-field>
        </div>

        <div class="d-flex align-center justify-space-between mb-8 px-1">
          <v-checkbox
            label="Recordarme"
            density="compact"
            hide-details
            color="grey-darken-4"
            class="font-weight-medium text-grey-darken-2"
          ></v-checkbox>
          <a href="#" class="text-grey-darken-3 text-decoration-none font-weight-bold text-body-2 hover:opacity-100 transition-opacity">¿Recuperar clave?</a>
        </div>

        <v-btn
          type="submit"
          color="grey-darken-4"
          variant="flat"
          class="w-100 rounded-lg font-weight-bold text-none mb-4 text-white"
          size="large"
          elevation="2"
          :loading="loading"
        >
          Ingresar
        </v-btn>

        <v-btn
          variant="text"
          color="grey-darken-2"
          class="w-100 rounded-lg font-weight-medium text-none"
          size="large"
          :to="{ name: 'register' }"
        >
          Registrarse
        </v-btn>
      </v-form>

      <!-- Divisor minimalista de credenciales -->
      <div class="mt-8 pt-4 border-t border-grey-lighten-2">
        <div class="d-flex justify-space-evenly">
          <div class="text-center text-grey-darken-3">
            <div class="text-caption font-weight-bold mb-1">Admin</div>
            <div class="text-caption opacity-80"><span class="font-weight-black">admin_root</span> / 1234</div>
          </div>
          <v-divider vertical class="mx-2"></v-divider>
          <div class="text-center text-grey-darken-3">
             <div class="text-caption font-weight-bold mb-1">Usuario</div>
            <div class="text-caption opacity-80"><span class="font-weight-black">multi_user</span> / 1234</div>
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);
const isFormValid = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) return;
  
  loading.value = true;
  error.value = '';

  try {
    await auth.login({ username: username.value, password: password.value });
    const redirect = route.query.redirect || '/';
    router.push(redirect);
  } catch (err) {
    error.value = err.response?.data?.error || 'Falló al iniciar sesión.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.immersive-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

.z-10 {
  z-index: 10;
  position: relative;
}

/* Bolas sutiles para evitar pantalla plana vacía */
.blob-1 {
  position: absolute;
  top: -10%;
  left: -10%;
  width: 700px;
  height: 700px;
  background: rgba(255, 255, 255, 0.02);
  filter: blur(120px);
  border-radius: 50%;
  pointer-events: none;
}
.blob-2 {
  position: absolute;
  bottom: -20%;
  right: -10%;
  width: 800px;
  height: 800px;
  background: rgba(148, 163, 184, 0.03);
  filter: blur(140px);
  border-radius: 50%;
  pointer-events: none;
}

/* Efecto Panel Cristalino */
.glass-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3) !important;
}

.border-white-10 {
  border-color: rgba(255,255,255,0.1) !important;
}

/* Sobrescribir input de Vuetify para inputs en el panel blanco */
:deep(.v-field--variant-outlined) {
  border-radius: 8px;
  background-color: transparent;
}
:deep(input::placeholder) {
  color: rgba(0, 0, 0, 0.4) !important;
}

.transition-opacity {
  transition: opacity 0.2s ease;
}
</style>
