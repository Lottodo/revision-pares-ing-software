import { createRouter, createWebHistory } from 'vue-router'
import SubirArticulo from '../views/SubirArticulo.vue'
import EstadoArticulos from '../views/EstadoArticulos.vue' // Importamos tu nueva vista

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/subir-articulo' // Arregla el error de la consola
    },
    {
      path: '/subir-articulo',
      name: 'subir-articulo',
      component: SubirArticulo
    },
    {
      path: '/estado-articulos',
      name: 'estado-articulos',
      component: EstadoArticulos // Tu nueva tarea
    }
  ]
})

export default router