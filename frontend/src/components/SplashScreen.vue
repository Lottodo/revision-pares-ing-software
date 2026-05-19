<template>
  <Transition name="splash-fade">
    <div v-if="visible" class="splash-screen">
      <!-- Animated background blobs -->
      <div class="splash-blob splash-blob--1"></div>
      <div class="splash-blob splash-blob--2"></div>
      <div class="splash-blob splash-blob--3"></div>

      <div class="splash-content">
        <div class="splash-icon-wrap">
          <img src="/icons/pwa-192x192.png" alt="StudioPeer" class="splash-icon" />
        </div>

        <h1 class="splash-title">StudioPeer</h1>
        <p class="splash-subtitle">Revisión Académica</p>

        <div class="splash-loader">
          <div class="splash-loader__bar"></div>
        </div>
      </div>

      <p class="splash-footer">Sistema de Revisión por Pares</p>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const visible = ref(true);

onMounted(() => {
  // Hide splash after a minimum display time
  setTimeout(() => {
    visible.value = false;
  }, 1800);
});
</script>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #0f172a 0%, #020617 100%);
  overflow: hidden;
}

/* Animated blobs */
.splash-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  animation: blob-float 6s ease-in-out infinite;
}
.splash-blob--1 {
  width: 400px;
  height: 400px;
  top: -10%;
  left: -10%;
  background: rgba(56, 189, 248, 0.08);
  animation-delay: 0s;
}
.splash-blob--2 {
  width: 500px;
  height: 500px;
  bottom: -15%;
  right: -10%;
  background: rgba(99, 102, 241, 0.06);
  animation-delay: -2s;
}
.splash-blob--3 {
  width: 300px;
  height: 300px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(16, 185, 129, 0.05);
  animation-delay: -4s;
}

@keyframes blob-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(15px, -20px) scale(1.05); }
  66% { transform: translate(-10px, 15px) scale(0.95); }
}

/* Content */
.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  animation: splash-enter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes splash-enter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.splash-icon-wrap {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  margin-bottom: 24px;
  animation: icon-pulse 2s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%, 100% { box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5); }
  50% { box-shadow: 0 12px 60px rgba(56, 189, 248, 0.3); }
}

.splash-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.splash-title {
  color: white;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
  font-family: 'Inter', system-ui, sans-serif;
}

.splash-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 40px;
}

/* Loader bar */
.splash-loader {
  width: 160px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.splash-loader__bar {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #34d399);
  border-radius: 4px;
  animation: loader-slide 1.5s ease-in-out infinite;
}

@keyframes loader-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

/* Footer */
.splash-footer {
  position: absolute;
  bottom: 32px;
  color: rgba(255, 255, 255, 0.25);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  z-index: 2;
}

/* Fade out transition */
.splash-fade-leave-active {
  transition: opacity 0.6s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}
</style>
