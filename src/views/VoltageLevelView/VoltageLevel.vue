<template>
  <div id="voltage-level-view">
    <el-row :gutter="20" id="main-content">
      <el-col :span="12" class="col-content">
        <div class="block">
          <div class="block-title">Voltage Level</div>
          <div v-if="isLoading" class="loading-text">Loading voltage level...</div>
          <div v-else>
            <el-descriptions :column="1" size="small" border class="voltage-descriptions">
              <el-descriptions-item
                v-for="item in voltageFields"
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
          <el-descriptions :column="1" size="small" border class="voltage-descriptions">
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
import { getVoltageLevelById } from "@/api/voltagelevel";

const defaultVoltageLevel = () => ({
  mrid: "",
  aliasName: "",
  description: "",
  name: "",
  assetDataSheet: "",
  substation: "",
});

export default {
  name: "VoltageLevelView",
  props: {
    ownerData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      voltageLevel: defaultVoltageLevel(),
      isLoading: false,
      errorMessage: "",
    };
  },
  computed: {
    voltageLevelId() {
      return (
        this.ownerData?.node?.id ??
        this.ownerData?.node?.mrid ??
        this.ownerData?.mrid ??
        this.ownerData?.id ??
        null
      );
    },
    voltageFields() {
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
        ["substation", "Substation"],
      ]);
    },
  },
  watch: {
    voltageLevelId: {
      handler(id) {
        this.fetchVoltageLevel(id);
      },
      immediate: true,
    },
  },
  methods: {
    buildFields(entries) {
      return entries.map(([key, label]) => ({
        key,
        label,
        value: this.voltageLevel?.[key] ?? "",
      }));
    },
    normalizeVoltageLevel(payload = {}) {
      const safe = (v) => (v === null || v === undefined ? "" : v);
      const vl = payload || {};
      return {
        mrid: safe(vl.mrid ?? vl.id),
        aliasName: safe(vl.aliasName),
        description: safe(vl.description),
        name: safe(vl.name),
        assetDataSheet: safe(vl.assetDataSheet),
        substation: safe(vl.substation),
      };
    },
    async fetchVoltageLevel(id) {
      if (id === null || id === undefined || id === "") {
        this.voltageLevel = defaultVoltageLevel();
        return;
      }
      this.isLoading = true;
      this.errorMessage = "";
      try {
        const response = await getVoltageLevelById(id);
        const data = response?.data ?? response;
        this.voltageLevel = this.normalizeVoltageLevel(data);
      } catch (error) {
        console.error("Failed to load voltage level info:", error);
        this.errorMessage = "Unable to load voltage level information.";
        this.voltageLevel = defaultVoltageLevel();
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
#voltage-level-view {
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

.voltage-descriptions :deep(.el-descriptions__label) {
  width: 140px;
  min-width: 140px;
  max-width: 140px;
}

.voltage-descriptions :deep(.el-descriptions__content) {
  width: auto;
}
</style>
