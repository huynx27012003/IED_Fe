<template>
  <div class="tree-node">
    <div class="tree-node-row" :style="{ paddingLeft: `${depth * 14 + 8}px` }" @click="toggleExpand">
      <span class="tree-node-arrow" :class="{ empty: !hasChildren }">
        {{ hasChildren ? (expanded ? '▼' : '▶') : '•' }}
      </span>
      <span class="tree-node-name" :class="nodeNameClass">{{ displayName }}</span>
    </div>

    <div v-if="hasChildren && expanded">
      <SettingCompareTreeNode
        v-for="(child, idx) in normalizedChildren"
        :key="child.id || `${displayName}-child-${idx}`"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "SettingCompareTreeNode",
  props: {
    node: { type: [Object, String], required: true },
    depth: { type: Number, default: 0 },
  },
  data() {
    return {
      expanded: true,
    };
  },
  computed: {
    displayName() {
      if (typeof this.node === "string") return this.node;
      return this.node?.name || this.node?.id || "(Unnamed node)";
    },
    normalizedChildren() {
      if (typeof this.node === "string") return [];
      const children = Array.isArray(this.node?.children) ? this.node.children : [];
      const hiddenModes = new Set(["pcDataObject", "dataObject", "dataAttribute"]);
      return children.filter((child) => {
        if (typeof child === "string") return true;
        if (hiddenModes.has(child?.mode)) return false;
        const name = String(child?.name ?? "").toLowerCase().trim();
        return name !== "operation";
      });
    },
    hasChildren() {
      return this.normalizedChildren.length > 0;
    },
    nodeNameClass() {
      if (typeof this.node === "string") return {};
      const status = String(this.node?.compareStatus ?? "").toUpperCase();
      const isMissing = status === "MISSING";
      return {
        "name-missing": isMissing,
        "name-has-diff": !isMissing && status === "DIFF",
      };
    },
  },
  methods: {
    toggleExpand() {
      if (!this.hasChildren) return;
      this.expanded = !this.expanded;
    },
  },
};
</script>

<style scoped>
.tree-node-row {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: default;
  user-select: none;
}

.tree-node-row:hover {
  background: #f5f8fc;
}

.tree-node-arrow {
  width: 14px;
  text-align: center;
  color: #4a5568;
  font-size: 11px;
}

.tree-node-arrow.empty {
  color: #9aa5b1;
}

.tree-node-name {
  font-size: 13px;
  color: #1f2937;
  white-space: nowrap;
}

.tree-node-name.name-has-diff {
  color: #c62828;
}

.tree-node-name.name-missing {
  color: #1565c0;
}
</style>
