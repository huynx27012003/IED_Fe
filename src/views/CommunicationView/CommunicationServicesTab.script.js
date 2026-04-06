import TreeNode from "@/views/common/TreeNode.vue";
import { getAncestorByMode } from "@/api/treenode";
import { getAssetCommunication, importCommunicationServices } from "@/api/asset";

export default {
  name: "CommunicationServicesTab",
  components: { TreeNode },
  props: {
    ownerData: { type: Object, required: true },
    focusNode: { type: Object, default: null },
    tree: { type: Array, default: () => [] },
  },
  data() {
    return {
      paramTreeLoading: false,
      paramTreeData: [],
      paramSelectedNodes: [],
      hideOperationOffTree: false,
      paramTreeWidthPx: 320,
      resizingParamTree: false,
      freshFocusNode: null,
      isEditing: false,
      renderTable: false,
      communicationRowsData: [],
      showContextMenu: false,
      menuX: 0,
      menuY: 0,
      contextTargetNode: null,
      selectedFile: null,
      selectedFileName: "",
      showImportConfirm: false,
      importLoading: false,
    };
  },
  computed: {
    currentNode() {
      return this.freshFocusNode || this.focusNode || this.ownerData?.node || null;
    },
    communicationDeviceTitle() {
      return String(this.currentNode?.name || this.currentNode?.serial_no || "Communication");
    },
    communicationRows() {
      return this.communicationRowsData;
    },
    paramTreeRoot() {
      return Array.isArray(this.paramTreeData) && this.paramTreeData.length
        ? this.paramTreeData[0]
        : null;
    },
  },
  watch: {
    focusNode: {
      handler(next) {
        if (!next?.id) return;
        const local = this.findNodeLocal(this.paramTreeData, next.id);
        if (local) {
          this.freshFocusNode = local;
          this.paramSelectedNodes = [local];
        }
      },
    },
    "ownerData.node.id": {
      handler() {
        this.applyParamTree(this.tree);
      },
    },
    tree: {
      handler(val) {
        const hasTree = Array.isArray(val) && val.length;
        this.paramTreeLoading = !hasTree;
        this.applyParamTree(val);
        if (hasTree) this.paramTreeLoading = false;
      },
      immediate: true,
    },
  },
  methods: {
    noopFetchChildren() {},
    updateParamSelection(node) {
      if (!node) return;
      const exists = this.paramSelectedNodes.some((n) => String(n.id) === String(node.id));
      if (!exists) this.paramSelectedNodes = [...this.paramSelectedNodes, node];
    },
    clearParamSelection() {
      this.paramSelectedNodes = [];
    },
    handleParamTreeSelect(node) {
      if (!node) return;
      this.freshFocusNode = node;
      this.paramSelectedNodes = [node];
      this.$nextTick(() => this.$forceUpdate());
    },
    handleParamTreeNodeOpen(node) {
      this.handleParamTreeSelect(node);
    },
    async handleCommunicationNodeClick(node) {
      if (!node) return;
      this.handleParamTreeSelect(node);
      await this.fetchCommunicationRows(node);
    },
    handleParamTreeContextMenu(event, node) {
      if (node?.mode !== "ied") return;

      event.preventDefault();
      event.stopPropagation();
      this.contextTargetNode = node;
      this.menuX = event.clientX;
      this.menuY = event.clientY;
      this.showContextMenu = true;
      this.$nextTick(() => {
        document.addEventListener("click", this.closeContextMenu);
      });
    },
    closeContextMenu() {
      this.showContextMenu = false;
      document.removeEventListener("click", this.closeContextMenu);
    },
    triggerFileInput() {
      this.closeContextMenu();
      this.$nextTick(() => {
        this.$refs.commFileInput?.click?.();
      });
    },
    handleFileSelect(event) {
      const file = event.target?.files?.[0];
      if (!file) return;
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.showImportConfirm = true;
      event.target.value = "";
    },
    async confirmImport() {
      if (!this.selectedFile) return;
      const node = this.contextTargetNode || this.currentNode;
      const iedId = node?.mode === "ied" ? node.id : null;

      if (!iedId) {
        this.$message?.warning?.("Cannot determine IED id for import");
        return;
      }
      this.importLoading = true;
      try {
        await importCommunicationServices(iedId, this.selectedFile);
        this.$message?.success?.("Import communication services successfully");
        this.showImportConfirm = false;
        this.selectedFile = null;
        this.selectedFileName = "";
        if (this.currentNode) {
          await this.fetchCommunicationRows(this.currentNode);
        }
      } catch (error) {
        console.error("Import communication services failed:", error);
        this.$message?.error?.("Failed to import communication services");
      } finally {
        this.importLoading = false;
      }
    },
    resolveCurrentIedId() {
      const node = this.currentNode || this.ownerData?.node;
      if (!node) return null;
      if (node.mode === "ied") return node.id;
      
      if (this.ownerData?.node?.mode === "ied") return this.ownerData.node.id;
      
      if (this.tree?.length) {
        const ancestor = getAncestorByMode(this.tree, node.id, "ied");
        if (ancestor) return ancestor.id;
      }
      return null;
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
      this.paramTreeWidthPx = Math.max(160, Math.min(540, this._paramTreeStartWidth + dx));
    },
    stopResizeParamTree() {
      this.resizingParamTree = false;
      document.removeEventListener("mousemove", this.resizeParamTree);
      document.removeEventListener("mouseup", this.stopResizeParamTree);
    },
    onClickEdit() {
      this.isEditing = true;
    },
    saveAll() {
      this.isEditing = false;
    },
    cancelAll() {
      this.isEditing = false;
    },
    onClickSetOperation(value) {
      const opNode = this.findOperationNode(this.currentNode);
      if (opNode) {
        opNode.value = value;
      }
      this.$nextTick(() => this.$forceUpdate());
    },
    findOperationNode(node) {
      if (!node) return null;
      const children = Array.isArray(node.children) ? node.children : [];
      return children.find(
        (item) => String(item?.name || "").trim().toLowerCase() === "operation"
      );
    },
    findNodeOperation(node) {
      return this.findOperationNode(node)?.value ?? "";
    },
    normalizeCommunicationValue(value) {
      return value === null || value === undefined ? "" : String(value);
    },
    mapCommunicationRow(item = {}) {
      return {
        port: this.normalizeCommunicationValue(item.port),
        name: this.normalizeCommunicationValue(item.name),
        operation: this.normalizeCommunicationValue(item.operation),
        redundancy: this.normalizeCommunicationValue(item.redundancy),
        subnetwork: this.normalizeCommunicationValue(item.subNetwork ?? item.subnetwork),
        ipAddress: this.normalizeCommunicationValue(item.ipAddress),
        subnetMask: this.normalizeCommunicationValue(item.subnetMask),
        defaultGateway: this.normalizeCommunicationValue(item.defaultGateway),
        mms: this.normalizeCommunicationValue(item.mms),
        goose: this.normalizeCommunicationValue(item.goose),
        smv: this.normalizeCommunicationValue(item.smv),
        https: this.normalizeCommunicationValue(item.https),
        ftp: this.normalizeCommunicationValue(item.ftp),
        dnp3: this.normalizeCommunicationValue(item.dnp3),
        snmp: this.normalizeCommunicationValue(item.snmp),
        sntp: this.normalizeCommunicationValue(item.sntp),
        ptp: this.normalizeCommunicationValue(item.ptp),
        networkSwitch1: this.normalizeCommunicationValue(item.destination),
      };
    },
    async fetchCommunicationRows(node) {
      const mode = node?.mode;
      const id = node?.id;
      if (!mode || id === null || id === undefined) {
        this.communicationRowsData = [];
        return;
      }

      try {
        const response = await getAssetCommunication(mode, id);
        const list = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
        this.communicationRowsData = list.map((item) => this.mapCommunicationRow(item));
      } catch (error) {
        console.error("Failed to fetch communication rows:", error);
        this.communicationRowsData = [];
      }
    },
    isCommunicationTreeMode(mode) {
      return ["organisation", "substation", "voltageLevel", "bay", "ied"].includes(
        String(mode || "")
      );
    },
    findNodeLocal(arr = [], id) {
      const target = String(id);
      const stack = Array.isArray(arr) ? [...arr] : [];
      while (stack.length) {
        const node = stack.pop();
        if (!node) continue;
        if (String(node.id) === target) return node;
        if (node.children?.length) stack.push(...node.children);
        if (node.childrenFromData?.length) stack.push(...node.childrenFromData);
      }
      return null;
    },
    resolveCommunicationSourceNode(tree) {
      const treeSource = Array.isArray(tree)
        ? tree
        : Array.isArray(this.tree)
          ? this.tree
          : [];
      const selectedId = this.ownerData?.node?.id || this.focusNode?.id;
      if (!selectedId) return null;

      const sourceFromTree = this.findNodeLocal(treeSource, selectedId);
      const fallback = this.ownerData?.node || this.focusNode || null;
      const sourceNode = sourceFromTree || fallback;
      if (!sourceNode) return null;

      if (this.isCommunicationTreeMode(sourceNode.mode)) return sourceNode;

      const ancestorModes = ["ied", "bay", "voltageLevel", "substation", "organisation"];
      for (const mode of ancestorModes) {
        const ancestor = getAncestorByMode(treeSource, selectedId, mode);
        if (ancestor && this.isCommunicationTreeMode(ancestor.mode)) return ancestor;
      }
      return sourceNode;
    },
    cloneCommunicationNode(node) {
      const mode = String(node?.mode || "");
      const rawChildren = Array.isArray(node?.children)
        ? node.children
        : Array.isArray(node?.childrenFromData)
          ? node.childrenFromData
          : [];
      const children = mode === "ied"
        ? []
        : rawChildren.filter((child) => this.isCommunicationTreeMode(child?.mode));

      return {
        id: node?.id ?? null,
        name: node?.name ?? "",
        mode,
        expanded: mode !== "ied",
        showParamTree: false,
        isSclTree: false,
        children: children.map((child) => this.cloneCommunicationNode(child)),
      };
    },
    applyParamTree(tree) {
      const sourceNode = this.resolveCommunicationSourceNode(tree);
      if (!sourceNode) {
        this.paramTreeData = [];
        this.freshFocusNode = null;
        this.paramSelectedNodes = [];
        return;
      }

      const clonedRoot = this.cloneCommunicationNode(sourceNode);
      this.paramTreeData = [clonedRoot];

      const focusId = this.focusNode?.id || clonedRoot.id;
      const localFocus = focusId ? this.findNodeLocal(this.paramTreeData, focusId) : null;

      this.freshFocusNode = localFocus || clonedRoot;
      this.paramSelectedNodes = this.freshFocusNode ? [this.freshFocusNode] : [];
    },
  },
  mounted() {
    setTimeout(() => {
      this.renderTable = true;
    }, 0);
    this.fetchCommunicationRows(this.currentNode);
  },
  beforeUnmount() {
    document.removeEventListener("mousemove", this.resizeParamTree);
    document.removeEventListener("mouseup", this.stopResizeParamTree);
  },
};
