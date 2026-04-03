import TreeNode from "@/views/common/TreeNode.vue";
import { getAncestorByMode } from "@/api/treenode";

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
      const node = this.currentNode || {};
      const pick = (...keys) => {
        for (const key of keys) {
          const value = node?.[key];
          if (value !== null && value !== undefined && String(value).trim() !== "") {
            return value;
          }
        }
        return "";
      };

      return [
        {
          port: pick("port"),
          name: pick("name", "serial_no"),
          operation: this.findNodeOperation(node),
          redundancy: pick("redundancy"),
          subnetwork: pick("subnetwork"),
          ipAddress: pick("ipAddress", "ip", "ip_address"),
          subnetMask: pick("subnetMask", "subnet_mask"),
          defaultGateway: pick("defaultGateway", "default_gateway", "gateway"),
          mms: pick("mms"),
          goose: pick("goose"),
          smv: pick("smv"),
          https: pick("https"),
          ftp: pick("ftp"),
          dnp3: pick("dnp3", "dnp30", "dnp3_0"),
          snmp: pick("snmp"),
          sntp: pick("sntp"),
          ptp: pick("ptp"),
          networkSwitch1: pick("networkSwitch1", "network_switch_1", "networkSwitch"),
        },
      ];
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
  },
  beforeUnmount() {
    document.removeEventListener("mousemove", this.resizeParamTree);
    document.removeEventListener("mouseup", this.stopResizeParamTree);
  },
};
