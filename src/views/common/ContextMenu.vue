<template>
  <div v-if="visible" class="context-menu-wrapper" v-bind="$attrs">
    <Loading v-if="isLoading" />
    <div v-else class="context-menu" ref="menu">
      <ul v-if="!isLoading && nodeMode === 'bay'">
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
        <li @click="emitAction('deviceList')">Device List</li>
        <li>Copy</li>
        <li>Cut</li>
        <li @click="emitAction('edit')">Rename</li>
        <li @click="triggerFileInput">Import</li>
        <li>Export</li>
        <li>Sync</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
      </ul>
      <ul v-else-if="!isLoading && nodeMode === 'ied'">
        <li @click="emitAction('hardware')">Hardware Infomation</li>
        <li @click="emitAction('parameter')">Parameter Settings</li>
        <li>System Integration Design</li>
        <li @click="emitAction('sclManagement')">SCL Management</li>
        <li @click="emitAction('test')">Test Management</li>
        <li>Event Management</li>
        <li @click="emitAction('addGroup')">Add Group</li>
        <li @click="emitAction('showAllGroup')">Show All Group</li>
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

      <ul v-else-if="!isLoading && nodeMode === 'settingFunction'">
        <li @click="emitAction('settingFunction')">Open</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
      </ul>
      <ul v-else-if="!isLoading && nodeMode === 'protectionFunction'">
        <li @click="emitAction('protectionFunction')">Open</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
      </ul>
      <ul v-else-if="!isLoading && nodeMode === 'protectionLevel'">
        <li @click="emitAction('protectionLevel')">Open</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
      </ul>
      <ul v-else-if="!isLoading && nodeMode === 'protectionGroup'">
        <li @click="emitAction('protectionGroup')">Open</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
      </ul>
      <ul v-else-if="!isLoading && nodeMode === 'systemSetting'">
        <li @click="emitAction('systemSetting')">Open</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
      </ul>
      <ul v-else-if="!isLoading && nodeMode === 'lineParameters'">
        <li @click="emitAction('lineParameters')">Open</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
      </ul>
      <ul v-else-if="!isLoading && nodeMode === 'substation'">
        <li @click="emitAction('addVoltageLevel')">+ Add voltage level</li>
        <li @click="emitAction('addBay')">+ Add bay</li>
        <li @click="emitAction('addAsset')">+ Add asset</li>
        <li @click="emitAction('deviceList')">Device List</li>
        <li @click="emitAction('show')">Show</li>
        <li @click="emitAction('edit')">Edit</li>
        <li @click="emitAction('download')">Download</li>
        <li @click="emitAction('move')">Move</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
        <li @click="emitAction('duplicate')">Duplicate</li>
        <li @click="emitAction('export')">Export</li>
        <li @click="emitAction('import')">Import</li>
      </ul>
      <ul v-else-if="!isLoading && nodeMode === 'voltageLevel'">
        <li @click="emitAction('addBay')">+ Add bay</li>
        <li @click="emitAction('addAsset')">+ Add asset</li>
        <li @click="emitAction('deviceList')">Device List</li>
        <li @click="emitAction('show')">Show</li>
        <li @click="emitAction('edit')">Edit</li>
        <li @click="emitAction('download')">Download</li>
        <li @click="emitAction('move')">Move</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
        <li @click="emitAction('duplicate')">Duplicate</li>
        <li @click="emitAction('export')">Export</li>
        <li @click="emitAction('import')">Import</li>
      </ul>
      <ul v-else-if="!isLoading && ownerModes.includes(nodeMode)">
        <li @click="emitAction('addOrganisation')">+ Add organisation</li>
        <li @click="emitAction('addSubstation')">+ Add substation</li>
        <li @click="emitAction('deviceList')">Device List</li>
        <li @click="emitAction('show')">Show</li>
        <li @click="emitAction('edit')">Edit</li>
        <li @click="emitAction('download')">Download</li>
        <li @click="emitAction('move')">Move</li>
        <li class="danger" @click="emitAction('delete')">Delete</li>
        <li @click="emitAction('duplicate')">Duplicate</li>
        <li @click="emitAction('export')">Export</li>
        <li @click="emitAction('import')">Import</li>
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
            <el-button type="primary" @click="confirmImport" :loading="isLoading">
              {{ isLoading ? "Importing..." : "Confirm" }}
            </el-button>
          </span>
        </template>
      </el-dialog>

      <el-dialog
        v-model="showDeleteDialog"
        title="Confirm Delete"
        width="30%"
        :before-close="cancelDelete"
      >
        <span>Do you really want to delete device with ID: {{ selectedNode.id }}?</span>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="cancelDelete">Cancel</el-button>
            <el-button type="primary" @click="confirmDelete" :loading="isLoading">
              {{ isLoading ? "Deleting..." : "Confirm" }}
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>
<script>
import { getAncestorByMode } from "@/api/treenode";
import { importDevice, deleteDevice } from "@/api/device";
import { deleteOrganisation } from "@/api/organisation";

import { deleteSubstation } from "@/api/substation";
import { deleteVoltageLevel } from "@/api/voltagelevel";
import { deleteBay } from "@/api/bay";
import Loading from "@/components/Loading.vue";

export default {
  inheritAttrs: false,
  components: {
    Loading,
  },
  emits: [
    "refresh-tree",
    "close",
    "open-tab",
    "update-focus",
    "open-add-device",
    "open-add-organisation",
    "open-add-substation",
    "open-show-organisation",
    "open-show-substation",
    "open-show-voltagelevel",
    "add-group",
    "show-all-group",
    "show-all-group",
    "open-add-voltage-level",
    "open-add-bay",
  ],
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
      showDeleteDialog: false,
      activePath: [],
      ownerModes: ["organisation"],
      showImportDialog: false,
      selectedFile: null,
      isLoading: false,
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
        this.$nextTick(() => this.scheduleAdjustMenuPosition());
        document.addEventListener("click", this.handleClickOutside);
      } else {
        document.removeEventListener("click", this.handleClickOutside);
        this.activePath = [];
      }
    },
    position() {
      if (this.visible) {
        this.$nextTick(() => this.scheduleAdjustMenuPosition());
      }
    },
  },
  methods: {
    scheduleAdjustMenuPosition() {
      if (this._menuFrame) cancelAnimationFrame(this._menuFrame);
      this._menuFrame = requestAnimationFrame(() => {
        this.adjustMenuPosition();
      });
    },
    cancelDelete() {
      this.showDeleteDialog = false;
      this.isLoading = false;
    },
    async confirmDelete() {
      if (!this.selectedNode || !this.selectedNode.id) {
        this.$message.error("Invalid node selected.");
        return;
      }
      this.showDeleteDialog = false;
      this.isLoading = true;
      try {
        await deleteDevice(this.selectedNode.id);
        this.$message.success(
          `Device with ID: ${this.selectedNode.name} has been deleted.`
        );
        this.$emit("close");
        this.$emit("refresh-tree");
      } catch (error) {
        console.error("Error deleting device:", error);
        this.$message.error(
          `Failed to delete device with ID: ${this.selectedNode.id}`
        );
      } finally {
        this.isLoading = false;
      }
    },

    handleClickOutside(e) {
      if (this.$el && !this.$el.contains(e.target)) this.$emit("close");
    },
    openSub(level, key) {
      this.activePath = this.activePath.slice(0, level);
      this.activePath.push(key);
    },
    isOpen(level, key) {
      return this.activePath[level] === key;
    },
    async emitAction(action) {
      if (!this.selectedNode || !this.selectedNode.id) {
        console.error("selectedNode khong hop le:", this.selectedNode);
        this.$emit("close");
        return;
      }

      let tab = {
        id: "",
        name: "",
        mode: "",
        component: "",
      };
      let nodeForParent = this.selectedNode;

      if (action === "parameter" || action === "hardware") {
        const iedNode =
          this.nodeMode === "ied"
            ? this.selectedNode
            : getAncestorByMode(this.tree, this.selectedNode.id, "ied");

        if (iedNode) {
          const hardwareTabId = `${iedNode.id}-hardware`;

          if (action === "hardware") {
            const existingHardware = this.$parent?.tabs?.find(
              (t) =>
                t.id === hardwareTabId ||
                (t.component === "HardWareInfoView" &&
                  (t.node?.id === iedNode.id || t.id === iedNode.id))
            );

            if (existingHardware) {
              existingHardware.component = "HardWareInfoView";
              existingHardware.name = `${iedNode.name} - Hardware Infomation`;
              existingHardware.node = iedNode;
              existingHardware.focusNode = iedNode;

              this.$emit("update-focus", {
                iedId: iedNode.id,
                focusNode: iedNode,
                action: "hardware",
              });
              this.$nextTick(() => this.$emit("close"));
              return;
            }

            tab = {
              id: hardwareTabId,
              name: `${iedNode.name} - Hardware Infomation`,
              mode: iedNode.mode,
              component: "HardWareInfoView",
              node: iedNode,
              focusNode: iedNode,
            };
            nodeForParent = iedNode;
          } else {
            // Parameter: open the Parameter Settings tab (tree is shown inside the tab)
            this.$emit("update-focus", {
              iedId: iedNode.id,
              focusNode: iedNode,
              action: "parameter",
            });
            this.$nextTick(() => this.$emit("close"));
            return;
          }
        }
      }

      if (action === "test") {
        tab.id = `${this.selectedNode.id}-testManagement`;
        tab.name = `${this.selectedNode.name} - Test Management`;
        tab.component = "TestManagementTab";
      }

      if (action === "addGroup") {
        this.$emit("add-group", this.selectedNode);
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      if (action === "showAllGroup") {
        this.$emit("show-all-group", this.selectedNode);
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      if (action === "delete") {
        if (this.ownerModes.includes(this.nodeMode)) {
          await this.confirmDeleteOwner();
          return;
        }
        if (this.nodeMode === "substation") {
          await this.confirmDeleteSubstation();
          return;
        }
        if (this.nodeMode === "voltageLevel") {
          await this.confirmDeleteVoltageLevel();
          return;
        }
        if (this.nodeMode === "bay") {
          await this.confirmDeleteBay();
          return;
        }
        this.showDeleteDialog = true;
        return;
      }

      if (
        action === "protectionGroup" ||
        action === "protectionLevel" ||
        action === "protectionFunction" ||
        action === "systemSetting" ||
        action === "lineParameters" ||
        action === "settingFunction"
      ) {
        const ancestorIed = getAncestorByMode(
          this.tree,
          this.selectedNode.id,
          "ied"
        );

        if (ancestorIed) {
          const existingParam = this.$parent.tabs.find(
            (t) =>
              t.id === ancestorIed.id ||
              (t.node?.id === ancestorIed.id &&
                t.component === "SystemSettingTab")
          );

          if (existingParam) {
            existingParam.component = "SystemSettingTab";
            existingParam.name = `${ancestorIed.name} - Parameter Settings`;
            existingParam.focusNode = this.selectedNode;

            this.$emit("update-focus", {
              iedId: ancestorIed.id,
              focusNode: this.selectedNode,
              action: action,
            });
            this.$nextTick(() => this.$emit("close"));
            return;
          } else {
            const tab = {
              id: ancestorIed.id,
              name: `${ancestorIed.name} - Parameter Settings`,
              mode: ancestorIed.mode,
              component: "SystemSettingTab",
              node: ancestorIed,
              focusNode: this.selectedNode,
            };
            this.$emit("open-tab", tab);
            this.$nextTick(() => this.$emit("close"));
            return;
          }
        } else {
          console.warn(
            "Khong tim thay ancestor IED cho node:",
            this.selectedNode
          );
        }
      }

      if (action === "addDevice") {
        this.$emit("open-add-device", nodeForParent);
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      if (action === "deviceList") {
        tab.id = `${this.selectedNode.id}-deviceList`;
        tab.name = `${this.selectedNode.name} - Device List`;
        tab.mode = this.nodeMode;
        tab.component = "DeviceListView";
        tab.type = "deviceList";
        tab.node = this.selectedNode;

        this.$emit("open-tab", tab);
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      if (this.ownerModes.includes(this.nodeMode)) {
        if (action === "show") {
          this.$emit("open-show-organisation", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (action === "addOrganisation") {
          this.$emit("open-add-organisation", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (action === "addSubstation") {
          this.$emit("open-add-substation", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (
          ["download", "move", "duplicate", "export", "import"].includes(action)
        ) {
          this.$message?.info?.("Action not implemented");
          this.$nextTick(() => this.$emit("close"));
          return;
        }
      }

      if (action === "sclManagement") {
        const iedNode =
          this.nodeMode === "ied"
            ? this.selectedNode
            : getAncestorByMode(this.tree, this.selectedNode.id, "ied");

        if (!iedNode) {
          this.$message?.warning?.("IED not found");
          this.$nextTick(() => this.$emit("close"));
          return;
        }

        this.$emit("open-tab", {
          id: `${iedNode.id}-sclManagement`,
          name: `${iedNode.name} - SCL Management`,
          mode: iedNode.mode,
          component: "SCLManagementTab",
          node: iedNode,
          focusNode: iedNode,
        });
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      if (this.nodeMode === "substation") {
        if (action === "show") {
          this.$emit("open-show-substation", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (action === "addVoltageLevel") {
          this.$emit("open-add-voltage-level", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (action === "addBay") {
          this.$emit("open-add-bay", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (["download", "move", "duplicate", "export", "import", "edit", "addAsset"].includes(action)) {
          this.$message?.info?.("Action not implemented");
          this.$nextTick(() => this.$emit("close"));
          return;
        }
      }

      if (this.nodeMode === "voltageLevel") {
        if (action === "show") {
          this.$emit("open-show-voltagelevel", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (action === "addBay") {
            this.$emit("open-add-bay", this.selectedNode);
            this.$nextTick(() => this.$emit("close"));
            return;
        } else if (["download", "move", "duplicate", "export", "import", "edit", "addAsset"].includes(action)) {
          this.$message?.info?.("Action not implemented");
          this.$nextTick(() => this.$emit("close"));
          return;
        }
      }

      if (this.nodeMode === "bay") {
         if (action === "delete") {
             await this.confirmDeleteBay();
             return;
         }
      }

      if (tab.id) {
        const parentArr = [];
        let current = nodeForParent.parentNode;
        while (current) {
          parentArr.unshift(current);
          current = current.parentNode;
        }

        const nodeWithParent = {
          ...nodeForParent,
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

    async confirmDeleteOwner() {
      if (!this.selectedNode?.id) {
        this.$message?.error?.("Invalid organisation id");
        return;
      }
      try {
        await this.$confirm(
          `Delete organisation "${this.selectedNode.name || this.selectedNode.id}"?`,
          "Confirm",
          { type: "warning" }
        );
      } catch {
        this.$emit("close");
        return;
      }
      try {
        await deleteOrganisation(this.selectedNode.id);
        this.$message?.success?.("Organisation deleted");
        this.$emit("refresh-tree");
      } catch (error) {
        console.error("Delete organisation failed:", error);
        this.$message?.error?.("Failed to delete organisation");
      } finally {
        this.$nextTick(() => this.$emit("close"));
      }
    },

    async confirmDeleteSubstation() {
      if (!this.selectedNode?.id) {
        this.$message?.error?.("Invalid substation id");
        return;
      }
      try {
        await this.$confirm(
          `Delete substation "${this.selectedNode.name || this.selectedNode.id}"?`,
          "Confirm",
          { type: "warning" }
        );
      } catch {
        this.$emit("close");
        return;
      }
      try {
        await deleteSubstation(this.selectedNode.id);
        this.$message?.success?.("Substation deleted");
        this.$emit("refresh-tree");
      } catch (error) {
        console.error("Delete substation failed:", error);
        this.$message?.error?.("Failed to delete substation");
      } finally {
        this.$nextTick(() => this.$emit("close"));
      }
    },

    async confirmDeleteVoltageLevel() {
      if (!this.selectedNode?.id) {
        this.$message?.error?.("Invalid voltage level id");
        return;
      }
      try {
        await this.$confirm(
          `Delete voltage level "${this.selectedNode.name || this.selectedNode.id}"?`,
          "Confirm",
          { type: "warning" }
        );
      } catch {
        this.$emit("close");
        return;
      }
      try {
        await deleteVoltageLevel(this.selectedNode.id);
        this.$message?.success?.("Voltage Level deleted");
        this.$emit("refresh-tree");
      } catch (error) {
        console.error("Delete voltage level failed:", error);
        const errMsg = error?.response?.data?.message || "Failed to delete voltage level";
        this.$message?.error?.(errMsg);
      } finally {
        this.$nextTick(() => this.$emit("close"));
      }
    },

    async confirmDeleteBay() {
      if (!this.selectedNode?.id) {
        this.$message?.error?.("Invalid bay id");
        return;
      }
      try {
        await this.$confirm(
          `Delete bay "${this.selectedNode.name || this.selectedNode.id}"?`,
          "Confirm",
          { type: "warning" }
        );
      } catch {
        this.$emit("close");
        return;
      }
      try {
        await deleteBay(this.selectedNode.id);
        this.$message?.success?.("Bay deleted");
        this.$emit("refresh-tree");
      } catch (error) {
        console.error("Delete bay failed:", error);
        const errMsg = error?.response?.data?.message || "Failed to delete bay";
        this.$message?.error?.(errMsg);
      } finally {
        this.$nextTick(() => this.$emit("close"));
      }
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
      this.isLoading = false;
      this.$refs.fileInput.value = "";
    },
    async confirmImport() {
      const file = this.selectedFile;
      const nodeId = this.selectedNode && this.selectedNode.id;

      if (!file || !nodeId) {
        this.$message.error("No file selected or invalid node ID");
        return;
      }

      this.showImportDialog = false;
      this.isLoading = true;

      try {
        await importDevice(file, nodeId);
        this.$message.success(
          `Successfully imported for IED ID: ${nodeId}`
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
        this.isLoading = false;
        this.showImportDialog = false;
        this.selectedFile = null;
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }
        this.$emit("close");
      }
    },

    adjustMenuPosition() {
      const wrapperEl = this.$el;
      const menuEl = this.$refs.menu;
      if (!wrapperEl || !menuEl || !this.position) return;

      // Start at exact cursor position
      let newTop = this.position.y;
      let newLeft = this.position.x;

      const menuRect = menuEl.getBoundingClientRect();
      const padding = 5; // Small padding from viewport edges

      // Check if menu would overflow bottom of viewport
      if (newTop + menuRect.height > window.innerHeight - padding) {
        // Position menu above cursor instead
        newTop = this.position.y - menuRect.height;
        // If still overflows at top, adjust to fit within viewport
        if (newTop < padding) {
          newTop = window.innerHeight - menuRect.height - padding;
        }
      }

      // Check if menu would overflow right edge of viewport
      if (newLeft + menuRect.width > window.innerWidth - padding) {
        // Position menu to the left of cursor instead
        newLeft = this.position.x - menuRect.width;
        // If still overflows at left, adjust to fit within viewport
        if (newLeft < padding) {
          newLeft = window.innerWidth - menuRect.width - padding;
        }
      }

      // Ensure minimum padding from edges
      if (newTop < padding) newTop = padding;
      if (newLeft < padding) newLeft = padding;

      // Apply position to wrapper element
      wrapperEl.style.top = `${newTop}px`;
      wrapperEl.style.left = `${newLeft}px`;
    },
  },
  beforeUnmount() {
    if (this._menuFrame) cancelAnimationFrame(this._menuFrame);
  },
};
</script>

<style scoped>
.context-menu-wrapper {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  border: none !important;
  background: none !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
}
.context-menu {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);
  min-width: 180px;
  padding: 8px 0;
  transition: opacity 0.3s ease;
  pointer-events: auto;
}

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
  left: calc(100% + 2px);
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
</style>
