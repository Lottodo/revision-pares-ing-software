<template>
  <v-container fluid class="pa-md-8 pa-4 max-width-container">
    <v-card class="elevation-3 w-100 rounded-xl overflow-hidden border-card">
      <v-toolbar color="white" flat class="border-b px-4">
        <v-toolbar-title class="text-grey-darken-4 font-weight-black text-h5">
          <v-icon start size="28" class="mr-2 text-deep-purple-darken-2">mdi-shield-crown-outline</v-icon>
          Panel de Administración
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pa-md-8 pa-6 bg-white">
        <p class="text-body-1 text-grey-darken-2 mb-6 font-weight-medium">
          Gestiona los roles de cada usuario registrado. Los cambios se aplican en tiempo real.
          Solo un Administrador puede otorgar o revocar los roles de <strong>autor</strong>, <strong>revisor</strong>, <strong>editor</strong> y <strong>administrador</strong>.
        </p>

        <v-alert v-if="msjGestor" :type="msjGestorTipo" variant="tonal" class="mb-6 font-weight-medium rounded-lg" density="compact">{{ msjGestor }}</v-alert>

        <v-row v-if="cargando">
          <v-col cols="12" class="d-flex justify-center pa-10">
            <v-progress-circular indeterminate color="deep-purple-darken-2" size="64" width="4"></v-progress-circular>
          </v-col>
        </v-row>

        <v-list v-else lines="two" bg-color="transparent" class="pa-0">
          <v-list-item
            v-for="user in todosUsuarios"
            :key="user._id"
            class="mb-4 border rounded-xl bg-grey-lighten-5 pa-0 overflow-hidden shadow-sm"
          >
            <div class="d-flex flex-column flex-sm-row pa-4">
              <!-- Avatar y Info Principal -->
              <div class="d-flex align-center mb-4 mb-sm-0 mr-sm-6">
                <v-avatar color="deep-purple-lighten-4" size="56" class="mr-4">
                  <span class="text-deep-purple-darken-3 font-weight-black text-h6">{{ user.username.substring(0, 2).toUpperCase() }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-black text-h6 text-grey-darken-4 line-height-tight">{{ user.username }}</div>
                  <div class="text-body-2 text-grey-darken-1">{{ user.email }}</div>
                </div>
              </div>

              <!-- Roles actuales badges -->
              <div class="d-flex align-center flex-grow-1">
                <div class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="r in user.roles"
                    :key="r"
                    size="x-small"
                    :color="getColorRol(r)"
                    variant="flat"
                    class="font-weight-bold text-white shadow-sm"
                  >
                    {{ r }}
                  </v-chip>
                </div>
              </div>
            </div>

            <v-divider></v-divider>

            <!-- Gestor de Roles Seccion -->
            <div class="bg-white pa-4">
              <div class="text-overline text-grey-darken-1 mb-2">Asignar Permisos</div>
              <div class="d-flex flex-column flex-md-row align-md-center justify-space-between gap-3">
                <div class="d-flex flex-wrap gap-x-4 gap-y-1">
                  <v-checkbox-btn v-model="user.rolesTemp" value="autor" label="Autor" color="blue-darken-2" density="comfortable"></v-checkbox-btn>
                  <v-checkbox-btn v-model="user.rolesTemp" value="revisor" label="Revisor" color="green-darken-2" density="comfortable"></v-checkbox-btn>
                  <v-checkbox-btn v-model="user.rolesTemp" value="editor" label="Editor" color="orange-darken-2" density="comfortable"></v-checkbox-btn>
                  <v-checkbox-btn v-model="user.rolesTemp" value="administrador" label="Admin" color="deep-purple-darken-2" density="comfortable"></v-checkbox-btn>
                </div>
                
                <v-btn
                  block
                  class="d-md-none mt-2 font-weight-black text-white rounded-lg"
                  color="deep-purple-darken-2"
                  @click="guardarRoles(user)"
                  :loading="user._saving"
                  size="large"
                >
                  <v-icon start>mdi-content-save-check-outline</v-icon>
                  Actualizar Roles
                </v-btn>

                <v-btn
                  display="none"
                  class="d-none d-md-flex font-weight-black text-white rounded-pill px-8"
                  color="deep-purple-darken-2"
                  elevation="2"
                  @click="guardarRoles(user)"
                  :loading="user._saving"
                >
                  <v-icon start>mdi-content-save-check-outline</v-icon>
                  Aplicar
                </v-btn>
              </div>
            </div>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const todosUsuarios = ref([]);
const cargando = ref(true);
const msjGestor = ref('');
const msjGestorTipo = ref('info');

const getColorRol = (rol) => {
  switch (rol) {
    case 'autor': return 'blue-darken-2';
    case 'revisor': return 'green-darken-2';
    case 'editor': return 'orange-darken-2';
    case 'administrador': return 'deep-purple-darken-2';
    default: return 'grey';
  }
};

onMounted(async () => {
  cargando.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/usuarios', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      todosUsuarios.value = data.map(u => ({ ...u, rolesTemp: [...u.roles], _saving: false }));
    } else {
      msjGestor.value = 'No se pudieron cargar los usuarios.';
      msjGestorTipo.value = 'error';
    }
  } catch (e) {
    msjGestor.value = 'Fallo de red al solicitar usuarios.';
    msjGestorTipo.value = 'error';
  } finally {
    cargando.value = false;
  }
});

const guardarRoles = async (user) => {
  if (!user.rolesTemp || user.rolesTemp.length === 0) {
    msjGestorTipo.value = 'error';
    msjGestor.value = `Error: ${user.username} debe tener al menos un rol.`;
    return;
  }
  user._saving = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/usuarios/${user._id}/roles`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: user.rolesTemp })
    });

    if (res.ok) {
      const data = await res.json();
      user.roles = [...data.roles];
      msjGestorTipo.value = 'success';
      msjGestor.value = `Roles de ${user.username} actualizados a [${data.roles.join(', ')}].`;
    } else {
      const errorData = await res.json();
      msjGestorTipo.value = 'error';
      msjGestor.value = errorData.error || 'Error al guardar.';
    }
  } catch (e) {
    msjGestorTipo.value = 'error';
    msjGestor.value = 'Fallo guardando roles.';
  } finally {
    user._saving = false;
  }
};
</script>

<style scoped>
.border-card {
  border: 1px solid rgba(0,0,0,0.06);
}
</style>
