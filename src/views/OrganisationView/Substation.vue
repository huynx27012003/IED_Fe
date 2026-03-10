<template>
  <div id="substation-view">
    <el-row :gutter="20" id="main-content">
      <el-col :span="12" class="col-content">
        <div class="block">
          <div class="block-title">Substation</div>
          <div v-if="isLoading" class="loading-text">Loading substation...</div>
          <div v-else>
            <el-descriptions :column="1" size="small" border class="substation-descriptions">
              <el-descriptions-item
                v-for="item in substationFields"
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
          <div class="block-title">Details</div>
          <el-descriptions :column="1" size="small" border class="substation-descriptions">
            <el-descriptions-item
              v-for="item in detailFields"
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
import { getSubstationById } from "@/api/substation";

const defaultSubstation = () => ({
  mrid: "",
  aliasName: "",
  description: "",
  name: "",
  assetDataSheet: "",
  generation: "",
  industry: "",
  owner: "",
});

export default {
  name: "SubstationView",
  props: {
    ownerData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      substation: defaultSubstation(),
      isLoading: false,
      errorMessage: "",
    };
  },
  computed: {
    substationId() {
      return (
        this.ownerData?.node?.id ??
        this.ownerData?.node?.mrid ??
        this.ownerData?.mrid ??
        this.ownerData?.id ??
        null
      );
    },
    substationFields() {
      return this.buildFields([
        ["mrid", "MRID"],
        ["name", "Name"],
        ["aliasName", "Alias Name"],
        ["description", "Description"],
      ]);
    },
    detailFields() {
      return this.buildFields([
        ["assetDataSheet", "Asset Data Sheet"],
        ["generation", "Generation"],
        ["industry", "Industry"],
        ["owner", "Owner"],
      ]);
    },
  },
  watch: {
    substationId: {
      handler(id) {
        this.fetchSubstation(id);
      },
      immediate: true,
    },
  },
  methods: {
    buildFields(entries) {
      return entries.map(([key, label]) => ({
        key,
        label,
        value: this.substation?.[key] ?? "",
      }));
    },
    normalizeSubstation(payload = {}) {
      const safe = (v) => (v === null || v === undefined ? "" : v);
      const sub = payload || {};
      return {
        mrid: safe(sub.mrid ?? sub.id),
        aliasName: safe(sub.aliasName),
        description: safe(sub.description),
        name: safe(sub.name),
        assetDataSheet: safe(sub.assetDataSheet),
        generation: safe(sub.generation),
        industry: safe(sub.industry),
        owner: safe(sub.owner),
      };
    },
    async fetchSubstation(id) {
      if (id === null || id === undefined || id === "") {
        this.substation = defaultSubstation();
        return;
      }
      this.isLoading = true;
      this.errorMessage = "";
      try {
        const response = await getSubstationById(id);
        const data = response?.data ?? response;
        this.substation = this.normalizeSubstation(data);
      } catch (error) {
        console.error("Failed to load substation info:", error);
        this.errorMessage = "Unable to load substation information.";
        this.substation = defaultSubstation();
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
#substation-view {
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

.substation-descriptions :deep(.el-descriptions__label) {
  width: 140px;
  min-width: 140px;
  max-width: 140px;
}

.substation-descriptions :deep(.el-descriptions__content) {
  width: auto;
}
</style>
