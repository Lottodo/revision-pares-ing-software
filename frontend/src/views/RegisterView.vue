<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card elevation="8" rounded="xl">
          <v-card-item class="bg-primary pa-6">
            <v-icon size="40" class="mb-2">mdi-account-plus</v-icon>
            <v-card-title class="text-h5 text-white">Crear Cuenta</v-card-title>
            <v-card-subtitle class="text-white opacity-80">Registro en el Sistema de Revisión</v-card-subtitle>
          </v-card-item>

          <v-card-text class="pa-6">
            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="form.username"
                label="Usuario"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                :error-messages="errors.username"
                class="mb-3"
              />
              <v-text-field
                v-model="form.email"
                label="Correo electrónico"
                type="email"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                :error-messages="errors.email"
                class="mb-3"
              />
              <v-text-field
                v-model="form.password"
                label="Contraseña"
                prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                :error-messages="errors.password"
                class="mb-3"
              />
              <v-text-field
                v-model="form.accessCode"
                label="ID de Congreso (Opcional)"
                placeholder="Ej. 2026-04-COMPUTACION-MADRID"
                prepend-inner-icon="mdi-school"
                variant="outlined"
                class="mb-4"
              />

              <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" density="compact">
                {{ errorMsg }}
              </v-alert>

              <v-alert v-if="successMsg" type="success" variant="tonal" class="mb-4" density="compact">
                {{ successMsg }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loading"
                rounded="lg"
                v-if="!successMsg"
              >
                Registrarse
              </v-btn>
              
              <v-btn
                v-else
                color="primary"
                block
                size="large"
                rounded="lg"
                to="/login"
              >
                Ir a Iniciar Sesión
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider />
          <v-card-text class="pa-4 text-center">
            <span class="text-medium-emphasis">¿Ya tienes cuenta? </span>
            <router-link to="/login" class="text-primary font-weight-bold text-decoration-none">Inicia sesión aquí</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const auth     = useAuthStore();
const router   = useRouter();
const loading  = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
const showPassword = ref(false);

const form   = reactive({ username: '', email: '', password: '', accessCode: '' });
const errors = reactive({ username: '', email: '', password: '' });

const validate = () => {
  errors.username = form.username.trim() ? '' : 'Usuario requerido';
  errors.email = form.email.trim() ? '' : 'Correo requerido';
  errors.password = form.password ? '' : 'Contraseña requerida';
  return !errors.username && !errors.email && !errors.password;
};

const handleRegister = async () => {
  if (!validate()) return;
  loading.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    await auth.register({ 
      username: form.username.trim(), 
      email: form.email.trim(),
      password: form.password,
      accessCode: form.accessCode.trim()
    });
    if (form.accessCode.trim()) {
      successMsg.value = 'Cuenta creada y asociada al congreso exitosamente.';
    } else {
      successMsg.value = 'Cuenta creada exitosamente. Ingresa para unirte a un congreso.';
    }
    form.username = '';
    form.email = '';
    form.password = '';
    form.accessCode = '';
  } catch (e) {
    errorMsg.value = e.response?.data?.error || 'Error al registrar la cuenta';
  } finally {
    loading.value = false;
  }
};
</script>
