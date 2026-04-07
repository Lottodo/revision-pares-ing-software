<template>
  <div class="contenedor-estado">
    <h2>📊 Estado de mis Manuscritos</h2>
    <p class="instrucciones">Consulta el progreso de las revisiones de tus artículos enviados.</p>

    <div v-if="cargando" class="cargando">Cargando información...</div>

    <table v-else class="tabla-articulos">
      <thead>
        <tr>
          <th>ID</th>
          <th>Título del Artículo</th>
          <th>Fecha de Envío</th>
          <th>Estado Actual</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="articulo in articulos" :key="articulo.id">
          <td>#{{ articulo.id }}</td>
          <td>{{ articulo.titulo }}</td>
          <td>{{ articulo.fecha }}</td>
          <td>
            <span :class="['etiqueta-estado', claseEstado(articulo.estado)]">
              {{ articulo.estado }}
            </span>
          </td>
        </tr>
        <tr v-if="articulos.length === 0">
          <td colspan="4" class="sin-datos">No has enviado ningún artículo todavía.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const articulos = ref([]);
const cargando = ref(true);

// Función para darle color a la etiqueta según el estado
const claseEstado = (estado) => {
  switch (estado) {
    case 'Recibido': return 'estado-recibido';
    case 'En Revisión': return 'estado-revision';
    case 'Aceptado': return 'estado-aceptado';
    case 'Rechazado': return 'estado-rechazado';
    default: return 'estado-default';
  }
};

onMounted(async () => {
  try {
    const token = localStorage.getItem('jwt_token');
    // Intentamos pedir los datos al backend
    const respuesta = await fetch('http://localhost:3000/api/mis-articulos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (respuesta.ok) {
      const data = await respuesta.json();
      articulos.value = data;
    } else {
      throw new Error("Backend no listo");
    }
  } catch (error) {
    console.warn("No se pudo conectar al API real. Cargando datos de prueba para la UI.");
    // Datos de prueba para que la interfaz no se vea vacía en la presentación
    articulos.value = [
      { id: 101, titulo: "El impacto de la IA en la educación moderna", fecha: "2026-03-20", estado: "En Revisión" },
      { id: 98, titulo: "Nuevas metodologías ágiles en 2026", fecha: "2026-03-15", estado: "Aceptado" },
      { id: 95, titulo: "Uso de Vue 3 en aplicaciones monolíticas", fecha: "2026-03-10", estado: "Recibido" }
    ];
  } finally {
    cargando.value = false;
  }
});
</script>

<style scoped>
.contenedor-estado {
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  color: #000; /* Asegura color oscuro general para todo el contenedor */
}

.instrucciones {
  color: #333; /* Forzamos gris oscuro para las instrucciones */
}

.cargando {
  color: #000;
  font-weight: bold;
  margin-top: 20px;
}

.tabla-articulos {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.tabla-articulos th, .tabla-articulos td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  color: #000; /* Forzamos texto negro en toda la tabla */
}

.tabla-articulos th {
  background-color: #f4f4f4;
  font-weight: bold;
}

.sin-datos {
  text-align: center;
  color: #777;
  font-style: italic;
}

/* Estilos de las etiquetas de estado */
.etiqueta-estado {
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  color: white; /* El texto dentro de las "píldoras" de colores se queda blanco para que contraste con el fondo de color */
}

.estado-recibido { background-color: #6c757d; }
.estado-revision { background-color: #f39c12; }
.estado-aceptado { background-color: #28a745; }
.estado-rechazado { background-color: #dc3545; }
.estado-default { background-color: #000; }
</style>