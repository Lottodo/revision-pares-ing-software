<template>
  <v-container class="pa-6" max-width="1200">
    <div class="d-flex align-center mb-6">
      <v-icon color="error" size="32" class="mr-3">mdi-shield-account</v-icon>
      <div>
        <h1 class="text-h5 font-weight-bold">Panel de Administración</h1>
        <p class="text-body-2 text-medium-emphasis">{{ auth.activeEvent?.event?.name }}</p>
      </div>
    </div>

    <v-tabs v-model="tab" color="primary" class="mb-6">
      <v-tab value="users">
        <v-icon start>mdi-account-group</v-icon>Usuarios del Sistema
      </v-tab>
      <v-tab value="event-members">
        <v-icon start>mdi-account-multiple-check</v-icon>Miembros del Evento
      </v-tab>
      <v-tab value="events">
        <v-icon start>mdi-calendar-multiple</v-icon>Eventos
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">

      <!-- ── TAB: TODOS LOS USUARIOS ──────────────────────────── -->
      <v-tabs-window-item value="users">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-4 d-flex align-center">
            <span>Usuarios registrados</span>
            <v-spacer />
            <v-text-field
              v-model="userSearch"
              prepend-inner-icon="mdi-magnify"
              placeholder="Buscar..."
              variant="outlined"
              density="compact"
              hide-details
              style="max-width:250px"
            />
          </v-card-title>

          <v-progress-linear v-if="loadingUsers" indeterminate color="primary" />

          <v-data-table
            :headers="userHeaders"
            :items="filteredUsers"
            :loading="loadingUsers"
            hover
            rounded="xl"
          >
            <template #item.events="{ item }">
              <div v-if="item.events?.length">
                <v-chip
                  v-for="ev in item.events"
                  :key="ev.event.id"
                  size="x-small"
                  variant="tonal"
                  color="secondary"
                  class="mr-1 mb-1"
                >
                  {{ ev.event.slug }}: {{ ev.roles.join(', ') }}
                </v-chip>
              </div>
              <span v-else class="text-caption text-medium-emphasis">Sin roles</span>
            </template>

            <template #item.active="{ item }">
              <v-chip :color="item.active ? 'success' : 'error'" size="small" variant="tonal">
                {{ item.active ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn size="small" icon variant="text" @click="openAssignRole(item)">
                <v-icon>mdi-account-plus</v-icon>
                <v-tooltip activator="parent">Asignar rol en evento</v-tooltip>
              </v-btn>
              <v-btn size="small" icon variant="text" color="error" @click="toggleActive(item)">
                <v-icon>{{ item.active ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
                <v-tooltip activator="parent">{{ item.active ? 'Desactivar' : 'Activar' }}</v-tooltip>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-tabs-window-item>

      <!-- ── TAB: MIEMBROS DEL EVENTO ACTIVO ─────────────────── -->
      <v-tabs-window-item value="event-members">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-4">
            Miembros de: <strong class="ml-1">{{ auth.activeEvent?.event?.name }}</strong>
          </v-card-title>

          <v-progress-linear v-if="loadingMembers" indeterminate color="primary" />

          <v-data-table
            :headers="memberHeaders"
            :items="eventMembers"
            :loading="loadingMembers"
            hover
            rounded="xl"
          >
            <template #item.roles="{ item }">
              <v-chip
                v-for="role in item.roles"
                :key="role"
                :color="roleColor(role)"
                size="small"
                variant="tonal"
                closable
                class="mr-1"
                @click:close="removeRole(item, role)"
              >{{ roleLabel(role) }}</v-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn size="small" variant="tonal" color="primary" @click="openAssignRoleEvent(item)">
                <v-icon start size="16">mdi-plus</v-icon>Agregar rol
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-tabs-window-item>

      <!-- ── TAB: EVENTOS ──────────────────────────────────────── -->
      <v-tabs-window-item value="events">
        <div class="d-flex justify-end mb-4">
          <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="showCreateEvent = true">
            Nuevo Evento
          </v-btn>
        </div>

        <v-progress-linear v-if="loadingEvents" indeterminate color="primary" class="mb-4" />

        <v-row>
          <v-col v-for="ev in events" :key="ev.id" cols="12" sm="6" md="4">
            <v-card rounded="xl" elevation="2" hover>
              <v-card-item>
                <template #prepend>
                  <v-avatar :color="ev.active ? 'primary' : 'grey'" variant="tonal" size="40">
                    <v-icon>mdi-school</v-icon>
                  </v-avatar>
                </template>
                <v-card-title class="text-body-1">{{ ev.name }}</v-card-title>
                <v-card-subtitle>{{ ev.slug }}</v-card-subtitle>
                <template #append>
                  <v-chip :color="ev.active ? 'success' : 'grey'" size="x-small" variant="tonal">
                    {{ ev.active ? 'Activo' : 'Inactivo' }}
                  </v-chip>
                </template>
              </v-card-item>
              <v-card-text class="text-caption text-medium-emphasis">
                {{ ev.description || 'Sin descripción' }}
              </v-card-text>
              <v-card-actions>
                <v-btn size="small" variant="text" prepend-icon="mdi-pencil" @click="openEditEvent(ev)">
                  Editar
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  :color="ev.active ? 'error' : 'success'"
                  @click="toggleEvent(ev)"
                >
                  {{ ev.active ? 'Desactivar' : 'Activar' }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

    </v-tabs-window>

    <!-- ── Dialogs ───────────────────────────────────────────── -->
    <AssignRoleDialog
      v-model="showAssignRole"
      :user="selectedUser"
      :events="events"
      @assigned="refreshAll"
    />

    <CreateEventDialog
      v-model="showCreateEvent"
      :event="editingEvent"
      @saved="loadEvents"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="bottom end">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { usersApi, eventsApi } from '../api/index.js';
import AssignRoleDialog from '../components/AssignRoleDialog.vue';
import CreateEventDialog from '../components/CreateEventDialog.vue';

const auth = useAuthStore();
const tab  = ref('users');

// ── Estado ───────────────────────────────────────────────────
const users         = ref([]);
const eventMembers  = ref([]);
const events        = ref([]);
const userSearch    = ref('');
const selectedUser  = ref(null);
const editingEvent  = ref(null);
const showAssignRole   = ref(false);
const showCreateEvent  = ref(false);
const loadingUsers   = ref(false);
const loadingMembers = ref(false);
const loadingEvents  = ref(false);
const snackbar = ref({ show: false, message: '', color: 'success' });

const notify = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

// ── Headers de tablas ─────────────────────────────────────────
const userHeaders = [
  { title: 'Usuario',  key: 'username', sortable: true  },
  { title: 'Email',    key: 'email',    sortable: false },
  { title: 'Estado',   key: 'active',   sortable: true  },
  { title: 'Roles/Eventos', key: 'events', sortable: false },
  { title: '',         key: 'actions',  sortable: false, align: 'end' },
];

const memberHeaders = [
  { title: 'Usuario', key: 'username', sortable: true  },
  { title: 'Email',   key: 'email',    sortable: false },
  { title: 'Roles',   key: 'roles',    sortable: false },
  { title: '',        key: 'actions',  sortable: false, align: 'end' },
];

// ── Computed ─────────────────────────────────────────────────
const filteredUsers = computed(() =>
  userSearch.value
    ? users.value.filter((u) =>
        u.username.toLowerCase().includes(userSearch.value.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.value.toLowerCase())
      )
    : users.value
);

// ── Loaders ───────────────────────────────────────────────────
const loadUsers = async () => {
  loadingUsers.value = true;
  try {
    const { data } = await usersApi.list();
    users.value = data.data;
  } finally { loadingUsers.value = false; }
};

const loadEventMembers = async () => {
  if (!auth.eventId) return;
  loadingMembers.value = true;
  try {
    const { data } = await usersApi.byEvent(auth.eventId);
    eventMembers.value = data.data;
  } finally { loadingMembers.value = false; }
};

const loadEvents = async () => {
  loadingEvents.value = true;
  try {
    const { data } = await eventsApi.list();
    events.value = data.data;
  } finally { loadingEvents.value = false; }
};

const refreshAll = async () => {
  await Promise.all([loadUsers(), loadEventMembers()]);
  notify('Cambio aplicado correctamente.');
};

// ── Acciones ─────────────────────────────────────────────────
const openAssignRole = (user) => {
  selectedUser.value = user;
  showAssignRole.value = true;
};

const openAssignRoleEvent = (member) => {
  // Pre-seleccionar el usuario con el evento activo
  selectedUser.value = { ...member, preselectedEventId: auth.eventId };
  showAssignRole.value = true;
};

const removeRole = async (member, role) => {
  try {
    await usersApi.removeRole({ userId: member.id, eventId: auth.eventId, role });
    await loadEventMembers();
    notify(`Rol ${role} removido de ${member.username}.`);
  } catch (e) {
    notify(e.response?.data?.error || 'Error al remover rol', 'error');
  }
};

const toggleActive = async (user) => {
  try {
    await usersApi.update(user.id, { active: !user.active });
    await loadUsers();
    notify(`Usuario ${user.active ? 'desactivado' : 'activado'}.`);
  } catch (e) {
    notify(e.response?.data?.error || 'Error al actualizar usuario', 'error');
  }
};

const openEditEvent = (ev) => {
  editingEvent.value = ev;
  showCreateEvent.value = true;
};

const toggleEvent = async (ev) => {
  try {
    await eventsApi.update(ev.id, { active: !ev.active });
    await loadEvents();
    notify(`Evento ${ev.active ? 'desactivado' : 'activado'}.`);
  } catch (e) {
    notify(e.response?.data?.error || 'Error al actualizar evento', 'error');
  }
};

// ── Helpers ───────────────────────────────────────────────────
const roleColor = (r) => ({ ADMIN: 'error', EDITOR: 'secondary', REVIEWER: 'warning', AUTHOR: 'accent' }[r] || 'grey');
const roleLabel = (r) => ({ ADMIN: 'Admin', EDITOR: 'Editor', REVIEWER: 'Revisor', AUTHOR: 'Autor' }[r] || r);

onMounted(() => Promise.all([loadUsers(), loadEventMembers(), loadEvents()]));
</script>
