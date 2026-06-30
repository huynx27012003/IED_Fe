<template>
  <div class="add-bay-container">
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="170px"
      v-loading="loading"
    >
      <!-- Substation ID (Hidden/Read-only display for debug/verification) -->
      <!-- Only show if it's set to something other than 0 to avoid confusion, or hidden entirely -->
      
      <!-- Voltage Level ID (Read-only) -->
      <el-form-item :label="$tUi('voltageLevelId')">
        <el-input v-model="form.voltageLevelId" disabled></el-input>
      </el-form-item>

      <el-form-item :label="$tUi('name')" prop="name">
        <el-input v-model="form.name" :placeholder="$tUi('enterBayName')"></el-input>
      </el-form-item>

      <el-form-item :label="$tUi('aliasName')" prop="aliasName">
        <el-input v-model="form.aliasName" :placeholder="$tUi('enterAliasName')"></el-input>
      </el-form-item>

      <el-form-item :label="$tUi('description')" prop="description">
        <el-input
          type="textarea"
          v-model="form.description"
          :placeholder="$tUi('enterDescription')"
        ></el-input>
      </el-form-item>

      <el-form-item :label="$tUi('breakerConfiguration')" prop="breakerConfiguration">
        <el-select v-model="form.breakerConfiguration" :placeholder="$tUi('selectConfiguration')">
          <el-option :label="$tUi('breakerAndAHalf')" value="breakerAndAHalf"></el-option>
          <el-option :label="$tUi('doubleBreaker')" value="doubleBreaker"></el-option>
          <el-option :label="$tUi('noBreaker')" value="noBreaker"></el-option>
          <el-option :label="$tUi('singleBreaker')" value="singleBreaker"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item :label="$tUi('busBarConfiguration')" prop="busBarConfiguration">
        <el-select v-model="form.busBarConfiguration" :placeholder="$tUi('selectConfiguration')">
          <el-option :label="$tUi('doubleBus')" value="doubleBus"></el-option>
          <el-option :label="$tUi('mainWithTransfer')" value="mainWithTransfer"></el-option>
          <el-option :label="$tUi('ringBus')" value="ringBus"></el-option>
          <el-option :label="$tUi('singleBus')" value="singBus"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item :label="$tUi('energyMeasurement')">
        <el-checkbox v-model="form.bayEnergyMeasFlag">{{ $tUi('enable') }}</el-checkbox>
      </el-form-item>

      <el-form-item :label="$tUi('powerMeasurement')">
        <el-checkbox v-model="form.bayPowerMeasFlag">{{ $tUi('enable') }}</el-checkbox>
      </el-form-item>

      <el-form-item>
        <div class="actions">
          <el-button @click="$emit('cancel')" :disabled="loading">{{ $tUi('cancel') }}</el-button>
          <el-button type="primary" @click="submitForm" :loading="loading" :disabled="loading">
            {{ $tUi('create') }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { createBay } from "@/api/bay";

export default {
  name: "AddBay",
  props: {
    nodeData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      loading: false,
      form: {
        name: "",
        aliasName: "",
        description: "",
        breakerConfiguration: "singleBreaker", // Default reasonable value
        busBarConfiguration: "singBus", // Default reasonable value
        substationId: 0,
        voltageLevelId: 0,
        assetDatasheetId: 0,
        bayEnergyMeasFlag: true,
        bayPowerMeasFlag: true,
      },
      rules: {
        name: [
          { required: true, message: this.$tUi("enterBayName"), trigger: "blur" },
        ],
        breakerConfiguration: [
            { required: true, message: this.$tUi("selectBreakerConfiguration"), trigger: "change" }
        ],
        busBarConfiguration: [
            { required: true, message: this.$tUi("selectBusBarConfiguration"), trigger: "change" }
        ]
      },
    };
  },
  watch: {
    nodeData: {
      immediate: true,
      handler(val) {
        if (val) {
          // If adding under a Voltage Level, voltageLevelId is the ID of the selected node
          if (val.mode === 'voltageLevel') {
              this.form.voltageLevelId = val.id;
              this.form.substationId = 0; // Default or maybe derived if needed, but payload says 0 is ok
          } else if (val.mode === 'substation') {
               // If adding directly under substation, logic might differ but user said "Voltage Level or Substation".
               // Usually Bay is under Voltage Level.
               // If context is substation, we might need a voltage level dropdown or pass 0.
               // Assuming strictly under Voltage Level for now based on context menu structure.
               this.form.substationId = val.id;
          }
        }
      },
    },
  },
  methods: {
    async submitForm() {
      if (this.loading) return;
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          try {
            await createBay(this.form);
            this.$message.success(this.$tUi("bayCreatedSuccess"));
            this.$emit("success");
            this.resetForm();
          } catch (error) {
            this.$notifyApiError?.(error, this.$tUi("failedToCreateBay"));
          } finally {
            this.loading = false;
          }
        }
      });
    },
    resetForm() {
      this.$refs.form.resetFields();
      this.form.aliasName = "";
      this.form.description = "";
      this.form.bayEnergyMeasFlag = true;
      this.form.bayPowerMeasFlag = true;
    },
  },
};
</script>

<style scoped>
.add-bay-container {
  padding: 20px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
