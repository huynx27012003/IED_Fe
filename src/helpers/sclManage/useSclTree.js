export function useSclTree() {
  return {
    toggleNode(node) {
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
    updateSelection(node) {
      this.state.selectedNodes = [node];
    },
    clearSelection() {
      this.state.selectedNodes = [];
    },
    handleShowProperties(node) {
      this.state.selectedNodes = [node];
      this.state.tableRootNode = node;
      this.tableFocusedNodeId = node?.id ?? null;
      this.tableExpandedById = {};
      this.emitControlBlockUpdate(node);
      this.maybeOpenSubtreeTab();
    },
  };
}
