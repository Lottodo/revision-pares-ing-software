<template>
  <div class="login-page">
    <v-card class="login-card elevation-10 rounded-xl overflow-hidden border-card">
      <div class="bg-gradient-header pa-8 text-center">
        <h2 class="text-white font-weight-black text-h4 mb-2">
          Studio<span class="text-green-lighten-2">Peer</span>
        </h2>
        <div class="text-white opacity-80 font-weight-medium">
          Sistema de Revisión por Pares — UABC FIM
        </div>
      </div>

      <v-card-text class="pa-10">
        <v-form @submit.prevent="handleLogin" id="login-form">
          <v-text-field
            v-model.trim="form.username"
            label="Usuario"
            placeholder="Usuario institucional"
            variant="outlined"
            density="comfortable"
            :error-messages="errors.username"
            @input="clearError('username')"
            class="mb-4 font-weight-medium"
            bg-color="grey-lighten-4"
            prepend-inner-icon="mdi-account-outline"
          ></v-text-field>

          <v-text-field
            v-model="form.password"
            label="Contraseña"
            placeholder="Tu contraseña segura"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            :error-messages="errors.password"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            prepend-inner-icon="mdi-lock-outline"
            @click:append-inner="showPassword = !showPassword"
            @input="clearError('password')"
            class="mb-6 font-weight-medium"
            bg-color="grey-lighten-4"
          ></v-text-field>

          <!-- Error del API -->
          <v-slide-y-transition>
            <div v-if="apiError || authError">
              <v-alert
                type="error"
                variant="tonal"
                class="mb-6 rounded-lg font-weight-bold"
                density="compact"
              >
                {{ apiError || authError }}
              </v-alert>
            </div>
          </v-slide-y-transition>

          <v-btn
            type="submit"
            color="green-darken-3"
            class="text-white font-weight-black mt-2 rounded-pill shadow-sm"
            size="x-large"
            block
            :loading="isLoading"
            elevation="2"
          >
            Acceder al Sistema
            <v-icon end size="20" class="ml-2">mdi-arrow-right</v-icon>
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login, error: authError, isLoading } = useAuth()

const form = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: ''
})

const apiError = ref('')
const showPassword = ref(false)

const clearError = (field) => {
  errors[field] = ''
  apiError.value = ''
}

const validate = () => {
  let valid = true

  if (!form.username) {
    errors.username = 'Requerido.'
    valid = false
  }
  if (!form.password) {
    errors.password = 'Requerido.'
    valid = false
  }

  return valid
}

const handleLogin = async () => {
  apiError.value = ''

  if (!validate()) return

  // Utilizar el endpoint del composable para mantener el estado reactivo vivo
  const userData = await login(form.username, form.password)

  if (userData) {
    // Redirigir según el rol
    const rol = (userData.rol || userData.role || '').toLowerCase()
    if (rol === 'editor') {
      router.push('/editor')
    } else if (rol === 'revisor') {
      router.push('/articulos-asignados')
    } else {
      router.push('/subir-articulo')
    }
  }
  // Si falla, el authError se mostrará
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f4f7f6 0%, #e0e8e4 100%);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 480px;
  background-color: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
}

.bg-gradient-header {
  background: linear-gradient(135deg, #0f3e2b 0%, #1a5c3a 100%);
}

.border-card {
  border: 1px solid rgba(0,0,0,0.05);
}

.shadow-sm {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
}
</style>
