<template>
  <div class="add-substation">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="sub-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('ownerId') + ' (orId)'" prop="orId">
            <el-input v-model="form.orId" disabled />
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
          <el-form-item :label="$tUi('industry')" prop="industry">
            <el-input v-model="form.industry" :placeholder="$tUi('enterIndustry')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="$tUi('description')" prop="description">
        <el-input
          type="textarea"
          :rows="3"
          v-model="form.description"
          :placeholder="$tUi('enterDescription')"
        />
      </el-form-item>

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
import { createSubstation } from "@/api/substation";

export default {
  name: "AddSubstation",
  props: {
    ownerData: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      submitting: false,
      form: this.initialForm(),
      rules: {
        orId: [{ required: true, message: this.$tUi('substationIdRequired'), trigger: "blur" }],
        name: [{ required: true, message: this.$tUi('nameRequired'), trigger: "blur" }],
      },
    };
  },
  computed: {
    ownerId() {
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
    ownerId: {
      handler(newVal) {
        this.form.orId = newVal || "";
      },
      immediate: true,
    },
  },
  methods: {
    initialForm() {
      return {
        orId: "",
        name: "",
        aliasName: "",
        industry: "",
        description: "",
      };
    },
    resetForm() {
      const base = this.initialForm();
      base.orId = this.ownerId || "";
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
          const payload = { ...this.form, orId: Number(this.ownerId) };
          await createSubstation(payload);
          this.$message?.success?.(this.$tUi('substationCreatedSuccess'));
          this.$emit("refresh-tree");
          this.resetForm();
        } catch (error) {
          this.$notifyApiError?.(error, "Failed to create substation");
        } finally {
          this.submitting = false;
        }
      });
    },
  },
};
</script>

<style scoped>
.add-substation {
  padding: 16px;
}
.sub-form {
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
