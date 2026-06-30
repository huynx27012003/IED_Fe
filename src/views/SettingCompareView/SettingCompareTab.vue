<template>
  <div class="setting-compare-tab">
    <div v-if="loading" class="state-block">
      <i class="fa-solid fa-spinner fa-spin state-icon"></i>
      <span>{{ $tUi('loadingCompareTree') }}</span>
    </div>
    <div v-else-if="errorMessage" class="state-block state-block--error">
      <i class="fa-solid fa-circle-exclamation state-icon"></i>
      <span>{{ errorMessage }}</span>
    </div>

    <div v-else class="compare-layout">
      <div class="tree-panel">
        <div class="tree-panel-header">
          <i class="fa-solid fa-diagram-project header-icon"></i>
          <span class="tree-panel-title">{{ $tUi('settingsLeft', { name: leftTreeName }) }}</span>
        </div>
        <div class="tree-body">
          <ul v-if="leftTree" class="compare-tree-root">
            <TreeNode
              :node="leftTree"
              :selectedNodes="[]"
              :selectedParameterId="''"
              :hide-operation-off="false"
              :show-leaf-dblclick-popup="true"
              @toggle-node="toggleCompareNode"
              @fetch-children="noop"
              @node-row-dblclick="openSubtreeCompareDialog('left', $event)"
            />
          </ul>
          <div v-else class="empty-state">
            <i class="fa-regular fa-folder-open" style="font-size: 20px; opacity: 0.4;"></i>
            <span>{{ $tUi('noLeftTree') }}</span>
          </div>
        </div>
      </div>

      <div class="tree-panel">
        <div class="tree-panel-header">
          <i class="fa-solid fa-diagram-project header-icon"></i>
          <span class="tree-panel-title">{{ $tUi('settingsRight', { name: rightTreeName }) }}</span>
        </div>
        <div class="tree-body">
          <ul v-if="rightTree" class="compare-tree-root">
            <TreeNode
              :node="rightTree"
              :selectedNodes="[]"
              :selectedParameterId="''"
              :hide-operation-off="false"
              :show-leaf-dblclick-popup="true"
              @toggle-node="toggleCompareNode"
              @fetch-children="noop"
              @node-row-dblclick="openSubtreeCompareDialog('right', $event)"
            />
          </ul>
          <div v-else class="empty-state">
            <i class="fa-regular fa-folder-open" style="font-size: 20px; opacity: 0.4;"></i>
            <span>{{ $tUi('noRightTree') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom dialog overlay styled like AssetInfoView -->
    <teleport to="body">
      <transition name="dialog-fade">
        <div v-if="showSubtreeDialog" class="custom-dialog-overlay" @click.self="showSubtreeDialog = false">
          <div class="custom-dialog">

            <!-- Dark topbar identical to AssetInfoView -->
            <div class="dialog-topbar">
              <div class="dialog-topbar-left">
              <div class="dialog-mode-badge">{{ $tUi('compare') }}</div>
              <span class="dialog-title">{{ $tUi('subtreeCompare') }}</span>
              </div>
              <button type="button" class="dialog-close-btn" @click="showSubtreeDialog = false" :aria-label="$tUi('close')">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Body: two panels side by side -->
            <div class="dialog-body">
              <div class="subtree-table-panel">
                <!-- Section header identical to AssetInfoView section-header -->
                <div class="dialog-section-header">
                  <div class="dialog-section-title">
                    <i class="fa-solid fa-table-list section-icon"></i>
                    {{ leftSubtreeTitle }}
                  </div>
                </div>
                <div class="subtree-table-body">
                    <table class="compare-subtree-table">
                    <thead>
                      <tr>
                        <th>{{ $tUi('parameter') }}</th>
                        <th>{{ $tUi('value') }}</th>
                        <th>{{ $tUi('unit') }}</th>
                        <th>{{ $tUi('min') }}</th>
                        <th>{{ $tUi('max') }}</th>
                        <th>{{ $tUi('reference') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="row in leftSubtreeRows"
                        :key="`left-subtree-${row.key}`"
                        :class="{ 'paramgroup-header': row.isGroup }"
                      >
                        <td :style="{ paddingLeft: row.padding + 'px' }">{{ row.name }}</td>
                        <template v-if="!row.isGroup && !row.isLockoutSignal">
                          <td :class="row.valueClass">{{ row.value }}</td>
                          <td>{{ row.unit }}</td>
                          <td>{{ row.minVal }}</td>
                          <td>{{ row.maxVal }}</td>
                          <td>{{ row.description }}</td>
                        </template>
                        <td v-if="!row.isGroup && row.isLockoutSignal" :class="row.valueClass" colspan="5">{{ row.combinedValue }}</td>
                        <td v-if="row.isGroup" colspan="5"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="subtree-table-panel">
                <div class="dialog-section-header">
                  <div class="dialog-section-title">
                    <i class="fa-solid fa-table-list section-icon"></i>
                    {{ rightSubtreeTitle }}
                  </div>
                </div>
                <div class="subtree-table-body">
                    <table class="compare-subtree-table">
                    <thead>
                      <tr>
                        <th>{{ $tUi('parameter') }}</th>
                        <th>{{ $tUi('value') }}</th>
                        <th>{{ $tUi('unit') }}</th>
                        <th>{{ $tUi('min') }}</th>
                        <th>{{ $tUi('max') }}</th>
                        <th>{{ $tUi('reference') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="row in rightSubtreeRows"
                        :key="`right-subtree-${row.key}`"
                        :class="{ 'paramgroup-header': row.isGroup }"
                      >
                        <td :style="{ paddingLeft: row.padding + 'px' }">{{ row.name }}</td>
                        <template v-if="!row.isGroup && !row.isLockoutSignal">
                          <td :class="row.valueClass">{{ row.value }}</td>
                          <td>{{ row.unit }}</td>
                          <td>{{ row.minVal }}</td>
                          <td>{{ row.maxVal }}</td>
                          <td>{{ row.description }}</td>
                        </template>
                        <td v-if="!row.isGroup && row.isLockoutSignal" :class="row.valueClass" colspan="5">{{ row.combinedValue }}</td>
                        <td v-if="row.isGroup" colspan="5"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script>
import { getCompareSettingTrees } from "@/api/device";
import TreeNode from "@/views/common/TreeNode.vue";

export default {
  name: "SettingCompareTab",
  components: { TreeNode },
  props: {
    ownerData: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      loading: false,
      errorMessage: "",
      leftTree: null,
      rightTree: null,
      showSubtreeDialog: false,
      selectedLeftSubtreeNode: null,
      selectedRightSubtreeNode: null,
    };
  },
  computed: {
    sourceId() {
      return this.ownerData?.compareSourceId || "";
    },
    targetId() {
      return this.ownerData?.compareTargetId || "";
    },
    leftTreeName() {
      return this.leftTree?.name || this.ownerData?.compareSourceName || "Left IED";
    },
    rightTreeName() {
      return this.rightTree?.name || this.ownerData?.compareTargetName || "Right IED";
    },
    leftSubtreeRows() {
      return this.buildSubtreeRows(this.selectedLeftSubtreeNode);
    },
    rightSubtreeRows() {
      return this.buildSubtreeRows(this.selectedRightSubtreeNode);
    },
    leftSubtreeTitle() {
      return this.$tUi('settingsLeft', { name: this.selectedLeftSubtreeNode?.name || this.leftTreeName });
    },
    rightSubtreeTitle() {
      return this.$tUi('settingsRight', { name: this.selectedRightSubtreeNode?.name || this.rightTreeName });
    },
  },
  watch: {
    sourceId: {
      immediate: true,
      handler() {
        this.fetchCompareTrees();
      },
    },
    targetId() {
      this.fetchCompareTrees();
    },
  },
  methods: {
    normalizeTreeNode(node, fallbackPrefix = "node", depth = 0) {
      if (!node) return null;
      if (typeof node === "string") {
        return { id: `${fallbackPrefix}-${node}`, name: node, children: [] };
      }
      const rawChildren = Array.isArray(node.children) ? node.children : [];
      return {
        ...node,
        id: node.id || node.mrid || `${fallbackPrefix}-${node.name || "unknown"}`,
        name: node.name || node.id || "(Unnamed node)",
        expanded: depth === 0,
        showParamTree: node.mode === "ied" ? true : node.showParamTree,
        showAllGroups: node.mode === "ied" ? true : node.showAllGroups,
        groupVisibleCount: node.mode === "ied" ? Number.MAX_SAFE_INTEGER : node.groupVisibleCount,
        children: rawChildren
          .map((child, idx) => this.normalizeTreeNode(child, `${fallbackPrefix}-c${idx}`, depth + 1))
          .filter(Boolean),
      };
    },
    toggleCompareNode(node) {
      if (!node) return;
      node.expanded = !node.expanded;
    },
    findNodeById(root, id) {
      if (!root || !id) return null;
      const target = String(id);
      const stack = [root];
      while (stack.length) {
        const current = stack.pop();
        if (!current || typeof current === "string") continue;
        if (String(current.id) === target) return current;
        const children = Array.isArray(current.children) ? current.children : [];
        for (let i = children.length - 1; i >= 0; i -= 1) stack.push(children[i]);
      }
      return null;
    },
    formatCellValue(v) {
      if (v == null) return "";
      if (typeof v === "number" && Number.isFinite(v)) {
        const rounded = Math.round((v + Number.EPSILON) * 1000000) / 1000000;
        return rounded.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
      }
      return String(v);
    },
    buildSubtreeRows(rootNode) {
      if (!rootNode || typeof rootNode === "string") return [];
      const rows = [];
      const walk = (node, depth) => {
        if (!node || typeof node === "string") return;
        const children = Array.isArray(node.children) ? node.children : [];
        const status = String(node.compareStatus || "").toUpperCase();
        const val = this.formatCellValue(node.convertedValue ?? node.value);
        const unit = this.formatCellValue(node.convertedUnit ?? node.unit);
        const minVal = this.formatCellValue(node.convertedMinVal != null ? node.convertedMinVal : node.minVal);
        const maxVal = this.formatCellValue(node.convertedMaxVal != null ? node.convertedMaxVal : node.maxVal);
        const desc = this.formatCellValue(node.description);
        const isLockoutSig = /lockout/i.test(node.name || "");
        rows.push({
          key: `${node.id || node.name || "node"}-${depth}-${rows.length}`,
          isGroup: children.length > 0,
          name: node.name || "",
          padding: depth * 20 + 8,
          value: val,
          unit,
          minVal,
          maxVal,
          description: desc,
          isLockoutSignal: isLockoutSig,
          combinedValue: isLockoutSig
            ? [val, unit, minVal, maxVal, desc].filter(Boolean).join("  |  ")
            : "",
          valueClass: status === "MISSING" ? "value-missing" : status === "DIFF" ? "value-has-diff" : "",
        });
        children.forEach((child) => walk(child, depth + 1));
      };
      walk(rootNode, 0);
      return rows;
    },
    openSubtreeCompareDialog(side, node) {
      if (!node || typeof node === "string") return;
      const compareKey = node.compareKey ? String(node.compareKey) : "";
      let leftNode = null;
      let rightNode = null;
      if (side === "left") {
        leftNode = node;
        rightNode = compareKey ? this.findNodeById(this.rightTree, compareKey) : null;
      } else {
        rightNode = node;
        leftNode = compareKey ? this.findNodeById(this.leftTree, compareKey) : null;
      }
      this.selectedLeftSubtreeNode = leftNode;
      this.selectedRightSubtreeNode = rightNode;
      this.showSubtreeDialog = true;
    },
    noop() {},
    async fetchCompareTrees() {
      if (!this.sourceId || !this.targetId) return;
      this.loading = true;
      this.errorMessage = "";
      this.leftTree = null;
      this.rightTree = null;
      try {
        const response = await getCompareSettingTrees(this.sourceId, this.targetId);
        const payload = response?.data ?? response;
        this.leftTree = this.normalizeTreeNode(payload?.leftTree, "left");
        this.rightTree = this.normalizeTreeNode(payload?.rightTree, "right");
      } catch (error) {
        this.errorMessage = this.$apiErrorMessage?.(error, "Failed to load compare tree data") || "Failed to load compare tree data";
        console.error(this.errorMessage, error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.setting-compare-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  padding: 12px;
  gap: 12px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ─── State blocks ───────────────────────────────── */
.state-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  font-size: 13px;
  color: #6b7280;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.state-block--error { color: #dc2626; }
.state-icon { font-size: 15px; opacity: 0.7; }

/* ─── Compare layout ─────────────────────────────── */
.compare-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

/* ─── Tree panel ─────────────────────────────────── */
.tree-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.tree-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.header-icon {
  font-size: 13px;
  color: #6b7280;
}

.tree-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 6px 0 10px;
}

.compare-tree-root {
  list-style: none;
  margin: 0;
  padding: 0 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  min-height: 80px;
  color: #9ca3af;
  font-size: 13px;
}

/* ─── Custom dialog overlay ──────────────────────── */
.custom-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.custom-dialog {
  display: flex;
  flex-direction: column;
  width: 95vw;
  max-width: 1600px;
  height: 80vh;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Dark topbar — identical to AssetInfoView */
.dialog-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  flex-shrink: 0;
}

.dialog-topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.dialog-mode-badge {
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

.dialog-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-close-btn {
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

.dialog-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

/* Dialog body — two panels side by side */
.dialog-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Section header — identical to AssetInfoView section-header */
.dialog-section-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
}

.dialog-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.section-icon {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

/* Two table panels */
.subtree-table-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid #e2e8f0;
}

.subtree-table-panel:last-child {
  border-right: none;
}

.subtree-table-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
}

/* Transition */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-fade-enter-active .custom-dialog,
.dialog-fade-leave-active .custom-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
.dialog-fade-enter-from .custom-dialog {
  transform: scale(0.97) translateY(-8px);
}

/* ─── Compare table ──────────────────────────────── */
.compare-subtree-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12.5px;
}

.compare-subtree-table th:nth-child(1),
.compare-subtree-table td:nth-child(1) { width: 36%; }
.compare-subtree-table th:nth-child(2),
.compare-subtree-table td:nth-child(2) { width: 22%; }
.compare-subtree-table th:nth-child(3),
.compare-subtree-table td:nth-child(3),
.compare-subtree-table th:nth-child(4),
.compare-subtree-table td:nth-child(4),
.compare-subtree-table th:nth-child(5),
.compare-subtree-table td:nth-child(5) { width: 7%; }
.compare-subtree-table th:nth-child(6),
.compare-subtree-table td:nth-child(6) { width: 21%; }

.compare-subtree-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 8px 10px;
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

.compare-subtree-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f1f5f9;
  color: #374151;
  white-space: normal;
  word-break: break-word;
}

.compare-subtree-table tbody tr:hover td {
  background: #f9fafb;
}

.paramgroup-header td {
  background: #eff6ff;
  font-weight: 600;
  color: #1e40af;
  font-size: 12px;
}

.paramgroup-header:hover td {
  background: #dbeafe !important;
}

.value-has-diff {
  color: #dc2626 !important;
  font-weight: 700;
}

.value-missing {
  color: #1d4ed8;
  font-weight: 700;
}
</style>
