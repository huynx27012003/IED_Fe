<template>
  <div class="system-setting-tab">
    <h3>{{ ownerData.id }}</h3>
    <h3>System Setting: {{ ownerData.node.name }}</h3>
    <h3>{{ ownerData.node.mode }}</h3>

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
      <tbody v-show="ownerData.node.name === 'System Setting'">
        <template v-for="group in parameterGroups" :key="group.id">
          <tr class="group-header">
            <td :colspan="6">{{ group.name }}</td>
          </tr>
          <tr v-for="param in group.children" :key="param.id">
            <td>{{ param.name }}</td>
            <td>
              <div v-if="!editStates[param.id]?.editing">
                {{ param.value }}
                <i
                  class="fa-solid fa-pen"
                  @click="enterEdit(param)"
                  style="cursor: pointer; margin-left: 10px"
                ></i>
              </div>
              <div v-else>
                <input
                  v-model="editStates[param.id].tempValue"
                  style="width: 60px; margin-right: 6px"
                />
                <i
                  class="fa-solid fa-check"
                  @click="requestSave(param)"
                  style="cursor: pointer; margin: 6px; color: #01d552"
                ></i>
                <i
                  class="fa-solid fa-x"
                  @click="cancelEdit(param)"
                  style="cursor: pointer; color: #ff0000; margin: 6px"
                ></i>
              </div>
            </td>
            <td>{{ param.unit }}</td>
            <td>{{ param.minVal }}</td>
            <td>{{ param.maxVal }}</td>
            <td>{{ param.description }}</td>
          </tr>
        </template>
      </tbody>

      <!-- Other Mode -->
      <tbody v-show="ownerData.node.name !== 'System Setting'">
        <tr v-for="param in parameterGroups" :key="param.id">
          <td>{{ param.name }}</td>
          <td>
            <div v-if="!editStates[param.id]?.editing">
              {{ param.value }}
              <i
                class="fa-solid fa-pen"
                @click="enterEdit(param)"
                style="cursor: pointer; margin-left: 6px"
              ></i>
            </div>
            <div v-else>
              <input
                v-model="editStates[param.id].tempValue"
                style="width: 60px; margin-right: 6px"
              />
              <i
                class="fa-solid fa-check"
                @click="requestSave(param)"
                style="cursor: pointer; margin-right: 4px; color: #01d552"
              ></i>
              <i
                class="fa-solid fa-x"
                @click="cancelEdit(param)"
                style="cursor: pointer; color: #ff0000"
              ></i>
            </div>
          </td>
          <td>{{ param.unit }}</td>
          <td>{{ param.minVal }}</td>
          <td>{{ param.maxVal }}</td>
          <td>{{ param.description }}</td>
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
    ownerData: {
      type: Object,
      required: true,
    },
    expandedGroup: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      editStates: {}, // { paramId: { editing: true, tempValue: "..." } }
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

      if (this.ownerData.parent?.name) {
        return this.ownerData.parent.name;
      }

      if (node.parentNode?.name) {
        return node.parentNode.name;
      }

      return "(no parent)";
    },
  },
  methods: {
    enterEdit(param) {
      this.editStates[param.id] = {
        editing: true,
        tempValue: param.value,
      };
    },
    cancelEdit(param) {
      this.editStates[param.id] = {
        editing: false,
        tempValue: param.value,
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

      this.editStates[param.id] = {
        editing: false,
        tempValue: updatedValue,
      };

      this.confirmDialogVisible = false;
      this.confirmTargetParam = null;
    },
    cancelDialog() {
      this.confirmDialogVisible = false;
      this.confirmTargetParam = null;
    },
  },
  mounted() {
    console.log("✅ Mounted with ownerData:", this.ownerData);
  },
};
</script>

<style scoped>
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
.group-header {
  background-color: #d9e3f0;
  font-weight: bold;
}
thead {
  background-color: #e1e1e1;
}
.group-header td {
  background-color: #eaf4ff;
}
.value-col {
  width: 60px;
  max-width: 60px;
  white-space: nowrap;
}
.parameter-table td:nth-child(2) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
