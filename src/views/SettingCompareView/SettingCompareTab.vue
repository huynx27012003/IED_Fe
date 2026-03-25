<template>
  <div class="setting-compare-tab">
    <div v-if="loading" class="status">Loading compare tree...</div>
    <div v-else-if="errorMessage" class="status error">{{ errorMessage }}</div>

    <div v-else class="compare-layout">
      <div class="tree-panel">
        <div class="tree-title">Settings {{ leftTreeName }}</div>
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
          <div v-else class="empty">No left tree data</div>
        </div>
      </div>

      <div class="tree-panel">
        <div class="tree-title">Settings {{ rightTreeName }}</div>
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
          <div v-else class="empty">No right tree data</div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="showSubtreeDialog"
      title="Subtree Compare"
      width="92vw"
      append-to-body
      class="subtree-compare-dialog"
    >
      <div class="subtree-dialog-layout">
        <div class="subtree-table-panel">
          <div class="subtree-table-title">{{ leftSubtreeTitle }}</div>
          <div class="subtree-table-body">
            <table class="parameter-table compare-subtree-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in leftSubtreeRows" :key="`left-subtree-${row.key}`" :class="{ 'paramgroup-header': row.isGroup }">
                  <td :style="{ paddingLeft: row.padding + 'px' }">{{ row.name }}</td>
                  <td v-if="!row.isGroup" :class="row.valueClass">{{ row.value }}</td>
                  <td v-if="!row.isGroup">{{ row.unit }}</td>
                  <td v-if="!row.isGroup">{{ row.minVal }}</td>
                  <td v-if="!row.isGroup">{{ row.maxVal }}</td>
                  <td v-if="!row.isGroup">{{ row.description }}</td>
                  <td v-if="row.isGroup" colspan="5"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="subtree-table-panel">
          <div class="subtree-table-title">{{ rightSubtreeTitle }}</div>
          <div class="subtree-table-body">
            <table class="parameter-table compare-subtree-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rightSubtreeRows" :key="`right-subtree-${row.key}`" :class="{ 'paramgroup-header': row.isGroup }">
                  <td :style="{ paddingLeft: row.padding + 'px' }">{{ row.name }}</td>
                  <td v-if="!row.isGroup" :class="row.valueClass">{{ row.value }}</td>
                  <td v-if="!row.isGroup">{{ row.unit }}</td>
                  <td v-if="!row.isGroup">{{ row.minVal }}</td>
                  <td v-if="!row.isGroup">{{ row.maxVal }}</td>
                  <td v-if="!row.isGroup">{{ row.description }}</td>
                  <td v-if="row.isGroup" colspan="5"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showSubtreeDialog = false">Close</el-button>
      </template>
    </el-dialog>
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
      return `Settings ${this.selectedLeftSubtreeNode?.name || this.leftTreeName}`;
    },
    rightSubtreeTitle() {
      return `Settings ${this.selectedRightSubtreeNode?.name || this.rightTreeName}`;
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
        return {
          id: `${fallbackPrefix}-${node}`,
          name: node,
          children: [],
        };
      }

      const rawChildren = Array.isArray(node.children) ? node.children : [];
      return {
        ...node,
        id: node.id || node.mrid || `${fallbackPrefix}-${node.name || "unknown"}`,
        name: node.name || node.id || "(Unnamed node)",
        expanded: depth === 0,
        showParamTree: node.mode === "ied" ? true : node.showParamTree,
        showAllGroups: node.mode === "ied" ? true : node.showAllGroups,
        groupVisibleCount:
          node.mode === "ied"
            ? Number.MAX_SAFE_INTEGER
            : node.groupVisibleCount,
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
        for (let i = children.length - 1; i >= 0; i -= 1) {
          stack.push(children[i]);
        }
      }
      return null;
    },
    formatCellValue(v) {
      if (v == null) return "";
      if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(1);
      return String(v);
    },
    buildSubtreeRows(rootNode) {
      if (!rootNode || typeof rootNode === "string") return [];
      const rows = [];
      const walk = (node, depth) => {
        if (!node || typeof node === "string") return;
        const children = Array.isArray(node.children) ? node.children : [];
        const status = String(node.compareStatus || "").toUpperCase();
        rows.push({
          key: `${node.id || node.name || "node"}-${depth}-${rows.length}`,
          isGroup: children.length > 0,
          name: node.name || "",
          padding: depth * 20 + 8,
          value: this.formatCellValue(node.value),
          unit: this.formatCellValue(node.unit),
          minVal: this.formatCellValue(node.minVal),
          maxVal: this.formatCellValue(node.maxVal),
          description: this.formatCellValue(node.description),
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
        console.error("Load setting compare trees failed:", error);
        this.errorMessage = "Failed to load compare tree data";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.setting-compare-tab {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.status {
  border: 1px solid #dde3ea;
  border-radius: 6px;
  background: #fff;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f6b7a;
}

.status.error {
  color: #b42318;
}

.compare-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  min-height: 0;
  flex: 1;
}

.tree-panel {
  border: 1px solid #cfd8e3;
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.tree-title {
  height: 30px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid #dbe2eb;
  background: #f4f7fb;
  font-size: 13px;
  font-weight: 600;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 4px 0 8px;
}

.compare-tree-root {
  list-style: none;
  margin: 0;
  padding: 0 8px;
}

.empty {
  color: #7a8797;
  font-size: 13px;
  padding: 10px;
}

.subtree-dialog-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  height: 58vh;
  min-height: 0;
  overflow: hidden;
}

.subtree-table-panel {
  border: 1px solid #dbe2eb;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.subtree-table-title {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: #f4f7fb;
  border-bottom: 1px solid #dbe2eb;
  font-size: 13px;
  font-weight: 600;
}

.subtree-table-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
}

:deep(.subtree-compare-dialog .el-dialog__body) {
  overflow: hidden;
  padding: 10px;
}

.compare-subtree-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.compare-subtree-table th:nth-child(1),
.compare-subtree-table td:nth-child(1) {
  width: 46%;
}

.compare-subtree-table th:nth-child(2),
.compare-subtree-table td:nth-child(2) {
  width: 10%;
}

.compare-subtree-table th:nth-child(3),
.compare-subtree-table td:nth-child(3),
.compare-subtree-table th:nth-child(4),
.compare-subtree-table td:nth-child(4),
.compare-subtree-table th:nth-child(5),
.compare-subtree-table td:nth-child(5) {
  width: 5%;
}

.compare-subtree-table th:nth-child(6),
.compare-subtree-table td:nth-child(6) {
  width: 28%;
}

.compare-subtree-table th,
.compare-subtree-table td {
  border: 1px solid #e2e6ea;
  padding: 6px 8px;
  white-space: normal;
  word-break: break-word;
  overflow: visible;
  text-overflow: clip;
}

.compare-subtree-table th {
  background: #f7f8fa;
  font-weight: 600;
  text-align: left;
}

.paramgroup-header td {
  background: #f5f8ff;
  font-weight: 600;
}

.value-has-diff {
  color: #c62828;
  font-weight: 700;
}

.value-missing {
  color: #1565c0;
  font-weight: 700;
}
</style>
