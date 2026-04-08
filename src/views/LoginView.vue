<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Header con branding -->
      <div class="login-header">
        <div class="logo-icon">🎓</div>
        <h1>PeerReview</h1>
        <p class="subtitle">Sistema de Revisión por Pares — UABC FIM</p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" class="login-form" id="login-form">
        <!-- Campo username -->
        <div class="form-group" :class="{ 'has-error': errors.username }">
          <label for="login-username">Usuario</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
              id="login-username"
              v-model.trim="form.username"
              type="text"
              placeholder="Ingresa tu usuario"
              autocomplete="username"
              @input="clearError('username')"
            />
          </div>
          <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
        </div>

        <!-- Campo password -->
        <div class="form-group" :class="{ 'has-error': errors.password }">
          <label for="login-password">Contraseña</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Ingresa tu contraseña"
              autocomplete="current-password"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>

        <!-- Error del API -->
        <div v-if="apiError" class="api-error" id="login-api-error">
          <span class="error-icon">⚠️</span>
          {{ apiError }}
        </div>

        <!-- Botón submit -->
        <button
          type="submit"
          class="btn-login"
          id="login-submit"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>

      <!-- Footer -->
      <div class="login-footer">
        <p>Universidad Autónoma de Baja California</p>
        <p>Facultad de Ingeniería Mexicali</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: ''
})

const apiError = ref('')
const isLoading = ref(false)
const showPassword = ref(false)

const clearError = (field) => {
  errors[field] = ''
  apiError.value = ''
}

const validate = () => {
  let valid = true

  if (!form.username) {
    errors.username = 'El usuario es requerido.'
    valid = false
  } else if (form.username.length < 3) {
    errors.username = 'Mínimo 3 caracteres.'
    valid = false
  }

  if (!form.password) {
    errors.password = 'La contraseña es requerida.'
    valid = false
  } else if (form.password.length < 4) {
    errors.password = 'Mínimo 4 caracteres.'
    valid = false
  }

  return valid
}

const handleLogin = async () => {
  apiError.value = ''

  if (!validate()) return

  isLoading.value = true

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username,
        password: form.password
      })
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      apiError.value = data.error || 'Error al iniciar sesión.'
      return
    }

    // Guardar token y datos del usuario
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('user', JSON.stringify(data.data.user))

    // Redirigir según el rol
    const rol = data.data.user.rol
    if (rol === 'editor') {
      router.push('/editor')
    } else if (rol === 'revisor') {
      router.push('/articulos-asignados')
    } else {
      router.push('/subir-articulo')
    }
  } catch {
    apiError.value = 'No se pudo conectar al servidor.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a3a2a 0%, #2c5f4a 50%, #1a3a2a 100%);
  padding: 1rem;
}

.login-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
}

.login-header {
  background: linear-gradient(135deg, #1a5c3a, #2d8a5e);
  color: #ffffff;
  text-align: center;
  padding: 2rem 2rem 1.5rem;
}

.logo-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.login-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  opacity: 0.85;
}

.login-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.4rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  font-size: 1rem;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  background: #f9fafb;
  box-sizing: border-box;
}

.input-wrapper input:focus {
  border-color: #2d8a5e;
  box-shadow: 0 0 0 3px rgba(45, 138, 94, 0.15);
  background: #ffffff;
}

.has-error .input-wrapper input {
  border-color: #ef4444;
}

.toggle-password {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
}

.error-text {
  color: #ef4444;
  font-size: 0.78rem;
  margin-top: 0.3rem;
  display: block;
}

.api-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  font-size: 1rem;
}

.btn-login {
  width: 100%;
  padding: 0.85rem;
  background: linear-gradient(135deg, #1a5c3a, #2d8a5e);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(45, 138, 94, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  text-align: center;
  padding: 1rem 2rem 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.login-footer p {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    border-radius: 12px;
  }

  .login-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .login-form {
    padding: 1.5rem;
  }
}
</style>
