import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import Layout from '../layout/index.vue'
import Login from '../views/Login.vue'
import treeNavigation from '../views/treeNavigation.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        redirect: { name: 'tree' }
      },
      {
        path: 'login',
        name: 'login',
        component: Login
      },
      {
        path: 'home',
        name: 'tree',
        meta: { requiresAuth: true },
        component: treeNavigation
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const isAuth = store.state.isAuthenticated

  if (to.meta.requiresAuth && !isAuth) {
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuth) {
    next({ name: 'tree' }) 
  } else {
    next()
  }
})

export default router
