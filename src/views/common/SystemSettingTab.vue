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

      <!-- System Setting Mode -->
      <tbody v-show="ownerData.node.mode === 'systemSetting'">
        <template v-for="group in parameterGroups" :key="group.id">
          <tr class="group-header">
            <td :colspan="6">{{ group.name }}</td>
          </tr>

          <tr v-for="param in group.children" :key="param.id" class="param-row">
            <!-- Parameter name-->
            <td class="param-name">
              <span class="indent-20">{{ param.name }}</span>
            </td>

            <!-- Value -->
            <td :class="['value-col', cellClass(param.value)]">
              <div class="cell">
                <template v-if="!editStates[param.id]?.editing">
                  <span class="cell-text">{{ displayValue(param.value) }}</span>
                  <i
                    class="fa-solid fa-pen cell-icon"
                    @click="enterEdit(param)"
                    title="Edit"
                  ></i>
                </template>
                <template v-else>
                  <input
                    v-model="editStates[param.id].tempValue"
                    class="cell-input"
                  />
                  <span class="cell-icons">
                    <i
                      class="fa-solid fa-check"
                      @click="requestSave(param)"
                      title="Save"
                    ></i>
                    <i
                      class="fa-solid fa-x"
                      @click="cancelEdit(param)"
                      title="Cancel"
                    ></i>
                  </span>
                </template>
              </div>
            </td>

            <!-- Unit -->
            <td :class="cellClass(param.unit)">
              <div class="cell">
                <span class="cell-text">{{ displayValue(param.unit) }}</span>
              </div>
            </td>

            <!-- Min -->
            <td :class="cellClass(param.minVal)">
              <div class="cell">
                <span class="cell-text">{{ displayValue(param.minVal) }}</span>
              </div>
            </td>

            <!-- Max -->
            <td :class="cellClass(param.maxVal)">
              <div class="cell">
                <span class="cell-text">{{ displayValue(param.maxVal) }}</span>
              </div>
            </td>

            <!-- Description -->
            <td :class="cellClass(param.description)">
              <div class="cell">
                <span class="cell-text">{{
                  displayValue(param.description)
                }}</span>
              </div>
            </td>
          </tr>
        </template>
      </tbody>

      <!-- Other Mode -->
      <tbody v-show="ownerData.node.mode !== 'systemSetting'">
        <tr v-for="param in parameterGroups" :key="param.id">
          <td class="param-name">
            <span class="indent-20">{{ param.name }}</span>
          </td>

          <td :class="['value-col', cellClass(param.value)]">
            <div class="cell">
              <template v-if="!editStates[param.id]?.editing">
                <span class="cell-text">{{ displayValue(param.value) }}</span>
                <i
                  class="fa-solid fa-pen cell-icon"
                  @click="enterEdit(param)"
                  title="Edit"
                ></i>
              </template>
              <template v-else>
                <input
                  v-model="editStates[param.id].tempValue"
                  class="cell-input"
                />
                <span class="cell-icons">
                  <i
                    class="fa-solid fa-check"
                    @click="requestSave(param)"
                    title="Save"
                  ></i>
                  <i
                    class="fa-solid fa-x"
                    @click="cancelEdit(param)"
                    title="Cancel"
                  ></i>
                </span>
              </template>
            </div>
          </td>

          <td :class="cellClass(param.unit)">
            <div class="cell">
              <span class="cell-text">{{ displayValue(param.unit) }}</span>
            </div>
          </td>
          <td :class="cellClass(param.minVal)">
            <div class="cell">
              <span class="cell-text">{{ displayValue(param.minVal) }}</span>
            </div>
          </td>
          <td :class="cellClass(param.maxVal)">
            <div class="cell">
              <span class="cell-text">{{ displayValue(param.maxVal) }}</span>
            </div>
          </td>
          <td :class="cellClass(param.description)">
            <div class="cell">
              <span class="cell-text">{{
                displayValue(param.description)
              }}</span>
            </div>
          </td>
        </tr>
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
export default {
  name: "SystemSettingTab",
  props: {
    ownerData: { type: Object, required: true },
    expandedGroup: { type: String, default: null },
  },
  data() {
    return {
      editStates: {},
      confirmDialogVisible: false,
      confirmTargetParam: null,
    };
  },
  computed: {
    parameterGroups() {
      return this.ownerData.node?.children || [];
    },
    parentName() {
      const node = this.ownerData?.node || {};
      const parentArr = node.parentArr || [];
      if (parentArr.length >= 1) {
        const last = parentArr[parentArr.length - 1];
        return last.name || last.parent || "(unnamed parent)";
      }
      if (this.ownerData.parent?.name) return this.ownerData.parent.name;
      if (node.parentNode?.name) return node.parentNode.name;
      return "(no parent)";
    },
  },
  methods: {
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
    console.log("Mounted with ownerData:", this.ownerData);
  },
};
</script>

<style scoped>
.param-row .indent-20 {
  display: inline-block;
  margin-left: 20px;
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
