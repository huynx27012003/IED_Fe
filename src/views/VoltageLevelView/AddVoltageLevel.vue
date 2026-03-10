<template>
  <div class="add-voltage-level">
    <div class="header">
      <h3>Add Voltage Level</h3>
      <span class="hint">for {{ ownerName || "selected node" }}</span>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="vl-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Substation ID" prop="subId">
            <el-input v-model="form.subId" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Name" prop="name">
            <el-input v-model="form.name" placeholder="Enter name" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Alias Name" prop="aliasName">
            <el-input v-model="form.aliasName" placeholder="Enter alias name" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Description" prop="description">
            <el-input
              type="textarea"
              :rows="1"
              v-model="form.description"
              placeholder="Enter description"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="actions">
        <el-button @click="resetForm" :disabled="submitting">Reset</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
        >
          Create
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import { createVoltageLevel } from "@/api/voltagelevel";

export default {
  name: "AddVoltageLevel",
  props: {
    ownerData: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      submitting: false,
      form: this.initialForm(),
      rules: {
        subId: [{ required: true, message: "Substation ID is required", trigger: "blur" }],
        name: [{ required: true, message: "Name is required", trigger: "blur" }],
      },
    };
  },
  computed: {
    subId() {
      return (
        this.ownerData?.node?.id ??
        this.ownerData?.node?.mrid ??
        this.ownerData?.mrid ??
        this.ownerData?.id ??
        ""
      );
    },
    ownerName() {
      return (
        this.ownerData?.node?.name ??
        this.ownerData?.name ??
        this.ownerData?.label ??
        ""
      );
    },
  },
  watch: {
    subId: {
      handler(newVal) {
        this.form.subId = newVal || "";
      },
      immediate: true,
    },
  },
  methods: {
    initialForm() {
      return {
        subId: "",
        name: "",
        aliasName: "",
        description: "",
      };
    },
    resetForm() {
      const base = this.initialForm();
      base.subId = this.subId || "";
      this.form = { ...base };
      if (this.$refs.formRef) {
        this.$refs.formRef.clearValidate();
      }
    },
    async handleSubmit() {
      if (!this.$refs.formRef) return;
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return;
        this.submitting = true;
        try {
          const toNull = (v) =>
            v === undefined || v === null || String(v).trim() === "" ? null : v;
          const payload = {
            subId: Number(this.subId),
            name: toNull(this.form.name),
            aliasName: toNull(this.form.aliasName),
            description: toNull(this.form.description),
          };
          console.debug("createVoltageLevel payload", payload);
          await createVoltageLevel(payload);
          this.$message?.success?.("Voltage Level created successfully");
          this.$emit("refresh-tree");
          this.resetForm();
        } catch (error) {
          console.error("Create voltage level failed:", error?.response || error);
          const errMsg =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to create voltage level";
          this.$message?.error?.(errMsg);
        } finally {
          this.submitting = false;
        }
      });
    },
  },
};
</script>

<style scoped>
.add-voltage-level {
  padding: 16px;
}
.header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.header h3 {
  margin: 0;
}
.hint {
  color: #666;
  font-size: 12px;
}
.vl-form {
  background: #fff;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
</style>
