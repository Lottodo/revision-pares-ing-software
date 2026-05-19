<template>
  <div class="not-found-layout d-flex flex-column align-center justify-center">
    <!-- Animated background -->
    <div class="nf-blob nf-blob--1"></div>
    <div class="nf-blob nf-blob--2"></div>

    <div class="nf-content">
      <!-- Floating 404 icon -->
      <div class="nf-icon-wrap">
        <v-icon size="80" class="nf-icon">mdi-file-question-outline</v-icon>
      </div>

      <h1 class="nf-code">404</h1>
      <h2 class="nf-title">Página no encontrada</h2>
      <p class="nf-desc">La ruta que buscas no existe o fue movida.</p>

      <v-btn
        color="white"
        variant="flat"
        class="nf-btn text-none font-weight-bold mt-8"
        size="large"
        rounded="pill"
        prepend-icon="mdi-home"
        @click="$router.push('/')"
      >
        Ir al inicio
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.not-found-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(160deg, #0f172a 0%, #020617 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

.nf-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  animation: nf-float 10s ease-in-out infinite;
}
.nf-blob--1 {
  width: 500px;
  height: 500px;
  top: -15%;
  right: -10%;
  background: rgba(239, 68, 68, 0.06);
}
.nf-blob--2 {
  width: 400px;
  height: 400px;
  bottom: -10%;
  left: -10%;
  background: rgba(99, 102, 241, 0.05);
  animation-delay: -3s;
}

@keyframes nf-float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -15px); }
}

.nf-content {
  text-align: center;
  z-index: 10;
  position: relative;
  animation: nf-enter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes nf-enter {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.nf-icon-wrap {
  margin-bottom: 16px;
  animation: icon-float 3s ease-in-out infinite;
}

@keyframes icon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.nf-icon {
  color: rgba(255, 255, 255, 0.2) !important;
}

.nf-code {
  font-size: 6rem;
  font-weight: 900;
  background: linear-gradient(135deg, #38bdf8, #818cf8, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 8px;
  letter-spacing: -0.03em;
}

.nf-title {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.nf-desc {
  color: rgba(255, 255, 255, 0.45);
  font-size: 1rem;
  font-weight: 400;
}

.nf-btn {
  color: #0f172a !important;
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.nf-btn:hover {
  box-shadow: 0 12px 32px rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}
</style>
