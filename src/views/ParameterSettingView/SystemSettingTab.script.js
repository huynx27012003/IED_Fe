import { mapState } from "vuex";
import Loading from "@/components/Loading.vue";
import TreeNode from "@/views/common/TreeNode.vue";
import Diagram from "@/views/ParameterSettingView/Diagram.vue";
import OvercurrentCurveDialog from "@/views/ParameterSettingView/OvercurrentCurveDialog.vue";
import { getIedInfoById } from "@/api/device";
import { getPointsDistanceByIedId } from "@/api/pointsDistance";
import { getAncestorByMode } from "@/api/treenode";
import { useParamTree } from "@/helpers/parameterSetting/useParamTree";
import { useParamTable } from "@/helpers/parameterSetting/useParamTable";
import { useParamEdit } from "@/helpers/parameterSetting/useParamEdit";
export default {
  name: "SystemSettingTab",
  components: { Loading, TreeNode, Diagram, OvercurrentCurveDialog },
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
    currentIedId: {
      handler() {
        this.loadCurrentIedModel();
      },
      immediate: true,
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
    paramGroupOptions: {
      handler() {
        this.syncParamGroupSelection();
      },
      immediate: true,
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
      selectedParamGroupIds: [],
      showParamGroupDropdown: false,
      paramGroupDropdownPos: { top: 0, left: 0 },

      // Defer heavy table render so parameter tree paints first
      renderTable: false,
      // Virtual table rendering
      virtualEnabled: true,
      virtualMinRows: 200,
      virtualRowHeight: 34,
      virtualOverscan: 8,
      virtualScrollTop: 0,
      virtualViewportHeight: 0,

      // Mock protection zone preview
      showZoneDialog: false,
      diagramLoading: false,
      diagramPolygons: [],
      showOvercurrentDialog: false,
      iedInfoModel: "",
      iedModelRequestId: 0,
      
      // View mode dropdown
      showViewModeDropdown: false,
      parameterDisplayMode: "raw",
      convertedCurrentSide: "secondary",
    };
  },
  computed: {
    ...mapState(["language"]),
    isFilteredView() {
      return this.hideOperationOffTree || !this.showMutedRows;
    },
    isConvertedDisplayMode() {
      return this.parameterDisplayMode === "converted";
    },
    parameterDisplayModeLabel() {
      return this.isConvertedDisplayMode ? "Converted" : "Raw";
    },
    isPrimaryCurrentDisplay() {
      return this.isConvertedDisplayMode && this.convertedCurrentSide === "primary";
    },
    showCurrentSideToggle() {
      const node = this.freshFocusNode || this.focusNode || this.ownerData.node;
      return this.isConvertedDisplayMode && !this.isSystemSettingContext(node);
    },
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
        const selectedGroupIds = this.selectedParamGroupIdSet;
        const visibleGroups = this.paramGroupOptions.length
          ? groups.filter((group) => selectedGroupIds.has(String(group.id)))
          : groups;
        const source = [...base, ...visibleGroups];
        return this.renderParamRows(
          source,
          1,
          false,
          new Set(),
          false,
          null,
          false,
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
        const inSystemSetting = this.isSystemSettingContext(node);

        return this.renderParamRows(
          node.children || [],
          1,
          false,
          new Set(),
          inPG,
          pgId,
          arOff,
          inSystemSetting
        );
      }
      return [];
    },
    visibleRows() {
      if (this.showMutedRows) return this.rowsToRender;

      const shouldHide = (row) =>
        !row.isGroup &&
        (row.muted || row.characteristicMuted || this.isNullish(row.displayValue));

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
    paramGroupOptions() {
      const groups = Array.isArray(this.paramTreeRoot?.children)
        ? this.paramTreeRoot.children.filter((child) => child?.mode === "protectionGroup")
        : [];
      const sorted = [...groups].sort((a, b) => {
        const aNum = this.getParamGroupNumber(a);
        const bNum = this.getParamGroupNumber(b);
        if (aNum != null && bNum != null) return aNum - bNum;
        if (aNum != null) return -1;
        if (bNum != null) return 1;
        return String(a?.name || "").localeCompare(String(b?.name || ""));
      });
      const defaultId = sorted.find((group) => this.getParamGroupNumber(group) === 1)?.id ?? sorted[0]?.id;

      return sorted.map((group) => ({
        id: group.id,
        name: group.name || `Group ${this.getParamGroupNumber(group) || ""}`.trim(),
        isDefault: String(group.id) === String(defaultId),
      }));
    },
    selectedParamGroupIdSet() {
      return new Set(this.selectedParamGroupIds.map((id) => String(id)));
    },
    paramGroupDropdownStyle() {
      return {
        top: `${this.paramGroupDropdownPos.top}px`,
        left: `${this.paramGroupDropdownPos.left}px`,
      };
    },
    filteredParamTreeRoot() {
      if (!this.paramTreeRoot) return null;
      if (!this.paramGroupOptions.length) return this.paramTreeRoot;

      const selectedIds = this.selectedParamGroupIdSet;
      const children = Array.isArray(this.paramTreeRoot.children)
        ? this.paramTreeRoot.children.filter((child) => child?.mode !== "protectionGroup" || selectedIds.has(String(child.id)))
        : [];

      return { ...this.paramTreeRoot, children };
    },
    currentIedNode() {
      const ownerNode = this.ownerData?.node || null;
      if (ownerNode?.mode === "ied") return ownerNode;

      const node = this.freshFocusNode || this.focusNode || ownerNode;
      if (node?.mode === "ied") return node;
      if (node?.id == null) return ownerNode;

      return getAncestorByMode(this.tree, node.id, "ied") || ownerNode;
    },
    currentIedId() {
      return this.currentIedNode?.id || null;
    },
    showZoneDiagramAction() {
      const iedNode = this.currentIedNode || {};
      const model = iedNode.model || iedNode.deviceModel || iedNode.modelName || this.iedInfoModel || "";
      return String(model).trim().toUpperCase() === "REL650";
    },
  },
  methods: {
    ...useParamTree(),
    ...useParamTable(),
    ...useParamEdit(),
    onClickEdit() {
      this.menuOpen = false;
      this.parameterDisplayMode = "raw";
      this.convertedCurrentSide = "secondary";
      if (!this.isEditing) this.enterEditMode();
    },
    toggleParameterDisplayMode() {
      if (this.isEditing) return;
      this.parameterDisplayMode = this.isConvertedDisplayMode ? "raw" : "converted";
      if (!this.isConvertedDisplayMode) this.convertedCurrentSide = "secondary";
    },
    setConvertedCurrentSide(side) {
      if (!this.isConvertedDisplayMode) return;
      this.convertedCurrentSide = side === "primary" ? "primary" : "secondary";
    },
    isSystemSettingContext(node) {
      if (!node) return false;
      if (node.mode === "systemSetting") return true;
      if (node.id == null) return false;
      return !!getAncestorByMode([this.paramTreeRoot].filter(Boolean), node.id, "systemSetting");
    },
    toggleViewModeDropdown(event) {
      if (event) event.stopPropagation();
      this.showViewModeDropdown = !this.showViewModeDropdown;
    },
    closeViewModeDropdown(event) {
      // Don't close if clicking inside the dropdown
      if (event && event.target.closest('.view-mode-dropdown')) return;
      this.showViewModeDropdown = false;
      if (event && event.target.closest('.param-group-selector')) return;
      this.showParamGroupDropdown = false;
    },
    getParamGroupNumber(group) {
      const match = String(group?.name || "").match(/group\s*(\d+)/i);
      return match ? Number(match[1]) : null;
    },
    syncParamGroupSelection() {
      const options = this.paramGroupOptions;
      if (!options.length) {
        this.selectedParamGroupIds = [];
        this.showParamGroupDropdown = false;
        return;
      }

      const validIds = new Set(options.map((option) => String(option.id)));
      const defaultGroup = options.find((option) => option.isDefault) || options[0];
      const next = this.selectedParamGroupIds
        .filter((id) => validIds.has(String(id)))
        .map((id) => String(id));

      if (defaultGroup && !next.includes(String(defaultGroup.id))) {
        next.unshift(String(defaultGroup.id));
      }

      if (next.length !== this.selectedParamGroupIds.length || next.some((id, idx) => id !== String(this.selectedParamGroupIds[idx]))) {
        this.selectedParamGroupIds = next;
      }
    },
    isParamGroupSelected(groupId) {
      return this.selectedParamGroupIdSet.has(String(groupId));
    },
    isParamTreeIedNode(node) {
      return node?.mode === "ied" && String(node.id) === String(this.paramTreeRoot?.id);
    },
    toggleParamGroupDropdown(event) {
      if (event) event.stopPropagation();
      const shouldOpen = !this.showParamGroupDropdown;
      if (shouldOpen && event?.currentTarget?.getBoundingClientRect) {
        const rect = event.currentTarget.getBoundingClientRect();
        const menuWidth = 190;
        const left = Math.min(rect.left, window.innerWidth - menuWidth - 8);
        this.paramGroupDropdownPos = {
          top: rect.bottom + 4,
          left: Math.max(8, left),
        };
      }
      this.showParamGroupDropdown = shouldOpen;
    },
    toggleParamGroupSelection(group) {
      if (!group || group.isDefault) return;
      const id = String(group.id);
      const selected = new Set(this.selectedParamGroupIds.map((item) => String(item)));
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      this.selectedParamGroupIds = Array.from(selected);
    },
    handleShowAll() {
      this.hideOperationOffTree = false;
      this.showMutedRows = true;
      this.showViewModeDropdown = false;
    },
    handleHideUnnecessary() {
      this.hideOperationOffTree = true;
      this.showMutedRows = false;
      this.showViewModeDropdown = false;
    },
    openOvercurrentCurve() {
      if (!this.currentIedId) {
        this.$message?.warning?.("Cannot determine IED id for overcurrent curve");
        return;
      }

      this.showOvercurrentDialog = true;
    },
    async loadCurrentIedModel() {
      const iedId = this.currentIedId;
      const requestId = this.iedModelRequestId + 1;
      this.iedModelRequestId = requestId;
      this.iedInfoModel = "";

      if (!iedId) return;

      const nodeModel = this.currentIedNode?.model || this.currentIedNode?.deviceModel || this.currentIedNode?.modelName;
      if (nodeModel) {
        this.iedInfoModel = nodeModel;
        return;
      }

      try {
        const deviceInfo = await getIedInfoById(iedId);
        if (this.iedModelRequestId === requestId) {
          this.iedInfoModel = deviceInfo?.model || "";
        }
      } catch (error) {
        if (this.iedModelRequestId === requestId) {
          this.iedInfoModel = "";
        }
        console.error(this.$apiErrorMessage?.(error, "Failed to load IED model"), error);
      }
    },
    resolveCurrentIedId() {
      const node = this.freshFocusNode || this.focusNode || this.ownerData?.node;
      if (!node) return this.ownerData?.node?.id || null;

      if (node.mode === "ied") return node.id;

      const ancestor = getAncestorByMode(this.tree, node.id, "ied");
      return ancestor?.id || this.ownerData?.node?.id || null;
    },
    buildDiagramPolygons(payload) {
      const palette = [
        "#2a9d8f",
        "#3a86ff",
        "#ff006e",
        "#fb8500",
        "#8338ec",
        "#06d6a0",
        "#118ab2",
        "#ef476f",
        "#8d6e63",
        "#4361ee",
        "#f4a261",
        "#7b2cbf",
      ];

      const groups = Array.isArray(payload) ? payload : [];
      const polygons = [];

      groups.forEach((group) => {
        const levels = Array.isArray(group?.levels) ? group.levels : [];
        levels.forEach((lv) => {
          const rawPoints = Array.isArray(lv?.points) ? lv.points : [];
          if (!rawPoints.length) return;

          const points = rawPoints
            .slice()
            .sort((a, b) => (a?.pointIndex ?? 0) - (b?.pointIndex ?? 0))
            .map((p) => ({ r: Number(p?.r), x: Number(p?.x) }))
            .filter((p) => Number.isFinite(p.r) && Number.isFinite(p.x));

          if (points.length < 2) return;

          const idx = polygons.length;

          const rawLevel = lv?.level;
          const normalizedLevel = rawLevel === null || rawLevel === undefined
            ? null
            : String(rawLevel).trim();

          polygons.push({
            key: `${group?.type || "TYPE"}-g${lv?.group || 0}-l${normalizedLevel || "NA"}-${lv?.id || idx}`,
            label: `${group?.type || "TYPE"} G${lv?.group || "?"}-L${normalizedLevel || "?"}`,
            type: group?.type || "TYPE",
            distanceName: group?.name || group?.type || "TYPE",
            group: Number(lv?.group) || 0,
            level: normalizedLevel,
            color: palette[idx % palette.length],
            points,
          });
        });
      });

      return polygons;
    },
    async openZonePreview() {
      const iedId = this.resolveCurrentIedId();
      if (!iedId) {
        this.$message?.warning?.("Cannot determine IED id for diagram");
        return;
      }

      this.showZoneDialog = true;
      this.diagramLoading = true;
      this.diagramPolygons = [];

      try {
        const response = await getPointsDistanceByIedId(iedId);
        const payload = response?.data ?? response;
        this.diagramPolygons = this.buildDiagramPolygons(payload);
      } catch (error) {
        this.$notifyApiError?.(error, "Failed to load diagram points");
      } finally {
        this.diagramLoading = false;
      }
    },
  },
  mounted() {
    // Parameter tree is derived from cached prop `tree` (no extra `/entity-tree` call).
    // Defer the heavy table render to the next task so the tree can paint first.
    setTimeout(() => {
      this.renderTable = true;
      this.$nextTick(() => this.syncTableViewport());
    }, 0);
    
    // Close view mode dropdown when clicking outside
    document.addEventListener('click', this.closeViewModeDropdown);
  },
  beforeUnmount() {
    document.removeEventListener("mousemove", this.resizeParamTree);
    document.removeEventListener("mouseup", this.stopResizeParamTree);
    document.removeEventListener("mousemove", this.onColumnResize);
    document.removeEventListener("mouseup", this.stopColumnResize);
    document.removeEventListener('click', this.closeViewModeDropdown);
    if (this._tableScrollFrame) cancelAnimationFrame(this._tableScrollFrame);
  },
  updated() {},
};
