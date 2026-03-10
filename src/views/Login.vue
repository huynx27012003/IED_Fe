<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">Đăng nhập</h2>
      <div class="login-form" style="text-align:center;">
        <el-button type="success" @click="startSSOPopupLogin">Login with SSO</el-button>
      </div>
    </el-card>
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
        this.$message.error('Không lấy được SSO login URL');
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
    .catch(() => this.$message.error('Không lấy được SSO login URL'));
}
,
    exchangeCodeForToken(code) {
      client.get('/auth/sso/access-token', { params: { code }})
        .then(resp => {
          const res = resp.data || {};
          if (res.code !== 1) { 
            this.$message.error(res.message || 'SSO login failed'); 
            return; 
          }
          const ssoToken = res.data;
          if (!ssoToken || !ssoToken.accessToken) { 
            this.$message.error('Thiếu accessToken'); 
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
        .catch(() => this.$message.error('Không đổi code lấy token được'));
    }
  },
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6fa;
}
.login-card {
  width: 350px;
  padding: 32px 24px;
}
.login-title {
  text-align: center;
  margin-bottom: 24px;
  font-weight: bold;
  font-size: 22px;
  color: #333;
}
.login-form {
  margin-top: 12px;
}
</style>
