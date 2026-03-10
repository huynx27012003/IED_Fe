import { mapState } from "vuex";
import Loading from "@/components/Loading.vue";
import TreeNode from "@/views/common/TreeNode.vue";
import { useParamTree } from "@/helpers/parameterSetting/useParamTree";
import { useParamTable } from "@/helpers/parameterSetting/useParamTable";
import { useParamEdit } from "@/helpers/parameterSetting/useParamEdit";
export default {
  name: "SystemSettingTab",
  components: { Loading, TreeNode },
  props: {
    ownerData: { type: Object, required: true },
    focusNode: { type: Object, default: null },
    tree: { type: Array, default: () => [] },
  },
  emits: ["update-focus", "open-context-menu", "node-dblclick"],
  watch: {
    // When focusNode changes from parent (e.g., user changes selection),
    // reload to align our internal freshFocusNode and parameterGroups
    focusNode: {
      handler() {
        // Avoid interrupting mid-save
        if (!this.loadingSave) {
          // Keep table/tree selection in sync; don't re-fetch the whole tree for every click.
          const focusId = this.focusNode?.id;
          if (!focusId) {
            this.freshFocusNode = null;
            this.paramSelectedNodes = [];
            this.rowsKey++;
            return;
          }

          const local =
            this.paramTreeRoot && this.paramTreeRoot.id != null
              ? this.findNodeLocal([this.paramTreeRoot], focusId)
              : null;
          this.freshFocusNode = local || this.focusNode;
          this.paramSelectedNodes = this.freshFocusNode ? [this.freshFocusNode] : [];
          this.rowsKey++;
        }
      },
    },
    // If IED context changes (ownerData.node.id), refresh our backing data too
    'ownerData.node.id': {
      handler() {
        if (!this.loadingSave) {
          // Use cached root tree (prop `tree`), avoid refetching `/entity-tree`
          this.applyParamTree(this.tree);
          this.applyTree(this.paramTreeData?.length ? this.paramTreeData : this.tree, true);
        }
      },
    },
    tree: {
      handler(val) {
        if (this.loadingSave) return;
        const hasTree = Array.isArray(val) && val.length;
        this.paramTreeLoading = !hasTree;
        this.applyParamTree(val);
        this.applyTree(this.paramTreeData?.length ? this.paramTreeData : val, true);
        if (hasTree) this.paramTreeLoading = false;
      },
      immediate: true,
    },
    renderTable: {
      handler() {},
    },
    visibleRows: {
      handler() {
        this.$nextTick(() => this.syncTableViewport());
      },
    },
  },
  data() {
    return {
      isLoadingEdit: false,
      loadingSave: false,
      freshFocusNode: null,
      groupTreeRoot: null,
      isDragging: false,
      dragDX: 0,
      dragDY: 0,
      userPinned: false,
      fmLeft: null,
      fmTop: null,
      offsetX: 850,
      offsetY: 50,
      parameterGroups: [],
      isEditing: false,
      editStates: {},
      changedValues: [],
      menuOpen: false,
      dragMoved: false,
      dragStartX: 0,
      dragStartY: 0,
      rowsKey: 0,
      showMutedRows: true,
      columnWidths: [],
      hasUserResized: false,
      resizingCol: null,
      resizeStartX: 0,
      resizeStartWidth: 0,

      // Parameter tree (left pane)
      paramTreeLoading: false,
      paramTreeData: [],
      paramSelectedNodes: [],
      hideOperationOffTree: false,
      paramTreeWidthPx: 320,
      resizingParamTree: false,

      // Defer heavy table render so parameter tree paints first
      renderTable: false,
      // Virtual table rendering
      virtualEnabled: true,
      virtualMinRows: 200,
      virtualRowHeight: 34,
      virtualOverscan: 8,
      virtualScrollTop: 0,
      virtualViewportHeight: 0,
    };
  },
  computed: {
    ...mapState(["language"]),
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
    useVirtualization() {
      return this.virtualEnabled && this.visibleRows.length > this.virtualMinRows;
    },
    virtualStartIndex() {
      if (!this.useVirtualization) return 0;
      const start = Math.floor(this.virtualScrollTop / this.virtualRowHeight) - this.virtualOverscan;
      return Math.max(0, start);
    },
    virtualEndIndex() {
      if (!this.useVirtualization) return this.visibleRows.length;
      const end = Math.ceil((this.virtualScrollTop + this.virtualViewportHeight) / this.virtualRowHeight) + this.virtualOverscan;
      return Math.min(this.visibleRows.length, end);
    },
    virtualRows() {
      if (!this.useVirtualization) return this.visibleRows;
      return this.visibleRows.slice(this.virtualStartIndex, this.virtualEndIndex);
    },
    virtualPaddingTop() {
      return this.useVirtualization ? this.virtualStartIndex * this.virtualRowHeight : 0;
    },
    virtualPaddingBottom() {
      if (!this.useVirtualization) return 0;
      return (this.visibleRows.length - this.virtualEndIndex) * this.virtualRowHeight;
    },
    tableHeaders() {
      return this.language === "vi-vi"
        ? {
          parameter: "Tham số",
          value: "Giá trị",
          unit: "Đơn vị",
          min: "Min",
          max: "Max",
          description: "Tham chiếu",
        }
        : {
          parameter: "Parameter",
          value: "Value",
          unit: "Unit",
          min: "Min",
          max: "Max",
          description: "Reference",
        };
    },
    editButtonText() {
      return this.language === "vi-vi" ? "Chỉnh sửa" : "Edit";
    },
    saveButtonText() {
      return this.language === "vi-vi" ? "Lưu" : "Save";
    },
    cancelButtonText() {
      return this.language === "vi-vi" ? "Hủy" : "Cancel";
    },
    selectPlaceholder() {
      return this.language === "vi-vi" ? "Chọn" : "Select";
    },
    successMessage() {
      return this.language === "vi-vi"
        ? "Lưu thành công!"
        : "Saved successfully!";
    },
    failureMessage() {
      return this.language === "vi-vi" ? "Lưu thất bại!" : "Save failed!";
    },
    fmStorageKey() {
      const id = this.ownerData?.node?.id ?? "unknown";
      return `floatingPos:${id}`;
    },
    rowsToRender() {
      const node = this.freshFocusNode || this.focusNode || this.ownerData.node;
      const mode = node.mode;

      if (mode === "ied") {
        const children = Array.isArray(node.children) ? node.children : [];
        const base = children.filter((c) => c.mode !== "protectionGroup");
        const groups = this.parameterGroups.length
          ? this.parameterGroups
          : children.filter((c) => c.mode === "protectionGroup");
        const source = [...base, ...groups];
        return this.renderParamRows(
          source,
          1,
          false,
          new Set(),
          false,
          null,
          false
        );
      }

      if (
        [
          "protectionFunction",
          "protectionLevel",
          "protectionGroup",
          "settingFunction",
          "systemSetting",
          "lineParameters",
        ].includes(mode)
      ) {
        const inPG = mode === "protectionGroup";
        const arOff = inPG ? this.hasAutoRecloseOffDeep(node) : false;
        const pgId = inPG ? node.id : null;

        return this.renderParamRows(
          node.children || [],
          1,
          false,
          new Set(),
          inPG,
          pgId,
          arOff
        );
      }
      return [];
    },
    visibleRows() {
      if (this.showMutedRows) return this.rowsToRender;

      const shouldHide = (row) =>
        !row.isGroup &&
        (row.muted || row.characteristicMuted || this.isNullish(row.value));

      // Keep set for rows that survive the muted filter
      const keptRowKeys = new Set(
        this.rowsToRender
          .filter((r) => !shouldHide(r))
          .map((r) => r.key)
      );

      // Determine which group headers should remain: only those with at least one kept descendant
      const keepGroups = new Set();
      const stack = [];
      this.rowsToRender.forEach((row) => {
        const pad = row.padding || 0;
        while (stack.length && pad <= stack[stack.length - 1].padding) {
          const g = stack.pop();
          if (g.keep) keepGroups.add(g.key);
        }

        if (row.isGroup) {
          stack.push({ key: row.key, padding: pad, keep: false });
        } else if (keptRowKeys.has(row.key)) {
          // mark all open parent groups as having visible descendants
          stack.forEach((g) => (g.keep = true));
        }
      });
      // flush remaining groups
      while (stack.length) {
        const g = stack.pop();
        if (g.keep) keepGroups.add(g.key);
      }

      return this.rowsToRender.filter((row) =>
        row.isGroup ? keepGroups.has(row.key) : keptRowKeys.has(row.key)
      );
    },
    paramTreeRoot() {
      return Array.isArray(this.paramTreeData) && this.paramTreeData.length
        ? this.paramTreeData[0]
        : null;
    },
  },
  methods: {
    ...useParamTree(),
    ...useParamTable(),
    ...useParamEdit(),
  },
  mounted() {
    // Parameter tree is derived from cached prop `tree` (no extra `/entity-tree` call).
    // Defer the heavy table rendering to the next task so the tree can paint first.
    setTimeout(() => {
      this.renderTable = true;
      this.$nextTick(() => this.syncTableViewport());
    }, 0);
  },
  beforeUnmount() {
    document.removeEventListener("mousemove", this.resizeParamTree);
    document.removeEventListener("mouseup", this.stopResizeParamTree);
    document.removeEventListener("mousemove", this.onColumnResize);
    document.removeEventListener("mouseup", this.stopColumnResize);
    if (this._tableScrollFrame) cancelAnimationFrame(this._tableScrollFrame);
  },
  updated() {},
};
