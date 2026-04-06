<template>
  <div class="contenedor-revisor">
    <h2>📋 Mis Asignaciones de Revisión</h2>
    <p class="instrucciones">Accede a los manuscritos asignados y envía tu dictamen.</p>

    <div v-if="cargando" class="cargando">Cargando asignaciones...</div>

    <table v-else class="tabla-articulos">
      <thead>
        <tr>
          <th>ID</th>
          <th>Título del Artículo</th>
          <th>Estado</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="articulo in articulos" :key="articulo.id">
          <td>#{{ articulo.id }}</td>
          <td>{{ articulo.titulo }}</td>
          <td>
            <span class="etiqueta-estado estado-revision">
              {{ articulo.estado }}
            </span>
          </td>
          <td class="acciones">
            <button class="btn-leer" @click="leerManuscrito(articulo)">📄 Leer</button>
            <button class="btn-evaluar" @click="abrirModal(articulo)">✍️ Evaluar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="modalAbierto" class="modal-fondo">
      <div class="modal-contenido">
        <h3>Evaluación del Artículo</h3>
        <p class="modal-subtitulo">Manuscrito: <strong>{{ articuloSeleccionado.titulo }}</strong></p>
        
        <form @submit.prevent="enviarEvaluacion" class="formulario-evaluacion">
          <div class="grupo-form">
            <label>Veredicto sugerido:</label>
            <select v-model="evaluacion.veredicto" required>
              <option value="" disabled>Selecciona una opción...</option>
              <option value="Aceptar">✅ Aceptar (Sin cambios)</option>
              <option value="Cambios Menores">⚠️ Aceptar con cambios menores</option>
              <option value="Cambios Mayores">🔄 Requiere cambios mayores</option>
              <option value="Rechazar">❌ Rechazar</option>
            </select>
          </div>

          <div class="grupo-form">
            <label>Comentarios para el Editor / Autor:</label>
            <textarea 
              v-model="evaluacion.comentarios" 
              rows="5" 
              placeholder="Escribe tus observaciones aquí..."
              required>
            </textarea>
          </div>

          <div class="modal-botones">
            <button type="button" class="btn-cancelar" @click="cerrarModal">Cancelar</button>
            <button type="submit" class="btn-enviar">Enviar Evaluación</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const articulos = ref([]);
const cargando = ref(true);

// Variables para el Modal de Evaluación
const modalAbierto = ref(false);
const articuloSeleccionado = ref(null);
const evaluacion = ref({
  veredicto: '',
  comentarios: ''
});

const leerManuscrito = (articulo) => {
  alert(`Abriendo el PDF de: "${articulo.titulo}"`);
};

// Lógica de la ventana Modal
const abrirModal = (articulo) => {
  articuloSeleccionado.value = articulo;
  evaluacion.value = { veredicto: '', comentarios: '' }; // Limpiar formulario
  modalAbierto.value = true;
};

const cerrarModal = () => {
  modalAbierto.value = false;
  articuloSeleccionado.value = null;
};

// Conexión con el Backend para enviar evaluación
const enviarEvaluacion = async () => {
  try {
    const token = localStorage.getItem('jwt_token');
    const respuesta = await fetch('http://localhost:3000/api/evaluar', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token 
      },
      body: JSON.stringify({
        articuloId: articuloSeleccionado.value.id,
        veredicto: evaluacion.value.veredicto,
        comentarios: evaluacion.value.comentarios
      })
    });

    const data = await respuesta.json();
    
    if (respuesta.ok) {
      alert(data.mensaje); // Muestra mensaje de éxito
      cerrarModal();
    } else {
      alert("Error: " + data.error);
    }
  } catch (error) {
    alert("Hubo un problema de conexión con el servidor.");
  }
};

onMounted(async () => {
  try {
    const token = localStorage.getItem('jwt_token');
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
      const data = await respuesta.json();
      
      // --- INICIO DEL TRUCO COMENTADO ---
      if (data.length === 0) {
        articulos.value = [{ 
          id: 999, 
          titulo: "El impacto de la Inteligencia Artificial (Prueba Forzada)", 
          estado: "Pendiente" 
        }];
      } else {
        articulos.value = data;
      }
      //--- FIN DEL TRUCO COMENTADO --- 
      
      // Comportamiento normal: solo muestra lo que mande el backend
      //articulos.value = data;
    }
  } catch (error) {
    console.warn("El backend no responde. Cargando artículo de prueba local...");
    // --- INICIO DEL TRUCO COMENTADO (CATCH) ---
    articulos.value = [{ 
      id: 999, 
      titulo: "El impacto de la IA (Prueba Local)", 
      estado: "Pendiente" 
    }];
    //--- FIN DEL TRUCO COMENTADO --- 
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
.instrucciones { color: #333; margin-bottom: 20px; }
.tabla-articulos {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin: 0 auto;
}
.tabla-articulos th, .tabla-articulos td {
  padding: 12px 15px;
  text-align: center;
  border-bottom: 1px solid #ddd;
  color: #000;
}
.tabla-articulos th { background-color: #f4f4f4; font-weight: bold; }
.etiqueta-estado { 
  padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; color: white; 
}
.estado-revision { background-color: #f39c12; }

/* Botones de acción */
.acciones { display: flex; gap: 10px; justify-content: center; }
.btn-leer { background-color: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: 0.3s; }
.btn-leer:hover { background-color: #5a6268; }
.btn-evaluar { background-color: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: 0.3s; font-weight: bold;}
.btn-evaluar:hover { background-color: #218838; }

/* Estilos de la Ventana Modal Flotante */
.modal-fondo {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000; /* Se pone por encima de todo */
}
.modal-contenido {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  text-align: left;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.modal-contenido h3 { margin-top: 0; color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;}
.modal-subtitulo { font-size: 0.9rem; color: #555; margin-bottom: 20px;}

.formulario-evaluacion .grupo-form { margin-bottom: 15px; }
.formulario-evaluacion label { display: block; margin-bottom: 5px; font-weight: bold; color: #333;}
.formulario-evaluacion select, .formulario-evaluacion textarea {
  width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;
}

.modal-botones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-cancelar { background-color: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
.btn-cancelar:hover { background-color: #c82333; }
.btn-enviar { background-color: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;}
.btn-enviar:hover { background-color: #0056b3; }
</style>