<template>
  <div class="logbar" v-if="$store.state.isAuthenticated">
    <ul
      v-show="logBarVisible"
      class="log-list"
      :style="{ height: logListHeight + 'px' }"
    >
      <div class="resize-handle" @mousedown="startResize"></div>
      <li class="log-header">
        <span class="icon">Icon</span>
        <span class="datetime">Date & Time</span>
        <span class="catgory">Category</span>
        <span class="user">User</span>
        <span class="object">Object</span>
        <span class="message">Message</span>
      </li>
      <li v-for="(log, idx) in filteredLogs" :key="idx" class="log-item">
        <span class="icon"><i :class="getIconClass(log.catgory)" /></span>
        <span class="datetime">{{ log.datetime }}</span>
        <span class="catgory">{{ log.catgory }}</span>
        <span class="user">{{ log.user }}</span>
        <span class="object">{{ log.object }}</span>
        <span class="message">{{ log.message }}</span>
      </li>
    </ul>
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
        <span class="footer-icons">
          <i class="fa-solid fa-square-caret-down" @click="hideLogBar"></i>
          <i class="fa-solid fa-square-caret-up" @click="showLogBar"></i>
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
      initialY: 0,
      initialHeight: 0,
      filterText: "",
      logBarVisible: false,
      logListHeight: 200,
      isResizing: false,
      currentTime: "",
      timeInterval: null,
      logs: [
        {
          catgory: "Message",
          datetime: "20/02/2025 11:00:01",
          user: "AnhOLD",
          object: "TBA 110kV PHỐ CAO",
          message: "Substation opened: TBA 110kV PHỐ CAO",
        },
        {
          catgory: "Message",
          datetime: "20/02/2025 11:00:10",
          user: "AnhOLD",
          object: "B13L-F8BT",
          message: "Opened Device: B13L-F8BT",
        },
        {
          catgory: "Process",
          datetime: "20/02/2025 11:00:01",
          user: "AnhOLD",
          object: "B13L-F8BT",
          message: "Imported parameter settings: B13L-F8BT",
        },
        {
          catgory: "Message",
          datetime: "20/02/2025 11:00:01",
          user: "AnhOLD",
          object: "TBA 110kV PHỐ CAO",
          message: "Synchronized successfully",
        },
        {
          catgory: "Alarm",
          datetime: "20/02/2025 11:00:01",
          user: "AnhOLD",
          object: "B13L-BCU",
          message: "Deleted Devices: B13L-BCU",
        },
        {
          catgory: "Warning",
          datetime: "20/02/2025 11:00:01",
          user: "AnhOLD",
          object: "B13L-F8BT",
          message: "Synchronization Failed: B13L-F8BT33",
        },
      ],
    };
  },
  computed: {
    ...mapState(["serverAddr", "user"]),
    username() {
      return this.user?.username || "";
    },
    filteredLogs() {
      if (!this.filterText) return this.logs;
      const txt = this.filterText.toLowerCase();
      return this.logs.filter(
        (log) =>
          log.catgory.toLowerCase().includes(txt) ||
          log.datetime.toLowerCase().includes(txt) ||
          log.user.toLowerCase().includes(txt) ||
          log.object.toLowerCase().includes(txt) ||
          log.message.toLowerCase().includes(txt)
      );
    },
  },
  methods: {
    showLogBar() {
      this.logBarVisible = true;
    },
    hideLogBar() {
      this.logBarVisible = false;
    },
    getIconClass(catgory) {
      switch (catgory) {
        case "Message":
          return "fa-solid fa-envelope-open text-primary";
        case "Process":
          return "fa-solid fa-cogs text-info";
        case "Alarm":
          return "fa-solid fa-triangle-exclamation text-warning";
        case "Warning":
          return "fa-solid fa-circle-exclamation text-danger";
        default:
          return "fa-solid fa-info-circle text-secondary";
      }
    },
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
    startResize(e) {
      this.isResizing = true;
      this.initialY = e.clientY;
      this.initialHeight = this.logListHeight;

      document.addEventListener("mousemove", this.resize);
      document.addEventListener("mouseup", this.stopResize);
    },
    resize(e) {
      if (this.isResizing) {
        const delta = this.initialY - e.clientY;
        const newHeight = this.initialHeight + delta;

        const windowHeight = window.innerHeight;
        if (newHeight >= 100 && newHeight <= windowHeight - 100) {
          this.logListHeight = newHeight;
        }
      }
    },
    stopResize() {
      this.isResizing = false;
      document.removeEventListener("mousemove", this.resize);
      document.removeEventListener("mouseup", this.stopResize);
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
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: 9999;
  font-size: 12px;
  height: 3vh !important;
}

.log-list {
  position: fixed;
  left: 0;
  bottom: 3vh;
  width: 100vw;
  z-index: 10000;
  background: #fff;
  pointer-events: auto;
  overflow-y: auto;
  font-size: 12px;
  margin: 0;
  border: 1px solid #bdbdbd;
  padding: 0;
}

.resize-handle {
  width: 100%;
  height: 1px;
  background: #ccc;
  cursor: ns-resize;
  position: absolute;
  top: 0;
  left: 0;
}

.log-header {
  display: flex;
  align-items: center;
  background: #e9ecef;
  padding: 5px 0;
  font-weight: 500;
  border-bottom: 1px solid #dee2e6;
}

.log-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding: 4px 0;
  transition: background 0.2s;
}

.log-item:hover {
  background: #f0f8ff;
}

.icon {
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.datetime {
  width: 150px;
  padding-left: 10px;
}

.catgory {
  width: 90px;
  padding-left: 10px;
  font-weight: 600;
}

.user {
  width: 90px;
  padding-left: 10px;
}

.object {
  width: 160px;
  padding-left: 10px;
  font-weight: 500;
  color: #1976d2;
}

.message {
  flex: 1;
  padding-left: 10px;
  color: #444;
}

.footer-bar {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: 9999;
  background: #f5f5f5;
  border-top: 1px solid #eee;
  font-size: 11px;
  color: #555;
  height: 3vh;
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

.footer-icons i {
  font-size: 13px;
  margin-left: 5px;
  cursor: pointer;
}

.text-primary {
  color: #1976d2;
}
.text-info {
  color: #17a2b8;
}
.text-warning {
  color: #ffc107;
}
.text-danger {
  color: #dc3545;
}
.text-secondary {
  color: #888;
}
</style>
