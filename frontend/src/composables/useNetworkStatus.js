// src/composables/useNetworkStatus.js
// Reactive composable for tracking online/offline state across the app.
// Provides `isOnline`, `wasOffline` (briefly true after reconnect), and `pendingSyncCount`.

import { ref, onMounted, onUnmounted } from 'vue';
import { pendingSyncCount } from '../utils/syncManager.js';

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine);
  const wasOffline = ref(false);

  let reconnectTimer = null;

  const handleOnline = () => {
    isOnline.value = true;
    // Show "reconnected" feedback briefly
    if (wasOffline.value === false) {
      wasOffline.value = true;
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        wasOffline.value = false;
      }, 4000);
    }
  };

  const handleOffline = () => {
    isOnline.value = false;
    wasOffline.value = false;
  };

  onMounted(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearTimeout(reconnectTimer);
  });

  return {
    isOnline,
    wasOffline,
    pendingSyncCount,
  };
}
