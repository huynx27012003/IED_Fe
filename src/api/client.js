import axios from 'axios'
import store from '@/store'
import Cookies from 'js-cookie'

const client = axios.create({
  baseURL: store.state.serverAddr
})

client.interceptors.request.use(config => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

store.watch(
  (state) => state.serverAddr,
  (newAddr) => {
    client.defaults.baseURL = newAddr
  }
)

export default client