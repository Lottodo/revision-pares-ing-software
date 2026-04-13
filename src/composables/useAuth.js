// src/composables/useAuth.js
import { ref, computed, readonly } from 'vue'
import { useRouter } from 'vue-router'

// Estado global reactivo (singleton fuera del composable)
const token = ref(localStorage.getItem('token') || '')
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const isLoading = ref(false)
const error = ref('')

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  /**
   * Inicia sesión con username y password.
   * Guarda el token y datos del usuario en localStorage y estado reactivo.
   */
  const login = async (username, password) => {
    isLoading.value = true
    error.value = ''

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        error.value = data.error || 'Error al iniciar sesión.'
        return null
      }

      // Guardar en estado y localStorage
      token.value = data.data.token
      user.value = data.data.user
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))

      return data.data.user
    } catch {
      error.value = 'No se pudo conectar al servidor.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cierra sesión: limpia token, usuario y redirige a /login.
   */
  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  /**
   * Obtiene los datos del usuario autenticado desde /api/auth/me.
   * Útil para restaurar sesión al recargar la página.
   */
  const fetchUser = async () => {
    if (!token.value) return null

    isLoading.value = true
    error.value = ''

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })

      if (res.status === 401 || res.status === 403) {
        // Token expirado o inválido
        logout()
        return null
      }

      const data = await res.json()

      if (!res.ok || !data.success) {
        error.value = data.error || 'Error al obtener usuario.'
        return null
      }

      user.value = data.data
      localStorage.setItem('user', JSON.stringify(data.data))
      return data.data
    } catch {
      error.value = 'No se pudo conectar al servidor.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Helper para hacer fetch autenticado (agrega el header Authorization).
   */
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token.value}`
    }

    const res = await fetch(url, { ...options, headers })

    // Interceptar 401 globalmente
    if (res.status === 401) {
      logout()
      return res
    }

    return res
  }

  return {
    // Estado (readonly para prevenir mutación directa)
    token: readonly(token),
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated,

    // Acciones
    login,
    logout,
    fetchUser,
    authFetch
  }
}
