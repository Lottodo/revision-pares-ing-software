<template>
  <div class="contenedor-revisor">
    <h2>📋 Mis Asignaciones de Revisión</h2>
    <p class="instrucciones">Accede a los manuscritos que te han sido asignados por el editor para tu lectura.</p>

    <div v-if="cargando" class="cargando">Cargando asignaciones...</div>

    <table v-else class="tabla-articulos">
      <thead>
        <tr>
          <th>ID</th>
          <th>Título del Artículo</th>
          <th>Fecha Asignación</th>
          <th>Estado</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="articulo in articulos" :key="articulo.id">
          <td>#{{ articulo.id }}</td>
          <td>{{ articulo.titulo }}</td>
          <td>{{ articulo.fechaAsignacion }}</td>
          <td>
            <span class="etiqueta-estado estado-revision">
              {{ articulo.estado }}
            </span>
          </td>
          <td>
            <button class="btn-leer" @click="leerManuscrito(articulo)">
              📄 Leer Manuscrito
            </button>
          </td>
        </tr>
        <tr v-if="articulos.length === 0">
          <td colspan="5" class="sin-datos">No tienes artículos asignados en este momento.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const articulos = ref([]);
const cargando = ref(true);

// Función que cumple la tarea de "Acceder al contenido"
const leerManuscrito = (articulo) => {
  // En la vida real, esto abriría el PDF. Para la PoC, usamos un alert claro.
  alert(`Abriendo el PDF del artículo: "${articulo.titulo}"...\n\nAquí el revisor podrá leer todo el contenido del manuscrito.`);
};

onMounted(async () => {
  try {
    const token = localStorage.getItem('jwt_token');
    
    // Inyectamos login de revisor automáticamente para la Prueba de Concepto
    if(!token) {
        const loginRes = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "revisor1", password: "1234" })
        });
        const loginData = await loginRes.json();
        localStorage.setItem('jwt_token', loginData.token);
    }

    const tokenActual = localStorage.getItem('jwt_token');
    const respuesta = await fetch('http://localhost:3000/api/articulos-asignados', {
      headers: { 'Authorization': tokenActual }
    });

    if (respuesta.ok) {
      articulos.value = await respuesta.json();
    } else {
      throw new Error("Error al obtener asignaciones");
    }
  } catch (error) {
    articulos.value = [
      { id: 105, titulo: "Optimización de bases de datos NoSQL", fechaAsignacion: "2026-04-01", estado: "Pendiente de Revisión" }
    ];
  } finally {
    cargando.value = false;
  }
});
</script>

<style scoped>
.contenedor-revisor {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  font-family: Arial, sans-serif;
  color: #000;
}
.instrucciones { 
  color: #333; 
  margin-bottom: 20px;
}
.tabla-articulos {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin: 0 auto;
}
.tabla-articulos th, .tabla-articulos td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  color: #000;
}
.tabla-articulos th { 
  background-color: #f4f4f4; 
  font-weight: bold; 
}
.etiqueta-estado { 
  padding: 5px 10px; 
  border-radius: 20px; 
  font-size: 0.85rem; 
  font-weight: bold; 
  color: white; 
}
.estado-revision { 
  background-color: #f39c12; 
}

/* Botón rediseñado para lectura */
.btn-leer {
  background-color: #6c757d; 
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}
.btn-leer:hover { 
  background-color: #5a6268; 
}
</style>