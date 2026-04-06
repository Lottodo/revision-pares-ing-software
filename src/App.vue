<template>
  <div id="app-container">
    <header class="menu-principal">
      <h1>Sistema PeerReview</h1>
      <nav>
        <router-link to="/subir-articulo" class="nav-link">📤 Subir Artículo</router-link>
        <router-link to="/estado-articulos" class="nav-link">📊 Ver Estado</router-link>
        <router-link to="/articulos-asignados" class="nav-link">📋 Tareas Revisor</router-link>
        <router-link to="/editor" class="nav-link">🗂️ Panel Editor</router-link>
      </nav>
    </header>

    <main class="contenido-principal">
      <router-view></router-view> 
    </main>
  </div>
</template>

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
.contenido-principal {
  padding: 2rem;
}
</style>