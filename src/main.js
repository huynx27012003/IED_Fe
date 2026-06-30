import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@fortawesome/fontawesome-free/css/all.min.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import store from './store'
import { installApiActionFeedback } from '@/helpers/apiActionFeedback'
import { installApiFeedback } from '@/helpers/apiFeedback'
import { installI18n } from '@/helpers/i18n'

function bootstrapApp() {
  const app = createApp(App)
  installApiFeedback(app)
  installApiActionFeedback()
  installI18n(app, store)
  app.use(router)
  app.use(ElementPlus)
  app.use(store)
  app.mount('#app')
}

// Initialize from SSO local storage if present
const accessToken = localStorage.getItem('accessToken1005')
const userJson = localStorage.getItem('user')
if (accessToken && userJson) {
  try {
    const userInfo = JSON.parse(userJson)
    store.commit('setAuthenticated', true)
    store.commit('setUser', userInfo)
  } catch (e) {
    // Ignore JSON parse errors - invalid user data will be handled by auth flow
    console.warn('Failed to parse stored user data:', e)
  }
}

bootstrapApp()
