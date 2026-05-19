<template>
  <Transition name="update-slide">
    <div v-if="needRefresh" class="update-banner">
      <div class="update-banner__content">
        <v-icon size="20" class="mr-2">mdi-update</v-icon>
        <span class="font-weight-bold mr-2">Nueva versión disponible</span>
        <v-btn
          size="small"
          color="white"
          variant="flat"
          class="text-none font-weight-bold update-btn"
          rounded="pill"
          @click="updateServiceWorker"
        >
          Actualizar
        </v-btn>
        <v-btn
          icon
          size="x-small"
          variant="text"
          color="white"
          class="ml-2"
          @click="needRefresh = false"
        >
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const needRefresh = ref(false);
let swRegistration = null;

const updateServiceWorker = () => {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  needRefresh.value = false;
  window.location.reload();
};

onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      swRegistration = reg;

      // If there's already a waiting worker
      if (reg.waiting) {
        needRefresh.value = true;
        return;
      }

      // Listen for new installing workers
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            needRefresh.value = true;
          }
        });
      });
    });

    // Handle controller change (new SW took over)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
});
</script>

<style scoped>
.update-banner {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
}

.update-banner__content {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(79, 70, 229, 0.4);
  font-size: 0.85rem;
  white-space: nowrap;
}

.update-btn {
  color: #4f46e5 !important;
  font-size: 0.8rem !important;
}

.update-slide-enter-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.update-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.update-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
.update-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
