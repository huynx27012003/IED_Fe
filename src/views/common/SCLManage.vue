<template>
  <div class="scl-import-view">
    <div class="scl-main" :class="{ 'single-pane': !showTreePane || !showTablePane }">
      <div v-if="showTreePane" class="scl-tree-pane">
        <div class="pane-title">{{ treePaneTitle }}</div>
        <div class="pane-actions">
          <input
            ref="sclFileInput"
            type="file"
            accept=".scl,.scd,.icd,.cid,.xml"
            style="display: none"
            @change="onFileSelected"
          />
          <button
            class="choose-file-btn"
            @click="triggerFileInput"
            :disabled="state.isLoading"
          >
            <i class="fa-solid fa-folder-open"></i>
            <span>{{ state.isLoading ? 'Loading...' : 'Choose SCL File' }}</span>
          </button>
          <div v-if="state.fileName" class="file-info">
            <i class="fa-solid fa-file-code"></i>
            <span>{{ state.fileName }}</span>
            <i class="fa-solid fa-xmark close-icon" @click="clearFile" title="Clear"></i>
          </div>
        </div>
        <div class="pane-body">
          <div v-if="state.isLoading" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Parsing SCL file...</span>
          </div>
          <div v-else-if="!displaySclTreeData.length" class="empty-state">
            <i class="fa-solid fa-file-import empty-icon"></i>
            <p>No SCL file loaded</p>
            <p class="hint">Click "Choose SCL File" to import an SCL/SCD/ICD/CID file</p>
          </div>
          <ul v-else class="scl-tree">
            <TreeNode
              v-for="item in displaySclTreeData"
              :key="item.id"
              :node="item"
              :selectedNodes="state.selectedNodes"
              :selectedParameterId="null"
              :hide-operation-off="false"
              @select-parameter="() => {}"
              @fetch-children="() => {}"
              @show-properties="handleShowProperties"
              @update-selection="updateSelection"
              @clear-selection="clearSelection"
              @open-context-menu="() => {}"
              @toggle-node="toggleNode"
              @node-dblclick="() => {}"
            />
          </ul>
        </div>
      </div>

      <div v-if="showTablePane" class="scl-table-pane">
        <div class="pane-title">
          <span>Data set entries</span>
          <span v-if="tableRootNode" class="pane-subtitle">for {{ tableRootNode.name }}</span>
        </div>
        <div class="pane-body">
          <div v-if="state.isLoading" class="table-placeholder">Loading...</div>
          <div v-else-if="!displaySclTreeData.length" class="table-placeholder">
            Import an SCL file to view data.
          </div>
          <div v-else-if="!tableRootNode" class="table-placeholder">
            Select a node in the tree to view its subtree.
          </div>
          <div v-else class="table-area">
            <table class="scl-detail-table" :class="{ 'table-resized': hasUserResized }" :style="tableColumnStyles">
              <thead>
                <tr>
                  <th class="name-col">
                    <div class="name-header">
                      <span>Name</span>
                      <div class="name-search" ref="nameSearch" @click.stop>
                        <button
                          type="button"
                          class="filter-toggle"
                          @click.stop="toggleFilterMenu"
                          title="Filter modes"
                        >
                          <i class="fa-solid fa-filter"></i>
                          <i class="fa-solid fa-caret-down"></i>
                        </button>
                        <input
                          v-model="searchQuery"
                          type="text"
                          class="search-input"
                          placeholder="Search or filter results..."
                        />
                        <div class="selected-filters">
                          <span
                            v-for="opt in selectedFilterOptions"
                            :key="opt.key"
                            class="filter-badge selectable"
                            title="Remove"
                            @click.stop="toggleFilterOption(opt.key)"
                          >
                            {{ opt.label }}
                            <span class="badge-close">×</span>
                          </span>
                        </div>
                        <button type="button" class="search-btn" title="Search">
                          <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <div v-if="filterOpen" class="filter-dropdown">
                          <button
                            v-for="opt in filterOptions"
                            :key="opt.key"
                            type="button"
                            class="filter-option"
                            :class="{ active: isFilterSelected(opt.key) }"
                            @click.stop="toggleFilterOption(opt.key)"
                          >
                            <span class="filter-badge">{{ opt.label }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="resizer-handle" @mousedown="startTableResize($event, 0)"></div>
                  </th>
                  <th>
                    Description
                    <div class="resizer-handle" @mousedown="startTableResize($event, 1)"></div>
                  </th>
                  <th class="value-col">
                    Value
                    <div class="resizer-handle" @mousedown="startTableResize($event, 2)"></div>
                  </th>
                </tr>
              </thead>
              <tbody v-if="tableRows.length">
                <tr
                  v-for="row in tableRows"
                  :key="row.key"
                  :class="{ 'selected-row': row.id === tableFocusedNodeId }"
                  @click="setTableFocus(row.node)"
                >
                  <td class="name-col">
                    <div class="name-cell" :style="{ paddingLeft: row.padding + 'px' }">
                      <button
                        v-if="row.hasChildren"
                        class="toggle-btn"
                        type="button"
                        @click.stop="toggleTableNode(row.node)"
                        :aria-label="row.expanded ? 'Collapse' : 'Expand'"
                        :title="row.expanded ? 'Collapse' : 'Expand'"
                      >
                        <i
                          class="fa-solid fa-caret-right caret"
                          :class="{ rotated: row.expanded }"
                        ></i>
                      </button>
                      <span v-else class="toggle-spacer"></span>

                      <span
                        v-if="row.badge"
                        class="mode-badge"
                        :class="'badge-' + row.badge.toLowerCase()"
                      >{{ row.badge }}</span>
                      <span class="name-text">{{ row.name }}</span>
                    </div>
                  </td>
                  <td class="desc-cell">
                    {{ row.description }}
                  </td>
                  <td class="value-col value-cell">
                    {{ formatCellValue(row.value) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TreeNode from "@/views/common/TreeNode.vue";
import { useSclImportState } from "@/helpers/sclManage/useSclImportState";
import { useSclTree } from "@/helpers/sclManage/useSclTree";
import { useSclTable } from "@/helpers/sclManage/useSclTable";

export default {
  name: 'SclImportView',
  components: {
    TreeNode
  },
  inject: {
    sclImportStore: { default: null },
  },
  emits: ["open-subtree-tab", "control-block-update"],
  props: {
    mode: {
      type: String,
      default: 'global'
    },
    title: {
      type: String,
      default: ''
    },
    // `split`: tree + table (default).
    // `tree`: tree only (used for ActivityBar "SCL Import" left pane).
    // `table`: table only (used in tab content).
    layout: {
      type: String,
      default: "split",
      validator: (v) => ["split", "tree", "table"].includes(v),
    },
  },
  data() {
    return {
      tableFocusedNodeId: null,
      columnWidths: [],
      hasUserResized: false,
      resizingCol: null,
      resizeStartX: 0,
      resizeStartWidth: 0,
      searchQuery: "",
      filterOpen: false,
      filterOptions: [
        { key: "ld", label: "LD" },
        { key: "ln", label: "LN" },
        { key: "do", label: "DO" },
        { key: "da", label: "DA" },
      ],
      selectedFilterKeys: [],
      // Table expand/collapse must be independent from the SCL tree expand/collapse.
      tableExpandedById: {},
      // Used when this component isn't backed by an injected global store.
      localState: {
        sclTreeData: [],
        selectedNodes: [],
        isLoading: false,
        fileName: "",
        tableRootNode: null,
      },
    };
  },
  computed: {
    usingSharedStore() {
      return this.mode === "global" && !!this.sclImportStore;
    },
    tableColumnStyles() {
      if (!this.hasUserResized || !Array.isArray(this.columnWidths) || !this.columnWidths.length) {
        return {};
      }
      const styles = {};
      this.columnWidths.forEach((w, idx) => {
        styles[`--col-${idx + 1}`] = `${w}px`;
      });
      return styles;
    },
    state() {
      return this.usingSharedStore ? this.sclImportStore : this.localState;
    },
    showTreePane() {
      return this.layout !== "table";
    },
    showTablePane() {
      return this.layout !== "tree";
    },
    treePaneTitle() {
      if (this.title) return this.title;
      if (this.mode === "ied") return "SCL Tree";
      return "SCL IMPORT";
    },
    displaySclTreeData() {
      if (!Array.isArray(this.state.sclTreeData) || !this.state.sclTreeData.length) return [];
      const root = this.state.sclTreeData[0];
      if (root && root.mode === "root" && Array.isArray(root.children)) {
        return root.children;
      }
      return this.state.sclTreeData;
    },
    tableRootNode() {
      return this.state.tableRootNode || null;
    },
    tableRows() {
      if (!this.tableRootNode) return [];
      const kids = Array.isArray(this.tableRootNode.children)
        ? this.tableRootNode.children
        : [];
      const top = kids.length ? kids : [this.tableRootNode];
      return this.flattenTableRows(top, 0);
    },
    selectedFilterOptions() {
      return this.filterOptions.filter((opt) =>
        this.selectedFilterKeys.includes(opt.key)
      );
    },
  },
  watch: {
    tableRootNode: {
      immediate: true,
      handler(next) {
        // When selection changes (from the SCL tree), reset table UI state.
        this.tableFocusedNodeId = next?.id ?? null;
        this.tableExpandedById = {};
      },
    },
  },
  methods: {
    ...useSclImportState(),
    ...useSclTree(),
    ...useSclTable(),
    toggleFilterMenu() {
      this.filterOpen = !this.filterOpen;
    },
    isFilterSelected(key) {
      return this.selectedFilterKeys.includes(key);
    },
    toggleFilterOption(key) {
      if (this.selectedFilterKeys.includes(key)) {
        this.selectedFilterKeys = this.selectedFilterKeys.filter((k) => k !== key);
      } else {
        this.selectedFilterKeys = [...this.selectedFilterKeys, key];
      }
    },
  },
  mounted() {
    this._onFilterOutsideClick = (event) => {
      const el = this.$refs.nameSearch;
      if (el && !el.contains(event.target)) {
        this.filterOpen = false;
      }
    };
    document.addEventListener("click", this._onFilterOutsideClick);
  },
  beforeUnmount() {
    if (this._onFilterOutsideClick) {
      document.removeEventListener("click", this._onFilterOutsideClick);
    }
    document.removeEventListener("mousemove", this.onTableResize);
    document.removeEventListener("mouseup", this.stopTableResize);
  }
};
</script>

<style scoped>
.scl-import-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.choose-file-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(30, 60, 114, 0.3);
}

.choose-file-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(30, 60, 114, 0.4);
}

.choose-file-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.choose-file-btn i {
  font-size: 14px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f0f7ff;
  border: 1px solid #d0e3ff;
  border-radius: 6px;
  font-size: 12px;
  color: #1e3c72;
}

.file-info i:first-child {
  color: #2a5298;
}

.file-info span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-icon {
  cursor: pointer;
  color: #999;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-icon:hover {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.scl-main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
  gap: 12px;
  padding: 0;
  overflow: hidden;
}
.scl-main.single-pane {
  grid-template-columns: 1fr;
}

@media (max-width: 900px) {
  .scl-main {
    grid-template-columns: 1fr;
  }
}

.scl-tree-pane,
.scl-table-pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}

.pane-title {
  height: 40px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  font-weight: 700;
  color: #444;
  background: linear-gradient(180deg, #f6f7f8 0%, #ffffff 100%);
  border-bottom: 1px solid #e6e6e6;
  font-size: 12px;
}

.pane-subtitle {
  font-weight: 600;
  color: #777;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pane-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px;
}

.scl-tree-pane .pane-body {
  padding: 6px 0;
}

.scl-table-pane .pane-body {
  padding: 0;
  overflow-x: hidden;
}

.scl-tree-pane :deep(li > ul) {
  padding-left: 8px !important;
}

.scl-tree-pane .pane-title {
  justify-content: center;
}

.pane-actions {
  flex: none;
  padding: 12px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fff;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: #666;
}

.loading-state i {
  font-size: 32px;
  color: #1e3c72;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: #999;
  text-align: center;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-state .hint {
  font-size: 12px;
  color: #bbb;
}

.scl-tree {
  list-style: none;
  padding: 0;
  margin: 0;
}

.table-placeholder {
  padding: 12px;
  color: #777;
  font-style: italic;
}

.table-area {
  min-width: 0;
}

.scl-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}

.scl-detail-table.table-resized th:nth-child(1),
.scl-detail-table.table-resized td:nth-child(1) {
  width: var(--col-1);
}

.scl-detail-table.table-resized th:nth-child(2),
.scl-detail-table.table-resized td:nth-child(2) {
  width: var(--col-2);
}

.scl-detail-table.table-resized th:nth-child(3),
.scl-detail-table.table-resized td:nth-child(3) {
  width: var(--col-3);
}

.scl-detail-table th,
.scl-detail-table td {
  border: 1px solid #d8d8d8;
  padding: 6px 8px;
  text-align: left;
  vertical-align: top;
}

.name-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.name-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fff;
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}

.filter-toggle {
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #555;
  font-size: 12px;
  padding: 2px 4px;
}

.search-input {
  border: none;
  outline: none;
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  color: #333;
  background: transparent;
}

.selected-filters {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid #c6d6ef;
  color: #1b4ea0;
  font-weight: 700;
  font-size: 11px;
  background: #e9f1ff;
  position: relative;
}

.filter-badge.selectable {
  padding-right: 10px;
  cursor: pointer;
}

.badge-close {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #9fb7e6;
  color: #2b5fbf;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease;
}

.filter-badge.selectable:hover .badge-close {
  opacity: 1;
  visibility: visible;
}

.search-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #666;
  padding: 2px 4px;
}

.filter-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  z-index: 20;
}

.filter-option {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 2px;
}

.filter-option.active .filter-badge {
  background: #d9ecff;
  border-color: #4c9aff;
  color: #1d5fbf;
}

.scl-detail-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #e1e1e1;
}

.scl-detail-table thead th {
  border-top: 0;
}

.scl-detail-table th {
  position: relative;
}

.resizer-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 7px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
  z-index: 2;
  transition: background-color 0.2s;
}

.scl-detail-table th:hover .resizer-handle {
  background-color: #ddd;
}

.resizer-handle:hover {
  background-color: #409eff;
}

.name-col {
  width: 40%;
}

.value-col {
  width: 25%;
}

.desc-cell,
.value-cell {
  white-space: normal;
  word-break: break-word;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}

.toggle-btn {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: #666;
}

.toggle-btn:hover {
  color: #146ebe;
}

.toggle-spacer {
  width: 18px;
  height: 18px;
  display: inline-block;
}

.caret {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.caret.rotated {
  transform: rotate(90deg);
}

.mode-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 16px;
  min-width: 16px;
  padding: 0 3px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
  color: #fff;
  background: #146ebe;
  flex: none;
  white-space: nowrap;
}

.badge-da,
.badge-do {
  background: #146ebe;
}

.badge-ln,
.badge-ld,
.badge-ds,
.badge-sg,
.badge-g,
.badge-r {
  background: #5a6b7d;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-row td {
  background: #d7ebff;
}
</style>
