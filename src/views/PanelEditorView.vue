<template>
  <v-container fluid class="pa-md-8 pa-4 max-width-container">
    <v-card class="elevation-3 mb-8 w-100 rounded-xl overflow-hidden">
      <v-toolbar color="white" flat class="border-b px-4">
        <v-toolbar-title class="text-grey-darken-4 font-weight-black text-h5">
          Panel de Editor
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" color="green-darken-4" class="font-weight-bold rounded-pill shadow-sm" prepend-icon="mdi-account-cog" @click="abrirGestorRoles">
          Gestor de Roles
        </v-btn>
      </v-toolbar>
      <v-card-text class="pa-md-8 pa-6 bg-white">
        <p class="text-body-1 text-grey-darken-2 font-weight-medium">
          Asigna al menos 2 revisores estratégicos a cada manuscrito. La decisión final "Aceptar/Rechazar" estará bloqueada hasta que todos los revisores emitan su veredicto.
        </p>
      </v-card-text>
    </v-card>

    <v-row v-if="cargando">
      <v-col cols="12" class="d-flex justify-center pa-10">
        <v-progress-circular indeterminate color="green-darken-3" size="64" width="4"></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else class="match-height-row">
      <!-- COLUMNA IZQUIERDA: Artículos -->
      <v-col cols="12" md="6" class="d-flex flex-column">
        <div class="d-flex align-center mb-6 pl-2">
          <v-icon color="grey-darken-3" class="mr-3" size="32">mdi-file-document-multiple-outline</v-icon>
          <h3 class="text-h5 font-weight-black text-grey-darken-4 mb-0">Artículos Activos</h3>
        </div>

        <v-card
          v-for="articulo in articulos"
          :key="articulo._id || articulo.id"
          class="mb-6 transition-swing rounded-xl border-card"
          :class="{ 'selected-card': articuloSeleccionado?.id === (articulo._id || articulo.id) }"
          :elevation="articuloSeleccionado?.id === (articulo._id || articulo.id) ? 8 : 2"
          @click="seleccionarArticulo(articulo)"
          :ripple="false"
        >
          <v-card-text class="pa-6">
            <div class="d-flex justify-space-between align-start mb-3">
              <span class="text-h6 font-weight-black text-grey-darken-4 lh-tight">{{ articulo.titulo }}</span>
              <v-chip :color="getColorEstado(articulo.estado)" size="small" variant="flat" class="font-weight-bold text-white shadow-sm ml-2">
                {{ articulo.estado }}
              </v-chip>
            </div>

            <div class="text-body-2 text-grey-darken-1 mb-4 font-weight-medium">Área: {{ articulo.area || 'General' }}</div>

            <!-- Chips revisores -->
            <div class="d-flex flex-wrap gap-2 mb-4 bg-grey-lighten-4 pa-3 rounded-lg border">
              <span v-if="!articulo.revisores || articulo.revisores.length === 0" class="text-caption text-grey-darken-1 font-weight-medium">
                Arrastra o asigna revisores abajo
              </span>
              <v-chip
                v-for="rev in articulo.revisores"
                :key="rev.id"
                :color="rev.completado ? 'green-darken-1' : 'grey-darken-2'"
                :variant="rev.completado ? 'flat' : 'outlined'"
                size="small"
                class="mr-2 mb-2 font-weight-bold"
              >
                {{ nombreRevisor(rev.revisor || rev.id) }}
                <v-icon end size="14" class="ml-1">{{ rev.completado ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
                <v-btn
                  v-if="!articuloDecidido(articulo)"
                  icon="mdi-close-circle"
                  size="x-small"
                  variant="text"
                  color="red"
                  class="ml-1 pa-0 border-0"
                  @click.stop="quitarRevisor(articulo, rev.revisor || rev.id)"
                ></v-btn>
              </v-chip>
            </div>

            <div class="text-caption mb-5 d-flex align-center">
              <v-icon :color="(articulo.revisores && articulo.revisores.length >= 2) ? 'green-darken-2' : 'orange-darken-2'" size="18" class="mr-2">
                {{ (articulo.revisores && articulo.revisores.length >= 2) ? 'mdi-shield-check' : 'mdi-shield-alert' }}
              </v-icon>
              <span :class="(articulo.revisores && articulo.revisores.length >= 2) ? 'text-green-darken-3 font-weight-bold' : 'text-orange-darken-3 font-weight-bold'">
                Asignados: {{ articulo.revisores ? articulo.revisores.length : 0 }} {{ (articulo.revisores && articulo.revisores.length >= 2) ? '(Completado)' : '(Mínimo: 2)' }}
              </span>
            </div>

            <!-- Zona Decision -->
            <v-divider class="mb-4"></v-divider>
            <div class="d-flex flex-column" @click.stop>
              <template v-if="articuloDecidido(articulo)">
                <v-alert density="compact" variant="tonal" :color="articulo.estado === 'Aceptado' ? 'green-darken-3' : 'red-darken-3'" class="font-weight-bold rounded-lg">
                  Decisión Final: {{ articulo.estado }}
                </v-alert>
              </template>

              <template v-else-if="!articulo.revisores || articulo.revisores.length < 2">
                <span class="text-caption text-orange-darken-3 mb-3 font-weight-bold">Bloqueo: Requiere al menos 2 revisores asignados</span>
                <div class="d-flex gap-3">
                  <v-btn size="small" color="grey-lighten-2" class="text-grey-darken-2 font-weight-bold rounded-pill shadow-sm" disabled elevation="0">Aceptar</v-btn>
                  <v-btn size="small" color="grey-lighten-2" class="text-grey-darken-2 font-weight-bold rounded-pill shadow-sm" disabled elevation="0">Rechazar</v-btn>
                </div>
              </template>

              <template v-else-if="!puedeDecidir(articulo)">
                <span class="text-caption text-grey-darken-2 mb-3 font-weight-bold">
                  ⏱ Esperando dictámenes: {{ revisoresPendientes(articulo) }}
                </span>
                <div class="d-flex gap-3">
                  <v-btn size="small" color="grey-lighten-2" class="text-grey-darken-2 font-weight-bold rounded-pill shadow-sm" disabled elevation="0">Aceptar</v-btn>
                  <v-btn size="small" color="grey-lighten-2" class="text-grey-darken-2 font-weight-bold rounded-pill shadow-sm" disabled elevation="0">Rechazar</v-btn>
                </div>
              </template>

              <template v-else>
                <v-alert density="compact" type="success" variant="tonal" class="mb-3 rounded-lg text-green-darken-3 font-weight-bold">
                  Dictámenes emitidos. Toma una decisión.
                </v-alert>
                <div class="d-flex gap-3">
                  <v-btn size="small" color="green-darken-2" class="font-weight-bold rounded-pill text-white" elevation="2" @click="decidirArticulo(articulo, 'Aceptado')">Aceptar Manuscrito</v-btn>
                  <v-btn size="small" color="red-darken-2" class="font-weight-bold rounded-pill text-white" elevation="2" @click="decidirArticulo(articulo, 'Rechazado')">Rechazar</v-btn>
                </div>
              </template>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- COLUMNA DERECHA: Revisores -->
      <v-col cols="12" md="6" class="d-flex flex-column h-100">
        <div class="d-flex align-center mb-6 pl-2">
          <v-icon color="grey-darken-3" class="mr-3" size="32">mdi-account-group-outline</v-icon>
          <h3 class="text-h5 font-weight-black text-grey-darken-4 mb-0">Staff de Peritos</h3>
        </div>

        <div v-if="!articuloSeleccionado" class="d-flex align-center justify-center flex-grow-1 bg-white rounded-xl border border-dashed pa-10" style="min-height: 400px; border-width: 2px !important; border-color: #E0E0E0 !important;">
          <div class="text-center">
             <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-cursor-default-click-outline</v-icon>
             <p class="text-h6 text-grey-darken-1 font-weight-medium">Selecciona un artículo<br>para abrir el panel de asignación</p>
          </div>
        </div>

        <v-card v-else class="elevation-4 rounded-xl sticky-panel flex-grow-1 border">
          <v-card-text class="pa-6">
            <div class="bg-grey-lighten-4 pa-4 rounded-lg mb-6 border">
                <span class="text-caption text-uppercase text-grey-darken-1 font-weight-bold tracking-wide">Foco de Asignación</span>
                <p class="text-h6 mt-1 font-weight-black text-grey-darken-4 lh-tight">
                  {{ articuloSeleccionado.titulo }}
                </p>
            </div>

            <v-alert v-if="mensajeError" type="error" variant="tonal" class="mb-5 rounded-lg font-weight-medium" density="compact">{{ mensajeError }}</v-alert>
            <v-alert v-if="mensajeExito" type="success" variant="tonal" class="mb-5 rounded-lg text-green-darken-4 font-weight-medium" density="compact">{{ mensajeExito }}</v-alert>

            <v-alert v-if="articuloDecidido(articuloSeleccionado)" type="warning" variant="tonal" class="mb-5 rounded-lg font-weight-medium" density="compact">
              Este artículo ya tiene una decisión final y ha sido cerrado.
            </v-alert>

            <v-data-table
              v-else
              :headers="headersRevisores"
              :items="revisores"
              class="elevation-0 bg-transparent"
              density="comfortable"
              hide-default-footer
              :items-per-page="-1"
            >
              <template v-slot:item.nombre="{ item }">
                <div class="d-flex align-center">
                  <v-avatar color="blue-grey-lighten-4" size="32" class="mr-3">
                    <span class="text-blue-grey-darken-3 font-weight-black text-caption">{{ item.nombre.substring(0, 2).toUpperCase() }}</span>
                  </v-avatar>
                  <span class="font-weight-bold text-grey-darken-4 text-subtitle-2">{{ item.nombre }}</span>
                </div>
              </template>

              <template v-slot:item.carga="{ item }">
                <v-chip size="small" :color="getColorCarga(item.carga)" variant="flat" class="text-white font-weight-bold shadow-sm">
                  {{ item.carga }}
                </v-chip>
              </template>

              <template v-slot:item.estadoRev="{ item }">
                <div v-if="estaAsignado(articuloSeleccionado, item.id || item._id)">
                  <v-chip v-if="estadoRevision(articuloSeleccionado, item.id || item._id)" size="small" color="green-darken-2" variant="tonal" class="font-weight-bold px-2">
                    <v-icon start size="14">mdi-check-all</v-icon> Dictaminó
                  </v-chip>
                  <v-chip v-else size="small" color="orange-darken-2" variant="outlined" class="font-weight-bold px-2 bg-white">
                    <v-icon start size="14" class="mdi-spin">mdi-loading</v-icon> Leyendo
                  </v-chip>
                </div>
                <span v-else class="text-grey-lighten-1 text-caption font-weight-medium">—</span>
              </template>

              <template v-slot:item.accion="{ item }">
                <v-btn
                  v-if="!estaAsignado(articuloSeleccionado, item.id || item._id)"
                  size="small"
                  color="#1a5c3a"
                  variant="flat"
                  class="rounded-pill font-weight-bold text-white px-4"
                  @click="asignarRevisor(item)"
                >
                  Vincular
                </v-btn>
                <v-btn
                  v-else
                  size="small"
                  color="red-lighten-1"
                  variant="tonal"
                  class="rounded-pill font-weight-bold px-4"
                  @click="quitarRevisor(articuloSeleccionado, item.id || item._id)"
                >
                  <v-icon size="16">mdi-close</v-icon> Remover
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Gestor Manual de Roles -->
    <v-dialog v-model="mostrarGestorRoles" max-width="650px">
      <v-card class="rounded-xl">
        <v-toolbar color="white" class="px-4 border-b" flat>
          <v-icon color="grey-darken-3" class="mr-3">mdi-shield-account</v-icon>
          <v-toolbar-title class="text-grey-darken-4 font-weight-bold">Asignación Manual de Multiroles</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" color="grey-darken-2" variant="text" @click="mostrarGestorRoles = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <v-alert v-if="msjGestor" :type="msjGestorTipo" variant="tonal" class="mb-4 font-weight-medium" density="compact">{{ msjGestor }}</v-alert>
          <p class="text-caption text-grey-darken-1 mb-4">Selecciona los roles que desees otorgar a cada usuario en tiempo real. Cuidado al revocar accesos administrativos.</p>
          
          <v-list lines="two" bg-color="transparent" class="pa-0">
            <v-list-item v-for="user in todosUsuarios" :key="user._id" class="mb-3 border rounded-lg bg-grey-lighten-5 pa-3">
              <v-list-item-title class="font-weight-bold text-h6 text-grey-darken-4 mb-1">
                {{ user.username }} 
                <span class="text-body-2 text-grey-darken-1 font-weight-regular ml-2">{{ user.email }}</span>
              </v-list-item-title>
              
              <div class="d-flex align-center flex-wrap gap-2 mt-2">
                <v-checkbox-btn v-model="user.rolesTemp" value="autor" label="Autor" color="primary" class="mr-4"></v-checkbox-btn>
                <v-checkbox-btn v-model="user.rolesTemp" value="revisor" label="Revisor" color="green-darken-2" class="mr-4"></v-checkbox-btn>
                <v-checkbox-btn v-model="user.rolesTemp" value="editor" label="Editor" color="red-darken-2" class="mr-4"></v-checkbox-btn>
                <v-spacer></v-spacer>
                <v-btn size="small" color="blue-grey-darken-3" class="font-weight-bold text-white rounded-pill px-4" elevation="2" @click="guardarRolesManual(user)">
                  Aplicar
                </v-btn>
              </div>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const articulos = ref([]);
const revisores = ref([]);
const cargando = ref(true);
const articuloSeleccionado = ref(null);
const mensajeError = ref('');
const mensajeExito = ref('');

// Estado para Gestor de Roles
const mostrarGestorRoles = ref(false);
const todosUsuarios = ref([]);
const msjGestor = ref('');
const msjGestorTipo = ref('info');

const headersRevisores = [
  { title: 'Revisor', key: 'nombre', align: 'start' },
  { title: 'Carga', key: 'carga', align: 'center' },
  { title: 'Status', key: 'estadoRev', align: 'center' },
  { title: 'Acción', key: 'accion', align: 'end', sortable: false }
];

const getColorEstado = (estado) => {
  switch (estado?.toLowerCase()) {
    case 'recibido': return 'grey-lighten-1';
    case 'pendiente': return 'grey-darken-1';
    case 'en revisión': return 'blue-darken-2';
    case 'cambios menores': return 'teal-darken-1';
    case 'cambios mayores': return 'purple-darken-2';
    case 'aceptado': return 'green-darken-3';
    case 'rechazado': return 'red-darken-3';
    default: return 'black';
  }
};

const getColorCarga = (carga) => {
  if (carga === 0) return 'blue-grey-lighten-1';
  if (carga <= 2) return 'green-darken-2';
  if (carga <= 4) return 'orange-darken-2';
  return 'red-darken-2';
};

const nombreRevisor = (id) => {
  const r = revisores.value.find(rv => rv.id === id || rv._id === id); 
  if(!r) return 'Usuario';
  return r.nombre || r.username || 'Usuario';
};

const estaAsignado = (articulo, revisorId) => {
  if (!articulo || !articulo.revisores) return false;
  return articulo.revisores.some(r => r.revisor === revisorId || r.id === revisorId);
};

const estadoRevision = (articulo, revisorId) => {
  if (!articulo || !articulo.revisores) return false;
  return articulo.revisores.find(r => r.revisor === revisorId || r.id === revisorId)?.completado ?? false;
};

const puedeDecidir = (articulo) =>
  articulo.revisores && articulo.revisores.length >= 2 &&
  articulo.revisores.every(r => r.completado);

const articuloDecidido = (articulo) =>
  articulo.estado === 'Aceptado' || articulo.estado === 'Rechazado' || articulo.estado === 'aceptado' || articulo.estado === 'rechazado';

const revisoresPendientes = (articulo) => {
  if (!articulo || !articulo.revisores) return '';
  return articulo.revisores
    .filter(r => !r.completado)
    .map(r => nombreRevisor(r.revisor || r.id))
    .join(', ');
};

const seleccionarArticulo = (articulo) => {
  if (articuloDecidido(articulo)) {
      articuloSeleccionado.value = articulo; // allow view mode
      return;
  }
  articuloSeleccionado.value = articulo;
  mensajeError.value = '';
  mensajeExito.value = '';
};

// Acciones Reales contra el Backend
const fetchPanelData = async () => {
    cargando.value = true;
    try {
        const token = localStorage.getItem('token');
        if(!token) throw new Error("Sin token");

        const [resArts, resRevs] = await Promise.all([
          fetch('/api/articulos', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/revisores', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (resArts.ok) {
            articulos.value = await resArts.json();
            articulos.value.forEach(a => { a.id = a._id; }); // mapping
        }

        if (resRevs.ok) {
            const rawRevs = await resRevs.json();
            revisores.value = rawRevs.map(r => ({...r, id: r._id || r.id}));
        } else {
             mensajeError.value = "Imposible cargar el staff.";
        }

    } catch (e) {
        console.error("Error cargando panel:", e);
        mensajeError.value = "Error al intentar sincronizar con la nube.";
    } finally {
        cargando.value = false;
    }
}

const asignarRevisor = async (revisor) => {
  const art = articuloSeleccionado.value;
  if (!art) return;

  mensajeError.value = '';
  mensajeExito.value = '';
  
  try {
     const token = localStorage.getItem('token');
     const res = await fetch('/api/asignaciones', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ articuloId: art._id || art.id, revisorId: revisor.id || revisor._id })
     });
     
     const data = await res.json();
     if(res.ok) {
        mensajeExito.value = 'Revisor vinculado exitosamente en DB.';
        await fetchPanelData(); // refresh full state
        // Reselect art visually
        const updatedArt = articulos.value.find(a => a.id === (art._id || art.id));
        if (updatedArt) articuloSeleccionado.value = updatedArt;
     } else {
        mensajeError.value = data.error || 'Error en vinculación.';
     }
  } catch(e) {
     mensajeError.value = 'Peticion POST a /api/asignaciones falló.';
  }
};

const quitarRevisor = async (articulo, revisorId) => {
  mensajeError.value = '';
  mensajeExito.value = '';
  try {
     const token = localStorage.getItem('token');
     const res = await fetch('/api/asignaciones', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ articuloId: articulo._id || articulo.id, revisorId: revisorId })
     });
     
     if(res.ok) {
        mensajeExito.value = 'Removido de DB.';
        await fetchPanelData();
        const updatedArt = articulos.value.find(a => a.id === (articulo._id || articulo.id));
        if (updatedArt) articuloSeleccionado.value = updatedArt;
     } else {
        mensajeError.value = 'No se pudo desvincular.';
     }
  } catch(e) {
     mensajeError.value = 'Peticion DELETE a /api/asignaciones falló.';
  }
};

const decidirArticulo = async (articulo, decision) => {
  if (!puedeDecidir(articulo)) return;
  
  try {
     const token = localStorage.getItem('token');
     await fetch(`/api/articulos/${articulo._id || articulo.id}/estado`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: decision })
     });
     mensajeExito.value = 'El dictamen ha sido cerrado y notificado en DB.';
     await fetchPanelData();
     const updatedArt = articulos.value.find(a => a.id === (articulo._id || articulo.id));
     if (updatedArt) articuloSeleccionado.value = updatedArt;
  } catch(e) {
     console.error(e);
     mensajeError.value = 'Fallo guardando dictamen final.';
  }
};

// Acciones Manuales de Roles
const abrirGestorRoles = async () => {
  msjGestor.value = '';
  mostrarGestorRoles.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/usuarios', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      // Clonar los roles para la vista (modificables temporalmente)
      todosUsuarios.value = data.map(u => ({ ...u, rolesTemp: [...u.roles] }));
    } else {
      msjGestor.value = 'No se pudieron cargar los usuarios.';
      msjGestorTipo.value = 'error';
    }
  } catch (e) {
    msjGestor.value = 'Fallo de red al solicitar usuarios.';
    msjGestorTipo.value = 'error';
  }
};

const guardarRolesManual = async (user) => {
  if (!user.rolesTemp || user.rolesTemp.length === 0) {
    msjGestorTipo.value = 'error';
    msjGestor.value = `Error: ${user.username} debe tener al menos un rol (ej. autor).`;
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/usuarios/${user._id}/roles`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: user.rolesTemp })
    });
    
    if (res.ok) {
      const data = await res.json();
      user.roles = [...data.roles]; // consolidar cambios
      msjGestorTipo.value = 'success';
      msjGestor.value = `¡Roles reales de ${user.username} actualizados con éxito a [${data.roles.join(', ')}]!`;
      // Refrescar lista de revisores por si hubo cambios
      await fetchPanelData();
    } else {
      const errorData = await res.json();
      msjGestorTipo.value = 'error';
      msjGestor.value = errorData.error || 'Error al guardar.';
    }
  } catch (e) {
    msjGestorTipo.value = 'error';
    msjGestor.value = 'Fallo guardando roles.';
  }
};

onMounted(() => {
    fetchPanelData();
});
</script>

<style scoped>
.lh-tight {
  line-height: 1.2 !important;
}

.tracking-wide {
  letter-spacing: 0.1em;
}

.border-card {
  border: 1px solid rgba(0,0,0,0.06);
}

.shadow-sm {
  box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
}

.selected-card {
  border: 2px solid #1a5c3a !important;
  transform: translateY(-2px);
}

.sticky-panel {
  position: sticky;
  top: 100px;
}

.match-height-row {
  align-items: stretch;
}

:deep(.v-data-table__th) {
  text-transform: uppercase;
  font-size: 0.70rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.05em;
  color: #78909c !important;
  background-color: transparent !important;
  border-bottom: 2px solid #eceff1 !important;
}
:deep(.v-data-table__tr) {
  transition: background-color 0.2s ease;
}
:deep(.v-data-table__tr:hover) {
  background-color: #f8fafc !important;
}
</style>