<template>
  <div v-if="visible" class="context-menu" ref="menu">
    <!-- Menu cho feeder -->
    <ul v-if="nodeMode === 'bay'">
      <li @click="openSub(0, 'addDevices')">
        + Add Devices <span class="arrow">▶</span>
        <div v-if="isOpen(0, 'addDevices')" class="submenu">
          <div class="submenu-item" @click="emitAction('addDevice')">
            IEC 61850 IEDs
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
      <li @click="triggerFileInput">Import</li>
      <li>Export</li>
      <li>Sync</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>

    <!-- Menu cho systemsetting -->
    <ul v-else-if="nodeMode === 'ied'">
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
      <li @click="triggerFileInput">Import</li>
      <li>Export</li>
      <li>Sync</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>
    <!-- Menu cho parameter -->
    <ul v-else-if="nodeMode === 'settingFunction'">
      <li @click="emitAction('settingFunction')">Open</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>
    <!-- Menu cho protectionFunction -->
    <ul v-else-if="nodeMode === 'protectionFunction'">
      <li @click="emitAction('protectionFunction')">Open</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>
    <!-- Menu cho protectionLevel -->
    <ul v-else-if="nodeMode === 'protectionLevel'">
      <li @click="emitAction('protectionLevel')">Open</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>
    <!-- Menu cho protectionGroup -->
    <ul v-else-if="nodeMode === 'protectionGroup'">
      <li @click="emitAction('protectionGroup')">Open</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>
    <!-- Menu cho systemSetting -->
    <ul v-else-if="nodeMode === 'systemSetting'">
      <li @click="emitAction('systemSetting')">Open</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>
    <!-- Menu cho owner -->
    <ul v-else-if="ownerModes.includes(nodeMode)">
      <li @click="emitAction('open')">Open</li>
      <li @click="emitAction('add')">Add</li>
      <li>Copy</li>
      <li>Cut</li>
      <li @click="emitAction('edit')">Rename</li>
      <li>Sync</li>
      <li class="danger" @click="emitAction('delete')">Delete</li>
    </ul>

    <input
      ref="fileInput"
      type="file"
      style="display: none"
      @change="handleFileSelect"
    />

    <el-dialog
      v-model="showImportDialog"
      title="Confirm Import"
      width="30%"
      :before-close="cancelImport"
    >
      <span>Do you want to import for IED ID: {{ selectedNode.id }}?</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelImport">Cancel</el-button>
          <el-button type="primary" @click="confirmImport">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  getParentById,
  getAncestorByMode,
  // findSubPathById,
} from "@/api/treenode";
import { importDevice } from "@/api/device";
export default {
  props: {
    visible: Boolean,
    position: Object,
    selectedNode: {
      type: Object,
      default: () => ({}),
    },
    tree: { type: Array, default: () => [] },
  },
  data() {
    return {
      activePath: [],
      ownerModes: ["organisation"],
      showImportDialog: false,
      selectedFile: null,
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
        this.$nextTick(() => {
          setTimeout(() => {
            this.adjustMenuPosition();
          }, 0);
        });
        document.addEventListener("click", this.handleClickOutside);
      } else {
        document.removeEventListener("click", this.handleClickOutside);
        this.activePath = [];
      }
    },
    position() {
      if (this.visible) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.adjustMenuPosition();
          }, 0);
        });
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
        console.error("selectedNode không hợp lệ:", this.selectedNode);
        this.$emit("close");
        return;
      }

      let tab = {
        id: "",
        name: "",
        mode: "",
        component: "",
      };

      if (action === "parameter") {
        // let parent = this.tree?.length
        //   ? getParentById(this.tree, this.selectedNode.id)
        //   : null;
        // console.log("getParentById(...) =>", parent);
        // if (this.selectedNode.mode === "settingFunction") {
        //   parent =
        //     getAncestorByMode(this.tree, this.selectedNode.id, "ied") || parent;
        // }

        tab.id = `${this.selectedNode.id}-parameter`;
        tab.name = `${this.selectedNode.name} - Parameter Settings`;
        tab.component = "SystemSettingTab";
      }

      if (action === "test") {
        // let parent = this.tree?.length
        //   ? getParentById(this.tree, this.selectedNode.id)
        //   : null;
        // console.log("getParentById(...) =>", parent);
        // if (this.selectedNode.mode === "protectionFunction") {
        //   parent =
        //     getAncestorByMode(this.tree, this.selectedNode.id, "ied") || parent;
        // }

        tab.id = `${this.selectedNode.id}-testManagement`;
        tab.name = `${this.selectedNode.name} - Test Management`;
        tab.component = "TestManagementTab";
      }

      if (
        action === "protectionGroup" ||
        action === "protectionLevel" ||
        action === "protectionFunction" ||
        action === "systemSetting" ||
        action === "settingFunction"
      ) {
        const ancestorIed = getAncestorByMode(
          this.tree,
          this.selectedNode.id,
          "ied"
        );

        if (ancestorIed) {
          const existingTab = this.$parent.tabs.find(
            (t) => t.node?.id === ancestorIed.id
          );

          if (existingTab) {
            this.$emit("update-focus", {
              iedId: ancestorIed.id,
              focusNode: this.selectedNode,
            });
            this.$nextTick(() => this.$emit("close"));
          } else {
            const tab = {
              id: ancestorIed.id,
              name: ancestorIed.name,
              mode: ancestorIed.mode,
              component: "SystemSettingTab",
              node: ancestorIed,
              focusNode: this.selectedNode,
            };
            this.$emit("open-tab", tab);
            this.$nextTick(() => this.$emit("close"));
          }
        } else {
          console.warn(
            "Không tìm thấy ancestor IED cho node:",
            this.selectedNode
          );
        }
      }

      if (action === "addDevice") {
        tab.id = `${this.selectedNode.id}-addDevice`;
        tab.name = `${this.selectedNode.name}- Add Device`;
        tab.component = "AddDevice";
      }

      if (action === "systemSetting") {
        let parent = this.tree?.length
          ? getParentById(this.tree, this.selectedNode.id)
          : null;
        if (this.selectedNode.mode === "systemSetting") {
          parent =
            getAncestorByMode(this.tree, this.selectedNode.id, "ied") || parent;
        }

        if (parent) {
          tab.id = `${parent.id}-parameter`;
          tab.name = `${parent.name} - Parameter Settings`;
          tab.component = "SystemSettingTab";
        }
      }

      if (action === "open" && this.ownerModes.includes(this.nodeMode)) {
        tab.id = `${this.selectedNode.id}`;
        tab.name = `${this.selectedNode.name}`;
        tab.component = "OwnerView";
        tab.nodeData = this.selectedNode;
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
          tree: this.tree,
        });
      }

      this.$nextTick(() => this.$emit("close"));
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileSelect(event) {
      this.selectedFile = event.target.files[0];
      if (this.selectedFile) {
        this.showImportDialog = true;
      }
    },
    cancelImport() {
      this.showImportDialog = false;
      this.selectedFile = null;
      this.$refs.fileInput.value = "";
    },
    async confirmImport() {
      if (!this.selectedFile || !this.selectedNode.id) {
        this.$message.error("No file selected or invalid node ID");
        return;
      }

      try {
        await importDevice(this.selectedFile, this.selectedNode.id);
        this.$message.success(
          `Successfully imported for IED ID: ${this.selectedNode.id}`
        );

        const expandedIds = [];
        const collectExpanded = (nodes) => {
          nodes.forEach((n) => {
            if (n.expanded) expandedIds.push(n.id);
            if (n.children) collectExpanded(n.children);
          });
        };
        collectExpanded(this.tree);

        const newTree = await this.$emit("refresh-tree");

        const restoreExpanded = (nodes) => {
          nodes.forEach((n) => {
            if (expandedIds.includes(n.id)) n.expanded = true;
            if (n.children) restoreExpanded(n.children);
          });
        };
        if (newTree) restoreExpanded(newTree);
      } catch (error) {
        this.$message.error(`Failed to import: ${error.message}`);
        console.error("Import error:", error);
      } finally {
        this.showImportDialog = false;
        this.selectedFile = null;
        this.$refs.fileInput.value = "";
        this.$emit("close");
      }
    },

    openParameterSettings() {
      this.$emit("open-tab", this.selectedNode);
      this.$emit("close");
    },
    adjustMenuPosition() {
      const menuEl = this.$refs.menu;
      if (!menuEl) return;

      let newTop = this.position.y;
      let newLeft = this.position.x;

      const menuRect = menuEl.getBoundingClientRect();

      if (newTop + menuRect.height > window.innerHeight) {
        newTop = window.innerHeight - menuRect.height - 10;
        if (newTop < 10) newTop = 10;
      }
      if (newLeft + menuRect.width > window.innerWidth) {
        newLeft = window.innerWidth - menuRect.width - 10;
        if (newLeft < 10) newLeft = 10;
      }

      menuEl.style.top = `${newTop}px`;
      menuEl.style.left = `${newLeft}px`;
    },
  },
};
</script>

<style scoped>
.context-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.context-menu li {
  padding: 10px 10px;
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

.danger {
  color: red;
  font-weight: 500;
}

.context-menu li.danger:hover,
.submenu-item.danger:hover {
  background-color: #ffeaea;
  color: #d60000;
}

.cancel {
  color: red;
  font-weight: 500;
}
</style>
