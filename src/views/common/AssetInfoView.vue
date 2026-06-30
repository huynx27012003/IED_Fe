<template>
  <div class="asset-info-view">
    <!-- Top bar -->
    <div class="asset-topbar">
      <div class="topbar-left">
        <div class="topbar-mode-badge">{{ modeLabel }}</div>
        <div class="asset-name">{{ assetDisplayName }}</div>
      </div>
      <button type="button" class="asset-close-btn" :aria-label="$tUi('close')" :title="$tUi('close')" @click="$emit('close')">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div class="asset-layout">
      <!-- Sidebar -->
      <aside class="asset-sidebar">
        <nav class="sidebar-nav">
          <button
            type="button"
            class="sidebar-item"
            :class="{ active: activeSection === 'information' }"
            @click="activeSection = 'information'"
          >
            <i class="fa-solid fa-circle-info sidebar-icon"></i>
            <span>{{ $tUi('information') }}</span>
          </button>
          <button
            type="button"
            class="sidebar-item"
            :class="{ active: activeSection === 'attachment' }"
            @click="activeSection = 'attachment'"
          >
            <i class="fa-solid fa-paperclip sidebar-icon"></i>
            <span>{{ $tUi('attachments') }}</span>
            <span v-if="attachments.length" class="sidebar-badge">{{ attachments.length }}</span>
          </button>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="asset-content">
        <!-- Section header -->
        <div class="section-header">
          <div class="section-title">
            <i :class="activeSection === 'information' ? 'fa-solid fa-circle-info' : 'fa-solid fa-paperclip'" class="section-icon"></i>
            {{ activeSection === 'information' ? (modeLabel + ' ' + $tUi('details')) : $tUi('attachments') }}
          </div>
          <div v-if="activeSection === 'information'" class="section-actions">
            <template v-if="!isEditing">
              <button type="button" class="action-btn" @click="onClickEdit" :aria-label="$tUi('edit')" :title="$tUi('edit')">
                <i class="fa-solid fa-pen-to-square"></i>
                <span>{{ $tUi('edit') }}</span>
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="action-btn action-btn--save"
                @click="saveEdit"
                :disabled="savingAsset"
                :aria-label="$tUi('save')"
                :title="$tUi('save')"
              >
                <i :class="savingAsset ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
                <span>{{ savingAsset ? $tUi('saving') : $tUi('save') }}</span>
              </button>
              <button
                type="button"
                class="action-btn action-btn--cancel"
                @click="cancelEdit"
                :aria-label="$tUi('cancel')"
                :title="$tUi('cancel')"
              >
                <i class="fa-solid fa-xmark"></i>
                <span>{{ $tUi('cancel') }}</span>
              </button>
            </template>
          </div>
        </div>

        <!-- Information section -->
        <template v-if="activeSection === 'information'">
          <div v-if="isLoading" class="state-block">
            <i class="fa-solid fa-spinner fa-spin state-icon"></i>
            <span>{{ $tUi('loadingInfo', { mode: modeLabel.toLowerCase() }) }}</span>
          </div>
          <div v-else-if="errorMessage" class="state-block state-block--error">
            <i class="fa-solid fa-circle-exclamation state-icon"></i>
            <span>{{ errorMessage }}</span>
          </div>
          <div v-else-if="!informationFields.length" class="state-block">
            <i class="fa-regular fa-folder-open state-icon"></i>
            <span>{{ $tUi('noInfoAvailable') }}</span>
          </div>

          <div v-else-if="isOrganisationMode" class="organisation-layout">
            <div class="form-group">
              <div class="form-group-header">
                <i class="fa-solid fa-building form-group-icon"></i>
                {{ $tUi('companyInformation') }}
              </div>
              <div class="fields-grid">
                <div v-for="item in organisationCompanyFields" :key="item.key" class="field-row">
                  <label class="field-label">{{ item.label }}</label>
                  <div class="field-value-wrap">
                    <input
                      v-model="formValues[item.formKey]"
                      class="field-input"
                      :class="{ 'field-input--readonly': !isEditing || item.editable === false, 'field-input--editable': isEditing && item.editable !== false }"
                      :readonly="!isEditing || item.editable === false"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <div class="form-group-header">
                <i class="fa-solid fa-user form-group-icon"></i>
                {{ $tUi('contactPerson') }}
              </div>
              <div class="fields-grid">
                <div v-for="item in organisationContactFields" :key="item.key" class="field-row">
                  <label class="field-label">{{ item.label }}</label>
                  <div class="field-value-wrap">
                    <input
                      v-model="formValues[item.formKey]"
                      class="field-input"
                      :class="{ 'field-input--readonly': !isEditing || item.editable === false, 'field-input--editable': isEditing && item.editable !== false }"
                      :readonly="!isEditing || item.editable === false"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="form-group">
            <div class="fields-grid">
              <div v-for="item in informationFields" :key="item.key" class="field-row">
                <label class="field-label">{{ item.label }}</label>
                <div class="field-value-wrap">
                  <input
                    v-model="formValues[item.formKey]"
                    class="field-input"
                    :class="{ 'field-input--readonly': !isEditing || item.editable === false, 'field-input--editable': isEditing && item.editable !== false }"
                    :readonly="!isEditing || item.editable === false"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>

        <AssetAttachmentPanel
          v-else
          v-model:active-sort-key="activeSortKey"
          v-model:selected-type-filters="selectedTypeFilters"
          :rows="displayedAttachmentRows"
          :available-type-options="availableTypeOptions"
          :selected-keys="selectedAttachmentKeys"
          :all-selected="allAttachmentSelected"
          :loading="attachmentsLoading"
          :error="attachmentsError"
          :uploading="attachmentsUploading"
          :downloading="attachmentsDownloading"
          :deleting="attachmentsDeleting"
          @file-selected="onAttachmentFileSelected"
          @download-selected="onClickDownloadSelected"
          @delete-selected="onClickDeleteSelected"
          @toggle-select-attachment="toggleSelectAttachment"
          @toggle-select-all="toggleSelectAllAttachments"
        />
      </main>
    </div>
  </div>
</template>

<script>
import { getOrganisationById, updateOrganisation } from "@/api/organisation";
import { getSubstationById, updateSubstation } from "@/api/substation";
import { getVoltageLevelById, updateVoltageLevel } from "@/api/voltagelevel";
import { getBayById, updateBay } from "@/api/bay";
import { getIedById, updateIed } from "@/api/device";
import AssetAttachmentPanel from "@/views/common/asset-info/AssetAttachmentPanel.vue";
import {
  getAttachmentsByAsset,
  downloadAttachmentById,
  uploadAttachment,
  deleteAttachments,
} from "@/api/attachment";

const FILE_TYPE_BY_EXTENSION = {
  xls: "Microsoft Excel Worksheet",
  xlsx: "Microsoft Excel Worksheet",
  csv: "CSV File",
  doc: "Microsoft Word Document",
  docx: "Microsoft Word Document",
  ppt: "Microsoft PowerPoint Presentation",
  pptx: "Microsoft PowerPoint Presentation",
  pdf: "PDF Document",
  txt: "Text Document",
  log: "Log File",
  md: "Markdown File",
  json: "JSON Source File",
  xml: "XML Document",
  yaml: "YAML File",
  yml: "YAML File",
  sql: "SQL Source File",
  scd: "SCD File",
  png: "PNG File",
  jpg: "JPEG File",
  jpeg: "JPEG File",
  gif: "GIF File",
  webp: "WEBP File",
  bmp: "BMP File",
  svg: "SVG File",
  zip: "ZIP File",
  rar: "RAR File",
  "7z": "7Z File",
  tar: "TAR File",
  gz: "GZ File",
  exe: "Application",
  msi: "Windows Installer Package",
  msix: "MSIX File",
  winmd: "WINMD File",
  apk: "Android Package",
  dmg: "Apple Disk Image",
  iso: "ISO Image",
  js: "JavaScript Source File",
  ts: "TypeScript Source File",
  vue: "Vue Component File",
  html: "HTML Document",
  css: "CSS File",
  scss: "SCSS File",
};

const FILE_TYPE_BY_CONTENT_TYPE = {
  "application/json": "JSON Source File",
  "application/xml": "XML Document",
  "text/xml": "XML Document",
  "text/plain": "Text Document",
  "text/csv": "CSV File",
  "application/pdf": "PDF Document",
  "image/png": "PNG File",
  "image/jpeg": "JPEG File",
  "image/jpg": "JPEG File",
  "image/gif": "GIF File",
  "image/webp": "WEBP File",
  "application/x-msdos-program": "Application",
  "application/x-msdownload": "Application",
  "application/octet-stream": "Binary File",
};

const MODE_CONFIG = {
  organisation: {
    label: "Organisation",
    fetcher: getOrganisationById,
    updater: updateOrganisation,
    fields: [
      { key: "mrid", label: "MRID", aliases: ["mrid", "id"], editable: false },
      { key: "name", label: "Name", aliases: ["name"] },
      { key: "aliasName", label: "Alias Name", aliases: ["aliasName"] },
      { key: "description", label: "Description", aliases: ["description"] },
      { key: "taxCode", label: "Tax Code", aliases: ["taxCode"] },
      { key: "address", label: "Address", aliases: ["address"] },
      { key: "city", label: "City", aliases: ["city"] },
      { key: "stateProvince", label: "State / Province", aliases: ["stateProvince"] },
      { key: "country", label: "Country", aliases: ["country"] },
      { key: "phone", label: "Phone", aliases: ["phone"] },
      { key: "personName", label: "Person Name", aliases: ["personName"] },
      { key: "phone1", label: "Phone 1", aliases: ["phone1"] },
      { key: "phone2", label: "Phone 2", aliases: ["phone2"] },
      { key: "cpFax", label: "Contact Fax", aliases: ["cpFax"] },
      { key: "cpEmail", label: "Contact Email", aliases: ["cpEmail"] },
      { key: "department", label: "Department", aliases: ["department"] },
      { key: "position", label: "Position", aliases: ["position"] },
      { key: "cfax", label: "Company Fax", aliases: ["cfax"] },
      { key: "cemail", label: "Company Email", aliases: ["cemail"] },
    ],
  },
  substation: {
    label: "Substation",
    fetcher: getSubstationById,
    updater: updateSubstation,
    fields: [
      { key: "mrid", label: "MRID", aliases: ["mrid", "id"], editable: false },
      { key: "name", label: "Name", aliases: ["name"] },
      { key: "aliasName", label: "Alias Name", aliases: ["aliasName"] },
      { key: "description", label: "Description", aliases: ["description"] },
      { key: "generation", label: "Generation", aliases: ["generation"] },
      { key: "industry", label: "Industry", aliases: ["industry"] },
    ],
  },
  voltageLevel: {
    label: "Voltage Level",
    fetcher: getVoltageLevelById,
    updater: updateVoltageLevel,
    fields: [
      { key: "mrid", label: "MRID", aliases: ["mrid", "id"], editable: false },
      { key: "name", label: "Name", aliases: ["name"] },
      { key: "aliasName", label: "Alias Name", aliases: ["aliasName"] },
      { key: "description", label: "Description", aliases: ["description"] },
    ],
  },
  bay: {
    label: "Bay",
    fetcher: getBayById,
    updater: updateBay,
    fields: [
      { key: "mrid", label: "MRID", aliases: ["mrid", "id"], editable: false },
      { key: "name", label: "Name", aliases: ["name"] },
      { key: "aliasName", label: "Alias Name", aliases: ["aliasName"] },
      { key: "description", label: "Description", aliases: ["description"] },
      { key: "breakerConfiguration", label: "Breaker Configuration", aliases: ["breakerConfiguration"] },
      { key: "busBarConfiguration", label: "Bus Bar Configuration", aliases: ["busBarConfiguration"] },
      { key: "bayEnergyMeasFlag", label: "Bay Energy Meas Flag", aliases: ["bayEnergyMeasFlag"] },
      { key: "bayPowerMeasFlag", label: "Bay Power Meas Flag", aliases: ["bayPowerMeasFlag"] },
    ],
  },
  ied: {
    label: "IED",
    fetcher: getIedById,
    updater: updateIed,
    fields: [
      { key: "mrid", label: "MRID", aliases: ["mrid", "id"], editable: false },
      { key: "name", label: "Name", aliases: ["name"] },
      { key: "aliasName", label: "Alias Name", aliases: ["aliasName"] },
      { key: "description", label: "Description", aliases: ["description"] },
      { key: "aggregate", label: "Aggregate", aliases: ["aggregate"] },
      { key: "inService", label: "In Service", aliases: ["inService"] },
      { key: "normallyInService", label: "Normally In Service", aliases: ["normallyInService"] },
      { key: "relayDelayTime", label: "Relay Delay Time", aliases: ["relayDelayTime"] },
      { key: "unitMultiplier", label: "Unit Multiplier", aliases: ["unitMultiplier"] },
      { key: "unitSymbol", label: "Unit Symbol", aliases: ["unitSymbol"] },
      { key: "highLimit", label: "High Limit", aliases: ["highLimit"] },
      { key: "lowLimit", label: "Low Limit", aliases: ["lowLimit"] },
      { key: "powerDirectionFlag", label: "Power Direction Flag", aliases: ["powerDirectionFlag"] },
    ],
  },
};

function formatLabel(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

export default {
  name: "AssetInfoView",
  emits: ["close", "refresh-tree"],
  components: { AssetAttachmentPanel },
  props: {
    ownerData: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      activeSection: "information",
      isEditing: false,
      savingAsset: false,
      isLoading: false,
      errorMessage: "",
      assetPayload: {},
      formValues: {},
      originalFormValues: {},
      attachmentsLoading: false,
      attachmentsDownloading: false,
      attachmentsUploading: false,
      attachmentsDeleting: false,
      attachmentsError: "",
      attachments: [],
      selectedAttachmentKeys: [],
      activeSortKey: "date",
      selectedTypeFilters: [],
    };
  },
  computed: {
    selectedNode() { return this.ownerData?.node || this.ownerData || {}; },
    assetMode() { return this.selectedNode?.mode || ""; },
    modeConfig() { return MODE_CONFIG[this.assetMode] || null; },
    modeLabel() {
      if (this.modeConfig?.label) return this.modeConfig.label;
      if (!this.assetMode) return "Asset";
      return formatLabel(this.assetMode);
    },
    assetId() {
      return this.selectedNode?.id ?? this.selectedNode?.mrid ?? this.ownerData?.id ?? this.ownerData?.mrid ?? null;
    },
    requestKey() { return `${this.assetMode || ""}:${this.assetId ?? ""}`; },
    isOrganisationMode() { return this.assetMode === "organisation"; },
    assetDisplayName() {
      const nodeName = this.selectedNode?.name;
      if (nodeName) return nodeName;
      const payloadName = this.readValue(this.assetPayload, ["name", "aliasName", "id", "mrid"]);
      if (payloadName) return payloadName;
      if (this.assetId === null || this.assetId === undefined || this.assetId === "") return this.modeLabel;
      return `${this.modeLabel} ${this.assetId}`;
    },
    informationFields() {
      const configFields = this.modeConfig?.fields || [];
      return configFields
        .filter((field) => field.key.toLowerCase() !== "mrid")
        .map((field) => ({
          key: field.key,
          formKey: `field-${field.key}`,
          label: field.label,
          value: this.readValue(this.assetPayload, field.aliases),
          editable: field.editable !== false,
        }));
    },
    organisationCompanyFields() {
      const contactKeys = new Set(["personName","phone1","phone2","cpFax","cpEmail","department","position","cfax","cemail"]);
      return this.informationFields.filter((f) => !contactKeys.has(f.key));
    },
    organisationContactFields() {
      const contactKeys = new Set(["personName","phone1","phone2","cpFax","cpEmail","department","position","cfax","cemail"]);
      return this.informationFields.filter((f) => contactKeys.has(f.key));
    },
    attachmentRows() {
      return (this.attachments || []).map((item) => ({
        key: this.getAttachmentKey(item),
        mrid: item?.mrid,
        fileName: item?.fileName || "",
        contentType: item?.contentType || "",
        fileSizeBytes: Number(item?.fileSize) || 0,
        fileSize: this.formatFileSize(item?.fileSize),
        uploadedAtRaw: item?.uploadedAt || "",
        uploadedAtTs: this.toTimestamp(item?.uploadedAt),
        uploadedAt: this.formatDate(item?.uploadedAt),
        uploadedBy: item?.uploadedBy || "",
        typeLabel: this.resolveFileType(item),
      }));
    },
    availableTypeOptions() {
      return Array.from(new Set(this.attachmentRows.map((r) => r.typeLabel))).filter(Boolean).sort((a, b) => a.localeCompare(b));
    },
    displayedAttachmentRows() {
      let rows = [...this.attachmentRows];
      if (this.selectedTypeFilters.length) {
        const selected = new Set(this.selectedTypeFilters);
        rows = rows.filter((r) => selected.has(r.typeLabel));
      }
      const sortMap = {
        name: (a, b) => a.fileName.localeCompare(b.fileName),
        nameDesc: (a, b) => b.fileName.localeCompare(a.fileName),
        date: (a, b) => b.uploadedAtTs - a.uploadedAtTs,
        dateAsc: (a, b) => a.uploadedAtTs - b.uploadedAtTs,
        type: (a, b) => a.typeLabel.localeCompare(b.typeLabel),
        typeDesc: (a, b) => b.typeLabel.localeCompare(a.typeLabel),
        size: (a, b) => b.fileSizeBytes - a.fileSizeBytes,
        sizeAsc: (a, b) => a.fileSizeBytes - b.fileSizeBytes,
        user: (a, b) => a.uploadedBy.localeCompare(b.uploadedBy),
        userDesc: (a, b) => b.uploadedBy.localeCompare(a.uploadedBy),
      };
      if (sortMap[this.activeSortKey]) rows.sort(sortMap[this.activeSortKey]);
      return rows;
    },
    allAttachmentSelected() {
      if (!this.displayedAttachmentRows.length) return false;
      return this.displayedAttachmentRows.every((r) => this.selectedAttachmentKeys.includes(r.key));
    },
  },
  watch: {
    requestKey: {
      handler() {
        this.activeSection = "information";
        this.isEditing = false;
        this.savingAsset = false;
        this.originalFormValues = {};
        this.attachments = [];
        this.attachmentsError = "";
        this.selectedAttachmentKeys = [];
        this.attachmentsDownloading = false;
        this.attachmentsUploading = false;
        this.activeSortKey = "date";
        this.selectedTypeFilters = [];
        this.fetchAssetInfo();
      },
      immediate: true,
    },
    activeSection(section) {
      if (section === "attachment") this.fetchAttachments();
    },
    informationFields: {
      handler(fields) {
        const next = {};
        fields.forEach((item) => {
          if (this.isEditing && this.formValues[item.formKey] !== undefined) {
            next[item.formKey] = this.formValues[item.formKey];
          } else {
            next[item.formKey] = item.value;
          }
        });
        this.formValues = next;
        if (!this.isEditing) this.originalFormValues = { ...next };
      },
      immediate: true,
    },
  },
  methods: {
    onClickEdit() {
      this.originalFormValues = { ...this.formValues };
      this.isEditing = true;
    },
    normalizeUpdateId() {
      const parsed = Number(this.assetId);
      return Number.isNaN(parsed) ? this.assetId : parsed;
    },
    getFormFieldValue(key, type = "string") {
      const raw = this.formValues[`field-${key}`];
      if (type === "boolean") {
        if (typeof raw === "boolean") return raw;
        const text = String(raw ?? "").trim().toLowerCase();
        if (text === "") return null;
        if (["true", "1", "yes", "y"].includes(text)) return true;
        if (["false", "0", "no", "n"].includes(text)) return false;
        return null;
      }
      if (type === "number") {
        if (raw === null || raw === undefined || String(raw).trim() === "") return null;
        const num = Number(raw);
        return Number.isNaN(num) ? null : num;
      }
      if (raw === null || raw === undefined) return null;
      const text = String(raw).trim();
      return text === "" ? null : text;
    },
    buildUpdatePayload() {
      const id = this.normalizeUpdateId();
      const g = (k, t) => this.getFormFieldValue(k, t);
      if (this.assetMode === "organisation") {
        return { id, taxCode: g("taxCode"), name: g("name"), aliasName: g("aliasName"), description: g("description"), address: g("address"), city: g("city"), stateProvince: g("stateProvince"), country: g("country"), phone: g("phone"), personName: g("personName"), phone1: g("phone1"), phone2: g("phone2"), cpFax: g("cpFax"), cpEmail: g("cpEmail"), department: g("department"), position: g("position"), cfax: g("cfax"), cemail: g("cemail") };
      }
      if (this.assetMode === "substation") {
        return { id, name: g("name"), aliasName: g("aliasName"), description: g("description"), generation: g("generation"), industry: g("industry") };
      }
      if (this.assetMode === "voltageLevel") {
        return { id, name: g("name"), aliasName: g("aliasName"), description: g("description") };
      }
      if (this.assetMode === "bay") {
        return { id, aliasName: g("aliasName"), description: g("description"), name: g("name"), breakerConfiguration: g("breakerConfiguration"), busBarConfiguration: g("busBarConfiguration"), bayEnergyMeasFlag: g("bayEnergyMeasFlag", "boolean"), bayPowerMeasFlag: g("bayPowerMeasFlag", "boolean") };
      }
      if (this.assetMode === "ied") {
        return { id, aliasName: g("aliasName"), description: g("description"), name: g("name"), aggregate: g("aggregate", "boolean"), inService: g("inService", "boolean"), normallyInService: g("normallyInService", "boolean"), relayDelayTime: g("relayDelayTime", "number"), unitMultiplier: g("unitMultiplier"), unitSymbol: g("unitSymbol"), highLimit: g("highLimit", "number"), lowLimit: g("lowLimit", "number"), powerDirectionFlag: g("powerDirectionFlag", "boolean") };
      }
      return null;
    },
    async saveEdit() {
      if (this.savingAsset || !this.isEditing) return;
      const updater = this.modeConfig?.updater;
      if (!updater) { this.$message?.warning?.(this.$tUi('updateNotSupported')); return; }
      const payload = this.buildUpdatePayload();
      if (!payload) { this.$message?.warning?.(this.$tUi('invalidUpdatePayload')); return; }
      this.savingAsset = true;
      try {
        await updater(payload);
        this.originalFormValues = { ...this.formValues };
        this.isEditing = false;
        this.$message?.success?.(this.$tUi('updatedSuccess', { label: this.modeLabel }));
        await this.fetchAssetInfo();
        this.$emit("refresh-tree");
      } catch (error) {
        this.$notifyApiError?.(error, this.$tUi('failedToUpdate', { mode: this.modeLabel.toLowerCase() }));
      } finally {
        this.savingAsset = false;
      }
    },
    cancelEdit() {
      this.formValues = { ...this.originalFormValues };
      this.isEditing = false;
      this.savingAsset = false;
    },
    async onAttachmentFileSelected(event) {
      const input = event?.target;
      const file = input?.files?.[0] || null;
      if (!file) return;
      if (!this.assetMode) { this.$message?.error?.(this.$tUi('invalidAssetMode')); input.value = ""; return; }
      if (this.assetId === null || this.assetId === undefined || this.assetId === "") { this.$message?.error?.(this.$tUi('invalidAssetId')); input.value = ""; return; }
      this.attachmentsUploading = true;
      try {
        await uploadAttachment(this.assetMode, this.assetId, file);
        this.$message?.success?.(this.$tUi('uploadedSuccess', { name: file.name }));
        await this.fetchAttachments();
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to upload attachment.");
      } finally {
        this.attachmentsUploading = false;
        if (input) input.value = "";
      }
    },
    triggerBrowserDownload(blob, fileName) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    async onClickDownloadSelected() {
      const selectedRows = this.attachmentRows.filter((r) => this.selectedAttachmentKeys.includes(r.key));
      if (!selectedRows.length) { this.$message?.warning?.(this.$tUi('selectAttachmentDownload')); return; }
      this.attachmentsDownloading = true;
      let successCount = 0;
      try {
        for (const row of selectedRows) {
          if (row.mrid === null || row.mrid === undefined || row.mrid === "") continue;
          const response = await downloadAttachmentById(row.mrid);
          this.triggerBrowserDownload(response.data, row.fileName);
          successCount += 1;
        }
        if (successCount > 0) this.$message?.success?.(this.$tUi('downloadCountSuccess', { count: successCount }));
        else this.$message?.warning?.(this.$tUi('noValidAttachmentIdDownload'));
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to download attachment.");
      } finally {
        this.attachmentsDownloading = false;
      }
    },
    async onClickDeleteSelected() {
      const selectedRows = this.attachmentRows.filter((r) => this.selectedAttachmentKeys.includes(r.key));
      if (!selectedRows.length) { this.$message?.warning?.(this.$tUi('selectAttachmentDelete')); return; }
      const attachmentIds = selectedRows.map((r) => r.mrid).filter((id) => id !== null && id !== undefined && id !== "");
      if (!attachmentIds.length) { this.$message?.warning?.(this.$tUi('noValidAttachmentIdDelete')); return; }
      this.attachmentsDeleting = true;
      try {
        await deleteAttachments(attachmentIds);
        this.$message?.success?.(this.$tUi('deleteCountSuccess', { count: attachmentIds.length }));
        this.selectedAttachmentKeys = [];
        await this.fetchAttachments();
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to delete attachment.");
      } finally {
        this.attachmentsDeleting = false;
      }
    },
    getAttachmentKey(item) {
      if (item?.mrid !== null && item?.mrid !== undefined && item?.mrid !== "") return `mrid-${item.mrid}`;
      return `file-${item?.fileName || ""}-${item?.uploadedAt || ""}`;
    },
    toggleSelectAttachment(key, event) {
      const checked = !!event?.target?.checked;
      if (checked) {
        if (!this.selectedAttachmentKeys.includes(key)) this.selectedAttachmentKeys = [...this.selectedAttachmentKeys, key];
        return;
      }
      this.selectedAttachmentKeys = this.selectedAttachmentKeys.filter((k) => k !== key);
    },
    toggleSelectAllAttachments(event) {
      const checked = !!event?.target?.checked;
      if (!checked) { this.selectedAttachmentKeys = []; return; }
      this.selectedAttachmentKeys = this.displayedAttachmentRows.map((r) => r.key);
    },
    normalizeValue(value) {
      if (value === null || value === undefined) return "";
      if (Array.isArray(value)) return value.map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item))).join(", ");
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
    formatFileSize(bytes) {
      const size = Number(bytes);
      if (!Number.isFinite(size) || size < 0) return "";
      if (size < 1024) return `${size} B`;
      const kb = size / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      const mb = kb / 1024;
      if (mb < 1024) return `${mb.toFixed(2)} MB`;
      return `${(mb / 1024).toFixed(2)} GB`;
    },
    formatDate(value) {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    toTimestamp(value) {
      if (!value) return 0;
      const ts = new Date(value).getTime();
      return Number.isFinite(ts) ? ts : 0;
    },
    getFileExtension(fileName = "") {
      const name = String(fileName || "");
      const idx = name.lastIndexOf(".");
      if (idx < 0 || idx === name.length - 1) return "";
      return name.slice(idx + 1).toLowerCase();
    },
    resolveFileType(item) {
      const ext = this.getFileExtension(item?.fileName);
      if (ext) {
        if (FILE_TYPE_BY_EXTENSION[ext]) return FILE_TYPE_BY_EXTENSION[ext];
        return `${ext.toUpperCase()} File`;
      }
      const contentType = String(item?.contentType || "").trim();
      const ctKey = contentType.toLowerCase();
      if (FILE_TYPE_BY_CONTENT_TYPE[ctKey]) return FILE_TYPE_BY_CONTENT_TYPE[ctKey];
      if (ctKey.includes("/")) {
        const [group] = ctKey.split("/");
        const groupMap = { image: "Image File", audio: "Audio File", video: "Video File", text: "Text File", application: "Application File" };
        if (groupMap[group]) return groupMap[group];
      }
      return contentType || "File";
    },
    readValue(payload, aliases) {
      if (!payload || typeof payload !== "object") return "";
      const aliasList = Array.isArray(aliases) ? aliases : [aliases];
      for (const key of aliasList) {
        if (!key) continue;
        if (Object.prototype.hasOwnProperty.call(payload, key)) return this.normalizeValue(payload[key]);
      }
      const entries = Object.entries(payload);
      for (const key of aliasList) {
        if (!key) continue;
        const match = entries.find(([k]) => String(k).toLowerCase() === String(key).toLowerCase());
        if (match) return this.normalizeValue(match[1]);
      }
      return "";
    },
    async fetchAssetInfo() {
      this.assetPayload = {};
      this.errorMessage = "";
      this.formValues = {};
      this.originalFormValues = {};
      this.savingAsset = false;
      if (!this.modeConfig) { this.errorMessage = this.$tUi('assetModeNotSupported'); return; }
      if (this.assetId === null || this.assetId === undefined || this.assetId === "") { this.errorMessage = this.$tUi('invalidAssetId'); return; }
      this.isLoading = true;
      try {
        const response = await this.modeConfig.fetcher(this.assetId);
        const data = response?.data ?? response;
        this.assetPayload = data && typeof data === "object" ? data : {};
      } catch (error) {
        this.errorMessage = this.$apiErrorMessage?.(error, this.$tUi('unableToLoadInfo', { mode: this.modeLabel.toLowerCase() })) || this.$tUi('unableToLoadInfo', { mode: this.modeLabel.toLowerCase() });
        this.assetPayload = {};
      } finally {
        this.isLoading = false;
      }
    },
    normalizeAttachmentList(payload) {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.result)) return payload.result;
      if (payload && typeof payload === "object") return [payload];
      return [];
    },
    async fetchAttachments() {
      this.attachmentsLoading = true;
      this.attachmentsDownloading = false;
      this.attachmentsError = "";
      this.attachments = [];
      this.selectedAttachmentKeys = [];
      if (!this.assetMode) { this.attachmentsLoading = false; this.attachmentsError = this.$tUi('invalidAssetMode'); return; }
      if (this.assetId === null || this.assetId === undefined || this.assetId === "") { this.attachmentsLoading = false; this.attachmentsError = this.$tUi('invalidAssetId'); return; }
      try {
        const response = await getAttachmentsByAsset(this.assetMode, this.assetId);
        this.attachments = this.normalizeAttachmentList(response);
      } catch (error) {
        this.attachmentsError = this.$apiErrorMessage?.(error, this.$tUi('unableToLoadAttachments')) || this.$tUi('unableToLoadAttachments');
        this.attachments = [];
      } finally {
        this.attachmentsLoading = false;
      }
    },
  },
};
</script>

<style scoped>
/* ─── Root ─────────────────────────────────────────── */
.asset-info-view {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 540px;
}

/* ─── Top bar ─────────────────────────────────────── */
.asset-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.topbar-mode-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 2px 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

.asset-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.asset-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

/* ─── Layout ─────────────────────────────────────── */
.asset-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ─── Sidebar ─────────────────────────────────────── */
.asset-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  padding: 16px 10px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-align: left;
  position: relative;
}

.sidebar-item:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.sidebar-item.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.sidebar-icon {
  font-size: 13px;
  width: 16px;
  flex-shrink: 0;
}

.sidebar-badge {
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

/* ─── Content area ───────────────────────────────── */
.asset-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* ─── Section header ─────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.section-icon {
  font-size: 13px;
  color: #6b7280;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
}

.action-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.action-btn--save {
  background: #1d4ed8;
  color: #ffffff;
  border-color: #1d4ed8;
}

.action-btn--save:hover:not(:disabled) {
  background: #1e40af;
  border-color: #1e40af;
}

.action-btn--save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn--cancel {
  border-color: #fca5a5;
  color: #dc2626;
}

.action-btn--cancel:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

/* ─── Fields / Form ──────────────────────────────── */
.organisation-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  overflow: auto;
  flex: 1;
}

.organisation-layout .form-group {
  border-right: 1px solid #e2e8f0;
}

.organisation-layout .form-group:last-child {
  border-right: none;
}

.form-group {
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex: 1;
}

.form-group-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 20px 10px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e2e8f0;
}

.form-group-icon {
  font-size: 12px;
  color: #9ca3af;
}

.fields-grid {
  padding: 8px 0;
}

.field-row {
  display: flex;
  align-items: center;
  padding: 4px 20px;
  min-height: 38px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.1s;
}

.field-row:last-child {
  border-bottom: none;
}

.field-row:hover {
  background: #f9fafb;
}

.field-label {
  flex-shrink: 0;
  width: 160px;
  font-size: 12.5px;
  font-weight: 500;
  color: #6b7280;
}

.field-value-wrap {
  flex: 1;
  min-width: 0;
}

.field-input {
  width: 100%;
  font-size: 13px;
  color: #111827;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 4px 8px;
  background: transparent;
  transition: all 0.15s;
  outline: none;
  font-family: inherit;
}

.field-input--readonly {
  color: #374151;
  background: transparent;
  border-color: transparent;
  cursor: default;
}

.field-input--editable {
  background: #ffffff;
  border-color: #d1d5db;
}

.field-input--editable:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* ─── State blocks ───────────────────────────────── */
.state-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  font-size: 13px;
  color: #6b7280;
  flex: 1;
}

.state-block--error {
  color: #dc2626;
}

.state-icon {
  font-size: 15px;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .asset-layout {
    flex-direction: column;
  }

  .asset-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 8px;
  }

  .sidebar-nav {
    flex-direction: row;
  }

  .sidebar-item {
    flex: 1;
    justify-content: center;
  }

  .organisation-layout {
    grid-template-columns: 1fr;
  }

  .organisation-layout .form-group {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .field-label {
    width: 120px;
  }
}
</style>
