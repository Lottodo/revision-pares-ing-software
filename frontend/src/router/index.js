// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

// Lazy-loaded views por rol
const LoginView           = () => import('../views/LoginView.vue');
const RegisterView        = () => import('../views/RegisterView.vue');
const EventSelectorView   = () => import('../views/EventSelectorView.vue');
const AuthorView          = () => import('../views/AuthorView.vue');
const ReviewerView        = () => import('../views/ReviewerView.vue');
const ReviewWorkerView    = () => import('../views/ReviewWorkerView.vue');
const EditorView          = () => import('../views/EditorView.vue');
const AdminView           = () => import('../views/AdminView.vue');
const PaperDetailView     = () => import('../views/PaperDetailView.vue');
const ReviewFormView      = () => import('../views/ReviewFormView.vue');
const NotFoundView        = () => import('../views/NotFoundView.vue');

const routes = [
  { path: '/login',          name: 'login',          component: LoginView,          meta: { guest: true } },
  { path: '/register',       name: 'register',       component: RegisterView,       meta: { guest: true } },
  { path: '/select-event',   name: 'select-event',   component: EventSelectorView,  meta: { requiresAuth: true } },
  { path: '/author',         name: 'author',         component: AuthorView,         meta: { requiresAuth: true, roles: ['AUTHOR'] } },
  {
    path: '/reviewer',
    name: 'reviewer',
    component: ReviewerView,
    meta: { requiresAuth: true, roles: ['REVIEWER'] },
  },
  {
    path: '/reviewer/work/:id',
    name: 'review-worker',
    component: ReviewWorkerView,
    meta: { requiresAuth: true, roles: ['REVIEWER'] },
  },
  { path: '/editor',         name: 'editor',         component: EditorView,         meta: { requiresAuth: true, roles: ['EDITOR', 'ADMIN'] } },
  { path: '/admin',          name: 'admin',          component: AdminView,          meta: { requiresAuth: true, roles: ['ADMIN'] } },
  { path: '/papers/:id',     name: 'paper-detail',   component: PaperDetailView,    meta: { requiresAuth: true } },
  { path: '/review/:assignmentId', name: 'review-form', component: ReviewFormView,  meta: { requiresAuth: true, roles: ['REVIEWER'] } },
  { path: '/',               redirect: () => defaultRedirect() },
  { path: '/:pathMatch(.*)*', name: 'not-found',     component: NotFoundView },
];

const defaultRedirect = () => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated) return '/login';
  if (!auth.eventId && !auth.isGlobalAdmin) return '/select-event';
  if (auth.isAdmin) return '/admin';
  if (auth.isEditor) return '/editor';
  if (auth.isReviewer) return '/reviewer';
  return '/author';
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();

  // Ruta pública (login)
  if (to.meta.guest) {
    return auth.isAuthenticated ? next(defaultRedirect()) : next();
  }

  // Requiere autenticación
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'login' });
  }

  // Requiere contexto de evento (no para select-event ni admin global)
  if (to.meta.requiresAuth && to.name !== 'select-event' && !auth.eventId && !auth.isGlobalAdmin) {
    return next({ name: 'select-event' });
  }

  // Si es admin global puede entrar a admin siempre
  if (auth.isGlobalAdmin && to.name === 'admin') {
    return next();
  }

  // Requiere rol específico
  if (to.meta.roles?.length) {
    const hasRole = to.meta.roles.some((r) => auth.roles.includes(r));
    if (!hasRole) return next(defaultRedirect());
  }

  next();
});

export default router;
