<template>
  <div class="bulk-ied-import">
    <input
      ref="folderInput"
      type="file"
      style="display: none"
      multiple
      webkitdirectory
      directory
      @change="handleFolderSelect"
    />
    <input
      ref="fileInput"
      type="file"
      style="display: none"
      :accept="acceptedFileTypes"
      @change="handleManualFileSelect"
    />

    <el-dialog
      v-model="folderReviewVisible"
      :title="t('folderReviewTitle')"
      width="460px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="folder-confirm-content">
        <p>{{ t('folderFound', { count: pendingFolderFiles.length }) }}</p>
        <p class="folder-confirm-note">{{ t('folderImportNote') }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelFolderFiles">{{ t('cancel') }}</el-button>
          <el-button type="primary" @click="confirmFolderFiles">
            {{ t('useTheseFiles') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <div class="import-header">
      <div>
        <div class="eyebrow">{{ t('eyebrow') }}</div>
        <h3>{{ substationTitle }}</h3>
        <p>{{ t('stats', { total: rows.length, imported: importedCount, notImported: notImportedCount, ready: readyCount }) }}</p>
      </div>
      <div class="header-actions">
        <el-button @click="chooseFolder" :disabled="importing || folderPicking" :loading="folderPicking">
          <i class="fa-solid fa-folder-open"></i>
          {{ t('chooseFolder') }}
        </el-button>
        <el-button @click="clearFiles" :disabled="importing || !hasSelectedFiles">{{ t('clear') }}</el-button>
        <el-button
          type="primary"
          @click="startImport"
          :loading="importing"
          :disabled="!canClickImport && !importing"
        >
          {{ importing ? t('importing') : t('import') }}
        </el-button>
      </div>
    </div>

    <div v-if="rows.length" class="import-body">
      <aside class="ied-panel">
        <div class="panel-title">{{ t('iedInSubstation') }}</div>
        <div class="ied-list">
          <button
            v-for="row in rows"
            :key="row.iedId"
            type="button"
            class="ied-list-item"
            :class="`status-${row.status}`"
            @click="scrollToRow(row.iedId)"
          >
            <span class="status-dot"></span>
            <span class="ied-list-name">{{ row.name }}</span>
            <span class="ied-list-file">{{ rowSummary(row) }}</span>
          </button>
        </div>
      </aside>

      <section class="file-panel">
        <div class="panel-title">{{ t('fileMapping') }}</div>
        <div class="file-rows">
          <div
            v-for="row in rows"
            :key="row.iedId"
            :ref="setRowRef(row.iedId)"
            class="file-row"
            :class="[`status-${row.status}`, { 'is-drag-over': dragOverIedId === row.iedId }]"
            @dragenter.prevent="handleDragEnterRow(row)"
            @dragover.prevent="handleDragOverRow($event, row)"
            @dragleave="handleDragLeaveRow(row)"
            @drop.prevent="handleDropOnRow($event, row)"
          >
            <div class="file-row-main">
              <div class="device-name">{{ row.name }}</div>
              <div
                class="selected-file"
                :class="{ empty: !row.file, 'drop-active': dragOverIedId === row.iedId }"
              >
                <i class="fa-regular fa-file-lines"></i>
                <span>{{ row.file ? displayFileName(row.file) : emptyFileLabel(row) }}</span>
              </div>
              <div v-if="row.message" class="row-message">{{ row.message }}</div>
            </div>
            <div class="file-row-actions">
              <el-tag :type="statusTagType(row.status)" effect="light">
                {{ statusLabel(row) }}
              </el-tag>
              <el-button size="small" @click="chooseFileForRow(row)" :disabled="importing">
                {{ t('chooseFile') }}
              </el-button>
              <el-button
                v-if="needsReplaceConfirmation(row)"
                size="small"
                type="warning"
                @click="confirmReplace(row)"
                :disabled="importing"
              >
                {{ t('replace') }}
              </el-button>
              <el-button
                size="small"
                :text="!needsReplaceConfirmation(row)"
                :circle="needsReplaceConfirmation(row)"
                @click="clearRowFile(row)"
                :disabled="importing || !row.file"
                :title="t('removeSelectedFile')"
              >
                {{ needsReplaceConfirmation(row) ? "×" : t('remove') }}
              </el-button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="empty-state">
      <i class="fa-solid fa-circle-info"></i>
      <div>{{ t('noIedFound') }}</div>
    </div>

    <div v-if="rows.length" class="import-footer">
      <div class="progress-line">
        <el-progress :percentage="progressPercent" :status="progressStatus" />
        <div class="progress-text">{{ currentImportText }}</div>
      </div>

      <div v-if="unusedFiles.length" class="unused-files">
        <div class="unused-title">{{ t('unusedFilesTitle') }}</div>
        <button
          v-for="file in unusedFiles"
          :key="fileKey(file)"
          type="button"
          class="unused-file"
          draggable="true"
          @dragstart="handleUnusedFileDragStart($event, file)"
          @dragend="handleUnusedFileDragEnd"
        >
          <i class="fa-regular fa-file-lines"></i>
          {{ displayFileName(file) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { importDevice } from "@/api/device";
import { mapGetters } from "vuex";

const ACCEPTED_EXTENSIONS = [".csv", ".xrio", ".rio", ".txt"];

const UI_TEXT = {
  "en-vi": {
    folderReviewTitle: "Confirm Folder Files",
    folderFound: "Found {count} supported file(s) in the selected folder.",
    folderImportNote: "Files are only imported after you click the Import button.",
    cancel: "Cancel",
    useTheseFiles: "Use These Files",
    eyebrow: "Substation IED Import",
    stats: "{total} IEDs, {imported} already imported, {notImported} not imported, {ready} ready.",
    chooseFolder: "Choose Folder",
    clear: "Clear",
    import: "Import",
    importing: "Importing...",
    iedInSubstation: "IED in Substation",
    fileMapping: "File Mapping",
    chooseFile: "Choose File",
    replace: "Replace",
    remove: "Remove",
    removeSelectedFile: "Remove selected file",
    noIedFound: "No IED found under this substation.",
    unusedFilesTitle: "Unused folder files - drag a file into an IED row to map manually",
    selectedSubstation: "Selected Substation",
    importingProgress: "Importing {current}/{total}: {file}",
    completedSummary: "Completed: {success} success, {failed} failed.",
    pendingReplaceNotice: "{count} imported IED(s) have matched files. Click Replace to overwrite them.",
    initialHint: "Choose a folder to auto-fill matching files, or choose files manually.",
    noSupportedFiles: "No supported import files found in selected folder",
    chooseFolderFailed: "Failed to choose folder",
    unsupportedFile: "Selected file type is not supported for import",
    alreadyImportedReplace: "Already imported. Click Replace to overwrite this IED.",
    autoMatched: "Auto matched from folder",
    mappedManually: "Mapped manually",
    chooseFileBeforeReplace: "Please choose a file before replacing",
    replacementSelected: "Replacement selected. This file will overwrite existing parameters.",
    noReplacementSelected: "No replacement selected. Click Replace for imported IEDs you want to overwrite.",
    chooseAtLeastOneFile: "Please choose at least one file to import",
    readyToImport: "Ready to import",
    skippedUnlessReplace: "Skipped unless Replace is selected",
    noFileSelected: "No file selected",
    importSuccessRow: "Imported successfully",
    importCompletedWithFailures: "Import completed with {failed} failed file(s)",
    bulkImportSuccess: "Bulk import completed successfully",
    dropSupportedFile: "Drop a supported import file into the IED row",
    importedDropHint: "Imported parameter settings - drop a file here to replace",
    notImportedDropHint: "No parameter settings imported - drop a file here",
    summaryImported: "imported",
    summaryError: "error",
    summaryWaitingReplace: "waiting Replace",
    summaryReplace: "replace",
    summaryImportedNoFile: "Imported",
    summaryNotImportedNoFile: "Not imported",
    statusEmpty: "Not imported",
    statusAutoMatched: "Auto matched",
    statusReady: "Ready",
    statusImported: "Imported",
    statusPendingReplace: "Need Replace",
    statusImporting: "Importing",
    statusSuccess: "Success",
    statusError: "Error",
    statusSkipped: "Skipped",
    statusNoFile: "No file",
    importFailed: "Import failed",
  },
  "vi-vi": {
    folderReviewTitle: "Xác nhận tệp trong thư mục",
    folderFound: "Tìm thấy {count} tệp được hỗ trợ trong thư mục đã chọn.",
    folderImportNote: "Các tệp chỉ được nhập sau khi bạn bấm nút Nhập.",
    cancel: "Hủy",
    useTheseFiles: "Dùng các tệp này",
    eyebrow: "Nhập IED theo trạm",
    stats: "{total} IED, {imported} đã nhập, {notImported} chưa nhập, {ready} sẵn sàng.",
    chooseFolder: "Chọn thư mục",
    clear: "Xóa chọn",
    import: "Nhập",
    importing: "Đang nhập...",
    iedInSubstation: "IED trong trạm",
    fileMapping: "Ánh xạ tệp",
    chooseFile: "Chọn tệp",
    replace: "Ghi đè",
    remove: "Xóa",
    removeSelectedFile: "Xóa tệp đã chọn",
    noIedFound: "Không tìm thấy IED trong trạm này.",
    unusedFilesTitle: "Tệp chưa dùng - kéo tệp vào dòng IED để ánh xạ thủ công",
    selectedSubstation: "Trạm đã chọn",
    importingProgress: "Đang nhập {current}/{total}: {file}",
    completedSummary: "Hoàn tất: {success} thành công, {failed} lỗi.",
    pendingReplaceNotice: "{count} IED đã nhập có tệp khớp. Bấm Ghi đè để nhập đè.",
    initialHint: "Chọn thư mục để tự động khớp tệp, hoặc chọn tệp thủ công.",
    noSupportedFiles: "Không tìm thấy tệp nhập được hỗ trợ trong thư mục đã chọn",
    chooseFolderFailed: "Chọn thư mục thất bại",
    unsupportedFile: "Loại tệp đã chọn không được hỗ trợ để nhập",
    alreadyImportedReplace: "Đã nhập. Bấm Ghi đè để nhập đè IED này.",
    autoMatched: "Tự động khớp từ thư mục",
    mappedManually: "Đã ánh xạ thủ công",
    chooseFileBeforeReplace: "Vui lòng chọn tệp trước khi ghi đè",
    replacementSelected: "Đã chọn ghi đè. Tệp này sẽ ghi đè cấu hình tham số hiện có.",
    noReplacementSelected: "Chưa chọn ghi đè. Bấm Ghi đè cho IED đã nhập nếu muốn ghi đè.",
    chooseAtLeastOneFile: "Vui lòng chọn ít nhất một tệp để nhập",
    readyToImport: "Sẵn sàng nhập",
    skippedUnlessReplace: "Bỏ qua nếu chưa chọn Ghi đè",
    noFileSelected: "Chưa chọn tệp",
    importSuccessRow: "Nhập thành công",
    importCompletedWithFailures: "Nhập hoàn tất với {failed} tệp lỗi",
    bulkImportSuccess: "Nhập hàng loạt thành công",
    dropSupportedFile: "Thả tệp nhập được hỗ trợ vào dòng IED",
    importedDropHint: "Đã nhập cấu hình tham số - thả tệp vào đây để ghi đè",
    notImportedDropHint: "Chưa nhập cấu hình tham số - thả tệp vào đây",
    summaryImported: "đã nhập",
    summaryError: "lỗi",
    summaryWaitingReplace: "chờ ghi đè",
    summaryReplace: "ghi đè",
    summaryImportedNoFile: "Đã nhập",
    summaryNotImportedNoFile: "Chưa nhập",
    statusEmpty: "Chưa nhập",
    statusAutoMatched: "Tự động khớp",
    statusReady: "Sẵn sàng",
    statusImported: "Đã nhập",
    statusPendingReplace: "Cần ghi đè",
    statusImporting: "Đang nhập",
    statusSuccess: "Thành công",
    statusError: "Lỗi",
    statusSkipped: "Bỏ qua",
    statusNoFile: "Chưa có tệp",
    importFailed: "Nhập thất bại",
  },
};

export default {
  name: "BulkIedImportDialog",
  props: {
    substationNode: { type: Object, default: () => ({}) },
    tree: { type: Array, default: () => [] },
  },
  emits: ["close", "import-complete"],
  data() {
    return {
      rows: [],
      folderFiles: [],
      pendingFolderFiles: [],
      unusedFiles: [],
      manualTargetIedId: null,
      folderReviewVisible: false,
      folderPicking: false,
      importing: false,
      completedCount: 0,
      totalImportCount: 0,
      successCount: 0,
      failedCount: 0,
      currentFileName: "",
      rowRefs: {},
      draggedFileKey: "",
      dragOverIedId: "",
    };
  },
  computed: {
    ...mapGetters(["language"]),
    uiText() {
      return UI_TEXT[this.language] || UI_TEXT["en-vi"];
    },
    acceptedFileTypes() {
      return ACCEPTED_EXTENSIONS.join(",");
    },
    substationTitle() {
      return this.substationNode?.name || this.t("selectedSubstation");
    },
    readyCount() {
      return this.rows.filter(this.canImportRow).length;
    },
    selectedFileCount() {
      return this.rows.filter((row) => !!row.file).length;
    },
    pendingReplaceCount() {
      return this.rows.filter(this.needsReplaceConfirmation).length;
    },
    canClickImport() {
      return this.readyCount > 0 || this.pendingReplaceCount > 0;
    },
    importedCount() {
      return this.rows.filter((row) => row.hasParameter).length;
    },
    notImportedCount() {
      return this.rows.filter((row) => !row.hasParameter).length;
    },
    hasSelectedFiles() {
      return this.selectedFileCount > 0 || this.folderFiles.length > 0;
    },
    progressPercent() {
      if (!this.rows.length) return 0;
      const total = Math.max(this.totalImportCount, this.completedCount, 1);
      return Math.min(100, Math.round((this.completedCount / total) * 100));
    },
    progressStatus() {
      if (this.importing) return undefined;
      if (this.failedCount) return "exception";
      if (this.successCount) return "success";
      return undefined;
    },
    currentImportText() {
      if (this.importing && this.currentFileName) {
        return this.t("importingProgress", {
          current: this.completedCount + 1,
          total: this.totalImportCount,
          file: this.currentFileName,
        });
      }
      if (this.successCount || this.failedCount) {
        return this.t("completedSummary", { success: this.successCount, failed: this.failedCount });
      }
      if (this.pendingReplaceCount) {
        return this.t("pendingReplaceNotice", { count: this.pendingReplaceCount });
      }
      return this.t("initialHint");
    },
  },
  watch: {
    substationNode: {
      immediate: true,
      handler() {
        this.rebuildRows();
      },
    },
    tree() {
      if (!this.rows.length) this.rebuildRows();
    },
  },
  methods: {
    t(key, params = {}) {
      let text = this.uiText[key] || UI_TEXT["en-vi"][key] || key;
      Object.keys(params).forEach((param) => {
        text = text.replace(`{${param}}`, params[param]);
      });
      return text;
    },
    rebuildRows() {
      const node = this.resolveSubstationNode();
      const ieds = this.collectIedNodes(node);
      this.rows = ieds.map((ied) => ({
        hasParameter: this.hasParameterData(ied),
        iedId: String(ied.id),
        name: ied.name || `IED ${ied.id}`,
        file: null,
        source: "",
        replaceConfirmed: false,
        status: this.hasParameterData(ied) ? "imported" : "empty",
        message: "",
      }));
      this.folderFiles = [];
      this.pendingFolderFiles = [];
      this.unusedFiles = [];
      this.completedCount = 0;
      this.totalImportCount = 0;
      this.successCount = 0;
      this.failedCount = 0;
      this.currentFileName = "";
      this.rowRefs = {};
    },
    resolveSubstationNode() {
      const selected = this.substationNode || {};
      const hasChildren = this.getChildren(selected).length > 0;
      if (selected.mode === "substation" && hasChildren) return selected;
      const id = selected.id == null ? "" : String(selected.id);
      return this.findNode(this.tree, id, "substation") || selected;
    },
    findNode(nodes, targetId, targetMode) {
      if (!targetId || !Array.isArray(nodes)) return null;
      for (const node of nodes) {
        if (String(node?.id) === targetId && node?.mode === targetMode) return node;
        const found = this.findNode(this.getChildren(node), targetId, targetMode);
        if (found) return found;
      }
      return null;
    },
    collectIedNodes(root) {
      const result = [];
      const seen = new Set();
      const walk = (node) => {
        if (!node) return;
        if (node.mode === "ied" && node.id != null) {
          const key = String(node.id);
          if (!seen.has(key)) {
            seen.add(key);
            result.push(node);
          }
          return;
        }
        this.getChildren(node).forEach(walk);
      };
      walk(root);
      return result;
    },
    getChildren(node) {
      if (Array.isArray(node?.children) && node.children.length) return node.children;
      if (Array.isArray(node?.childrenFromData)) return node.childrenFromData;
      if (Array.isArray(node?.children)) return node.children;
      return [];
    },
    hasParameterData(iedNode) {
      return this.getChildren(iedNode).some((child) => {
        const mode = String(child?.mode || "");
        return [
          "systemSetting",
          "lineParameters",
          "protectionGroup",
          "protectionFunction",
          "protectionLevel",
          "settingFunction",
        ].includes(mode);
      });
    },
    statusWithoutFile(row) {
      return row.hasParameter ? "imported" : "empty";
    },
    async chooseFolder() {
      if (this.importing || this.folderPicking) return;
      this.folderPicking = true;
      try {
        if (window.showDirectoryPicker) {
          await this.chooseFolderWithDirectoryPicker();
        } else {
          this.$nextTick(() => this.$refs.folderInput?.click?.());
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          this.$notifyApiError?.(error, this.t("chooseFolderFailed"));
        }
      } finally {
        this.folderPicking = false;
      }
    },
    async chooseFolderWithDirectoryPicker() {
      const directoryHandle = await window.showDirectoryPicker();
      const files = this.sortFiles(
        (await this.collectDirectoryFiles(directoryHandle, directoryHandle.name)).filter(this.isImportableFile)
      );

      this.preparePendingFolderFiles(files);
    },
    async collectDirectoryFiles(directoryHandle, basePath) {
      const files = [];
      for await (const [name, handle] of directoryHandle.entries()) {
        const path = `${basePath}/${name}`;
        if (handle.kind === "file") {
          const file = await handle.getFile();
          Object.defineProperty(file, "_iedRelativePath", {
            value: path,
            configurable: true,
          });
          files.push(file);
        } else if (handle.kind === "directory") {
          files.push(...await this.collectDirectoryFiles(handle, path));
        }
      }
      return files;
    },
    handleFolderSelect(event) {
      const files = Array.from(event.target?.files || []).filter(this.isImportableFile);
      event.target.value = "";

      this.preparePendingFolderFiles(this.sortFiles(files));
    },
    preparePendingFolderFiles(files) {
      this.pendingFolderFiles = files;

      if (!files.length) {
        this.$message?.warning?.(this.t("noSupportedFiles"));
        return;
      }
      this.folderReviewVisible = true;
    },
    confirmFolderFiles() {
      this.folderFiles = this.pendingFolderFiles;
      this.pendingFolderFiles = [];
      this.folderReviewVisible = false;
      this.applyAutoMatch();
    },
    cancelFolderFiles() {
      this.pendingFolderFiles = [];
      this.folderReviewVisible = false;
    },
    sortFiles(files) {
      return [...files].sort((left, right) => {
        const leftScore = this.extensionScore(left.name);
        const rightScore = this.extensionScore(right.name);
        if (leftScore !== rightScore) return leftScore - rightScore;
        return left.name.localeCompare(right.name);
      });
    },
    extensionScore(fileName) {
      const lower = String(fileName || "").toLowerCase();
      const index = ACCEPTED_EXTENSIONS.findIndex((ext) => lower.endsWith(ext));
      return index === -1 ? ACCEPTED_EXTENSIONS.length : index;
    },
    isImportableFile(file) {
      const name = String(file?.name || "");
      const lower = name.toLowerCase();
      if (!name || name.startsWith(".") || lower.endsWith(".signature")) return false;
      return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
    },
    applyAutoMatch() {
      const filesByName = new Map();
      this.folderFiles.forEach((file) => {
        const key = this.normalizeMatchName(this.baseFileName(file.name));
        if (key && !filesByName.has(key)) filesByName.set(key, file);
      });

      const used = new Set();
      this.rows.forEach((row) => {
        const file = filesByName.get(this.normalizeMatchName(row.name));
        if (file) {
          this.assignFileToRow(row, file, "auto");
          used.add(file);
        } else {
          row.file = null;
          row.source = "";
          row.replaceConfirmed = false;
          row.status = this.statusWithoutFile(row);
          row.message = "";
        }
      });
      this.unusedFiles = this.folderFiles.filter((file) => !used.has(file));
      this.resetImportCounters();
    },
    chooseFileForRow(row) {
      this.manualTargetIedId = row.iedId;
      this.$refs.fileInput?.click?.();
    },
    handleManualFileSelect(event) {
      const file = event.target?.files?.[0] || null;
      event.target.value = "";
      if (!file || !this.manualTargetIedId) return;
      if (!this.isImportableFile(file)) {
        this.$message?.warning?.(this.t("unsupportedFile"));
        return;
      }
      const row = this.rows.find((item) => item.iedId === this.manualTargetIedId);
      if (!row) return;

      this.assignFileToRow(row, file, "manual");
      this.manualTargetIedId = null;
      this.recomputeUnusedFiles();
      this.resetImportCounters();
    },
    assignFileToRow(row, file, source) {
      row.file = file;
      row.source = source;
      row.replaceConfirmed = false;
      if (row.hasParameter) {
        row.status = "pendingReplace";
        row.message = this.t("alreadyImportedReplace");
      } else {
        row.status = "ready";
        row.message = source === "auto" ? this.t("autoMatched") : this.t("mappedManually");
      }
    },
    confirmReplace(row) {
      if (!row?.file) {
        this.$message?.warning?.(this.t("chooseFileBeforeReplace"));
        return;
      }
      row.replaceConfirmed = true;
      row.status = "ready";
      row.message = this.t("replacementSelected");
      this.resetImportCounters();
    },
    clearFiles() {
      this.rows.forEach((row) => {
        row.file = null;
        row.source = "";
        row.replaceConfirmed = false;
        row.status = this.statusWithoutFile(row);
        row.message = "";
      });
      this.folderFiles = [];
      this.pendingFolderFiles = [];
      this.folderReviewVisible = false;
      this.unusedFiles = [];
      this.resetImportCounters();
    },
    clearRowFile(row) {
      row.file = null;
      row.source = "";
      row.replaceConfirmed = false;
      row.status = this.statusWithoutFile(row);
      row.message = "";
      this.recomputeUnusedFiles();
      this.resetImportCounters();
    },
    recomputeUnusedFiles() {
      const used = new Set(this.rows.map((row) => row.file).filter(Boolean).map(this.fileKey));
      this.unusedFiles = this.folderFiles.filter((file) => !used.has(this.fileKey(file)));
    },
    handleUnusedFileDragStart(event, file) {
      if (this.importing) return;
      const key = this.fileKey(file);
      this.draggedFileKey = key;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("application/x-ied-import-file", key);
        event.dataTransfer.setData("text/plain", key);
      }
    },
    handleUnusedFileDragEnd() {
      this.draggedFileKey = "";
      this.dragOverIedId = "";
    },
    handleDragEnterRow(row) {
      if (this.importing) return;
      this.dragOverIedId = row.iedId;
    },
    handleDragOverRow(event, row) {
      if (!this.importing) this.dragOverIedId = row.iedId;
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    },
    handleDragLeaveRow(row) {
      if (this.dragOverIedId === row.iedId) this.dragOverIedId = "";
    },
    handleDropOnRow(event, row) {
      if (this.importing) return;
      const file = this.resolveDroppedFile(event);
      this.draggedFileKey = "";
      this.dragOverIedId = "";

      if (!file) {
        this.$message?.warning?.(this.t("dropSupportedFile"));
        return;
      }

      this.assignFileToRow(row, file, "drag");
      this.recomputeUnusedFiles();
      this.resetImportCounters();
    },
    resolveDroppedFile(event) {
      const droppedFiles = Array.from(event.dataTransfer?.files || []);
      const externalFile = droppedFiles.find(this.isImportableFile);
      if (externalFile) return externalFile;

      const key =
        event.dataTransfer?.getData("application/x-ied-import-file") ||
        event.dataTransfer?.getData("text/plain") ||
        this.draggedFileKey;
      if (!key) return null;
      return this.folderFiles.find((file) => this.fileKey(file) === key) || null;
    },
    resetImportCounters() {
      this.completedCount = 0;
      this.totalImportCount = 0;
      this.successCount = 0;
      this.failedCount = 0;
      this.currentFileName = "";
    },
    async startImport() {
      const targets = this.rows.filter(this.canImportRow);
      if (!targets.length) {
        if (this.pendingReplaceCount) {
          this.$message?.warning?.(this.t("noReplacementSelected"));
        } else {
          this.$message?.warning?.(this.t("chooseAtLeastOneFile"));
        }
        return;
      }

      this.importing = true;
      this.resetImportCounters();
      this.totalImportCount = targets.length;
      this.rows.forEach((row) => {
        if (this.canImportRow(row)) {
          row.status = "ready";
          row.message = this.t("readyToImport");
        } else if (row.file && row.hasParameter && !row.replaceConfirmed) {
          row.status = "pendingReplace";
          row.message = this.t("skippedUnlessReplace");
        } else if (row.hasParameter) {
          row.status = "imported";
          row.message = "";
        } else {
          row.status = "empty";
          row.message = this.t("noFileSelected");
        }
      });

      for (const row of targets) {
        row.status = "importing";
        row.message = this.t("importing");
        this.currentFileName = row.file.name;

        try {
          await importDevice(row.file, row.iedId);
          row.status = "success";
          row.message = this.t("importSuccessRow");
          row.hasParameter = true;
          row.replaceConfirmed = false;
          this.successCount += 1;
        } catch (error) {
          row.status = "error";
          row.message = this.formatError(error);
          this.failedCount += 1;
        } finally {
          this.completedCount += 1;
        }
      }

      this.importing = false;
      this.currentFileName = "";
      this.$emit("import-complete", {
        total: targets.length,
        success: this.successCount,
        failed: this.failedCount,
      });

      if (this.failedCount) {
        this.$message?.warning?.(this.t("importCompletedWithFailures", { failed: this.failedCount }));
      } else {
        this.$message?.success?.(this.t("bulkImportSuccess"));
      }
    },
    baseFileName(fileName) {
      return String(fileName || "").replace(/\.[^/.]+$/, "");
    },
    normalizeMatchName(value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
    },
    canImportRow(row) {
      return !!row?.file && (!row.hasParameter || row.replaceConfirmed);
    },
    needsReplaceConfirmation(row) {
      return !!row?.file && row.hasParameter && !row.replaceConfirmed && row.status === "pendingReplace";
    },
    emptyFileLabel(row) {
      return row.hasParameter ? this.t("importedDropHint") : this.t("notImportedDropHint");
    },
    rowSummary(row) {
      if (row.file) {
        if (row.status === "success") return `${row.file.name} (${this.t("summaryImported")})`;
        if (row.status === "error") return `${row.file.name} (${this.t("summaryError")})`;
        if (row.hasParameter && !row.replaceConfirmed) return `${row.file.name} (${this.t("summaryWaitingReplace")})`;
        if (row.hasParameter && row.replaceConfirmed) return `${row.file.name} (${this.t("summaryReplace")})`;
        return row.file.name;
      }
      return row.hasParameter ? this.t("summaryImportedNoFile") : this.t("summaryNotImportedNoFile");
    },
    displayFileName(file) {
      return file?._iedRelativePath || file?.webkitRelativePath || file?.name || "";
    },
    fileKey(file) {
      return `${this.displayFileName(file)}-${file?.size || 0}`;
    },
    statusLabel(row) {
      const labels = {
        empty: this.t("statusEmpty"),
        ready: row.source === "auto" ? this.t("statusAutoMatched") : this.t("statusReady"),
        imported: this.t("statusImported"),
        pendingReplace: this.t("statusPendingReplace"),
        importing: this.t("statusImporting"),
        success: this.t("statusSuccess"),
        error: this.t("statusError"),
        skipped: this.t("statusSkipped"),
      };
      return labels[row.status] || this.t("statusNoFile");
    },
    statusTagType(status) {
      if (status === "success") return "success";
      if (status === "error") return "danger";
      if (status === "importing" || status === "pendingReplace") return "warning";
      if (status === "imported") return "success";
      if (status === "skipped" || status === "empty") return "info";
      return "";
    },
    formatError(error) {
      const data = error?.response?.data;
      if (typeof data === "string" && data.trim()) return data;
      if (data?.message) return data.message;
      return error?.apiMessage || error?.message || this.t("importFailed");
    },
    setRowRef(iedId) {
      return (el) => {
        if (el) this.rowRefs[iedId] = el;
      };
    },
    scrollToRow(iedId) {
      this.rowRefs[iedId]?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    },
  },
};
</script>

<style scoped>
.bulk-ied-import {
  color: #1f2937;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.folder-confirm-content {
  color: #334155;
  line-height: 1.5;
}

.folder-confirm-content p {
  margin: 0 0 10px;
}

.folder-confirm-content .folder-confirm-note {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  color: #1d4ed8;
  margin-bottom: 0;
  padding: 10px 12px;
}

.import-header {
  align-items: flex-start;
  background: linear-gradient(135deg, #eef6ff 0%, #f8fbff 58%, #ffffff 100%);
  border: 1px solid #d8e8ff;
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.eyebrow {
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.import-header h3 {
  font-size: 22px;
  line-height: 1.2;
  margin: 4px 0 6px;
}

.import-header p {
  color: #64748b;
  margin: 0;
}

.header-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.header-actions i {
  margin-right: 6px;
}

.import-body {
  display: grid;
  gap: 14px;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 420px;
}

.ied-panel,
.file-panel {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  min-width: 0;
  overflow: hidden;
}

.panel-title {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
  font-weight: 700;
  padding: 12px 14px;
}

.ied-list,
.file-rows {
  max-height: 520px;
  overflow: auto;
}

.ied-list-item {
  align-items: center;
  background: #ffffff;
  border: 0;
  border-bottom: 1px solid #eef2f7;
  cursor: pointer;
  display: grid;
  gap: 8px;
  grid-template-columns: 10px minmax(0, 1fr);
  padding: 11px 14px;
  text-align: left;
  width: 100%;
}

.ied-list-item:hover {
  background: #f8fbff;
}

.status-dot {
  background: #94a3b8;
  border-radius: 999px;
  height: 8px;
  width: 8px;
}

.status-ready .status-dot {
  background: #2563eb;
}

.status-imported .status-dot {
  background: #16a34a;
}

.status-pendingReplace .status-dot {
  background: #f59e0b;
}

.status-importing .status-dot {
  background: #f59e0b;
}

.status-success .status-dot {
  background: #16a34a;
}

.status-error .status-dot {
  background: #dc2626;
}

.ied-list-name,
.ied-list-file {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ied-list-name {
  color: #0f172a;
  font-weight: 700;
}

.ied-list-file {
  color: #64748b;
  font-size: 12px;
  grid-column: 2;
}

.file-row {
  align-items: center;
  background: #ffffff;
  border-bottom: 1px solid #eef2f7;
  border-left: 3px solid transparent;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 12px 14px;
}

.file-row.status-importing {
  background: #fffbeb;
}

.file-row.status-pendingReplace {
  background: #fff7ed;
}

.file-row.status-imported {
  background: #f8fff9;
}

.file-row.status-error {
  background: #fff5f5;
}

.file-row.status-success {
  background: #f0fdf4;
}

.file-row.is-drag-over,
.file-row.status-imported.is-drag-over,
.file-row.status-pendingReplace.is-drag-over,
.file-row.status-success.is-drag-over,
.file-row.status-error.is-drag-over,
.file-row.status-importing.is-drag-over {
  background: #eff6ff;
  border-left-color: #2563eb;
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.28);
}

.file-row-main {
  min-width: 0;
}

.device-name {
  font-weight: 700;
  margin-bottom: 8px;
}

.selected-file {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  color: #1e40af;
  display: flex;
  gap: 8px;
  min-height: 38px;
  min-width: 0;
  padding: 8px 10px;
}

.selected-file.drop-active {
  background: #dbeafe;
  border-color: #2563eb;
  box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.28), 0 6px 18px rgba(37, 99, 235, 0.16);
  transform: translateY(-1px);
}

.selected-file.empty {
  border-color: #e2e8f0;
  color: #94a3b8;
}

.selected-file span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-message {
  color: #64748b;
  font-size: 12px;
  margin-top: 6px;
}

.file-row-actions {
  align-items: center;
  display: flex;
  gap: 8px;
}

.import-footer {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
}

.progress-line {
  display: grid;
  gap: 8px;
}

.progress-text {
  color: #475569;
  font-size: 13px;
}

.unused-files {
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
}

.unused-title {
  color: #64748b;
  flex-basis: 100%;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.unused-file {
  align-items: center;
  background: #f1f5f9;
  border: 1px solid transparent;
  border-radius: 999px;
  color: #475569;
  cursor: grab;
  display: inline-flex;
  font-size: 12px;
  gap: 6px;
  padding: 5px 9px;
}

.unused-file:active {
  cursor: grabbing;
}

.unused-file:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.empty-state {
  align-items: center;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  color: #64748b;
  display: flex;
  gap: 10px;
  justify-content: center;
  min-height: 260px;
}

@media (max-width: 900px) {
  .import-header,
  .file-row {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .import-header {
    flex-direction: column;
  }

  .header-actions,
  .file-row-actions {
    justify-content: flex-start;
  }

  .import-body {
    grid-template-columns: 1fr;
  }
}
</style>
