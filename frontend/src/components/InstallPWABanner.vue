<template>
  <!-- Install Banner (non-iOS) -->
  <Transition name="install-slide">
    <div v-if="canInstall && !dismissed" class="install-overlay">
      <div class="install-card">
        <!-- Glow effect -->
        <div class="install-glow"></div>

        <div class="install-card__inner">
          <button class="install-close" @click="handleDismiss" aria-label="Cerrar">
            <v-icon size="20" color="white">mdi-close</v-icon>
          </button>

          <div class="install-icon-wrap">
            <img src="/icons/pwa-192x192.png" alt="StudioPeer" class="install-app-icon" />
          </div>

          <h3 class="install-title">Instalar StudioPeer</h3>
          <p class="install-desc">
            Accede más rápido, trabaja sin conexión y recibe notificaciones. 
            Instala la app directamente en tu dispositivo.
          </p>

          <div class="install-features">
            <div class="install-feature">
              <v-icon size="18" color="#38bdf8">mdi-lightning-bolt</v-icon>
              <span>Acceso instantáneo</span>
            </div>
            <div class="install-feature">
              <v-icon size="18" color="#34d399">mdi-wifi-off</v-icon>
              <span>Funciona sin conexión</span>
            </div>
            <div class="install-feature">
              <v-icon size="18" color="#a78bfa">mdi-bell-ring</v-icon>
              <span>Notificaciones</span>
            </div>
          </div>

          <v-btn
            color="white"
            variant="flat"
            class="install-btn text-none font-weight-bold"
            size="large"
            rounded="pill"
            block
            @click="handleInstall"
          >
            <v-icon start>mdi-download</v-icon>
            Instalar Ahora
          </v-btn>

          <button class="install-later" @click="handleDismiss">
            Quizás más tarde
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- iOS Instructions (shown on Safari) -->
  <Transition name="install-slide">
    <div v-if="showIOSGuide && !dismissed" class="install-overlay">
      <div class="install-card">
        <div class="install-glow"></div>
        <div class="install-card__inner">
          <button class="install-close" @click="handleDismiss" aria-label="Cerrar">
            <v-icon size="20" color="white">mdi-close</v-icon>
          </button>

          <div class="install-icon-wrap">
            <img src="/icons/pwa-192x192.png" alt="StudioPeer" class="install-app-icon" />
          </div>

          <h3 class="install-title">Instalar en tu iPhone</h3>
          <p class="install-desc">
            Agrega StudioPeer a tu pantalla de inicio para una experiencia nativa completa.
          </p>

          <div class="ios-steps">
            <div class="ios-step">
              <span class="ios-step-num">1</span>
              <span>Toca el botón <v-icon size="16" color="white">mdi-export-variant</v-icon> Compartir</span>
            </div>
            <div class="ios-step">
              <span class="ios-step-num">2</span>
              <span>Selecciona <strong>"Agregar a inicio"</strong></span>
            </div>
            <div class="ios-step">
              <span class="ios-step-num">3</span>
              <span>Toca <strong>"Agregar"</strong> para confirmar</span>
            </div>
          </div>

          <button class="install-later" @click="handleDismiss">
            Entendido
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useInstallPrompt } from '../composables/useInstallPrompt.js';

const { canInstall, promptInstall, dismiss: dismissPrompt, isInstalled } = useInstallPrompt();

const dismissed = ref(false);
const isIOS = ref(false);

const showIOSGuide = computed(() => {
  return isIOS.value && !isInstalled.value && !dismissed.value;
});

const handleInstall = async () => {
  const accepted = await promptInstall();
  if (accepted) {
    dismissed.value = true;
  }
};

const handleDismiss = () => {
  dismissed.value = true;
  dismissPrompt();
};

onMounted(() => {
  // Detect iOS Safari
  const ua = navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  isIOS.value = isIOSDevice && isSafari && !navigator.standalone;

  // Check dismiss cooldown
  const dismissKey = 'studiopeer-install-dismissed';
  const dismissedAt = localStorage.getItem(dismissKey);
  if (dismissedAt) {
    const daysSince = (Date.now() - new Date(dismissedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) {
      dismissed.value = true;
    }
  }
});
</script>

<style scoped>
.install-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  padding: 16px;
}

.install-card {
  position: relative;
  max-width: 400px;
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
}

.install-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(16, 185, 129, 0.1) 100%);
  filter: blur(40px);
  z-index: 0;
}

.install-card__inner {
  position: relative;
  z-index: 1;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px 28px;
  text-align: center;
  color: white;
}

.install-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.install-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.install-icon-wrap {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.install-app-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.install-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.install-desc {
  font-size: 0.9rem;
  opacity: 0.7;
  line-height: 1.5;
  margin-bottom: 24px;
}

.install-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.install-feature {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.85;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.install-btn {
  color: #0f172a !important;
  letter-spacing: 0.02em;
  margin-bottom: 12px;
}

.install-later {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 8px 16px;
  transition: color 0.2s;
}
.install-later:hover {
  color: rgba(255, 255, 255, 0.8);
}

/* iOS Steps */
.ios-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  text-align: left;
}

.ios-step {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.9;
}

.ios-step-num {
  width: 28px;
  height: 28px;
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
  flex-shrink: 0;
}

/* Transition */
.install-slide-enter-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.install-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.install-slide-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
.install-slide-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
