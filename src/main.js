import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@fortawesome/fontawesome-free/css/all.min.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import store from './store'
import Cookies from 'js-cookie'
import { getUserFromToken } from '@/api/auth'

function bootstrapApp() {
  const app = createApp(App)
  app.use(router)
  app.use(ElementPlus)
  app.use(store)
  app.mount('#app')
}

const token = Cookies.get('token')
if (token) {
  getUserFromToken(token)
  .then(async userInfo => {
    store.commit('setAuthenticated', true)
    store.commit('setUser', userInfo)
    await Promise.resolve() 
    bootstrapApp()
  })

    .catch(() => {
      store.commit('logout')
      Cookies.remove('token')
      bootstrapApp()
    })
} else {
  bootstrapApp()
}