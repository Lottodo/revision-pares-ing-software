<template>
  <div id="app-container">
    <!-- El nav solo se muestra si hay sesion activa -->
    <header v-if="isAuthenticated" class="menu-principal">
      <h1>Sistema PeerReview</h1>
      <nav>
        <router-link to="/subir-articulo" class="nav-link">Subir Artículo</router-link>
        <router-link to="/estado-articulos" class="nav-link">Ver Estado</router-link>
        <router-link to="/articulos-asignados" class="nav-link">Tareas Revisor</router-link>
        <router-link to="/editor" class="nav-link">Panel Editor</router-link>
        <button class="nav-link btn-logout" @click="handleLogout">Salir</button>
      </nav>
    </header>

    <main :class="{ 'contenido-principal': isAuthenticated }">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const isAuthenticated = computed(() => !!localStorage.getItem('token'))

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style>
body {
  background-color: #f4f7f6; /* Gris muy claro y elegante */
  margin: 0; /* Quita los márgenes por defecto del navegador */
}
</style>

<style scoped>
#app-container {
  font-family: Arial, sans-serif;
}
.menu-principal {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.menu-principal h1 {
  margin: 0;
  font-size: 1.5rem;
}
.nav-link {
  color: white;
  text-decoration: none;
  font-weight: bold;
  padding: 10px;
}
.nav-link:hover {
  text-decoration: underline;
}
.btn-logout {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: inherit;
  transition: background 0.2s;
}
.btn-logout:hover {
  background: rgba(255, 255, 255, 0.1);
  text-decoration: none;
}
.contenido-principal {
  padding: 2rem;
}
</style>