<template>
  <div class="split-layout">
    <!-- Branding / Image Side (Left on Desktop, Top on Mobile) -->
    <div class="brand-side d-flex flex-column justify-center align-center position-relative">
      <div class="blob-1"></div>
      <div class="blob-2"></div>
      
      <div class="z-10 text-center text-white px-8">
        <v-avatar color="white" size="80" class="mb-6 elevation-4" rounded="xl">
          <v-icon color="primary" size="40">mdi-account-plus</v-icon>
        </v-avatar>
        <h1 class="text-h3 font-weight-black mb-4">Únete a la Red</h1>
        <p class="text-h6 font-weight-regular opacity-90 mx-auto" style="max-width: 400px; line-height: 1.4;">
          Forma parte de la comunidad de investigadores y revisores académicos más avanzada.
        </p>
      </div>
    </div>

    <!-- Register Form Side -->
    <div class="form-side bg-surface d-flex flex-column justify-center align-center">
      <v-card class="elevation-0 border-card w-100 mx-auto bg-white pa-8 pa-sm-12 rounded-xl" max-width="480">
        <div class="text-center mb-8">
          <h2 class="text-h4 font-weight-black text-grey-darken-4 mb-2">Crear Cuenta</h2>
          <p class="text-body-1 text-grey-darken-1">Registra tus credenciales para comenzar</p>
        </div>

        <v-form @submit.prevent="handleRegister" v-model="isFormValid">
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
            <span class="text-subtitle-2 font-weight-bold text-grey-darken-2 ml-1">Nombre de Usuario</span>
            <v-text-field
              v-model="form.username"
              placeholder="Ej. jrodriguez"
              variant="outlined"
              color="primary"
              bg-color="grey-lighten-4"
              class="mt-1 rounded-lg custom-input"
              density="comfortable"
              prepend-inner-icon="mdi-account-outline"
              hide-details="auto"
              :rules="[v => !!v || 'Requerido', v => v.length >= 3 || 'Mínimo 3 caracteres']"
            ></v-text-field>
          </div>

          <div class="mb-4">
            <span class="text-subtitle-2 font-weight-bold text-grey-darken-2 ml-1">Correo Electrónico</span>
            <v-text-field
              v-model="form.email"
              placeholder="correo@institucion.edu"
              variant="outlined"
              color="primary"
              bg-color="grey-lighten-4"
              class="mt-1 rounded-lg custom-input"
              density="comfortable"
              prepend-inner-icon="mdi-email-outline"
              type="email"
              hide-details="auto"
              :rules="[v => !!v || 'Requerido', v => /.+@.+\..+/.test(v) || 'Correo inválido']"
            ></v-text-field>
          </div>

          <div class="mb-4">
            <span class="text-subtitle-2 font-weight-bold text-grey-darken-2 ml-1">Contraseña</span>
            <v-text-field
              v-model="form.password"
              placeholder="••••••••"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              color="primary"
              bg-color="grey-lighten-4"
              class="mt-1 rounded-lg custom-input"
              density="comfortable"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              hide-details="auto"
              :rules="[v => !!v || 'Requerido', v => v.length >= 6 || 'Mínimo 6 caracteres']"
            ></v-text-field>
          </div>

          <div class="mb-8">
            <span class="text-subtitle-2 font-weight-bold text-grey-darken-2 ml-1">Código de Congreso (Opcional)</span>
            <v-text-field
              v-model="form.accessCode"
              placeholder="G-XXXX-XXXX"
              variant="outlined"
              color="primary"
              bg-color="grey-lighten-4"
              class="mt-1 rounded-lg custom-input"
              density="comfortable"
              prepend-inner-icon="mdi-ticket-confirmation-outline"
              hide-details="auto"
              hint="Código proporcionado por el comité editorial de tu congreso"
              persistent-hint
            ></v-text-field>
          </div>

          <v-btn
            type="submit"
            color="primary"
            class="w-100 rounded-pill font-weight-bold text-none mb-4"
            size="x-large"
            elevation="2"
            :loading="loading"
            :disabled="!isFormValid"
          >
            Completar Registro
          </v-btn>

          <div class="text-center mt-4">
            <span class="text-grey-darken-1">¿Ya tienes una cuenta? </span>
            <router-link :to="{ name: 'login' }" class="text-primary font-weight-bold text-decoration-none hover:underline">
              Inicia sesión aquí
            </router-link>
          </div>
        </v-form>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const auth = useAuthStore();

const isFormValid = ref(false);
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');

const form = reactive({
  username: '',
  email: '',
  password: '',
  accessCode: '',
});

const handleRegister = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = '';

  try {
    await auth.register(form);
    // Tras el registro, login automático suele ser util (dependiendo si register de auth.js de Pinia hace login)
    // El Pinia register ya hace dispatch de auth y pone token.
    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.error || 'No se pudo crear la cuenta, revisa tus datos.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.split-layout {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.brand-side {
  flex: 1;
  background: linear-gradient(135deg, #1A2B4C 0%, #0d1b33 100%);
  position: relative;
  overflow: hidden;
}

.form-side {
  flex: 1;
  padding: 2rem;
}

.z-10 {
  z-index: 10;
}

.blob-1 {
  position: absolute;
  top: -10%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: rgba(41, 98, 255, 0.15);
  filter: blur(100px);
  border-radius: 50%;
}

.blob-2 {
  position: absolute;
  bottom: -20%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: rgba(0, 200, 83, 0.1);
  filter: blur(120px);
  border-radius: 50%;
}

:deep(.v-field--variant-outlined) {
  border-radius: 12px;
}
:deep(.v-field__overlay) {
  background-color: #f5f5f5 !important;
}

@media (max-width: 960px) {
  .split-layout {
    flex-direction: column;
  }
  .brand-side {
    flex: none;
    padding: 3rem 1rem;
    min-height: 30vh;
  }
  .form-side {
    flex: 1;
    border-radius: 24px 24px 0 0;
    margin-top: -24px;
    z-index: 20;
    padding: 2rem 1rem;
  }
}
</style>
