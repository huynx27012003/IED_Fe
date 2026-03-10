export function useSclTable() {
  return {
    startTableResize(event, index) {
      if (!event || index == null) return;
      if (!this.hasUserResized) {
        this.initTableColumnWidthsFromDom();
        this.hasUserResized = true;
      }
      const header = event.currentTarget?.parentElement;
      this.resizingCol = index;
      this.resizeStartX = event.clientX;
      this.resizeStartWidth = header?.offsetWidth || this.columnWidths[index] || 160;

      document.addEventListener("mousemove", this.onTableResize);
      document.addEventListener("mouseup", this.stopTableResize);
      document.body.style.cursor = "col-resize";
      event.preventDefault();
      event.stopPropagation();
    },
    initTableColumnWidthsFromDom() {
      const table = this.$el?.querySelector('.scl-detail-table');
      if (!table) return;
      const headers = table.querySelectorAll('thead th');
      if (!headers?.length) return;
      this.columnWidths = Array.from(headers).map((th) => th.offsetWidth || 160);
    },
    onTableResize(event) {
      if (this.resizingCol == null) return;
      const dx = event.clientX - this.resizeStartX;
      const minWidth = this.getTableMinWidth(this.resizingCol);
      const nextWidth = Math.max(minWidth, this.resizeStartWidth + dx);
      this.columnWidths.splice(this.resizingCol, 1, nextWidth);
    },
    stopTableResize() {
      if (this.resizingCol == null) return;
      document.removeEventListener("mousemove", this.onTableResize);
      document.removeEventListener("mouseup", this.stopTableResize);
      document.body.style.cursor = "";
      this.resizingCol = null;
    },
    getTableMinWidth(index) {
      const mins = [200, 200, 160];
      return mins[index] || 160;
    },
    setTableFocus(node) {
      this.tableFocusedNodeId = node?.id ?? null;
      this.emitControlBlockUpdate(node);
    },
    getModeBadge(mode) {
      switch (mode) {
        case "dataObject":
          return "DO";
        case "dataAttribute":
          return "DA";
        case "logicalDevice":
          return "LD";
        case "logicalNode":
          return "LN";
        case "dataset":
          return "DS";
        case "settingGroup":
          return "SG";
        case "goose":
          return "G";
        case "urcb":
        case "brcb":
        case "reportControl":
          return "R";
        default:
          return "";
      }
    },
    flattenTableRows(nodes, depth, out = []) {
      if (!Array.isArray(nodes)) return out;
      const indent = 18;
      nodes.forEach((node) => {
        if (!node) return;
        const kids = Array.isArray(node.children) ? node.children : [];
        const hasChildren = kids.length > 0;
        const expanded = !!this.tableExpandedById?.[node.id];
        const badge = this.getModeBadge(node.mode);
        out.push({
          key: node.id,
          id: node.id,
          node,
          name: node.name || "",
          description: node.description || "",
          value: node.value,
          mode: node.mode || "",
          depth,
          padding: depth * indent,
          hasChildren,
          expanded,
          badge,
        });
        if (hasChildren && expanded) {
          this.flattenTableRows(kids, depth + 1, out);
        }
      });
      return out;
    },
    toggleTableNode(node) {
      if (!node) return;
      const id = node.id;
      if (!id) return;

      const isExpanded = !!this.tableExpandedById?.[id];
      if (isExpanded) {
        this.collapseTableSubtree(node);
        const next = { ...(this.tableExpandedById || {}) };
        delete next[id];
        this.tableExpandedById = next;
        return;
      }

      this.tableExpandedById = {
        ...(this.tableExpandedById || {}),
        [id]: true,
      };
    },
    collapseTableSubtree(node) {
      const kids = Array.isArray(node?.children) ? node.children : [];
      if (!kids.length) return;

      const next = { ...(this.tableExpandedById || {}) };
      const walk = (children) => {
        children.forEach((c) => {
          if (!c) return;
          if (c.id != null) delete next[c.id];
          const grand = Array.isArray(c.children) ? c.children : [];
          if (grand.length) walk(grand);
        });
      };
      walk(kids);
      this.tableExpandedById = next;
    },
    formatCellValue(val) {
      if (val === null || val === undefined) return "";
      if (typeof val === "object") {
        try {
          return JSON.stringify(val);
        } catch {
          return String(val);
        }
      }
      return String(val);
    },
  };
}
