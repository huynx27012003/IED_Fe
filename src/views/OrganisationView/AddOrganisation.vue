<template>
  <div class="add-organisation">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="org-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('ownerId')" prop="ownerId">
            <el-input v-model="form.ownerId" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('taxCode')" prop="taxCode">
            <el-input v-model="form.taxCode" :placeholder="$tUi('enterTaxCode')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('name')" prop="name">
            <el-input v-model="form.name" :placeholder="$tUi('enterName')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('aliasName')" prop="aliasName">
            <el-input v-model="form.aliasName" :placeholder="$tUi('enterAliasName')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('description')" prop="description">
            <el-input
              type="textarea"
              :rows="3"
              v-model="form.description"
              :placeholder="$tUi('enterDescription')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('parentOrganisation')" prop="parentOrganisation">
            <el-input
              v-model="form.parentOrganisation"
              :placeholder="$tUi('enterParentOrg')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('streetAddress')" prop="streetAddress">
            <el-input
              v-model="form.streetAddress"
              :placeholder="$tUi('enterStreetAddress')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('postalAddress')" prop="postalAddress">
            <el-input
              v-model="form.postalAddress"
              :placeholder="$tUi('enterPostalAddress')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('electronicAddress')" prop="electronicAddress">
            <el-input
              v-model="form.electronicAddress"
              :placeholder="$tUi('enterElectronicAddress')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('address')" prop="address">
            <el-input v-model="form.address" :placeholder="$tUi('enterAddress')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('city')" prop="city">
            <el-input v-model="form.city" :placeholder="$tUi('enterCity')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('stateProvince')" prop="stateProvince">
            <el-input
              v-model="form.stateProvince"
              :placeholder="$tUi('enterStateProvince')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('country')" prop="country">
            <el-input v-model="form.country" :placeholder="$tUi('enterCountry')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('phone')" prop="phone">
            <el-input v-model="form.phone" :placeholder="$tUi('enterPhone')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('companyFax')" prop="cfax">
            <el-input v-model="form.cfax" :placeholder="$tUi('enterPhone')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('companyEmail')" prop="cemail">
            <el-input v-model="form.cemail" :placeholder="$tUi('enterAliasName')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>{{ $tUi('contactPerson') }}</el-divider>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('personName')" prop="personName">
            <el-input v-model="form.personName" :placeholder="$tUi('enterName')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('department')" prop="department">
            <el-input v-model="form.department" :placeholder="$tUi('enterDescription')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('position')" prop="position">
            <el-input v-model="form.position" :placeholder="$tUi('enterName')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('phone1')" prop="phone1">
            <el-input v-model="form.phone1" :placeholder="$tUi('enterPhone')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('phone2')" prop="phone2">
            <el-input v-model="form.phone2" :placeholder="$tUi('enterPhone')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$tUi('contactFax')" prop="cpFax">
            <el-input v-model="form.cpFax" :placeholder="$tUi('enterPhone')" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="$tUi('contactEmail')" prop="cpEmail">
            <el-input v-model="form.cpEmail" :placeholder="$tUi('enterAliasName')" />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="actions">
        <el-button @click="resetForm" :disabled="submitting">{{ $tUi('reset') }}</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
        >
          {{ $tUi('create') }}
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
            ownerId:
              this.ownerId === undefined ||
              this.ownerId === null ||
              String(this.ownerId).trim() === ""
                ? null
                : Number(this.ownerId),
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
          await createOrganisation(payload);
          this.$message?.success?.(this.$tUi('organisationCreatedSuccess'));
          this.$emit("refresh-tree");
          this.resetForm();
        } catch (error) {
          this.$notifyApiError?.(error, "Failed to create organisation");
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
