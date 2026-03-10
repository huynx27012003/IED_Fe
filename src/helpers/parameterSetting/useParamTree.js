import {
  getAncestorByMode,
  getGroupByIedId,
  getEntityTree,
} from "@/api/treenode";

export function useParamTree() {
  return {
    noopFetchChildren() {},
    setHideOperationOffTree(val) {
      this.hideOperationOffTree = !!val;
    },
    updateParamSelection(node) {
      if (!node) return;
      const exists = this.paramSelectedNodes.some((n) => n.id === node.id);
      if (!exists) this.paramSelectedNodes = [...this.paramSelectedNodes, node];
    },
    clearParamSelection() {
      this.paramSelectedNodes = [];
    },
    handleParamTreeSelect(node) {
      if (!node) return;
      this.paramSelectedNodes = [node];
      this.$emit("update-focus", {
        iedId: this.ownerData?.node?.id,
        focusNode: node,
      });
    },
    handleParamTreeContextMenu(event, node) {
      this.$emit("open-context-menu", event, node);
    },
    handleParamTreeNodeOpen(node) {
      this.$emit("node-dblclick", node);
    },
    toggleParamNode(node) {
      if (!node) return;
      node.expanded = !node.expanded;
    },
    startResizeParamTree(event) {
      if (!event) return;
      this.resizingParamTree = true;
      this._paramTreeStartX = event.clientX;
      this._paramTreeStartWidth = this.paramTreeWidthPx;
      document.addEventListener("mousemove", this.resizeParamTree);
      document.addEventListener("mouseup", this.stopResizeParamTree);
    },
    resizeParamTree(event) {
      if (!this.resizingParamTree) return;
      const dx = event.clientX - this._paramTreeStartX;
      this.paramTreeWidthPx = Math.max(
        160,
        Math.min(540, this._paramTreeStartWidth + dx)
      );
    },
    stopResizeParamTree() {
      this.resizingParamTree = false;
      document.removeEventListener("mousemove", this.resizeParamTree);
      document.removeEventListener("mouseup", this.stopResizeParamTree);
    },
    findNodeLocal(arr = [], id) {
      const t = String(id);
      const stack = Array.isArray(arr) ? [...arr] : [];
      while (stack.length) {
        const n = stack.pop();
        if (!n) continue;
        if (String(n.id) === t) return n;
        if (n.children?.length) stack.push(...n.children);
        if (n.childrenFromData?.length) stack.push(...n.childrenFromData);
      }
      return null;
    },
    applyTree(tree, keepFocus = true) {
      const iedId = this.ownerData?.node?.id;
      let iedNode = iedId ? this.findNodeLocal(tree, iedId) : null;
      if (!iedNode || iedNode.mode !== "ied") {
        const focusId = this.focusNode?.id;
        iedNode = focusId ? getAncestorByMode(tree, focusId, "ied") : null;
      }
      if (!iedNode) {
        this.parameterGroups = [];
        this.freshFocusNode = null;
        this.paramSelectedNodes = [];
        return;
      }
      const groupTree = getGroupByIedId(tree, iedNode.id);
      this.parameterGroups = groupTree?.children
        ? JSON.parse(JSON.stringify(groupTree.children))
        : [];

      if (keepFocus) {
        const focusId = this.focusNode?.id || this.ownerData.node?.id;
        this.freshFocusNode = focusId ? this.findNodeLocal(tree, focusId) : null;
        if (this.freshFocusNode) {
          this.paramSelectedNodes = [this.freshFocusNode];
        }
      } else {
        this.freshFocusNode = null;
        this.paramSelectedNodes = [];
      }

      this.rowsKey++;
      this.$nextTick(() => this.$forceUpdate());
    },
    async reloadFromServer(keepFocus = true) {
      const tree = await getEntityTree();
      this.applyTree(tree, keepFocus);
      this.applyParamTree(tree);
    },
    applyParamTree(tree) {
      const iedId = this.ownerData?.node?.id;
      let iedNode = iedId ? this.findNodeLocal(tree, iedId) : null;
      if (!iedNode || iedNode.mode !== "ied") {
        const focusId = this.focusNode?.id;
        iedNode = focusId ? getAncestorByMode(tree, focusId, "ied") : null;
      }
      if (!iedNode) {
        this.paramTreeData = [];
        return;
      }

      const cloneNode = (node) => {
        const children = Array.isArray(node.children)
          ? node.children
          : Array.isArray(node.childrenFromData)
            ? node.childrenFromData
            : [];
        return {
          id: node.id ?? null,
          name: node.name ?? "",
          mode: node.mode ?? "",
          description: node.description ?? null,
          value: node.value ?? null,
          unit: node.unit ?? null,
          minVal: node.minVal ?? null,
          maxVal: node.maxVal ?? null,
          options: Array.isArray(node.options) ? [...node.options] : [],
          children: children.map(cloneNode),
        };
      };
      const cloned = cloneNode(iedNode);
      cloned.showParamTree = true;
      cloned.isSclTree = false;
      cloned.expanded = true;
      cloned.showAllGroups = true;
      this.paramTreeData = [cloned];
    },
  };
}
