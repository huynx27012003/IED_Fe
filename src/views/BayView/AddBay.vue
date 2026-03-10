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
      <el-form-item label="Voltage Level ID">
        <el-input v-model="form.voltageLevelId" disabled></el-input>
      </el-form-item>

      <el-form-item label="Name" prop="name">
        <el-input v-model="form.name" placeholder="Enter bay name"></el-input>
      </el-form-item>

      <el-form-item label="Alias Name" prop="aliasName">
        <el-input v-model="form.aliasName" placeholder="Enter alias name"></el-input>
      </el-form-item>

      <el-form-item label="Description" prop="description">
        <el-input
          type="textarea"
          v-model="form.description"
          placeholder="Enter description"
        ></el-input>
      </el-form-item>

      <el-form-item label="Breaker Configuration" prop="breakerConfiguration">
        <el-select v-model="form.breakerConfiguration" placeholder="Select configuration">
          <el-option label="Breaker And A Half" value="breakerAndAHalf"></el-option>
          <el-option label="Double Breaker" value="doubleBreaker"></el-option>
          <el-option label="No Breaker" value="noBreaker"></el-option>
          <el-option label="Single Breaker" value="singleBreaker"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="Bus Bar Configuration" prop="busBarConfiguration">
        <el-select v-model="form.busBarConfiguration" placeholder="Select configuration">
          <el-option label="Double Bus" value="doubleBus"></el-option>
          <el-option label="Main With Transfer" value="mainWithTransfer"></el-option>
          <el-option label="Ring Bus" value="ringBus"></el-option>
          <el-option label="Single Bus" value="singBus"></el-option> 
        </el-select>
      </el-form-item>

      <el-form-item label="Energy Measurement">
        <el-checkbox v-model="form.bayEnergyMeasFlag">Enable</el-checkbox>
      </el-form-item>

      <el-form-item label="Power Measurement">
        <el-checkbox v-model="form.bayPowerMeasFlag">Enable</el-checkbox>
      </el-form-item>

      <el-form-item>
        <div class="actions">
          <el-button @click="$emit('cancel')">Cancel</el-button>
          <el-button type="primary" @click="submitForm">Create</el-button>
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
          { required: true, message: "Please enter bay name", trigger: "blur" },
        ],
        breakerConfiguration: [
            { required: true, message: "Please select breaker configuration", trigger: "change" }
        ],
        busBarConfiguration: [
            { required: true, message: "Please select bus bar configuration", trigger: "change" }
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
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          try {
            await createBay(this.form);
            this.$message.success("Bay created successfully");
            this.$emit("success");
            this.resetForm();
          } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Failed to create bay";
            this.$message.error(msg);
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
