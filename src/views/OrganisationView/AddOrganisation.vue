<template>
  <div class="add-organisation">
    <div class="header">
      <h3>Add Organisation</h3>
      <span class="hint">for {{ ownerName || "selected node" }}</span>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="org-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Owner ID" prop="ownerId">
            <el-input v-model="form.ownerId" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Tax Code" prop="taxCode">
            <el-input v-model="form.taxCode" placeholder="Enter tax code" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Name" prop="name">
            <el-input v-model="form.name" placeholder="Enter name" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Alias Name" prop="aliasName">
            <el-input v-model="form.aliasName" placeholder="Enter alias name" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Description" prop="description">
            <el-input
              type="textarea"
              :rows="3"
              v-model="form.description"
              placeholder="Enter description"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Parent Organisation" prop="parentOrganisation">
            <el-input
              v-model="form.parentOrganisation"
              placeholder="Enter parent organisation"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Street Address" prop="streetAddress">
            <el-input
              v-model="form.streetAddress"
              placeholder="Enter street address"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Postal Address" prop="postalAddress">
            <el-input
              v-model="form.postalAddress"
              placeholder="Enter postal address"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Electronic Address" prop="electronicAddress">
            <el-input
              v-model="form.electronicAddress"
              placeholder="Enter electronic address"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Address" prop="address">
            <el-input v-model="form.address" placeholder="Enter address" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="City" prop="city">
            <el-input v-model="form.city" placeholder="Enter city" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="State / Province" prop="stateProvince">
            <el-input
              v-model="form.stateProvince"
              placeholder="Enter state / province"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Country" prop="country">
            <el-input v-model="form.country" placeholder="Enter country" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Phone" prop="phone">
            <el-input v-model="form.phone" placeholder="Enter phone" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Company Fax" prop="cfax">
            <el-input v-model="form.cfax" placeholder="Enter fax" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Company Email" prop="cemail">
            <el-input v-model="form.cemail" placeholder="Enter company email" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>Contact Person</el-divider>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Person Name" prop="personName">
            <el-input v-model="form.personName" placeholder="Enter person name" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Department" prop="department">
            <el-input v-model="form.department" placeholder="Enter department" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Position" prop="position">
            <el-input v-model="form.position" placeholder="Enter position" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Phone 1" prop="phone1">
            <el-input v-model="form.phone1" placeholder="Enter phone 1" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Phone 2" prop="phone2">
            <el-input v-model="form.phone2" placeholder="Enter phone 2" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Contact Fax" prop="cpFax">
            <el-input v-model="form.cpFax" placeholder="Enter fax" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Contact Email" prop="cpEmail">
            <el-input v-model="form.cpEmail" placeholder="Enter email" />
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
import { createOrganisation } from "@/api/organisation";

export default {
  name: "AddOrganisation",
  props: {
    ownerData: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      submitting: false,
      form: this.initialForm(),
      rules: {
        ownerId: [{ required: true, message: "Owner ID is required", trigger: "blur" }],
        name: [{ required: true, message: "Name is required", trigger: "blur" }],
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
        this.form.ownerId = newVal || "";
      },
      immediate: true,
    },
  },
  methods: {
    initialForm() {
      return {
        ownerId: "",
        taxCode: "",
        name: "",
        aliasName: "",
        description: "",
        parentOrganisation: "",
        streetAddress: "",
        postalAddress: "",
        electronicAddress: "",
        address: "",
        city: "",
        stateProvince: "",
        country: "",
        phone: "",
        personName: "",
        phone1: "",
        phone2: "",
        cpFax: "",
        cpEmail: "",
        department: "",
        position: "",
        cfax: "",
        cemail: "",
      };
    },
    resetForm() {
      const base = this.initialForm();
      base.ownerId = this.ownerId || "";
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
            ownerId: Number(this.ownerId),
            taxCode: toNull(this.form.taxCode),
            name: toNull(this.form.name),
            aliasName: toNull(this.form.aliasName),
            description: toNull(this.form.description),
            parentOrganisation: toNull(this.form.parentOrganisation),
            streetAddress: toNull(this.form.streetAddress),
            postalAddress: toNull(this.form.postalAddress),
            electronicAddress: toNull(this.form.electronicAddress),
            address: toNull(this.form.address),
            city: toNull(this.form.city),
            stateProvince: toNull(this.form.stateProvince),
            country: toNull(this.form.country),
            phone: toNull(this.form.phone),
            personName: toNull(this.form.personName),
            phone1: toNull(this.form.phone1),
            phone2: toNull(this.form.phone2),
            cpFax: toNull(this.form.cpFax),
            cpEmail: toNull(this.form.cpEmail),
            department: toNull(this.form.department),
            position: toNull(this.form.position),
            cfax: toNull(this.form.cfax),
            cemail: toNull(this.form.cemail),
          };
          console.debug("createOrganisation payload", payload);
          await createOrganisation(payload);
          this.$message?.success?.("Organisation created successfully");
          this.$emit("refresh-tree");
          this.resetForm();
        } catch (error) {
          console.error("Create organisation failed:", error?.response || error);
          const errMsg =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to create organisation";
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
.add-organisation {
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
.org-form {
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
