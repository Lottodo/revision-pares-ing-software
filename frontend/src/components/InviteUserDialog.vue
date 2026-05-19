<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="500">
    <v-card rounded="xl">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-white text-body-1">
          Invitar a: <strong>{{ event?.name }}</strong>
        </v-toolbar-title>
        <v-btn icon="mdi-close" color="white" variant="text" @click="close"></v-btn>
      </v-toolbar>
      
      <v-card-text class="pa-4">
        <v-form @submit.prevent="sendInvite" ref="form">
          <p class="mb-4 text-body-2 text-medium-emphasis">
            Puedes invitar por correo electrónico (incluso si no están registrados aún) o por su nombre de usuario.
          </p>

          <v-text-field
            v-model="identifier"
            label="Correo electrónico o Username"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Campo requerido']"
            required
          ></v-text-field>

          <v-select
            v-model="role"
            :items="roles"
            item-title="title"
            item-value="value"
            label="Rol a asignar"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Debe seleccionar un rol']"
            required
          ></v-select>

          <div class="d-flex justify-end mt-4">
            <v-btn variant="text" @click="close" class="mr-2">Cancelar</v-btn>
            <v-btn color="primary" type="submit" :loading="loading" class="px-6" rounded="lg">
              Enviar Invitación
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { invitationsApi } from '../api/index.js';

const props = defineProps({
  modelValue: Boolean,
  event: Object,
});

const emit = defineEmits(['update:modelValue']);
const loading = ref(false);
const form = ref(null);

const identifier = ref('');
const role = ref('REVIEWER');

const roles = [
  { title: 'Revisor', value: 'REVIEWER' },
  { title: 'Editor', value: 'EDITOR' },
  { title: 'Autor', value: 'AUTHOR' },
];

const sendInvite = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const isEmail = identifier.value.includes('@');
    await invitationsApi.send({
      eventId: props.event.id,
      email: isEmail ? identifier.value : null,
      username: !isEmail ? identifier.value : null,
      role: role.value,
    });
    alert('Invitación enviada exitosamente.');
    close();
  } catch (e) {
    alert(e.response?.data?.error || 'Error al enviar invitación');
  } finally {
    loading.value = false;
  }
};

const close = () => {
  emit('update:modelValue', false);
  identifier.value = '';
  role.value = 'REVIEWER';
};
</script>
