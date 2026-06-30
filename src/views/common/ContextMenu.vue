<template>
  <div v-if="visible" class="context-menu-wrapper" v-bind="$attrs">
    <Loading v-if="isLoading" />
    <div v-else class="context-menu" ref="menu">
      <ContextMenuList
        :sections="menuSections"
        :active-path="activePath"
        :compare-setting-loading="compareSettingLoading"
        :compare-setting-options="compareSettingOptions"
        :selected-compare-ied-id="selectedCompareIedId"
        :compare-overcurrent-loading="compareOvercurrentLoading"
        :compare-overcurrent-options="compareOvercurrentOptions"
        :selected-compare-overcurrent-ied-id="selectedCompareOvercurrentIedId"
        @action="handleMenuAction"
        @open-submenu="openSub(0, $event)"
        @select-compare-setting="selectCompareSetting"
        @select-compare-overcurrent="selectCompareOvercurrent"
      />
      <input
        ref="fileInput"
        type="file"
        style="display: none"
        @change="handleFileSelect"
      />

      <el-dialog
        v-model="showImportDialog"
        title="Confirm Import"
        width="420px"
        append-to-body
        :before-close="cancelImport"
      >
        <div class="confirm-text">Do you want to import for {{ importTargetLabel }}: {{ selectedNode.name || selectedNode.id }}?</div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="cancelImport" :disabled="isLoading">Cancel</el-button>
            <el-button type="primary" @click="confirmImport" :loading="isLoading" :disabled="isLoading">
              {{ isLoading ? "Importing..." : "Confirm" }}
            </el-button>
          </span>
        </template>
      </el-dialog>

      <el-dialog
        v-model="showDeleteDialog"
        title="Confirm Delete"
        width="420px"
        append-to-body
        :before-close="cancelDelete"
      >
        <div class="confirm-text">Do you really want to delete device with ID: {{ selectedNode.id }}?</div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="cancelDelete" :disabled="isLoading">Cancel</el-button>
            <el-button type="primary" @click="confirmDelete" :loading="isLoading" :disabled="isLoading">
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
import { importDevice, deleteDevice, getAllActiveIeds, exportIedXrio, exportPcdDocx, exportBbtnDocx } from "@/api/device";
import { importScl, exportSclByIed, exportSignalList } from "@/api/scl";
import {
  deleteOrganisation,
  importOrganisationScd,
  exportOrganisationScd,
} from "@/api/organisation";
import { pasteAsset } from "@/api/asset";

import { deleteSubstation } from "@/api/substation";
import { deleteVoltageLevel } from "@/api/voltagelevel";
import { deleteBay } from "@/api/bay";
import Loading from "@/components/Loading.vue";
import ContextMenuList from "./context-menu/ContextMenuList.vue";
import { buildContextMenuSections } from "./context-menu/contextMenuItems";
import { mapGetters } from "vuex";

let copiedAssetCache = null;

export default {
  inheritAttrs: false,
  components: {
    Loading,
    ContextMenuList,
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
    "open-show-bay",
    "open-show-ied",
    "open-overcurrent-compare",
    "add-group",
    "rename-node",
    "start-rename",
    "open-add-voltage-level",
    "open-add-bay",
    "open-bulk-ied-import",
    "set-clipboard",
  ],
  props: {
    visible: Boolean,
    position: Object,
    selectedNode: {
      type: Object,
      default: () => ({}),
    },
    tree: { type: Array, default: () => [] },
    clipboardAsset: { type: Object, default: null },
  },
  data() {
    return {
      showDeleteDialog: false,
      activePath: [],
      ownerModes: ["organisation"],
      showImportDialog: false,
      compareSettingLoading: false,
      compareSettingOptions: [],
      selectedCompareIedId: null,
      compareOvercurrentLoading: false,
      compareOvercurrentOptions: [],
      selectedCompareOvercurrentIedId: null,
      pendingFileAction: "",
      selectedFile: null,
      isLoading: false,
    };
  },
  computed: {
    ...mapGetters(["language"]),
    nodeMode() {
      return this.selectedNode?.mode || "";
    },
    importTargetLabel() {
      if (this.ownerModes.includes(this.nodeMode)) return "Organisation";
      if (this.nodeMode === "ied") return "IED";
      return "Node";
    },
    activeClipboardAsset() {
      return this.clipboardAsset || copiedAssetCache || null;
    },
    pasteActionLabel() {
      if (!this.activeClipboardAsset) return this.$tUi("paste");
      const name =
        this.activeClipboardAsset?.name ||
        this.activeClipboardAsset?.id ||
        this.$tUi("item");
      return `${this.$tUi("paste")} (${name})`;
    },
    canPasteHere() {
      if (!this.activeClipboardAsset || !this.selectedNode?.id) return false;
      const expected = this.getExpectedTargetMode(this.activeClipboardAsset?.mode);
      if (!expected) return false;
      if (String(this.selectedNode?.mode || "") !== expected) return false;
      return String(this.activeClipboardAsset?.id || "") !== String(this.selectedNode?.id || "");
    },
    menuSections() {
      return buildContextMenuSections({
        nodeMode: this.nodeMode,
        isOwnerMode: this.ownerModes.includes(this.nodeMode),
        hasSelectedNode: !!this.selectedNode?.id,
        pasteActionLabel: this.pasteActionLabel,
        canPasteHere: this.canPasteHere,
        language: this.language,
      });
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
    startRename() {
      if (this.isLoading) return;
      this.$emit("start-rename", this.selectedNode);
      this.$emit("close");
    },
    cancelDelete() {
      this.showDeleteDialog = false;
      this.isLoading = false;
    },
    async confirmDelete() {
      if (this.isLoading) return;
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
        this.$notifyApiError?.(error, `Failed to delete device with ID: ${this.selectedNode.id}`);
      } finally {
        this.isLoading = false;
      }
    },

    handleClickOutside(e) {
      if (this.showImportDialog || this.showDeleteDialog) {
        return;
      }
      if (this.$el && !this.$el.contains(e.target)) this.$emit("close");
    },
    normalizeCompareIedList(payload) {
      const source = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
            ? payload.result
            : [];

      const selectedIds = new Set(
        [
          this.selectedNode?.id,
          this.selectedNode?.mrid,
          this.selectedNode?.mrd,
          this.selectedNode?.iedId,
        ]
          .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
          .map((v) => String(v).trim())
      );

      return source
        .map((item) => {
          const id = item?.mrid ?? item?.mrd ?? item?.iedId ?? item?.id;
          const name = item?.name ?? item?.iedName ?? item?.label;
          return {
            id: id == null ? "" : String(id).trim(),
            name: name == null ? "" : String(name),
          };
        })
        .filter((item) => item.id && item.name && !selectedIds.has(item.id));
    },
    getSelectedIedId() {
      const raw = this.selectedNode?.id ?? this.selectedNode?.mrid ?? this.selectedNode?.mrd ?? this.selectedNode?.iedId;
      if (raw == null) return "";
      return String(raw).trim();
    },
    async openCompareSettingSubmenu() {
      if (this.compareSettingLoading) return;
      this.openSub(0, "compareSetting");
      this.compareSettingLoading = true;
      this.compareSettingOptions = [];

      try {
        const response = await getAllActiveIeds();
        this.compareSettingOptions = this.normalizeCompareIedList(response);
      } catch (error) {
        this.compareSettingOptions = [];
        this.$notifyApiError?.(error, "Failed to load IED list");
      } finally {
        this.compareSettingLoading = false;
      }
    },
    async openCompareOvercurrentSubmenu() {
      if (this.compareOvercurrentLoading) return;
      this.openSub(0, "compareOvercurrentCharacteristic");
      this.compareOvercurrentLoading = true;
      this.compareOvercurrentOptions = [];

      try {
        const response = await getAllActiveIeds();
        this.compareOvercurrentOptions = this.normalizeCompareIedList(response);
      } catch (error) {
        this.compareOvercurrentOptions = [];
        this.$notifyApiError?.(error, "Failed to load IED list");
      } finally {
        this.compareOvercurrentLoading = false;
      }
    },
    selectCompareSetting(item) {
      if (!item?.id) return;
      const sourceIedId = this.getSelectedIedId();
      if (!sourceIedId) {
        this.$message?.warning?.("Current IED id is missing");
        return;
      }

      this.selectedCompareIedId = item.id;
      this.$emit("open-tab", {
        id: `setting-compare-${sourceIedId}-${item.id}`,
        name: "Setting Compare",
        mode: "ied",
        component: "SettingCompareTab",
        node: this.selectedNode,
        compareSourceId: sourceIedId,
        compareSourceName: this.selectedNode?.name || sourceIedId,
        compareTargetId: item.id,
        compareTargetName: item.name || item.id,
      });
      this.$nextTick(() => this.$emit("close"));
    },
    selectCompareOvercurrent(item) {
      if (!item?.id) return;
      const sourceIedId = this.getSelectedIedId();
      if (!sourceIedId) {
        this.$message?.warning?.("Current IED id is missing");
        return;
      }

      this.selectedCompareOvercurrentIedId = item.id;
      this.$emit("open-overcurrent-compare", {
        source: {
          id: sourceIedId,
          name: this.selectedNode?.name || sourceIedId,
        },
        target: {
          id: item.id,
          name: item.name || item.id,
        },
      });
      this.$nextTick(() => this.$emit("close"));
    },
    openSub(level, key) {
      this.activePath = this.activePath.slice(0, level);
      this.activePath.push(key);
    },
    isOpen(level, key) {
      return this.activePath[level] === key;
    },
    handleMenuAction(action) {
      if (this.isLoading) return;
      if (action === "rename") {
        this.startRename();
        return;
      }
      if (action === "triggerImport") {
        this.triggerFileInput();
        return;
      }
      this.emitAction(action);
    },
    getExpectedTargetMode(mode) {
      const m = String(mode || "");
      const map = {
        ied: "bay",
        bay: "voltageLevel",
        voltageLevel: "substation",
        substation: "organisation",
      };
      return map[m] || "";
    },
    isCopyableMode(mode) {
      return !!this.getExpectedTargetMode(mode);
    },
    async emitAction(action) {
      if (this.isLoading) return;
      if (!this.selectedNode || !this.selectedNode.id) {
        this.$message?.warning?.("Invalid node selected");
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

      if (action === "parameterSettingsShow") {
        action = "parameter";
      }

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
              existingHardware.name = `${iedNode.name} - Hardware Information`;
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
              name: `${iedNode.name} - Hardware Information`,
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

      if (action === "communicationServices") {
        tab.id = `${this.selectedNode.id}-communicationServices`;
        tab.name = `${this.selectedNode.name} - Communication & Services`;
        tab.mode = this.nodeMode;
        tab.component = "CommunicationServicesTab";
        tab.node = this.selectedNode;
        tab.focusNode = this.selectedNode;

        this.$emit("open-tab", tab);
        this.$nextTick(() => this.$emit("close"));
        return;
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

      if (action === "compareSetting") {
        if (this.isOpen(0, "compareSetting")) {
          this.activePath = [];
          return;
        }
        await this.openCompareSettingSubmenu();
        return;
      }

      if (action === "compareOvercurrentCharacteristic") {
        if (this.isOpen(0, "compareOvercurrentCharacteristic")) {
          this.activePath = [];
          return;
        }
        await this.openCompareOvercurrentSubmenu();
        return;
      }

      if (action === "parameterSettings") {
        if (this.isOpen(0, "parameterSettings")) {
          this.activePath = [];
          return;
        }
        this.openSub(0, "parameterSettings");
        return;
      }

      if (action === "parameterSettingsImport") {
        this.pendingFileAction = "parameterSettingsImport";
        this.triggerFileInput();
        return;
      }

      if (action === "parameterSettingsExport") {
        await this.exportIedXRIO();
        return;
      }

      if (action === "parameterSettingsGenerateReport") {
        await this.exportPcdDocx();
        return;
      }

      if (action === "parameterSettingsExportTestReport") {
        await this.exportBbtnTestReport();
        return;
      }

      if (action === "sclManagement") {
        if (this.isOpen(0, "sclManagement")) {
          this.activePath = [];
          return;
        }
        this.openSub(0, "sclManagement");
        return;
      }

      if (action === "sclManagementImport") {
        this.pendingFileAction = "sclManagementImport";
        this.triggerFileInput();
        return;
      }

      if (action === "sclManagementExport") {
        await this.exportSclFile();
        return;
      }

      if (action === "copy") {
        if (!this.isCopyableMode(this.nodeMode)) {
          this.$message?.warning?.("This node type cannot be copied");
          this.$nextTick(() => this.$emit("close"));
          return;
        }
        const payload = {
          id: this.selectedNode?.id,
          mode: this.selectedNode?.mode,
          name: this.selectedNode?.name || this.selectedNode?.id,
        };
        copiedAssetCache = payload;
        this.$emit("set-clipboard", payload);
        this.$message?.success?.(`Copied ${payload.name}`);
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      if (action === "paste") {
        if (!this.canPasteHere) {
          this.$message?.warning?.("Paste is not available for this node");
          return;
        }
        const mode = this.activeClipboardAsset?.mode;
        const id = this.activeClipboardAsset?.id;
        const ownerId = this.selectedNode?.id;
        this.isLoading = true;
        try {
          await pasteAsset(mode, id, ownerId);
          this.$message?.success?.("Pasted successfully");
          this.$emit("refresh-tree");
          this.$nextTick(() => this.$emit("close"));
        } catch (error) {
          this.$notifyApiError?.(error, "Failed to paste");
        } finally {
          this.isLoading = false;
        }
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
          this.$message?.warning?.("IED not found");
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

      if (action === "exportSignalList") {
        await this.exportSignalListFile();
        return;
      }

      if (this.ownerModes.includes(this.nodeMode)) {
        if (action === "show") {
          this.$emit("open-show-organisation", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (action === "export") {
          await this.exportOrganisationSCD();
          return;
        } else if (action === "addOrganisation") {
          this.$emit("open-add-organisation", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (action === "addSubstation") {
          this.$emit("open-add-substation", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (["download", "move", "duplicate", "import"].includes(action)) {
          this.$message?.info?.("Action not implemented");
          this.$nextTick(() => this.$emit("close"));
          return;
        }
      }

      if (action === "sclManagementShow") {
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

      if (action === "openSclFile") {
        const sclId = this.selectedNode?.sclId ?? this.selectedNode?.id;
        if (sclId == null || sclId === "") {
          this.$message?.warning?.("Invalid SCL id");
          this.$nextTick(() => this.$emit("close"));
          return;
        }

        const fileName = this.selectedNode?.fileName || this.selectedNode?.name || `SCL ${sclId}`;
        this.$emit("open-tab", {
          id: `scl-${sclId}-sclManagement`,
          name: `${fileName} - SCL Management`,
          mode: "sclFile",
          component: "SCLManagementTab",
          sclId,
          fileName,
          node: {
            id: String(sclId),
            sclId,
            mode: "sclFile",
            name: fileName,
            fileName,
          },
          focusNode: null,
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
        } else if (action === "bulkIedImport") {
          this.$emit("open-bulk-ied-import", this.selectedNode);
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
        if (action === "show") {
          this.$emit("open-show-bay", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        }
        if (action === "delete") {
          await this.confirmDeleteBay();
          return;
        }
      }

      if (this.nodeMode === "ied") {
        if (action === "show") {
          this.$emit("open-show-ied", this.selectedNode);
          this.$nextTick(() => this.$emit("close"));
          return;
        } else if (action === "export") {
          await this.exportIedXRIO();
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

    async confirmDeleteTreeEntity({
      entityName,
      invalidMessage,
      deleteFn,
      successMessage,
      errorMessage,
    }) {
      if (this.isLoading) return;
      if (!this.selectedNode?.id) {
        this.$message?.error?.(invalidMessage);
        return;
      }

      try {
        await this.$confirm(
          `Delete ${entityName} "${this.selectedNode.name || this.selectedNode.id}"?`,
          "Confirm",
          { type: "warning" }
        );
      } catch {
        this.$emit("close");
        return;
      }

      this.isLoading = true;
      try {
        await deleteFn(this.selectedNode.id);
        this.$message?.success?.(successMessage);
        this.$emit("refresh-tree");
      } catch (error) {
        this.$notifyApiError?.(error, errorMessage);
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.$emit("close"));
      }
    },

    confirmDeleteOwner() {
      return this.confirmDeleteTreeEntity({
        entityName: "organisation",
        invalidMessage: "Invalid organisation id",
        deleteFn: deleteOrganisation,
        successMessage: "Organisation deleted",
        errorMessage: "Failed to delete organisation",
      });
    },

    confirmDeleteSubstation() {
      return this.confirmDeleteTreeEntity({
        entityName: "substation",
        invalidMessage: "Invalid substation id",
        deleteFn: deleteSubstation,
        successMessage: "Substation deleted",
        errorMessage: "Failed to delete substation",
      });
    },

    confirmDeleteVoltageLevel() {
      return this.confirmDeleteTreeEntity({
        entityName: "voltage level",
        invalidMessage: "Invalid voltage level id",
        deleteFn: deleteVoltageLevel,
        successMessage: "Voltage Level deleted",
        errorMessage: "Failed to delete voltage level",
      });
    },

    confirmDeleteBay() {
      return this.confirmDeleteTreeEntity({
        entityName: "bay",
        invalidMessage: "Invalid bay id",
        deleteFn: deleteBay,
        successMessage: "Bay deleted",
        errorMessage: "Failed to delete bay",
      });
    },

    triggerFileInput() {
      if (this.isLoading) return;
      this.$refs.fileInput.click();
    },
    handleFileSelect(event) {
      this.selectedFile = event.target.files[0];
      if (this.selectedFile) {
        if (this.pendingFileAction === "sclManagementImport") {
          this.confirmImportSclFromMenu();
          return;
        }
        this.showImportDialog = true;
      }
    },
    cancelImport() {
      this.showImportDialog = false;
      this.selectedFile = null;
      this.pendingFileAction = "";
      this.isLoading = false;
      this.$refs.fileInput.value = "";
    },
    async confirmImportSclFromMenu() {
      if (this.isLoading) return;
      const file = this.selectedFile;
      const iedId = this.selectedNode?.id;

      if (!file || iedId == null || iedId === "") {
        this.$message?.error?.("No file selected or invalid IED ID");
        this.pendingFileAction = "";
        return;
      }

      this.isLoading = true;
      try {
        await importScl(file, iedId);
        this.$message?.success?.("SCL imported successfully.");
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to import SCL file.");
      } finally {
        this.isLoading = false;
        this.pendingFileAction = "";
        this.selectedFile = null;
        if (this.$refs.fileInput) this.$refs.fileInput.value = "";
        this.$nextTick(() => this.$emit("close"));
      }
    },
    async confirmImport() {
      if (this.isLoading) return;
      const file = this.selectedFile;
      const nodeId = this.selectedNode && this.selectedNode.id;
      const isOrganisationImport = this.ownerModes.includes(this.nodeMode);
      const isIedImport = this.nodeMode === "ied";

      if (!file || !nodeId) {
        this.$message.error("No file selected or invalid node ID");
        return;
      }

      if (!isOrganisationImport && !isIedImport) {
        this.$message.error("Import is only supported for IED or Organisation");
        return;
      }

      this.showImportDialog = false;
      this.isLoading = true;

      try {
        if (isOrganisationImport) {
          await importOrganisationScd(file, nodeId);
          this.$message.success(`Successfully imported for Organisation ID: ${nodeId}`);
        } else {
          await importDevice(file, nodeId);
          this.$message.success(`Successfully imported for IED ID: ${nodeId}`);
        }

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
        this.$notifyApiError?.(error, "Failed to import");
      } finally {
        this.isLoading = false;
        this.showImportDialog = false;
        this.pendingFileAction = "";
        this.selectedFile = null;
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }
        this.$emit("close");
      }
    },

    extractFilenameFromDisposition(dispositionHeader) {
      const raw = String(dispositionHeader || "");
      if (!raw) return "";

      const utfMatch = raw.match(/filename\*=UTF-8''([^;]+)/i);
      if (utfMatch?.[1]) {
        try {
          return decodeURIComponent(utfMatch[1]).replace(/^"|"$/g, "");
        } catch {
          return utfMatch[1].replace(/^"|"$/g, "");
        }
      }

      const plainMatch = raw.match(/filename=([^;]+)/i);
      if (plainMatch?.[1]) {
        return plainMatch[1].trim().replace(/^"|"$/g, "");
      }

      return "";
    },

    triggerBrowserDownload(blob, fileName, defaultName = "download") {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || defaultName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },

    getSignalListExportMode() {
      if (this.ownerModes.includes(this.nodeMode)) return "organisation";
      if (this.nodeMode === "substation") return "substation";
      if (this.nodeMode === "voltageLevel") return "voltageLevel";
      return "";
    },

    async exportSignalListFile() {
      if (this.isLoading) return;
      const mode = this.getSignalListExportMode();
      const id = this.selectedNode?.id;
      if (!mode || id === null || id === undefined || id === "") {
        this.$message?.error?.("Invalid Signal List export target");
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      this.isLoading = true;
      try {
        const response = await exportSignalList(mode, id);
        const disposition = response?.headers?.["content-disposition"];
        const fallbackFileName = `signal-list-${mode}-${id}.xlsx`;
        const fileName = this.extractFilenameFromDisposition(disposition) || fallbackFileName;
        this.triggerBrowserDownload(response.data, fileName, fallbackFileName);
        this.$message?.success?.("Exported Signal List successfully.");
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to export Signal List.");
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.$emit("close"));
      }
    },

    async exportOrganisationSCD() {
      if (this.isLoading) return;
      const organisationId = this.selectedNode?.id;
      if (organisationId === null || organisationId === undefined || organisationId === "") {
        this.$message?.error?.("Invalid organisation id");
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      this.isLoading = true;
      try {
        const response = await exportOrganisationScd(organisationId);
        const disposition = response?.headers?.["content-disposition"];
        const fallbackFileName = `organisation-${organisationId}.scd`;
        const fileName = this.extractFilenameFromDisposition(disposition) || fallbackFileName;
        this.triggerBrowserDownload(response.data, fileName, `organisation-${organisationId}`);
        this.$message?.success?.("Exported organisation SCD successfully.");
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to export organisation SCD.");
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.$emit("close"));
      }
    },

    async exportIedXRIO() {
      if (this.isLoading) return;
      const iedId = this.selectedNode?.id;
      if (iedId === null || iedId === undefined || iedId === "") {
        this.$message?.error?.("Invalid IED id");
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      this.isLoading = true;
      try {
        const response = await exportIedXrio(iedId);
        const disposition = response?.headers?.["content-disposition"];
        const fallbackFileName = `ied-${iedId}.xrio`;
        const fileName = this.extractFilenameFromDisposition(disposition) || fallbackFileName;
        this.triggerBrowserDownload(response.data, fileName, `ied-${iedId}.xrio`);
        this.$message?.success?.("Exported IED XRIO successfully.");
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to export IED XRIO.");
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.$emit("close"));
      }
    },
    async exportPcdDocx() {
      if (this.isLoading) return;
      const iedId = this.selectedNode?.id;
      if (iedId === null || iedId === undefined || iedId === "") {
        this.$message?.error?.("Invalid IED id");
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      this.isLoading = true;
      try {
        const response = await exportPcdDocx(iedId);
        const disposition = response?.headers?.["content-disposition"];
        const fallbackFileName = `pcd-report-${iedId}.docx`;
        const fileName = this.extractFilenameFromDisposition(disposition) || fallbackFileName;
        this.triggerBrowserDownload(response.data, fileName, fallbackFileName);
        this.$message?.success?.("Exported PCD report successfully.");
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to export PCD report.");
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.$emit("close"));
      }
    },
    async exportBbtnTestReport() {
      if (this.isLoading) return;
      const iedId = this.selectedNode?.id;
      if (iedId === null || iedId === undefined || iedId === "") {
        this.$message?.error?.("Invalid IED id");
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      this.isLoading = true;
      try {
        const response = await exportBbtnDocx(iedId);
        const disposition = response?.headers?.["content-disposition"];
        const fallbackFileName = `bbtn-test-report-${iedId}.docx`;
        const fileName = this.extractFilenameFromDisposition(disposition) || fallbackFileName;
        this.triggerBrowserDownload(response.data, fileName, fallbackFileName);
        this.$message?.success?.("Exported test report successfully.");
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to export test report.");
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.$emit("close"));
      }
    },
    async exportSclFile() {
      if (this.isLoading) return;
      const iedId = this.selectedNode?.id;
      if (iedId === null || iedId === undefined || iedId === "") {
        this.$message?.error?.("Invalid IED id");
        this.$nextTick(() => this.$emit("close"));
        return;
      }

      this.isLoading = true;
      try {
        const response = await exportSclByIed(iedId);
        const disposition = response?.headers?.["content-disposition"];
        const fileName = this.extractFilenameFromDisposition(disposition);
        this.triggerBrowserDownload(response.data, fileName, `ied-${iedId}.cid`);
        this.$message?.success?.("Exported SCL successfully.");
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to export SCL.");
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.$emit("close"));
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

.confirm-text {
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  color: #333;
}
</style>
