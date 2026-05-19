// src/composables/useInstallPrompt.js
// Composable for handling the PWA install prompt (beforeinstallprompt event).
// Provides `canInstall`, `promptInstall`, and `isInstalled`.

import { ref, onMounted, onUnmounted } from 'vue';

export function useInstallPrompt() {
  const canInstall = ref(false);
  const isInstalled = ref(false);

  let deferredPrompt = null;

  const DISMISS_KEY = 'studiopeer-install-dismissed';
  const DISMISS_DAYS = 7;

  /** Check if the user dismissed the install prompt recently. */
  const isDismissed = () => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    const dismissedAt = new Date(dismissed);
    const now = new Date();
    const daysSince = (now - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  };

  /** Dismiss the install prompt for DISMISS_DAYS days. */
  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    canInstall.value = false;
  };

  /** Trigger the native install prompt. */
  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    canInstall.value = false;
    return outcome === 'accepted';
  };

  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!isDismissed()) {
      canInstall.value = true;
    }
  };

  const handleAppInstalled = () => {
    isInstalled.value = true;
    canInstall.value = false;
    deferredPrompt = null;
  };

  onMounted(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
      isInstalled.value = true;
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  });

  return {
    canInstall,
    isInstalled,
    promptInstall,
    dismiss,
  };
}
