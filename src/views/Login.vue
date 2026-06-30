<template>
  <div class="login-container">
    <div class="login-panel">
      <div class="panel-header">
        <div class="brand-badge">
          ATDigital IED
        </div>
      </div>

      <div class="login-title">{{ $tUi('iedManagementSystem') }}</div>

      <div class="login-form">
        <el-button class="sso-button" @click="startSSOPopupLogin">
          <i class="fa-solid fa-right-to-bracket"></i>
          {{ $tUi('loginWithSso') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import client from "@/api/client";
import { mapMutations } from "vuex";

const CLIENT_ID = '1005';

export default {
  name: "Login",
  methods: {
    ...mapMutations(["setAuthenticated", "setUser"]),
    startSSOPopupLogin() {
  const callbackUrl = window.location.origin + '/oauth2-popup-callback.html';
  client.get('/auth/sso/login_url', { params: { redirectUri: callbackUrl }})
    .then(resp => {
      const res = resp.data || {};
      const loginUrl = res.data;
      if (!loginUrl) {
        this.$message.error(this.$tUi('ssoLoginUrlFailed'));
        return;
      }

      const width = 420;
      const height = 560;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const url = (loginUrl.indexOf('?') === -1 ? (loginUrl + '?') : (loginUrl + '&')) + 'popup=true';

      window.open(
        url,
        'smart-sso-login',
        `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
      );

      const handler = (event) => {
        if (event.origin !== window.location.origin) return;
        const data = event.data || {};
        if (data.type === 'smart-sso-oauth' && data.code) {
          window.removeEventListener('message', handler);
          this.exchangeCodeForToken(data.code);
        }
      };
      window.addEventListener('message', handler, false);
    })
    .catch((error) => this.$notifyApiError?.(error, this.$tUi('ssoLoginUrlFailed')));
}
,
    exchangeCodeForToken(code) {
      client.get('/auth/sso/access-token', { params: { code }})
        .then(resp => {
          const res = resp.data || {};
          if (res.code !== 1) { 
            this.$message.error(res.message || this.$tUi('ssoLoginFailed'));
            return; 
          }
          const ssoToken = res.data;
          if (!ssoToken || !ssoToken.accessToken) { 
            this.$message.error(this.$tUi('missingAccessToken'));
            return; 
          }
          localStorage.setItem('accessToken' + CLIENT_ID, ssoToken.accessToken);
          if (ssoToken.refreshToken) {
            localStorage.setItem('refreshToken' + CLIENT_ID, ssoToken.refreshToken);
          }
          const username = ssoToken.tokenUser?.username || 'sso-user';
          const roles = ssoToken.tokenUser?.roles || [];
          const authorities = roles.map(r => (r || '').toUpperCase());
          const userData = { 
            username, 
            roles, 
            authorities, 
            role: roles[0] || null 
          };
          try { 
            localStorage.setItem('user', JSON.stringify(userData)); 
          } catch (e) {
            // Ignore localStorage errors - auth will work with in-memory state
            console.warn('Failed to save user data to localStorage:', e);
          }
          this.setAuthenticated(true);
          this.setUser(userData);
          this.$router.replace({ name: 'tree' });
        })
        .catch((error) => this.$notifyApiError?.(error, this.$tUi('ssoTokenExchangeFailed')));
    }
  },
};
</script>

<style scoped>
.login-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #f8fbff 0%, #edf4fd 52%, #f5f9ff 100%);
  font-family: "IBM Plex Sans", "Montserrat", "Noto Sans", sans-serif;
}

.login-container::before,
.login-container::after {
  content: "";
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
}

.login-container::before {
  width: 460px;
  height: 460px;
  left: -160px;
  top: -180px;
  background: radial-gradient(circle at 30% 30%, rgba(86, 154, 236, 0.22), rgba(86, 154, 236, 0));
}

.login-container::after {
  width: 520px;
  height: 520px;
  right: -220px;
  bottom: -240px;
  background: radial-gradient(circle at 35% 35%, rgba(34, 85, 158, 0.18), rgba(34, 85, 158, 0));
}

.login-panel {
  position: relative;
  z-index: 1;
  width: min(92vw, 460px);
  padding: 26px 24px;
  border-radius: 18px;
  border: 1px solid rgba(167, 197, 233, 0.74);
  background: linear-gradient(155deg, rgba(247, 252, 255, 0.76), rgba(233, 244, 255, 0.66));
  backdrop-filter: blur(14px) saturate(118%);
  -webkit-backdrop-filter: blur(14px) saturate(118%);
  box-shadow: 0 14px 28px rgba(23, 54, 104, 0.18);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #1b477f;
  border: 1px solid rgba(169, 198, 234, 0.86);
  background: rgba(228, 241, 255, 0.78);
}

.login-form {
  margin-top: 50px;
}

.login-title {
  margin: 14px 0 8px;
  text-align: center;
  font-size: 26px;
  font-weight: 800;
  color: #123f79;
  letter-spacing: 0.2px;
}

.sso-button {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.2px;
  background: linear-gradient(130deg, #1e3c72 0%, #2a5298 100%) !important;
  box-shadow: 0 10px 20px rgba(34, 76, 140, 0.28);
}

.sso-button:hover {
  transform: translateY(-1px);
}

.sso-button :deep(i) {
  margin-right: 8px;
}

</style>
