<template>
  <div class="system-setting-tab">
    <el-form
      :model="deviceForm"
      :rules="rules"
      ref="deviceForm"
      label-width="150px"
    >
      <el-form-item label="Alias Name" prop="aliasName">
        <el-input
          v-model="deviceForm.aliasName"
          placeholder="Enter alias name"
        />
      </el-form-item>
      <el-form-item label="Name" prop="name">
        <el-input v-model="deviceForm.name" placeholder="Enter device name" />
      </el-form-item>
      <el-form-item label="Description" prop="description">
        <el-input
          v-model="deviceForm.description"
          type="textarea"
          placeholder="Enter description"
        />
      </el-form-item>
      <el-form-item label="Vendor" prop="vendor">
        <el-select
          v-model="deviceForm.vendor"
          placeholder="Select vendor"
          style="width: 100%"
          @change="onVendorChange"
        >
          <el-option
            v-for="vendor in vendors"
            :key="vendor.code"
            :label="vendor.name"
            :value="vendor.code"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Device Type" prop="deviceType">
        <el-select
          v-model="deviceForm.deviceType"
          placeholder="Select device type"
          style="width: 100%"
          @change="onDeviceTypeChange"
          :disabled="!deviceForm.vendor"
        >
          <el-option
            v-for="type in deviceTypes"
            :key="type.code"
            :label="type.name"
            :value="type.code"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Model" prop="model">
        <el-select
          v-model="deviceForm.model"
          placeholder="Select model"
          style="width: 100%"
          :disabled="
            !deviceForm.vendor || !deviceForm.deviceType || models.length === 0
          "
          :loading="modelLoading"
        >
          <!-- Fallback to code if name is missing -->
          <el-option
            v-for="model in models"
            :key="model"
            :label="model"
            :value="model"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Role" prop="role">
        <el-input
          v-model="deviceForm.role"
          placeholder="Role (auto-filled)"
          disabled
        />
      </el-form-item>
      <!-- <el-form-item label="Asset Datasheet" prop="assetDatasheet">
        <el-input-number v-model="deviceForm.assetDatasheet" :min="0" />
      </el-form-item> -->
      <!-- <el-form-item label="Bay ID" prop="bayId">
        <el-input
          v-model="deviceForm.bayId"
          placeholder="Bay ID (auto-filled)"
          disabled
        />
      </el-form-item> -->
      <!-- <el-form-item label="Aggregate" prop="aggregate">
        <el-switch v-model="deviceForm.aggregate" />
      </el-form-item> -->
      <el-form-item label="In Service" prop="inService">
        <el-switch v-model="deviceForm.inService" />
      </el-form-item>
      <!-- <el-form-item label="Normally In Service" prop="normallyInService">
        <el-switch v-model="deviceForm.normallyInService" />
      </el-form-item>
      <el-form-item label="Relay Delay Time" prop="relayDelayTime">
        <el-input-number
          v-model="deviceForm.relayDelayTime"
          :min="0"
          :step="0.1"
        />
      </el-form-item> -->
      <!-- <el-form-item label="Unit Multiplier" prop="unitMultiplier">
        <el-input
          v-model="deviceForm.unitMultiplier"
          placeholder="Enter unit multiplier"
        />
      </el-form-item> -->
      <!-- <el-form-item label="Unit Symbol" prop="unitSymbol">
        <el-input
          v-model="deviceForm.unitSymbol"
          placeholder="Enter unit symbol"
        />
      </el-form-item> -->
      <!-- <el-form-item label="High Limit" prop="highLimit">
        <el-input-number v-model="deviceForm.highLimit" :min="0" :step="0.1" />
      </el-form-item>
      <el-form-item label="Low Limit" prop="lowLimit">
        <el-input-number v-model="deviceForm.lowLimit" :min="0" :step="0.1" />
      </el-form-item> -->
      <!-- <el-form-item label="Power Direction Flag" prop="powerDirectionFlag">
        <el-switch v-model="deviceForm.powerDirectionFlag" />
      </el-form-item> -->
      <el-form-item>
        <el-button type="primary" @click="handleSave">Save</el-button>
        <el-button @click="handleCancel">Cancel</el-button>
      </el-form-item>
    </el-form>
    <el-dialog
      v-model="confirmDialogVisible"
      title="Confirm Save"
      width="30%"
      :before-close="cancelDialog"
    >
      <span>Are you sure you want to save the device?</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialog">Cancel</el-button>
          <el-button type="primary" @click="confirmSave">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  getVendors,
  getDeviceTypes,
  getModel,
  createDevice,
} from "@/api/device";
import { debounce } from "lodash";

export default {
  name: "AddDevice",
  props: {
    ownerData: { type: Object, required: true },
    expandedGroup: { type: String, default: null },
  },
  data() {
    return {
      deviceForm: {
        aliasName: "",
        description: "",
        name: "",
        assetDatasheet: 0,
        bayId: this.ownerData.node?.id || 0,
        aggregate: true,
        inService: true,
        normallyInService: true,
        relayDelayTime: 0.1,
        unitMultiplier: "",
        unitSymbol: "",
        highLimit: 0.1,
        lowLimit: 0.1,
        powerDirectionFlag: true,
        role: "",
        vendor: "",
        deviceType: "",
        model: "",
      },
      rules: {
        aliasName: [
          {
            required: true,
            message: "Please enter alias name",
            trigger: "blur",
          },
        ],
        name: [
          {
            required: true,
            message: "Please enter device name",
            trigger: "blur",
          },
        ],
        vendor: [
          {
            required: true,
            message: "Please select a vendor",
            trigger: "change",
          },
        ],
        deviceType: [
          {
            required: true,
            message: "Please select a device type",
            trigger: "change",
          },
        ],
        model: [
          {
            required: true,
            message: "Please select a model",
            trigger: "change",
          },
        ],
        role: [
          {
            required: true,
            message: "Please select a device type to auto-fill role",
            trigger: "change",
          },
        ],
      },
      vendors: [],
      deviceTypes: [],
      models: [],
      modelLoading: false,
      confirmDialogVisible: false,
      confirmTargetParam: null,
    };
  },
  computed: {
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
  async mounted() {
    this.deviceForm.bayId = this.ownerData.node?.id || 0;
    await Promise.all([this.fetchVendors(), this.fetchDeviceTypes()]);
  },
  watch: {
    "ownerData.node.id"(newId) {
      this.deviceForm.bayId = newId || 0;
    },
  },
  methods: {
    async fetchVendors() {
      try {
        this.vendors = await getVendors();
      } catch (error) {
        this.$message.error("Failed to load vendors");
      }
    },
    async fetchDeviceTypes() {
      try {
        this.deviceTypes = await getDeviceTypes();
      } catch (error) {
        this.$message.error("Failed to load device types");
      }
    },
    fetchModels: debounce(async function () {
      if (!this.deviceForm.vendor || !this.deviceForm.deviceType) {
        this.models = [];
        this.deviceForm.model = "";
        this.modelLoading = false;
        return;
      }
      this.modelLoading = true;
      try {
        const models = await getModel(
          this.deviceForm.vendor,
          this.deviceForm.deviceType
        );
        this.models = Array.isArray(models) ? models : [];
        if (this.models.length === 0) {
          this.$message.warning(
            "No models available for the selected vendor and device type"
          );
          this.deviceForm.model = "";
        } else {
          this.$nextTick(() => {
            this.$forceUpdate(); // Force re-render if needed
          });
        }
      } catch (error) {
        this.$message.error("Failed to load models");
        this.models = [];
        this.deviceForm.model = "";
        console.error("Fetch models error:", error);
      } finally {
        this.modelLoading = false;
      }
    }, 300),
    onVendorChange() {
      this.deviceForm.deviceType = "";
      this.deviceForm.model = "";
      this.deviceForm.role = "";
      this.models = [];
    },
    onDeviceTypeChange() {
      this.deviceForm.model = "";
      this.models = [];
      this.deviceForm.role =
        this.deviceTypes.find(
          (type) => type.code === this.deviceForm.deviceType
        )?.roleCode || "";

      this.fetchModels();
    },
    handleSave() {
      this.$refs.deviceForm.validate(async (valid) => {
        if (valid) {
          this.confirmDialogVisible = true;
        } else {
          this.$message.error("Please fill in all required fields");
        }
      });
    },
    async confirmSave() {
      try {
        const deviceData = {
          ...this.deviceForm,
          type: this.deviceForm.deviceType,
        };

        await createDevice(deviceData);
        this.$message.success("Device created successfully");
        this.resetForm();
        this.confirmDialogVisible = false;
        this.$emit("device-created");
      } catch (error) {
        this.$message.error("Failed to create device");
        this.confirmDialogVisible = false;
        console.error("Create device error:", error);
      }
    },
    handleCancel() {
      this.resetForm();
    },
    cancelDialog() {
      this.confirmDialogVisible = false;
    },
    resetForm() {
      this.deviceForm = {
        aliasName: "",
        description: "",
        name: "",
        assetDatasheet: 0,
        bayId: this.ownerData.node?.id || 0,
        aggregate: true,
        inService: true,
        normallyInService: true,
        relayDelayTime: 0.1,
        unitMultiplier: "",
        unitSymbol: "",
        highLimit: 0.1,
        lowLimit: 0.1,
        powerDirectionFlag: true,
        role: "",
        vendor: "",
        deviceType: "",
        model: "",
      };
      this.models = [];
      this.modelLoading = false;
      this.$refs.deviceForm.resetFields();
    },
  },
};
</script>

<style scoped>
.system-setting-tab {
  padding: 20px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
