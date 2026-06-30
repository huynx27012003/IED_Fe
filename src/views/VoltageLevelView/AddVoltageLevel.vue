<template>
  <div class="add-voltage-level">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="vl-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('substationId')" prop="subId">
            <el-input v-model="form.subId" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('name')" prop="name">
            <el-input v-model="form.name" :placeholder="$tUi('enterName')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('aliasName')" prop="aliasName">
            <el-input v-model="form.aliasName" :placeholder="$tUi('enterAliasName')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('description')" prop="description">
            <el-input
              type="textarea"
              :rows="1"
              v-model="form.description"
              :placeholder="$tUi('enterDescription')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="actions">
        <el-button @click="resetForm" :disabled="submitting">{{ $tUi('reset') }}</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
          :disabled="submitting"
        >
          {{ $tUi('create') }}
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
        subId: [{ required: true, message: this.$tUi("substationIdRequired"), trigger: "blur" }],
        name: [{ required: true, message: this.$tUi("nameRequired"), trigger: "blur" }],
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
      if (this.submitting || !this.$refs.formRef) return;
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
          await createVoltageLevel(payload);
          this.$message?.success?.(this.$tUi("voltageLevelCreatedSuccess"));
          this.$emit("refresh-tree");
          this.resetForm();
        } catch (error) {
          this.$notifyApiError?.(error, this.$tUi("failedToCreateVoltageLevel"));
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
