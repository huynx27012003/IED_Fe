<template>
  <div class="system-setting-tab">
    <h3>{{ ownerData.name }}</h3>
    <table class="parameter-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th class="value-col">Value</th>
          <th>Unit</th>
          <th>Min</th>
          <th>Max</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody v-if="rowsToRender.length">
        <template v-for="row in rowsToRender" :key="row.key">
          <!-- Group header -->
          <tr
            v-if="row.isGroup"
            class="paramgroup-header"
            :class="row.mode ? 'row-' + row.mode : ''"
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
            :class="row.mode ? 'row-' + row.mode : ''"
          >
            <td class="param-name" :style="{ paddingLeft: row.padding + 'px' }">
              {{ row.name }}
            </td>
            <td :class="['value-col', cellClass(row.value)]">
              <div class="cell">
                <template v-if="!editStates[row.id]?.editing">
                  <span class="cell-text">{{ displayValue(row.value) }}</span>
                  <i
                    class="fa-solid fa-pen cell-icon"
                    @click="enterEdit(row)"
                  ></i>
                </template>
                <template v-else>
                  <input
                    v-model="editStates[row.id].tempValue"
                    class="cell-input"
                  />
                  <span class="cell-icons">
                    <i class="fa-solid fa-check" @click="requestSave(row)"></i>
                    <i class="fa-solid fa-x" @click="cancelEdit(row)"></i>
                  </span>
                </template>
              </div>
            </td>
            <td :class="cellClass(row.unit)">
              <div class="cell">
                <span class="cell-text">{{ displayValue(row.unit) }}</span>
              </div>
            </td>
            <td :class="cellClass(row.minVal)">
              <div class="cell">
                <span class="cell-text">{{ displayValue(row.minVal) }}</span>
              </div>
            </td>
            <td :class="cellClass(row.maxVal)">
              <div class="cell">
                <span class="cell-text">{{ displayValue(row.maxVal) }}</span>
              </div>
            </td>
            <td :class="cellClass(row.description)">
              <div class="cell">
                <span class="cell-text">{{
                  displayValue(row.description)
                }}</span>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <el-dialog
      v-model="confirmDialogVisible"
      title="Xác nhận lưu"
      width="300px"
      :close-on-click-modal="false"
    >
      <p>
        Lưu giá trị mới cho:
        <strong
          >{{ confirmTargetParam?.mode }} - {{ confirmTargetParam?.id }}</strong
        >
      </p>
      <template #footer>
        <el-button @click="cancelDialog">Huỷ</el-button>
        <el-button type="primary" @click="confirmSave">Lưu</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  getAncestorByMode,
  getGroupByIedId,
  getEntityTree,
} from "@/api/treenode";

export default {
  name: "SystemSettingTab",
  props: {
    ownerData: { type: Object, required: true },
  },
  data() {
    return {
      parameterGroups: [],
      editStates: {},
      confirmDialogVisible: false,
      confirmTargetParam: null,
    };
  },
  computed: {
    rowsToRender() {
      const mode = this.ownerData.node.mode;

      if (mode === "ied") {
        const protectionGroups =
          this.ownerData.node.children?.filter(
            (c) => c.mode === "systemSetting"
          ) || [];
        return this.renderParamRows(protectionGroups, 1);
      }

      if (
        mode === "protectionFunction" ||
        mode === "protectionLevel" ||
        mode === "protectionGroup" ||
        mode === "settingFunction" ||
        mode === "systemSetting"
      ) {
        return this.renderParamRows(this.ownerData.node.children, 1);
      }

      return [];
    },
  },
  methods: {
    renderParamRows(children, level) {
      const rows = [];
      const padding = level * 20;
      children?.forEach((child) => {
        if (child.children && child.children.length > 0) {
          rows.push({
            key: "group-" + child.id,
            isGroup: true,
            name: child.name,
            mode: child.mode,
            padding,
          });
          rows.push(...this.renderParamRows(child.children, level + 1));
        } else {
          rows.push({
            key: "param-" + child.id,
            isGroup: false,
            ...child,
            padding,
          });
        }
      });
      return rows;
    },

    displayValue(v) {
      return v === null || v === undefined ? "" : v;
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
    enterEdit(param) {
      this.editStates[param.id] = {
        editing: true,
        tempValue: this.displayValue(param.value),
      };
    },
    cancelEdit(param) {
      this.editStates[param.id] = {
        editing: false,
        tempValue: this.displayValue(param.value),
      };
    },
    requestSave(param) {
      this.confirmTargetParam = param;
      this.confirmDialogVisible = true;
    },
    confirmSave() {
      const param = this.confirmTargetParam;
      const updatedValue = this.editStates[param.id].tempValue;
      param.value = updatedValue;
      this.editStates[param.id] = { editing: false, tempValue: updatedValue };
      this.confirmDialogVisible = false;
      this.confirmTargetParam = null;
    },
    cancelDialog() {
      this.confirmDialogVisible = false;
      this.confirmTargetParam = null;
    },
  },
  mounted() {
    getEntityTree().then((tree) => {
      const iedNode = getAncestorByMode(tree, this.ownerData.node.id, "ied");
      if (!iedNode) return;
      const groupTree = getGroupByIedId(tree, iedNode.id);
      if (groupTree?.children) {
        this.parameterGroups = groupTree.children;
      }
    });
  },
};
</script>

<style scoped>
.row-ied,
.row-systemSetting {
  background-color: #b3c7f2;
}

.row-settingFunction {
  background-color: #b0dce8;
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
.group-header {
  background-color: #d9e3f0;
  font-weight: bold;
}
.group-header td {
  background-color: #eaf4ff;
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
.cell-icon {
  margin-left: auto;
  cursor: pointer;
}
.cell-icons {
  margin-left: auto;
  display: inline-flex;
  gap: 8px;
}
.cell-input {
  flex: 1 1 auto;
  min-width: 0;
}
.null-cell {
  background-color: #f3f3f3;
  color: #666;
  font-style: italic;
}
</style>
