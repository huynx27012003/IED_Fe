<template>
  <div class="attachment-panel">
    <div class="attachment-toolbar">
      <button type="button" class="toolbar-btn" :disabled="uploading" @click="triggerFileInput">
        <i class="fa-solid fa-arrow-up-from-bracket"></i>
        <span>{{ uploading ? "Uploading..." : "Upload" }}</span>
      </button>
      <button type="button" class="toolbar-btn" :disabled="!selectedKeys.length || downloading" @click="$emit('download-selected')">
        <i class="fa-solid fa-arrow-down-to-line"></i>
        <span>{{ downloading ? "Downloading..." : "Download" }}</span>
      </button>
      <button type="button" class="toolbar-btn" disabled>
        <i class="fa-regular fa-copy"></i>
        <span>Copy</span>
      </button>
      <button type="button" class="toolbar-btn toolbar-btn--danger" :disabled="!selectedKeys.length || deleting" @click="$emit('delete-selected')">
        <i class="fa-regular fa-trash-can"></i>
        <span>{{ deleting ? "Deleting..." : "Delete" }}</span>
      </button>

      <div class="toolbar-divider"></div>

      <div class="toolbar-filter">
        <i class="fa-solid fa-arrow-up-wide-short toolbar-filter-icon"></i>
        <select v-model="localActiveSortKey" class="toolbar-select">
          <option value="date">Latest first</option>
          <option value="dateAsc">Oldest first</option>
          <option value="name">Name A-Z</option>
          <option value="nameDesc">Name Z-A</option>
          <option value="type">Type A-Z</option>
          <option value="typeDesc">Type Z-A</option>
          <option value="size">Largest first</option>
          <option value="sizeAsc">Smallest first</option>
          <option value="user">User A-Z</option>
          <option value="userDesc">User Z-A</option>
        </select>
      </div>

      <div class="toolbar-filter">
        <i class="fa-solid fa-filter toolbar-filter-icon"></i>
        <el-select
          v-model="localSelectedTypeFilters"
          class="toolbar-type-select"
          placeholder="All types"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          size="small"
        >
          <el-option v-for="typeItem in availableTypeOptions" :key="typeItem" :label="typeItem" :value="typeItem" />
        </el-select>
      </div>
    </div>

    <input ref="attachmentFileInput" type="file" style="display: none" @change="$emit('file-selected', $event)" />

    <div v-if="loading" class="state-block">
      <i class="fa-solid fa-spinner fa-spin state-icon"></i>
      <span>Loading attachments...</span>
    </div>
    <div v-else-if="error" class="state-block state-block--error">
      <i class="fa-solid fa-circle-exclamation state-icon"></i>
      <span>{{ error }}</span>
    </div>
    <div v-else class="attachment-table-wrap">
      <table class="attachment-table">
        <thead>
          <tr>
            <th class="check-col">
              <input type="checkbox" class="table-checkbox" :checked="allSelected" @change="$emit('toggle-select-all', $event)" />
            </th>
            <th class="col-name">Name</th>
            <th class="col-date">Date Modified</th>
            <th class="col-type">Type</th>
            <th class="col-size">Size</th>
            <th class="col-user">Uploaded By</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key" class="table-row" :class="{ 'table-row--selected': selectedKeys.includes(row.key) }">
            <td class="check-col">
              <input type="checkbox" class="table-checkbox" :checked="selectedKeys.includes(row.key)" @change="$emit('toggle-select-attachment', row.key, $event)" />
            </td>
            <td class="file-name-cell">
              <Icon icon-type="file" :file-name="row.fileName" :content-type="row.contentType" size="15px" />
              <span class="file-name">{{ row.fileName }}</span>
            </td>
            <td class="cell-muted">{{ row.uploadedAt }}</td>
            <td>
              <span class="type-badge">{{ row.typeLabel }}</span>
            </td>
            <td class="cell-muted">{{ row.fileSize }}</td>
            <td class="cell-muted">{{ row.uploadedBy }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="6" class="empty-row">
              <i class="fa-regular fa-folder-open" style="margin-right: 8px; opacity: 0.5;"></i>
              No attachments found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import Icon from "@/views/common/Icon.vue";

export default {
  name: "AssetAttachmentPanel",
  components: { Icon },
  props: {
    rows: { type: Array, default: () => [] },
    availableTypeOptions: { type: Array, default: () => [] },
    selectedKeys: { type: Array, default: () => [] },
    allSelected: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    error: { type: String, default: "" },
    uploading: { type: Boolean, default: false },
    downloading: { type: Boolean, default: false },
    deleting: { type: Boolean, default: false },
    activeSortKey: { type: String, default: "date" },
    selectedTypeFilters: { type: Array, default: () => [] },
  },
  emits: [
    "update:activeSortKey",
    "update:selectedTypeFilters",
    "file-selected",
    "download-selected",
    "delete-selected",
    "toggle-select-attachment",
    "toggle-select-all",
  ],
  computed: {
    localActiveSortKey: {
      get() {
        return this.activeSortKey;
      },
      set(value) {
        this.$emit("update:activeSortKey", value);
      },
    },
    localSelectedTypeFilters: {
      get() {
        return this.selectedTypeFilters;
      },
      set(value) {
        this.$emit("update:selectedTypeFilters", value);
      },
    },
  },
  methods: {
    triggerFileInput() {
      if (this.uploading) return;
      this.$refs.attachmentFileInput?.click?.();
    },
  },
};
</script>

<style scoped>
.attachment-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.attachment-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn--danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.toolbar-divider {
  width: 1px;
  height: 22px;
  background: #e2e8f0;
  margin: 0 4px;
  flex-shrink: 0;
}

.toolbar-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  font-size: 12px;
  color: #6b7280;
}

.toolbar-filter-icon {
  font-size: 11px;
  color: #9ca3af;
  flex-shrink: 0;
}

.toolbar-select {
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  min-width: 130px;
}

.toolbar-type-select {
  width: 180px;
}

.toolbar-type-select :deep(.el-select__wrapper) {
  box-shadow: none;
  border: none;
  background: transparent;
  min-height: 22px;
  padding: 0;
  font-size: 12px;
}

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

.attachment-table-wrap {
  flex: 1;
  overflow: auto;
}

.attachment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  table-layout: fixed;
}

.col-name { width: auto; }
.col-date { width: 160px; }
.col-type { width: 190px; }
.col-size { width: 90px; }
.col-user { width: 110px; }

.attachment-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 8px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  z-index: 1;
}

.attachment-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #374151;
  white-space: nowrap;
}

.check-col {
  width: 36px;
  padding: 8px 10px !important;
}

.table-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #1d4ed8;
}

.table-row:hover td {
  background: #f9fafb;
}

.table-row--selected td {
  background: #eff6ff;
}

.file-name-cell {
  display: flex !important;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-muted {
  color: #6b7280;
  font-size: 12px;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.empty-row {
  text-align: center !important;
  padding: 40px 12px !important;
  color: #9ca3af;
  font-size: 13px;
}
</style>
