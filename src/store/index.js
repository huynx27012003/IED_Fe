import { createStore } from 'vuex'
import Cookies from 'js-cookie'

const savedUser = JSON.parse(localStorage.getItem('user'))
const savedToken = Cookies.get('token')

const store = createStore({
  state() {
    return {
      isAuthenticated: !!savedToken,
      user: savedUser || null,
      serverAddr: localStorage.getItem('SERVER_ADDR') || 'http://localhost:8000',
      selectedOwner: null,
    }
  },
  mutations: {
    setAuthenticated(state, value) {
      state.isAuthenticated = value
    },
    setUser(state, user) {
      if (!user.username && user.sub) {
    user.username = user.sub
  }
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    setSelectedOwner(state, owner) {
    state.selectedOwner = owner
  },
    logout(state) {
      state.isAuthenticated = false
      state.user = null
      Cookies.remove('token')
      localStorage.removeItem('user')
    },
    setServerAddr(state, addr) {
      state.serverAddr = addr
      localStorage.setItem('SERVER_ADDR', addr)
    }
  },
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    user: state => state.user,
    role: state => state.user?.role || null,
    selectedOwner: state => state.selectedOwner,
  }
})

export default store
