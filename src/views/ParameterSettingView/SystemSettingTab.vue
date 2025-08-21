<template>
  <div class="system-setting-tab">
    <h3>{{ ownerData.name }}</h3>
    <div class="toolbar">
      <el-button v-if="!isEditing" type="primary" @click="enterEditMode">
        Edit
      </el-button>
      <template v-else>
        <el-button type="success" @click="saveAll">Save</el-button>
        <el-button type="danger" @click="cancelAll">Cancel</el-button>
      </template>
    </div>

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

            <!-- Value -->
            <td :class="['value-col', cellClass(row.value)]">
              <div class="cell">
                <template v-if="!isEditing">
                  <el-switch
                    v-if="isOnOff(row)"
                    v-model="dummySwitch[row.id]"
                    disabled
                  />
                  <span v-else class="cell-text">{{
                    displayValue(row.value)
                  }}</span>
                </template>

                <!-- Edit mode -->
                <template v-else>
                  <el-select
                    v-if="row.options && !isOnOff(row)"
                    v-model="editStates[row.id]"
                    placeholder="Select"
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

export default {
  name: "SystemSettingTab",
  props: { ownerData: { type: Object, required: true } },
  data() {
    return {
      parameterGroups: [],
      isEditing: false,
      editStates: {},
      changedValues: [],
      dummySwitch: {},
    };
  },
  computed: {
    rowsToRender() {
      const mode = this.ownerData.node.mode;
      if (mode === "ied") {
        const groups =
          this.ownerData.node.children?.filter(
            (c) => c.mode === "systemSetting" || c.mode === "protectionGroup"
          ) || [];
        return this.renderParamRows(groups, 1);
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
        return this.renderParamRows(this.ownerData.node.children, 1);
      }
      return [];
    },
  },
  methods: {
    isOnOff(row) {
      return (
        row.options &&
        row.options.length === 2 &&
        row.options.includes("On") &&
        row.options.includes("Off")
      );
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
    renderParamRows(children, level) {
      const rows = [];
      const padding = level * 20;
      children?.forEach((child) => {
        if (child.children?.length) {
          rows.push({
            key: "group-" + child.id,
            isGroup: true,
            ...child,
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
      return v == null ? "" : v;
    },

    enterEditMode() {
      this.isEditing = true;
      this.editStates = {};
      this.rowsToRender.forEach((row) => {
        if (!row.isGroup) {
          this.editStates[row.id] = row.value;
          this.dummySwitch[row.id] = row.value === "On";
        }
      });
    },

    cancelAll() {
      this.isEditing = false;
      this.editStates = {};
      this.changedValues = [];
    },

    saveAll() {
      this.changedValues = [];
      this.rowsToRender.forEach((row) => {
        if (!row.isGroup && this.editStates[row.id] !== undefined) {
          const newVal = this.editStates[row.id];
          if (row.value !== newVal) {
            this.changedValues.push({ id: row.id, newValue: newVal });
            row.value = newVal;
          }
        }
      });

      console.log("Các giá trị thay đổi:", JSON.stringify(this.changedValues));

      this.isEditing = false;
      this.editStates = {};
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
.value-col {
  width: 160px;
  max-width: 200px;
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
.toolbar {
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.row-ied,
.row-protectionGroup {
  background-color: #b3c7f2;
}
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
.null-cell {
  background-color: #f3f3f3;
  color: #666;
  font-style: italic;
}
.cell .el-switch {
  margin: 0 auto;
}
</style>
