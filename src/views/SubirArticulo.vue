<template>
  <div class="contenedor-autor">
    <h2> Subir Nuevo Manuscrito</h2>
    <p class="instrucciones">Por favor, llena los datos de tu artículo. Solo se admiten archivos PDF (Máx. 5MB).</p>

    <form @submit.prevent="enviarArticulo" class="formulario">
      
      <div class="grupo-input">
        <label for="titulo">Título del Artículo:</label>
        <input 
          type="text" 
          id="titulo" 
          v-model="titulo" 
          required 
          placeholder="Ej. El impacto de la IA en la educación"
        />
      </div>

      <div class="grupo-input">
        <label for="resumen">Resumen (Abstract):</label>
        <textarea 
          id="resumen" 
          v-model="resumen" 
          required 
          rows="4"
          placeholder="Escribe un breve resumen de tu investigación..."
        ></textarea>
      </div>

      <div class="grupo-input">
        <label for="archivo">Archivo del Manuscrito (PDF):</label>
        <input 
          type="file" 
          id="archivo" 
          accept="application/pdf" 
          @change="manejarArchivo" 
          required 
        />
      </div>

      <p v-if="mensajeError" class="error">{{ mensajeError }}</p>
      <p v-if="mensajeExito" class="exito">{{ mensajeExito }}</p>

      <button type="submit" :disabled="cargando">
        {{ cargando ? 'Subiendo...' : 'Enviar Artículo' }}
      </button>

    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Variables reactivas (Estado del componente)
const titulo = ref('');
const resumen = ref('');
const archivoPdf = ref(null);
const mensajeError = ref('');
const mensajeExito = ref('');
const cargando = ref(false);

// Función que se ejecuta cuando el usuario selecciona un archivo
const manejarArchivo = (evento) => {
  const archivo = evento.target.files[0];
  mensajeError.value = ''; // Limpiar errores previos
  
  if (archivo) {
    // Validación 1: Que sea PDF
    if (archivo.type !== 'application/pdf') {
      mensajeError.value = 'El archivo debe ser un PDF.';
      evento.target.value = ''; // Limpiar el input
      archivoPdf.value = null;
      return;
    }
    
    // Validación 2: Tamaño menor a 5MB (5 * 1024 * 1024 bytes)
    if (archivo.size > 5242880) {
      mensajeError.value = 'El archivo es muy pesado. Máximo 5MB.';
      evento.target.value = '';
      archivoPdf.value = null;
      return;
    }

    archivoPdf.value = archivo;
  }
};

// Función para enviar los datos al servidor
const enviarArticulo = async () => {
  if (!archivoPdf.value || !titulo.value || !resumen.value) {
    mensajeError.value = "Por favor completa todos los campos.";
    return;
  }

  cargando.value = true;
  mensajeError.value = '';
  mensajeExito.value = '';

  try {
    // 1. Recuperamos el token seguro que guardamos en el login
    const token = localStorage.getItem('jwt_token');

    if(!token) {
        mensajeError.value = "No estás autenticado. Por favor inicia sesión.";
        cargando.value = false;
        return;
    }

    // 2. Preparamos los datos (FormData es ideal para enviar archivos + texto)
    const formData = new FormData();
    // Sanitización básica (Vue ya protege mucho contra XSS al usar v-model, pero quitamos espacios extra)
    formData.append('titulo', titulo.value.trim());
    formData.append('resumen', resumen.value.trim());
    formData.append('documento', archivoPdf.value);

    // 3. Enviamos al backend (Ajustaremos esta URL cuando tu compañero de Backend termine su parte)
    const respuesta = await fetch('http://localhost:3000/api/articulos', {
      method: 'POST',
      headers: {
        'Authorization': token // ¡Seguridad JWT aplicada!
      },
      body: formData
    });

    if (respuesta.ok) {
      mensajeExito.value = "¡Artículo enviado con éxito para su revisión!";
      // Limpiar formulario
      titulo.value = '';
      resumen.value = '';
      document.getElementById('archivo').value = '';
      archivoPdf.value = null;
    } else {
      const errorData = await respuesta.json();
      mensajeError.value = errorData.error || "Error al subir el artículo.";
    }

  } catch (error) {
    console.error("Error de conexión:", error);
    mensajeError.value = "No se pudo conectar con el servidor.";
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
.contenedor-autor {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  color: #000; /* Asegura que el texto general sea negro */
}

.instrucciones {
  color: #333; /* Forzamos gris oscuro para el párrafo de instrucciones */
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 15px;
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.grupo-input {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.grupo-input label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #000; /* Forzamos color negro para las etiquetas */
}

.grupo-input input[type="text"],
.grupo-input textarea {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  color: #000; /* Asegura que lo que escribe el usuario se vea negro */
}

button {
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error { color: #dc3545; font-weight: bold; }
.exito { color: #28a745; font-weight: bold; }
</style>