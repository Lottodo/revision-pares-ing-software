<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card elevation="8" rounded="xl">
          <v-card-item class="bg-primary pa-6">
            <v-icon size="40" class="mb-2">mdi-school</v-icon>
            <v-card-title class="text-h5 text-white">Sistema de Revisión</v-card-title>
            <v-card-subtitle class="text-white opacity-80">Gestión de Congresos Académicos</v-card-subtitle>
          </v-card-item>

          <v-card-text class="pa-6">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="form.username"
                label="Usuario"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                :error-messages="errors.username"
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
                class="mb-4"
              />

              <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" density="compact">
                {{ errorMsg }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loading"
                rounded="lg"
              >
                Iniciar Sesión
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider />
          <v-card-text class="pa-4">
            <p class="text-caption text-medium-emphasis text-center mb-2">Cuentas de prueba (password: 1234)</p>
            <v-chip-group class="justify-center" column>
              <v-chip
                v-for="u in demoUsers"
                :key="u"
                size="small"
                variant="tonal"
                color="secondary"
                @click="form.username = u; form.password = '1234'"
              >{{ u }}</v-chip>
            </v-chip-group>
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
const showPassword = ref(false);

const form   = reactive({ username: '', password: '' });
const errors = reactive({ username: '', password: '' });

const demoUsers = ['admin', 'editor_ia', 'editor_sw', 'revisor1', 'revisor2', 'autor1', 'multiusuario'];

const validate = () => {
  errors.username = form.username.trim() ? '' : 'Usuario requerido';
  errors.password = form.password        ? '' : 'Contraseña requerida';
  return !errors.username && !errors.password;
};

const handleLogin = async () => {
  if (!validate()) return;
  loading.value = true;
  errorMsg.value = '';
  try {
    const result = await auth.login({ username: form.username.trim(), password: form.password });
    // Si no tiene evento activo → selector de eventos
    if (!auth.eventId) {
      router.push({ name: 'select-event' });
    } else if (auth.isAdmin || auth.isEditor) {
      router.push({ name: 'editor' });
    } else if (auth.isReviewer) {
      router.push({ name: 'reviewer' });
    } else {
      router.push({ name: 'author' });
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.error || 'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
};
</script>
