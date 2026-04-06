import { createRouter, createWebHistory } from 'vue-router'
import SubirArticulo from '../views/SubirArticulo.vue'
import EstadoArticulos from '../views/EstadoArticulos.vue'
import ArticulosAsignados from '../views/ArticulosAsignados.vue'
import EditorDashboard from '../views/EditorDashboard.vue'   

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/subir-articulo'
    },
    {
      path: '/subir-articulo',
      name: 'subir-articulo',
      component: SubirArticulo
    },
    {
      path: '/estado-articulos',
      name: 'estado-articulos',
      component: EstadoArticulos
    },
    {
      path: '/articulos-asignados',
      name: 'articulos-asignados',
      component: ArticulosAsignados
    },
    {
      path: '/editor',           
      name: 'editor',            
      component: EditorDashboard 
    }
  ]
})

export default router