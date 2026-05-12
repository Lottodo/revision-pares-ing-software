<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="xl">
      <v-card-title class="pa-4 bg-primary text-white">Cambiar Congreso</v-card-title>
      <v-card-text class="pa-4">
        <v-row>
          <v-col v-for="ev in auth.userEvents" :key="ev.event.id" cols="12" sm="6">
            <v-card
              variant="outlined"
              rounded="lg"
              :color="auth.eventId === ev.event.id ? 'primary' : undefined"
              hover
              @click="select(ev.event.id)"
            >
              <v-card-item>
                <v-card-title class="text-body-2">{{ ev.event.name }}</v-card-title>
              </v-card-item>
              <v-card-text>
                <v-chip v-for="role in ev.roles" :key="role" size="x-small" class="mr-1">{{ role }}</v-chip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('update:modelValue', false)">Cancelar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const props = defineProps({ modelValue: Boolean });
const emit  = defineEmits(['update:modelValue']);
const auth   = useAuthStore();
const router = useRouter();

const select = async (eventId) => {
  await auth.switchEvent(eventId);
  emit('update:modelValue', false);
  if (auth.isAdmin || auth.isEditor) router.push({ name: 'editor' });
  else if (auth.isReviewer) router.push({ name: 'reviewer' });
  else router.push({ name: 'author' });
};
</script>
