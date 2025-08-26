<template>
  <div class="system-setting-tab" ref="rootEl">
    <div class="toolbar" v-if="isEditing">
      <el-button type="success" @click="saveAll">{{
        saveButtonText
      }}</el-button>
      <el-button type="danger" @click="cancelAll">{{
        cancelButtonText
      }}</el-button>
    </div>

    <table class="parameter-table">
      <thead>
        <tr>
          <th>{{ tableHeaders.parameter }}</th>
          <th class="value-col">{{ tableHeaders.value }}</th>
          <th>{{ tableHeaders.unit }}</th>
          <th>{{ tableHeaders.min }}</th>
          <th>{{ tableHeaders.max }}</th>
          <th>{{ tableHeaders.description }}</th>
        </tr>
      </thead>
      <tbody v-if="rowsToRender.length">
        <template v-for="row in rowsToRender" :key="row.key">
          <tr
            v-if="row.isGroup"
            class="paramgroup-header"
            :class="[row.mode ? 'row-' + row.mode : '']"
          >
            <td
              colspan="6"
              :style="{ paddingLeft: row.padding + 'px', fontWeight: 'bold' }"
            >
              {{ row.name }}
            </td>
          </tr>
          <tr
            v-else
            class="param-row"
            :class="[
              row.mode ? 'row-' + row.mode : '',
              { 'muted-row': row.muted },
            ]"
          >
            <td class="param-name" :style="{ paddingLeft: row.padding + 'px' }">
              {{ row.name }}
            </td>
            <td :class="['value-col', cellClass(row.value)]">
              <div class="cell">
                <template v-if="!isEditing">
                  <span v-if="isOnOff(row)" class="switch-label">
                    {{ getSwitchLabel(row) }}
                  </span>
                  <el-switch
                    v-if="isOnOff(row)"
                    :model-value="getSwitchValue(row)"
                    active-value="On"
                    inactive-value="Off"
                    disabled
                  />
                  <span v-else class="cell-text">
                    {{ formatValue(row, row.value) }}
                  </span>
                </template>

                <template v-else>
                  <el-select
                    v-if="row.options && !isOnOff(row)"
                    v-model="editStates[row.id]"
                    :placeholder="selectPlaceholder"
                    style="width: 100%"
                    popper-append-to-body
                    teleported
                    popper-class="system-setting-dropdown"
                  >
                    <el-option
                      v-for="opt in row.options"
                      :key="opt"
                      :label="opt"
                      :value="opt"
                    />
                  </el-select>

                  <span v-if="isOnOff(row)" class="switch-label">
                    {{ getSwitchLabel(row, editStates[row.id]) }}
                  </span>
                  <el-switch
                    v-if="isOnOff(row)"
                    v-model="editStates[row.id]"
                    active-value="On"
                    inactive-value="Off"
                  />

                  <input
                    v-else
                    v-model="editStates[row.id]"
                    class="cell-input"
                  />
                </template>
              </div>
            </td>
            <td :class="cellClass(row.unit)">
              <span class="cell-text">{{ displayValue(row.unit) }}</span>
            </td>
            <td :class="cellClass(row.minVal)">
              <span class="cell-text">{{ displayValue(row.minVal) }}</span>
            </td>
            <td :class="cellClass(row.maxVal)">
              <span class="cell-text">{{ displayValue(row.maxVal) }}</span>
            </td>
            <td :class="cellClass(row.description)">
              <span class="cell-text">{{ displayValue(row.description) }}</span>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <div class="floating-menu" ref="floatingEl">
      <button
        class="gear-btn drag-handle"
        @pointerdown="startDrag"
        aria-label="Open quick menu"
      >
        <i class="fa-solid fa-gear"></i>
      </button>

      <transition name="fade">
        <div v-if="menuOpen" class="menu-items" @click.self="menuOpen = false">
          <!-- Edit -->
          <button class="menu-item" @click="onClickEdit" aria-label="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <!-- ON -->
          <button
            class="menu-item"
            @click="onClickSetOperation('On')"
            aria-label="Turn On"
          >
            <i class="fa-solid fa-toggle-on"></i>
          </button>
          <!-- OFF -->
          <button
            class="menu-item"
            @click="onClickSetOperation('Off')"
            aria-label="Turn Off"
          >
            <i class="fa-solid fa-toggle-off"></i>
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import {
  getAncestorByMode,
  getGroupByIedId,
  getEntityTree,
} from "@/api/treenode";
import { updateDeviceParameters } from "@/api/device";
import { mapState } from "vuex";

export default {
  name: "SystemSettingTab",
  props: {
    ownerData: { type: Object, required: true },
    focusNode: { type: Object, default: null },
  },
  data() {
    return {
      isDragging: false,
      dragDX: 0,
      dragDY: 0,
      userPinned: false,
      fmLeft: null,
      fmTop: null,
      offsetX: 850,
      offsetY: 50,
      parameterGroups: [],
      isEditing: false,
      editStates: {},
      changedValues: [],
      menuOpen: false,
      dragMoved: false,
      dragStartX: 0,
      dragStartY: 0,
    };
  },
  computed: {
    ...mapState(["language"]),
    tableHeaders() {
      return this.language === "vi-vi"
        ? {
            parameter: "Tham số",
            value: "Giá trị",
            unit: "Đơn vị",
            min: "Min",
            max: "Max",
            description: "Mô tả",
          }
        : {
            parameter: "Parameter",
            value: "Value",
            unit: "Unit",
            min: "Min",
            max: "Max",
            description: "Description",
          };
    },
    editButtonText() {
      return this.language === "vi-vi" ? "Chỉnh sửa" : "Edit";
    },
    saveButtonText() {
      return this.language === "vi-vi" ? "Lưu" : "Save";
    },
    cancelButtonText() {
      return this.language === "vi-vi" ? "Hủy" : "Cancel";
    },
    selectPlaceholder() {
      return this.language === "vi-vi" ? "Chọn" : "Select";
    },
    successMessage() {
      return this.language === "vi-vi"
        ? "Lưu thành công!"
        : "Saved successfully!";
    },
    failureMessage() {
      return this.language === "vi-vi" ? "Lưu thất bại!" : "Save failed!";
    },
    fmStorageKey() {
      const id = this.ownerData?.node?.id ?? "unknown";
      return `floatingPos:${id}`;
    },
    rowsToRender() {
      const node = this.focusNode || this.ownerData.node;
      const mode = node.mode;
      if (mode === "ied") {
        const source = this.parameterGroups.length
          ? this.parameterGroups
          : node.children || [];
        return this.renderParamRows(source, 1);
      }
      if (
        [
          "protectionFunction",
          "protectionLevel",
          "protectionGroup",
          "settingFunction",
          "systemSetting",
        ].includes(mode)
      ) {
        return this.renderParamRows(node.children || [], 1);
      }
      return [];
    },
  },
  methods: {
    getScrollParents(el) {
      const parents = [];
      let p = el && el.parentElement;
      while (p) {
        const s = getComputedStyle(p);
        const hasScroll = /(auto|scroll)/.test(
          `${s.overflow}${s.overflowX}${s.overflowY}`
        );
        if (hasScroll) parents.push(p);
        p = p.parentElement;
      }
      parents.push(window);
      return parents;
    },
    startDrag(e) {
      const fm = this.$refs.floatingEl;
      if (!fm) return;

      const rect = fm.getBoundingClientRect();
      this.fmLeft = rect.left;
      this.fmTop = rect.top;

      this.dragDX = e.clientX - this.fmLeft;
      this.dragDY = e.clientY - this.fmTop;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragMoved = false;
      this.isDragging = true;

      e.target.setPointerCapture?.(e.pointerId);
      document.documentElement.classList.add("dragging");

      window.addEventListener("pointermove", this.onDrag, { passive: false });
      window.addEventListener("pointerup", this.endDrag);
      window.addEventListener("pointercancel", this.endDrag);
    },

    onDrag(e) {
      if (!this.isDragging) return;
      e.preventDefault();

      const fm = this.$refs.floatingEl;
      if (!fm) return;

      const dx0 = e.clientX - this.dragStartX;
      const dy0 = e.clientY - this.dragStartY;
      if (!this.dragMoved && (Math.abs(dx0) > 6 || Math.abs(dy0) > 6)) {
        this.dragMoved = true;
      }

      // Nếu đang kéo thật thì cập nhật vị trí
      let left = e.clientX - this.dragDX;
      let top = e.clientY - this.dragDY;

      const w = fm.offsetWidth || 0;
      const h = fm.offsetHeight || 0;
      const maxLeft = window.innerWidth - w;
      const maxTop = window.innerHeight - h;

      left = Math.max(0, Math.min(left, maxLeft));
      top = Math.max(0, Math.min(top, maxTop));

      fm.style.position = "fixed";
      fm.style.left = `${left}px`;
      fm.style.top = `${top}px`;
      fm.style.right = "";
      fm.style.bottom = "";

      this.fmLeft = left;
      this.fmTop = top;
    },

    endDrag() {
      if (!this.isDragging) return;
      this.isDragging = false;
      document.documentElement.classList.remove("dragging");

      window.removeEventListener("pointermove", this.onDrag);
      window.removeEventListener("pointerup", this.endDrag);
      window.removeEventListener("pointercancel", this.endDrag);

      // Nếu KHÔNG kéo (chỉ chạm/nhấp) → toggle menu
      if (!this.dragMoved) {
        this.menuOpen = !this.menuOpen;
        // KHÔNG pin vị trí khi chỉ click
        return;
      }

      this.userPinned = true;
    },

    updateFloatingPos() {
      const fm = this.$refs.floatingEl;
      const root = this.$refs.rootEl;
      if (!fm || !root) return;

      if (this.userPinned && this.fmLeft != null && this.fmTop != null) return;

      const rect = root.getBoundingClientRect();
      const visLeft = Math.max(rect.left, 0);
      const visRight = Math.min(rect.right, window.innerWidth);
      const visTop = Math.max(rect.top, 0);
      const visBottom = Math.min(rect.bottom, window.innerHeight);
      const hasIntersection = visRight > visLeft && visBottom > visTop;

      if (!hasIntersection) {
        fm.style.display = "none";
        return;
      } else {
        fm.style.display = "";
      }

      const left = visLeft + this.offsetX;

      const bottomToViewport = this.offsetY;
      const bottomToContainer = window.innerHeight - rect.bottom + this.offsetY;
      const bottom = Math.max(bottomToViewport, bottomToContainer);

      fm.style.position = "fixed";
      fm.style.left = `${left}px`;
      fm.style.top = "";
      fm.style.right = "";
      fm.style.bottom = `${bottom}px`;

      this.fmLeft = left;
      this.fmTop = window.innerHeight - bottom - (fm.offsetHeight || 0);
    },

    resetFloatingPos() {
      this.userPinned = false;

      this.$nextTick(this.updateFloatingPos);
    },
    onClickEdit() {
      this.menuOpen = false;
      if (!this.isEditing) this.enterEditMode();
    },
    async onClickSetOperation(val) {
      this.menuOpen = false;

      const targetRows = this.rowsToRender.filter(
        (r) =>
          !r.isGroup &&
          typeof r.name === "string" &&
          r.name.trim().toLowerCase() === "operation" &&
          this.isOnOff(r)
      );

      if (!targetRows.length) {
        this.$message.info(
          this.language === "vi-vi"
            ? "Không tìm thấy tham số Operation để chuyển trạng thái."
            : "No 'Operation' parameters found."
        );
        return;
      }

      if (this.isEditing) {
        targetRows.forEach((r) => (this.editStates[r.id] = val));
        this.$message.success(
          (this.language === "vi-vi"
            ? "Đã đặt Operation = "
            : "Set Operation = ") + val
        );
        return;
      }

      const prevEdit = this.isEditing;
      try {
        this.enterEditMode();
        targetRows.forEach((r) => (this.editStates[r.id] = val));
        await this.saveAll();
      } catch (e) {
        console.error(e);
      } finally {
        if (prevEdit) this.isEditing = true;
      }
    },

    hasOperationOff(node) {
      if (!node || !Array.isArray(node.children)) return false;
      const hasDirectOperationOff = node.children.some(
        (c) =>
          String(c?.name || "").toLowerCase() === "operation" &&
          String(c?.value || "").toLowerCase() === "off"
      );
      if (hasDirectOperationOff) return true;
      return node.children.some((child) => this.hasOperationOff(child));
    },
    formatValue(row, v) {
      if (
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
      ) {
        return "";
      }
      if (
        row?.mode === "pcDataObject" &&
        /^(active\s*group)$/i.test(row?.name || "")
      ) {
        const s = String(v);
        const left = s.split(".")[0];
        return (left ?? s).trim();
      }
      if (this.isOnOff(row)) {
        return v === true || v === 1 || v === "On" ? "On" : "Off";
      }
      return v;
    },
    isOnOff(row) {
      return (
        row.options &&
        row.options.length === 2 &&
        row.options.includes("On") &&
        row.options.includes("Off")
      );
    },
    getSwitchValue(row) {
      const value = row.value;
      if (value === true || value === 1 || value === "On" || value === "on") {
        return "On";
      } else {
        return "Off";
      }
    },
    getSwitchLabel(row, value = this.getSwitchValue(row)) {
      const labels = {
        "vi-vi": { On: "Bật", Off: "Tắt" },
        default: { On: "On", Off: "Off" },
      };
      const langConfig = labels[this.language] || labels.default;
      return langConfig[value];
    },
    isNullish(v) {
      return (
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
      );
    },
    cellClass(v) {
      return this.isNullish(v) ? "null-cell" : "";
    },
    renderParamRows(children, level, inheritedMuted = false, seen = new Set()) {
      const rows = [];
      const padding = level * 20;
      children?.forEach((child) => {
        if (seen.has(child.id)) return;
        seen.add(child.id);
        const selfMuted =
          inheritedMuted ||
          (child.children?.some(
            (c) =>
              String(c?.name || "").toLowerCase() === "operation" &&
              String(c?.value || "").toLowerCase() === "off"
          ) ??
            false);
        if (child.children?.length) {
          rows.push({
            key: "group-" + child.id,
            isGroup: true,
            ...child,
            padding,
            muted: selfMuted,
          });
          rows.push(
            ...this.renderParamRows(child.children, level + 1, selfMuted, seen)
          );
        } else {
          rows.push({
            key: "param-" + child.id,
            isGroup: false,
            ...child,
            padding,
            muted: inheritedMuted,
          });
        }
      });
      return rows;
    },
    displayValue(v) {
      return v == null ? "" : v;
    },
    enterEditMode() {
      this.isEditing = true;
      this.editStates = {};
      this.rowsToRender.forEach((row) => {
        if (!row.isGroup) {
          if (this.isOnOff(row)) {
            this.editStates[row.id] = this.getSwitchValue(row);
          } else {
            this.editStates[row.id] = row.value;
          }
        }
      });
    },
    cancelAll() {
      this.isEditing = false;
      this.editStates = {};
      this.changedValues = [];
    },
    async saveAll() {
      this.changedValues = [];
      const groupChanges = new Map();
      const processedKeys = new Set();

      this.rowsToRender.forEach((row) => {
        if (
          !row.isGroup &&
          this.editStates[row.id] !== undefined &&
          !processedKeys.has(row.id)
        ) {
          const newVal = this.editStates[row.id];
          if (row.value !== newVal) {
            const groupId = this.findParentGroupId(row.id);
            if (!groupChanges.has(groupId)) {
              groupChanges.set(groupId, []);
            }
            groupChanges.get(groupId).push({
              key: row.id,
              value: newVal,
            });
            processedKeys.add(row.id);
            row.value = newVal;

            if (String(row.name).toLowerCase() === "operation") {
              const isOff = String(newVal).toLowerCase() === "off";
              const parentGroupId = this.findParentGroupId(row.id);
              this.rowsToRender.forEach((r) => {
                if (r.isGroup && r.id === parentGroupId) r.muted = isOff;
                if (
                  !r.isGroup &&
                  this.findParentGroupId(r.id) === parentGroupId
                ) {
                  r.muted = isOff;
                }
              });
            }
          }
        }
      });

      this.changedValues = Array.from(groupChanges.values());

      try {
        if (this.changedValues.length > 0) {
          await updateDeviceParameters(this.changedValues);
          this.$message.success(this.successMessage);

          const tree = await getEntityTree();
          this.$emit("device-saved");
          const iedNode = getAncestorByMode(
            tree,
            this.ownerData.node.id,
            "ied"
          );
          if (iedNode) {
            const groupTree = getGroupByIedId(tree, iedNode.id);
            if (groupTree?.children) {
              this.parameterGroups = JSON.parse(
                JSON.stringify(groupTree.children)
              );
              this.$nextTick(() => this.$forceUpdate());
            }
          }
        } else {
          this.$message.info(
            this.language === "vi-vi" ? "Chưa có gì thay đổi!" : "No changes."
          );
        }
      } catch (error) {
        console.error("Failed to update parameters:", error);
        let errorMsg = this.failureMessage;
        if (error.response && error.response.data) {
          errorMsg =
            error.response.data.message || JSON.stringify(error.response.data);
        } else if (error.message) {
          errorMsg = error.message;
        }
        this.$message.error(errorMsg);
      }

      this.isEditing = false;
      this.editStates = {};
    },
    findParentGroupId(paramId) {
      const keyStr = String(paramId);
      const firstDashIndex = keyStr.indexOf("-");
      if (firstDashIndex !== -1) {
        const prefix = keyStr.substring(0, firstDashIndex);
        if (/^\d+$/.test(prefix)) {
          return prefix;
        }
      }
      let foundGroup = null;
      for (let i = 0; i < this.rowsToRender.length; i++) {
        const row = this.rowsToRender[i];
        if (row.isGroup) {
          foundGroup = row.id;
        } else if (row.id === paramId) {
          break;
        }
      }
      return foundGroup || "ungrouped";
    },
  },
  mounted() {
    this.$nextTick(() => {
      // khôi phục từ localStorage
      try {
        const saved = JSON.parse(
          localStorage.getItem(this.fmStorageKey) || "null"
        );
        if (
          saved &&
          typeof saved.left === "number" &&
          typeof saved.top === "number"
        ) {
          const fm = this.$refs.floatingEl;
          if (fm) {
            fm.style.position = "fixed";
            fm.style.left = `${saved.left}px`;
            fm.style.top = `${saved.top}px`;
            fm.style.right = "";
            fm.style.bottom = "";
            this.fmLeft = saved.left;
            this.fmTop = saved.top;
            this.userPinned = !!saved.userPinned;
          }
        } else {
          // chưa có -> auto đặt lần đầu
          this.updateFloatingPos();
        }
      } catch {
        this.updateFloatingPos();
      }

      // nghe scroll/resize như cũ (để auto cập nhật khi chưa kéo tay)
      this._scrollParents = this.getScrollParents(this.$refs.rootEl);
      this._scrollParents.forEach((p) =>
        p.addEventListener("scroll", this.updateFloatingPos, { passive: true })
      );
      window.addEventListener("resize", this.updateFloatingPos);
    });

    getEntityTree().then((tree) => {
      const iedNode = getAncestorByMode(tree, this.ownerData.node.id, "ied");
      if (!iedNode) return;
      const groupTree = getGroupByIedId(tree, iedNode.id);
      if (groupTree?.children) this.parameterGroups = groupTree.children;
    });

    document.addEventListener("click", this.handleDocClick);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleDocClick);

    if (this._scrollParents) {
      this._scrollParents.forEach((p) =>
        p.removeEventListener("scroll", this.updateFloatingPos)
      );
    }
    window.removeEventListener("resize", this.updateFloatingPos);
  },
  created() {
    this.handleDocClick = (e) => {
      const fm = this.$el.querySelector(".floating-menu");
      if (fm && (fm === e.target || fm.contains(e.target))) return;
      this.menuOpen = false;
    };
  },
  updated() {
    this.$nextTick(this.updateFloatingPos);
  },
};
</script>

<style scoped>
.muted-row td,
.muted-row {
  background-color: #f3f3f3;
  color: #666;
  font-style: italic;
}

.null-cell {
  background-color: #f3f3f3;
  color: #666;
  font-style: italic;
}

.toolbar {
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* màu nhóm giữ nguyên như cũ */
.row-ied,
.row-systemSetting,
.row-protectionGroup {
  background-color: #b3c7f2;
}

.row-settingFunction,
.row-protectionFunction {
  background-color: #b0dce8;
}

.row-protectionLevel {
  background-color: #d6e7f0;
}

.parameter-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 30px;
  overflow: visible;
}

.parameter-table th,
.parameter-table td {
  border: 1px solid #ccc;
  padding: 6px;
  text-align: left;
}

thead {
  background-color: #e1e1e1;
}

.value-col {
  width: 120px;
  max-width: 160px;
  white-space: nowrap;
}

.cell {
  display: flex;
  align-items: center;
  min-height: 22px;
  position: relative;
}

.cell-text {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-input {
  flex: 1 1 auto;
  min-width: 0;
}

.switch-label {
  margin-right: 15px;
  font-size: 14px;
}

.cell .el-switch {
  margin: 0;
}

.system-setting-tab {
  overflow: visible;
  position: relative;
}

.floating-menu {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gear-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: transparent;
  color: black;
  border: none;
  font-size: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

.menu-items {
  position: absolute;
  bottom: calc(56px + 10px);
  left: 50%;
  transform: translateX(-50%);

  display: flex;
  flex-direction: column;
  gap: 10px;

  margin: 0;
}

.menu-item {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #fff;
  color: #222;
  border: 1px solid #e5e5e5;
  font-size: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

/* transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
.system-setting-dropdown {
  z-index: 999999 !important;
}
.el-select-dropdown {
  z-index: 999999 !important;
}
.system-setting-dropdown .el-select-dropdown__item {
  color: #333;
  padding: 8px 16px;
}
.system-setting-dropdown .el-select-dropdown__item:hover {
  background-color: #f5f5f5;
  color: #333;
}
.system-setting-dropdown .el-select-dropdown__item.selected {
  background-color: #409eff;
  color: #fff;
  font-weight: bold;
}
.drag-handle {
  cursor: grab;
}
.dragging .drag-handle {
  cursor: grabbing;
}
.dragging {
  user-select: none;
}
</style>
