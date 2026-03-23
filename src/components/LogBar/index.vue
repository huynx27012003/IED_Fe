<template>
  <div class="logbar" v-if="$store.state.isAuthenticated">
    <div class="footer-bar">
      <div class="footer-content">
        <span>
          {{ currentTime }} &nbsp; | &nbsp; User:
          {{ $store.state.user.username || username }}
          &nbsp; | &nbsp; Roles: Administrator
          <i
            class="fa-solid fa-lock"
            style="color: #4caf50; margin-left: 10px"
          ></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "LogBar",
  data() {
    return {
      currentTime: "",
      timeInterval: null,
    };
  },
  computed: {
    ...mapState(["user"]),
    username() {
      return this.user?.username || "";
    },
  },
  methods: {
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      });
    },
  },
  mounted() {
    this.updateTime();
    this.timeInterval = setInterval(this.updateTime, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timeInterval);
  },
};
</script>

<style scoped>
.logbar {
  position: fixed;
  left: 48px;
  bottom: 0;
  width: calc(100% - 48px);
  z-index: 999;
  font-size: 12px;
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  background-attachment: fixed;
  background-size: 100% 100vh;
  background-position: 0 0;
  color: #fff;
  height: 2.5vh !important;
}

.footer-bar {
  position: fixed;
  left: 48px;
  bottom: 0;
  width: calc(100% - 48px);
  z-index: 99;
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  background-attachment: fixed;
  background-size: 100% 100vh;
  background-position: 0 0;
  border-top: none;
  font-size: 11px;
  color: #fff;
  height: 2.5vh;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.footer-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 10px;
}
</style>
