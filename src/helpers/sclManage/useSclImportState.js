import { getSclSnapshot, importScl, listSclImports } from "@/api/scl";

export function useSclImportState() {
  return {
    resolveSclPayload(input) {
      let current = input;

      for (let i = 0; i < 8; i += 1) {
        if (!current) return null;

        if (Array.isArray(current)) {
          return current;
        }

        if (typeof current !== "object") return null;

        if (
          Object.prototype.hasOwnProperty.call(current, "name") ||
          Object.prototype.hasOwnProperty.call(current, "children") ||
          Object.prototype.hasOwnProperty.call(current, "mode")
        ) {
          return current;
        }

        if (Object.prototype.hasOwnProperty.call(current, "data")) {
          current = current.data;
          continue;
        }

        if (Object.prototype.hasOwnProperty.call(current, "result")) {
          current = current.result;
          continue;
        }

        if (Array.isArray(current.items)) {
          return current.items;
        }

        return null;
      }

      return null;
    },
    resolveSclRoot(input) {
      const payload = this.resolveSclPayload(input);
      if (Array.isArray(payload)) return payload[0] || null;
      return payload;
    },
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

      if (this.mode === "ied" && (this.iedId == null || this.iedId === "")) {
        this.$message?.warning?.("IED id is missing for SCL import");
      }

      this.state.fileName = file.name;
      this.state.isLoading = true;

      try {
        const response = await importScl(file, this.mode === "ied" ? this.iedId : null);

        if (this.mode === "global") {
          // In global SCL IMPORT view, keep showing file list instead of rendering tree.
          this.state.sclTreeData = [];
          this.state.selectedNodes = [];
          this.state.tableRootNode = null;
          this.baseTableRootNode = null;
          this.includeRootInTable = false;
          this.tableFocusedNodeId = null;
          this.tableExpandedById = {};
          this.state.fileName = "";
          this.emitControlBlockUpdate(null);
          this.loadSclImportList();
          this.$message?.success?.("SCL imported");
          return;
        }

        const root = this.resolveSclRoot(response);
        const normalized = this.normalizeSclTree(root);
        this.state.sclTreeData = normalized ? [normalized] : [];

        const firstVisible =
          normalized && normalized.mode === "root" && Array.isArray(normalized.children)
            ? normalized.children[0]
            : normalized;
        if (firstVisible) {
          this.state.selectedNodes = [firstVisible];
          this.state.tableRootNode = firstVisible;
          this.baseTableRootNode = firstVisible;
          this.includeRootInTable = false;
          this.tableFocusedNodeId = firstVisible.id;
          this.tableExpandedById = {};
          this.emitControlBlockUpdate(firstVisible);
          this.maybeOpenSubtreeTab();
        } else {
          this.state.selectedNodes = [];
          this.state.tableRootNode = null;
          this.baseTableRootNode = null;
          this.includeRootInTable = false;
          this.tableFocusedNodeId = null;
          this.tableExpandedById = {};
          this.emitControlBlockUpdate(null);
        }

      } catch (err) {
        this.$notifyApiError?.(err, "Failed to import SCL file");
        this.state.sclTreeData = [];
        this.state.selectedNodes = [];
        this.state.tableRootNode = null;
        this.baseTableRootNode = null;
        this.includeRootInTable = false;
        this.tableFocusedNodeId = null;
        this.tableExpandedById = {};
        this.emitControlBlockUpdate(null);
      } finally {
        this.state.isLoading = false;
        if (event?.target) event.target.value = "";
      }
    },
    async loadSclImportList() {
      if (this.mode !== "global") return;

      this.state.isListLoading = true;
      try {
        const response = await listSclImports();
        const payload = response?.data ?? response;
        this.state.sclImportList = Array.isArray(payload) ? payload : [];
      } catch (err) {
        console.error(this.$apiErrorMessage?.(err, "Load SCL import list failed"), err);
        this.state.sclImportList = [];
      } finally {
        this.state.isListLoading = false;
      }
    },
    async loadSclFromDb() {
      if (!["ied", "scl"].includes(this.mode)) return;
      if (this.mode === "ied" && !this.iedId) {
        this.clearFile();
        return;
      }
      if (this.mode === "scl" && !this.sclId) {
        this.clearFile();
        return;
      }

      this.state.isLoading = true;
      try {
        const response = await getSclSnapshot({
          iedId: this.mode === "ied" ? this.iedId : undefined,
          sclId: this.mode === "scl" ? this.sclId : "",
        });

        const root = this.resolveSclRoot(response);
        const normalized = this.normalizeSclTree(root);
        this.state.sclTreeData = normalized ? [normalized] : [];

        const firstVisible =
          normalized && normalized.mode === "root" && Array.isArray(normalized.children)
            ? normalized.children[0]
            : normalized;

        if (firstVisible) {
          this.state.selectedNodes = [firstVisible];
          this.state.tableRootNode = firstVisible;
          this.baseTableRootNode = firstVisible;
          this.includeRootInTable = false;
          this.tableFocusedNodeId = firstVisible.id;
          this.tableExpandedById = {};
          this.emitControlBlockUpdate(firstVisible);
          this.maybeOpenSubtreeTab();
        } else {
          this.state.selectedNodes = [];
          this.state.tableRootNode = null;
          this.baseTableRootNode = null;
          this.includeRootInTable = false;
          this.tableFocusedNodeId = null;
          this.tableExpandedById = {};
          this.emitControlBlockUpdate(null);
        }
      } catch (err) {
        console.error(this.$apiErrorMessage?.(err, "Load SCL snapshot failed"), err);
        this.state.sclTreeData = [];
        this.state.selectedNodes = [];
        this.state.tableRootNode = null;
        this.baseTableRootNode = null;
        this.includeRootInTable = false;
        this.tableFocusedNodeId = null;
        this.tableExpandedById = {};
        this.emitControlBlockUpdate(null);
      } finally {
        this.state.isLoading = false;
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
      this.baseTableRootNode = null;
      this.includeRootInTable = false;
      this.tableFocusedNodeId = null;
      this.tableExpandedById = {};
      this.emitControlBlockUpdate(null);
    },
  };
}
