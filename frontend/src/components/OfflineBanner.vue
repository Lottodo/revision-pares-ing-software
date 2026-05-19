<template>
  <Transition name="offline-slide">
    <div v-if="!isOnline" class="offline-banner">
      <div class="offline-banner__content">
        <div class="offline-banner__pulse"></div>
        <v-icon size="20" class="mr-2">mdi-wifi-off</v-icon>
        <span class="offline-banner__text">
          Estás trabajando sin conexión
        </span>
        <span class="offline-banner__sub d-none d-sm-inline">
          — Los cambios se sincronizarán automáticamente
        </span>
        <v-chip
          v-if="pendingSyncCount > 0"
          size="x-small"
          color="white"
          variant="outlined"
          class="ml-3 font-weight-bold"
        >
          {{ pendingSyncCount }} pendiente{{ pendingSyncCount > 1 ? 's' : '' }}
        </v-chip>
      </div>
    </div>
  </Transition>

  <!-- Reconnection flash -->
  <Transition name="reconnect-flash">
    <div v-if="wasOffline && isOnline" class="reconnect-banner">
      <v-icon size="18" class="mr-2">mdi-check-circle</v-icon>
      <span class="font-weight-bold">Conexión restaurada</span>
    </div>
  </Transition>
</template>

<script setup>
import { useNetworkStatus } from '../composables/useNetworkStatus.js';

const { isOnline, wasOffline, pendingSyncCount } = useNetworkStatus();
</script>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
  color: white;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 20px rgba(217, 119, 6, 0.4);
}

.offline-banner__content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.offline-banner__text {
  font-weight: 700;
}

.offline-banner__sub {
  opacity: 0.85;
  font-weight: 400;
}

.offline-banner__pulse {
  width: 8px;
  height: 8px;
  background: #fbbf24;
  border-radius: 50%;
  margin-right: 10px;
  animation: pulse-dot 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.5; }
}

/* Reconnection banner */
.reconnect-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font-size: 0.85rem;
  box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4);
}

/* Transitions */
.offline-slide-enter-active {
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease;
}
.offline-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.2s ease;
}
.offline-slide-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.offline-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.reconnect-flash-enter-active {
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease;
}
.reconnect-flash-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
  transition-delay: 0s;
}
.reconnect-flash-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.reconnect-flash-leave-to {
  opacity: 0;
  transform: translateY(-60%);
}
</style>
