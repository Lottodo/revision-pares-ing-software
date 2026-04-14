import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SubirArticulo from '../views/SubirArticuloView.vue'
import EstadoArticulos from '../views/EstadoArticulosView.vue'
import ArticulosAsignados from '../views/ArticulosAsignadosView.vue'
import EditorDashboard from '../views/PanelEditorView.vue'
import AdminDashboard from '../views/AdminDashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true }
    },
    {
      path: '/',
      redirect: '/subir-articulo'
    },
    {
      path: '/subir-articulo',
      name: 'subir-articulo',
      component: SubirArticulo,
      meta: { requiresAuth: true }
    },
    {
      path: '/estado-articulos',
      name: 'estado-articulos',
      component: EstadoArticulos,
      meta: { requiresAuth: true }
    },
    {
      path: '/articulos-asignados',
      name: 'articulos-asignados',
      component: ArticulosAsignados,
      meta: { requiresAuth: true }
    },
    {
      path: '/editor',
      name: 'editor',
      component: EditorDashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: { requiresAuth: true }
    }
  ]
})

// Guard de navegacion global
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // Si la ruta requiere auth y no hay token -> login
  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' })
  }

  // Si la ruta es de guest (login) y ya hay token -> dashboard
  if (to.meta.guest && token) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const roles = user.roles || (user.rol ? [user.rol] : [])

    if (roles.includes('administrador')) return next('/admin')
    if (roles.includes('editor')) return next('/editor')
    if (roles.includes('revisor')) return next('/articulos-asignados')
    return next('/subir-articulo')
  }

  next()
})

export default router