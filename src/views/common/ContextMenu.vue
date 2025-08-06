<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ top: `${position.y - 32}px`, left: `${position.x}px` }"
  >
    <!-- Menu cho feeder -->
    <ul v-if="nodeMode === 'feeder'">
      <li @mouseenter="openSub(0, 'addDevices')">
        + Add Devices <span class="arrow">▶</span>
        <div v-if="isOpen(0, 'addDevices')" class="submenu">
          <div class="submenu-item" @mouseenter="openSub(1, 'iec')">
            IEC 61850 IEDs <span class="arrow">▶</span>
            <div v-if="isOpen(1, 'iec')" class="submenu">
              <div class="submenu-item" @mouseenter="openSub(2, 'abb')">
                ABB <span class="arrow">▶</span>
                <div v-if="isOpen(2, 'abb')" class="submenu">
                  <div class="submenu-item">Generator Protection</div>
                  <div class="submenu-item">Transformer Protection</div>
                  <div class="submenu-item">Feeder Protection</div>
                </div>
              </div>
              <div class="submenu-item">Siemens</div>
              <div class="submenu-item">SEL</div>
              <div class="submenu-item cancel">Cancel</div>
            </div>
          </div>
          <div class="submenu-item">Network Switches</div>
          <div class="submenu-item">Router/Firewall</div>
          <div class="submenu-item">Engineering PC</div>
          <div class="submenu-item">GPS</div>
          <div class="submenu-item danger">Cancel</div>
        </div>
      </li>
      <li>Copy</li>
      <li>Cut</li>
      <li @click="emitAction('edit')">Rename</li>
      <li>Import</li>
      <li>Export</li>
      <li>Sync</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>

    <!-- Menu cho systemsetting -->
    <ul v-else-if="nodeMode === 'systemsetting'">
      <li @click="emitAction('parameter')">Parameter Settings</li>

      <li>System Integration Design</li>
      <li>SCL Management</li>
      <li @click="emitAction('test')">Test Management</li>

      <li>Event Management</li>
      <li>Add Setting Group</li>
      <li>Copy</li>
      <li>Cut</li>
      <li>Move</li>
      <li @click="emitAction('edit')">Rename</li>
      <li>Expand</li>
      <li>Collapse</li>
      <li>Import</li>
      <li>Export</li>
      <li>Properties</li>
      <li>Sync</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>
    <!-- Menu cho parameter -->
    <ul ul v-else-if="nodeMode === 'parameter'">
      <li @click="emitAction('parameterValue')">Open</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>
    <!-- Menu cho owner -->
    <ul v-else-if="ownerModes.includes(nodeMode)">
      <li>Open</li>
      <li @click="emitAction('add')">Add</li>
      <li>Copy</li>
      <li>Cut</li>
      <li @click="emitAction('edit')">Rename</li>
      <li>Sync</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    visible: Boolean,
    position: Object,
    selectedNode: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      activePath: [],
      ownerModes: ["OWNER1", "OWNER2", "OWNER3", "OWNER4", "OWNER5"],
    };
  },
  computed: {
    nodeMode() {
      return this.selectedNode?.mode || "";
    },
  },
  watch: {
    visible(val) {
      if (val) {
        console.log("👉 Context menu opened for node:", this.selectedNode);
        document.addEventListener("click", this.handleClickOutside);
      } else {
        document.removeEventListener("click", this.handleClickOutside);
        this.activePath = [];
      }
    },
  },

  methods: {
    handleClickOutside(e) {
      if (!this.$el.contains(e.target)) this.$emit("close");
    },
    openSub(level, key) {
      this.activePath = this.activePath.slice(0, level);
      this.activePath.push(key);
    },
    isOpen(level, key) {
      return this.activePath[level] === key;
    },
    emitAction(action) {
      if (!this.selectedNode || !this.selectedNode.id) {
        console.error("⚠️ selectedNode không hợp lệ:", this.selectedNode);
        return;
      }

      let tab = {
        id: "",
        name: "",
        mode: "systemsetting",
        component: "",
      };

      if (action === "parameter") {
        tab.id = `${this.selectedNode.id}-parameter`;
        tab.name = `${this.selectedNode.name} - Parameter Settings`;
        tab.component = "SystemSettingTab";
      }

      if (action === "test") {
        tab.id = `${this.selectedNode.id}-testManagement`;
        tab.name = `${this.selectedNode.name} - Test Management`;
        tab.component = "TestManagementTab";
      }
      if (action === "parameterValue") {
        tab.id = `${this.selectedNode.id}`;
        tab.name = `${this.selectedNode.name}`;
        tab.component = "SystemSettingTab";
      }

      if (tab.id) {
        const parentArr = [];

        let current = this.selectedNode.parentNode;
        while (current) {
          parentArr.unshift(current);
          current = current.parentNode;
        }

        const nodeWithParent = {
          ...this.selectedNode,
          parentArr,
        };

        this.$emit("open-tab", {
          ...tab,
          node: nodeWithParent,
        });
      }

      this.$emit("close");
    },

    openParameterSettings() {
      this.$emit("open-tab", this.selectedNode);
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  min-width: 220px;
  padding: 8px 0;
  font-family: "Segoe UI", sans-serif;
}

.context-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.context-menu li {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  transition: background 0.2s;
}

.context-menu li:hover {
  background-color: #f5f5f5;
}

.context-menu li .arrow {
  font-size: 12px;
  color: #999;
}

/* Submenu */
.submenu {
  position: absolute;
  top: 0;
  left: calc(100% + 2px); /* 2px gap */
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);
  min-width: 180px;
  padding: 8px 0;
  z-index: 1001;
}

/* Submenu item */
.submenu-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: #f5f5f5;
}

/* Danger styles */
.danger {
  color: red;
  font-weight: 500;
}

.context-menu li.danger:hover,
.submenu-item.danger:hover {
  background-color: #ffeaea;
  color: #d60000;
}

/* Cancel style */
.cancel {
  color: red;
  font-weight: 500;
}
</style>
