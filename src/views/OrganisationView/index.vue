<template>
  <div id="location">
    <el-row :gutter="20" id="main-content">
      <el-col :span="12" class="col-content">
        <div class="block">
          <div class="block-title">Organisation</div>
          <div v-if="isLoading" class="loading-text">Loading organisation...</div>
          <div v-else>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item
                v-for="item in companyFields"
                :key="item.key"
                :label="item.label"
              >
                {{ item.value }}
              </el-descriptions-item>
            </el-descriptions>
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          </div>
        </div>
      </el-col>

      <el-col :span="12" class="col-content">
        <div class="block">
          <div class="block-title">Contact Person</div>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item
              v-for="item in contactFields"
              :key="item.key"
              :label="item.label"
            >
              {{ item.value }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getOrganisationById } from "@/api/organisation";

const defaultOrganisation = () => ({
  mrid: null,
  aliasName: "",
  description: "",
  name: "",
  taxCode: "",
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
});

export default {
  name: "OrganisationView",
  props: {
    ownerData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      organisation: defaultOrganisation(),
      isLoading: false,
      errorMessage: "",
    };
  },
  computed: {
    organisationId() {
      return (
        this.ownerData?.node?.id ??
        this.ownerData?.node?.mrid ??
        this.ownerData?.mrid ??
        this.ownerData?.id ??
        null
      );
    },
    companyFields() {
      return this.buildFields([
        ["mrid", "MRID"],
        ["name", "Name"],
        ["aliasName", "Alias Name"],
        ["description", "Description"],
        ["taxCode", "Tax Code"],
        ["parentOrganisation", "Parent Organisation"],
        ["streetAddress", "Street Address"],
        ["postalAddress", "Postal Address"],
        ["electronicAddress", "Electronic Address"],
        ["address", "Address"],
        ["city", "City"],
        ["stateProvince", "State / Province"],
        ["country", "Country"],
        ["phone", "Phone"],
        ["cfax", "Company Fax"],
        ["cemail", "Company Email"],
      ]);
    },
    contactFields() {
      return this.buildFields([
        ["personName", "Person Name"],
        ["phone1", "Phone 1"],
        ["phone2", "Phone 2"],
        ["cpFax", "Contact Fax"],
        ["cpEmail", "Contact Email"],
        ["department", "Department"],
        ["position", "Position"],
      ]);
    },
  },
  watch: {
    organisationId: {
      handler(id) {
        this.fetchOrganisation(id);
      },
      immediate: true,
    },
  },
  methods: {
    buildFields(entries) {
      return entries
        .map(([key, label]) => ({
          key,
          label,
          value: this.organisation?.[key] ?? "",
        }));
    },
    normalizeOrganisation(payload = {}) {
      const safe = (v) => (v === null || v === undefined ? "" : v);
      const org = payload || {};
      return {
        mrid: org.mrid ?? org.id ?? null,
        aliasName: safe(org.aliasName),
        description: safe(org.description),
        name: safe(org.name),
        taxCode: safe(org.taxCode),
        parentOrganisation: safe(org.parentOrganisation),
        streetAddress: safe(org.streetAddress),
        postalAddress: safe(org.postalAddress),
        electronicAddress: safe(org.electronicAddress),
        address: safe(org.address),
        city: safe(org.city),
        stateProvince: safe(org.stateProvince),
        country: safe(org.country),
        phone: safe(org.phone),
        personName: safe(org.personName),
        phone1: safe(org.phone1),
        phone2: safe(org.phone2),
        cpFax: safe(org.cpFax),
        cpEmail: safe(org.cpEmail),
        department: safe(org.department),
        position: safe(org.position),
        cfax: safe(org.cfax),
        cemail: safe(org.cemail),
      };
    },
    async fetchOrganisation(id) {
      if (!id) {
        this.organisation = defaultOrganisation();
        return;
      }
      this.isLoading = true;
      this.errorMessage = "";
      try {
        const response = await getOrganisationById(id);
        const data = response?.data ?? response;
        this.organisation = this.normalizeOrganisation(data);
      } catch (error) {
        console.error("Failed to load organisation info:", error);
        this.errorMessage = "Unable to load organisation information.";
        this.organisation = defaultOrganisation();
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
#location {
  padding: 15px;
}
.block {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 15px;
  background: #fff;
}
.block-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
  color: #333;
}
.loading-text {
  color: #666;
  font-size: 13px;
}
.error-message {
  margin-top: 8px;
  color: #d9534f;
  font-size: 12px;
}
</style>
