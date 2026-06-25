import { importScl } from "@/api/scl";

export function useSclImportStore() {
  return {
    openSclManagementByFile(item) {
      const sclId = item?.sclId;
      if (sclId == null || sclId === "") {
        this.$message?.warning?.("Invalid SCL file item");
        return;
      }

      const fileName = item?.fileName || `SCL ${sclId}`;
      this.handleOpenTab({
        id: `scl-${sclId}-management`,
        name: `${fileName} - SCL Management`,
        mode: "sclFile",
        component: "SCLManagementTab",
        sclId,
        fileName,
        node: {
          id: String(sclId),
          sclId,
          name: fileName,
          mode: "sclFile",
        },
        focusNode: null,
      });
    },
    openSclImportSubtreeTab() {
      const id = "scl-import-subtree";
      const fileName = this.sclImportStore?.fileName || "";
      const tabName = fileName ? `SCL - ${fileName}` : "SCL - Subtree";

      this.handleOpenTab({
        id,
        name: tabName,
        mode: "sclImport",
        component: "SCLImportSubtreeTab",
        node: { id, name: tabName, mode: "sclImport" },
        focusNode: this.sclImportStore?.tableRootNode || null,
      });
    },
    handleSCLManagement(node) {
      this.sclTargetNode = node || null;
      this.showSCL = true;
    },
    triggerSclImport() {
      const input = this.$refs.sclFileInput;
      if (input) {
        input.value = "";
        input.click();
      }
    },
    toggleSCLView() {
      this.showSCL = !this.showSCL;
    },
    toggleParamView() {
      this.showParam = !this.showParam;
    },
    async onSclFileSelected(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;

      try {
        this.sclLoading = true;
        const response = await importScl(file);
        const normalized = this.normalizeSclTree(response);
        this.sclTreeData = normalized ? [normalized] : [];
        this.showSCL = true;
        this.$message?.success?.("SCL imported");
      } catch (err) {
        this.$notifyApiError?.(err, "Import SCL failed");
      } finally {
        this.sclLoading = false;
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
        return {
          id: String(id),
          name,
          mode,
          isSclTree: true,
          expanded: false,
          children: builtChildren,
        };
      };
      return build(root, []);
    },
    noopFetchChildren() {},
    noopShowProps() {},
    updateSelectionScl(node) {
      this.selectedNodes = [node];
    },
    clearSelectionScl() {
      this.selectedNodes = [];
    },
    noopContextMenu() {},
    toggleSclNode(node) {
      if (!node) return;
      node.expanded = !node.expanded;
      if (!node.expanded && node.children && node.children.length) {
        const collapse = (children) => {
          children.forEach((c) => {
            c.expanded = false;
            if (c.children && c.children.length) collapse(c.children);
          });
        };
        collapse(node.children);
      }
    },
    noopDblClick() {},
  };
}
