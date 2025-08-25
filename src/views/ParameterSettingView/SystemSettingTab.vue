<template>
  <div class="system-setting-tab">
    <h3>{{ ownerData.name }}</h3>
    <div class="toolbar">
      <el-button v-if="!isEditing" type="primary" @click="enterEditMode">
        Chỉnh sửa
      </el-button>
      <template v-else>
        <el-button type="success" @click="saveAll">Lưu</el-button>
        <el-button type="danger" @click="cancelAll">Hủy</el-button>
      </template>
    </div>

    <table class="parameter-table">
      <thead>
        <tr>
          <th>Tham số</th>
          <th class="value-col">Giá trị</th>
          <th>Đơn vị</th>
          <th>Min</th>
          <th>Max</th>
          <th>Mô tả</th>
        </tr>
      </thead>
      <tbody v-if="rowsToRender.length">
        <template v-for="row in rowsToRender" :key="row.key">
          <!-- Group header -->
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

          <!-- Parameter row -->
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

            <!-- Value -->
            <td :class="['value-col', cellClass(row.value)]">
              <div class="cell">
                <template v-if="!isEditing">
                  <el-switch
                    v-if="isOnOff(row)"
                    :model-value="getSwitchValue(row)"
                    active-value="On"
                    inactive-value="Off"
                    disabled
                  />
                  <span v-else class="cell-text">{{
                    formatValue(row, row.value)
                  }}</span>
                </template>

                <!-- Edit mode -->
                <template v-else>
                  <el-select
                    v-if="row.options && !isOnOff(row)"
                    v-model="editStates[row.id]"
                    placeholder="Chọn"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="opt in row.options"
                      :key="opt"
                      :label="opt"
                      :value="opt"
                    />
                  </el-select>
                  <el-switch
                    v-else-if="isOnOff(row)"
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
  </div>
</template>

<script>
import {
  getAncestorByMode,
  getGroupByIedId,
  getEntityTree,
} from "@/api/treenode";
import { updateDeviceParameters } from "@/api/device";
export default {
  name: "SystemSettingTab",
  props: {
    ownerData: { type: Object, required: true },
    focusNode: { type: Object, default: null },
  },
  data() {
    return {
      parameterGroups: [],
      isEditing: false,
      editStates: {},
      changedValues: [],
    };
  },
  computed: {
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
      console.log("🔹 saveAll bắt đầu");

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
          this.$message.success("Lưu thành công!");
        } else {
          console.log("Không có thay đổi, vẫn gọi lại entity-tree để refresh");
        }

        const tree = await getEntityTree();
        this.$emit("device-saved");
        const iedNode = getAncestorByMode(tree, this.ownerData.node.id, "ied");
        if (iedNode) {
          const groupTree = getGroupByIedId(tree, iedNode.id);
          if (groupTree?.children) {
            this.parameterGroups = JSON.parse(
              JSON.stringify(groupTree.children)
            );
            this.$nextTick(() => this.$forceUpdate());
          }
        }
      } catch (error) {
        console.error("Failed to update parameters:", error);
        this.$message.error("Lưu thất bại!");
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
    getEntityTree().then((tree) => {
      const iedNode = getAncestorByMode(tree, this.ownerData.node.id, "ied");
      if (!iedNode) return;
      const groupTree = getGroupByIedId(tree, iedNode.id);
      if (groupTree?.children) this.parameterGroups = groupTree.children;
    });
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

.cell .el-switch {
  margin: 0 auto;
}
</style>
