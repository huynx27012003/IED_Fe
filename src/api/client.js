import axios from 'axios'
import store from '@/store'

const CLIENT_ID = '1005'
const TOKEN_NAME_PREFIX = 'smart-sso-token-'

const toApiBase = (addr) => {
  if (!addr) return '/api'
  let base = String(addr).trim()
  base = base.replace(/\/+$/, '')
  if (base.toLowerCase().endsWith('/api')) return base
  return base + '/api'
}

const client = axios.create({
  baseURL: toApiBase(store.state.serverAddr)
})

client.interceptors.request.use(config => {
  const accessToken = localStorage.getItem('accessToken' + CLIENT_ID)
  if (!config.headers) config.headers = {}
  if (accessToken) {
    config.headers[TOKEN_NAME_PREFIX + CLIENT_ID] = accessToken
  }
  config.headers['X-Requested-With'] = 'XMLHttpRequest'
  const lang = store.state.language || 'en-vi'
  config.headers['Accept-Language'] = lang
  return config
})

store.watch(
  (state) => state.serverAddr,
  (newAddr) => {
    client.defaults.baseURL = toApiBase(newAddr)
  }
)
function clearAuthAndRedirect() {
  try {
    localStorage.removeItem('accessToken' + CLIENT_ID);
    localStorage.removeItem('refreshToken' + CLIENT_ID);
  } catch (e) { "error" }
  store.commit('logout');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

client.interceptors.response.use(
  async (response) => {
    const res = response && response.data ? response.data : null;
    if (!res || typeof res.code === 'undefined') return response;
    if (res.code === 1) return response;

    // Chưa login || timeout
    if (res.code === 10) {
      clearAuthAndRedirect();
      return Promise.reject(new Error(res.message || 'Not logged in'));
    }

    // at hết hạn / rt còn
    if (res.code === 15) {
      const refreshToken = localStorage.getItem('refreshToken' + CLIENT_ID);
      if (refreshToken) {
        try {
          const refreshResp = await client.get('/auth/sso/refresh-token', { params: { refreshToken }});
          const r = refreshResp.data || {};
          if (r.code === 1 && r.data && r.data.accessToken) {
            localStorage.setItem('accessToken' + CLIENT_ID, r.data.accessToken);
            if (r.data.refreshToken) {
              localStorage.setItem('refreshToken' + CLIENT_ID, r.data.refreshToken);
            }
            const cfg = { ...response.config };
            cfg.headers = cfg.headers || {};
            cfg.headers[TOKEN_NAME_PREFIX + CLIENT_ID] = r.data.accessToken;
            return client.request(cfg);
          }
        } catch (e) {
          // Fall-through to clear/redirect
        }
      }
      clearAuthAndRedirect();
      return Promise.reject(new Error(res.message || 'Token expired'));
    }

    // No permission
    if (res.code === 20) {
      return Promise.reject(new Error(res.message || 'No permission'));
    }

    return response;
  },
  (error) => {
    if (error && error.response && error.response.status === 401) {
      clearAuthAndRedirect();
    }
    return Promise.reject(error);
  }
);
export default client

