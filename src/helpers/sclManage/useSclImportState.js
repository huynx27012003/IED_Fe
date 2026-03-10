import { importScl } from "@/api/scl";

export function useSclImportState() {
  return {
    emitControlBlockUpdate(node) {
      this.$emit("control-block-update", node || null);
    },
    triggerFileInput() {
      const input = this.$refs.sclFileInput;
      if (input) input.click();
    },
    maybeOpenSubtreeTab() {
      if (this.mode === "global" && this.layout !== "table") {
        this.$emit("open-subtree-tab");
      }
    },
    async onFileSelected(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;

      this.state.fileName = file.name;
      this.state.isLoading = true;

      try {
        const response = await importScl(file);
        const normalized = this.normalizeSclTree(response);
        this.state.sclTreeData = normalized ? [normalized] : [];

        const firstVisible =
          normalized && normalized.mode === "root" && Array.isArray(normalized.children)
            ? normalized.children[0]
            : normalized;
        if (firstVisible) {
          this.state.selectedNodes = [firstVisible];
          this.state.tableRootNode = firstVisible;
          this.tableFocusedNodeId = firstVisible.id;
          this.tableExpandedById = {};
          this.emitControlBlockUpdate(firstVisible);
          this.maybeOpenSubtreeTab();
        } else {
          this.state.selectedNodes = [];
          this.state.tableRootNode = null;
          this.tableFocusedNodeId = null;
          this.tableExpandedById = {};
          this.emitControlBlockUpdate(null);
        }
      } catch (err) {
        console.error("Import SCL failed:", err);
        this.$message?.error?.("Failed to import SCL file");
        this.state.sclTreeData = [];
        this.state.selectedNodes = [];
        this.state.tableRootNode = null;
        this.tableFocusedNodeId = null;
        this.tableExpandedById = {};
        this.emitControlBlockUpdate(null);
      } finally {
        this.state.isLoading = false;
        if (event?.target) event.target.value = "";
      }
    },
    normalizeSclTree(root) {
      if (!root) return null;
      let counter = 0;
      const build = (node, path) => {
        if (!node) return null;
        const name = node.name || "Node";
        const mode = node.mode || "folder";
        const description = node.description ?? null;
        const value = node.value ?? null;
        let controlBlock =
          node.controlBlock ??
          node.controlblock ??
          node.control_block ??
          null;
        if (controlBlock && typeof controlBlock === "string") {
          try {
            controlBlock = JSON.parse(controlBlock);
          } catch {
            controlBlock = null;
          }
        }
        const id =
          node.id ||
          `scl-${path.join("-") || "root"}-${name}`
            .replace(/\s+/g, "_")
            .toLowerCase() +
          `-${counter++}`;
        const children = Array.isArray(node.children) ? node.children : [];
        const builtChildren = children
          .map((child, idx) => build(child, [...path, `${name}-${idx}`]))
          .filter(Boolean);
        const builtNode = {
          id: String(id),
          name,
          mode,
          description,
          value,
          isSclTree: true,
          controlBlock,
          expanded: false,
          children: builtChildren,
        };
        builtChildren.forEach((child) => {
          child.parentNode = builtNode;
        });
        return builtNode;
      };
      return build(root, []);
    },
    clearFile() {
      this.state.sclTreeData = [];
      this.state.fileName = "";
      this.state.selectedNodes = [];
      this.state.tableRootNode = null;
      this.tableFocusedNodeId = null;
      this.tableExpandedById = {};
      this.emitControlBlockUpdate(null);
    },
  };
}
