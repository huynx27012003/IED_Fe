/* eslint-disable */
import TreeNode from "../common/TreeNode.vue";
import Tabs from "../common/Tabs.vue";
import ContextMenu from "../common/ContextMenu.vue";
import ActivityBar from "../common/ActivityBar.vue";
import SCLManage from "../common/SCLManage.vue";
import MockView2 from "../common/MockView2.vue";
import PropertiesPane from "../common/PropertiesPane.vue";
import OwnerView from "@/views/OrganisationView/index.vue";
import SubstationView from "@/views/OrganisationView/Substation.vue";
import VoltageLevelView from "@/views/VoltageLevelView/VoltageLevel.vue";
import { findNodeById } from "@/api/treenode";
import AddDevice from "@/views/AddDeviceView/AddDevice.vue";
import AddOrganisation from "@/views/OrganisationView/AddOrganisation.vue";
import AddSubstation from "@/views/OrganisationView/AddSubstation.vue";
import AddVoltageLevel from "@/views/VoltageLevelView/AddVoltageLevel.vue";
import AddBay from "@/views/BayView/AddBay.vue";
import DeviceListView from "@/views/DeviceListView/DeviceListView.vue";
import {
  getEntityTreeRaw,
  getPropertiesById,
  getAncestorsById,
  getAncestorByMode,
} from "@/api/treenode";
import { getIedInfoById } from "@/api/device";
import { mapGetters } from "vuex";
import { useSidebarResize } from "@/helpers/treeNavigation/useSidebarResize";
import { useTabs } from "@/helpers/treeNavigation/useTabs";
import { useContextMenu } from "@/helpers/treeNavigation/useContextMenu";
import { useSclImportStore } from "@/helpers/treeNavigation/useSclImportStore";

const EMPTY_PROPS = () => ({
  Owner1: "",
  Owner2: "",
  Owner3: "",
  Location: "",
  VoltageLevel: "",
  Feeder: "",
});

// Translation dictionary
const translations = {
  "en-vi": {
    home: "Home",
    location: "Location",
    owner: "Owner",
    objectProperties: "Object Properties",
    ownerAndPosition: "Owner & Position",
    owner1: "Owner 1",
    owner2: "Owner 2",
    owner3: "Owner 3",
    voltageLevel: "Voltage Level",
    feeder: "Feeder",
    deviceInformation: "Device Information",
    name: "Name",
    description: "Description",
    vendor: "Vendor",
    model: "Model",
    serialNumber: "Serial Number",
    hardwareVersion: "Hardware Version",
    softwareVersion: "Software Version",
    orderCode: "Order Code",
    roles: "Roles",
    configurationVersion: "Configuration Version",
    lastModified: "Last Modified",
    author: "Author",
    lastSavedBy: "Last Saved By",
  },
  "vi-vi": {
    home: "Trang chủ",
    location: "Vị trí",
    owner: "Chủ sở hữu",
    objectProperties: "Thuộc tính đối tượng",
    ownerAndPosition: "Chủ sở hữu & Vị trí",
    owner1: "Chủ sở hữu 1",
    owner2: "Chủ sở hữu 2",
    owner3: "Chủ sở hữu 3",
    voltageLevel: "Mức điện áp",
    feeder: "Đường dây cấp điện",
    deviceInformation: "Thông tin thiết bị",
    name: "Tên",
    description: "Mô tả",
    vendor: "Nhà cung cấp",
    model: "Mẫu",
    serialNumber: "Số sê-ri",
    hardwareVersion: "Phiên bản phần cứng",
    softwareVersion: "Phiên bản phần mềm",
    orderCode: "Mã đặt hàng",
    roles: "Vai trò",
    configurationVersion: "Phiên bản cấu hình",
    lastModified: "Sửa đổi lần cuối",
    author: "Tác giả",
    lastSavedBy: "Lưu lần cuối bởi",
  },
};

const GOOSE_CONTROL_BLOCK_FIELDS = [
  { key: "controlBlockReference", label: "Control Block reference" },
  { key: "destinationMacAddress", label: "Destinstion MAC Address" },
  { key: "applicationId", label: "Application ID" },
  { key: "gooseId", label: "GOOSE ID" },
  { key: "dataSetReference", label: "DataSet reference" },
  { key: "vlanId", label: "VLAN ID" },
  { key: "vlanPriority", label: "VLAN Priority" },
  { key: "minTime", label: "Min Time" },
  { key: "maxTime", label: "Max Time" },
  { key: "configurationRevision", label: "Configuration revision" },
];

const REPORT_CONTROL_BLOCK_FIELDS = [
  { key: "controlBlockReference", label: "Control Block reference" },
  { key: "dataSetReference", label: "DataSet reference" },
  { key: "reportId", label: "Report ID" },
  { key: "triggerOptions", label: "Trigger options" },
  { key: "bufferTimeMs", label: "Buffer time (ms)" },
  { key: "configurationRevision", label: "Configuration revision" },
  { key: "integrityPeriodMs", label: "Integrity period (ms)" },
  { key: "owner", label: "Owner" },
];

const SETTING_GROUP_FIELDS = [
  { key: "controlBlock", label: "Control Block" },
  { key: "numberOfSettingGroups", label: "Number of Setting Groups" },
  { key: "activeSettingGroup", label: "Active Setting Group" },
  { key: "lastChanged", label: "Last changed" },
  { key: "reserveTime", label: "Reserve time (seconds)" },
  { key: "affectedLogicalDevices", label: "Affected Logical Devices" },
];

const resolveControlBlockValue = (block, key) => {
  if (!block || typeof block !== "object") return "";
  if (Object.prototype.hasOwnProperty.call(block, key)) return block[key];
  const target = String(key).toLowerCase();
  const matchKey = Object.keys(block).find(
    (k) => String(k).toLowerCase() === target
  );
  return matchKey ? block[matchKey] : "";
};

const formatControlBlockValue = (value) => {
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "";
};

export default {
  name: "TreeNavigation",
  components: {
    TreeNode,
    Tabs,
    ContextMenu,
    ActivityBar,
    SCLManage,
    MockView2,
    PropertiesPane,
    OwnerView,
    SubstationView,
    VoltageLevelView,
    AddDevice,
    AddOrganisation,
    AddSubstation,
    AddVoltageLevel,
    AddBay,
    DeviceListView,
  },
  computed: {
    ...mapGetters(["language"]),
    selectedId() {
      return (
        this.selectedOwnerNodes[0]?.id ??
        this.selectedLocationNodes[0]?.id ??
        this.selectedNodes[0]?.id ??
        null
      );
    },
    renderOwnerList() {
      if (!this.hideOperationOff) return this.ownerServerList;
      return this.ownerServerList.filter((n) => !this.isOperationOffDirect(n));
    },
    sidebarTotalWidthPx() {
      if (this.sidebarCollapsed) return 0;
      if (this.activeView !== 'explorer') return this.ownerWidthPx;
      let width = this.ownerWidthPx;
      if (this.showSCL) width += this.sclWidthPx + 4; // +4 for resizer handle
      if (this.showParam) width += this.paramWidthPx + 4;
      return width;
    },
    sclTargetName() {
      return this.sclTargetNode?.name || "IED";
    },
  },
  provide() {
    return {
      sclImportStore: this.sclImportStore,
    };
  },

  data() {
    return {
      activeView: 'explorer',
      menuVisible: false,
      menuPosition: { x: 0, y: 0 },
      selectedNode: {},
      tree: [],
      addDeviceDialogVisible: false,
      addOrganisationDialogVisible: false,
      addSubstationDialogVisible: false,
      addVoltageLevelDialogVisible: false,
      showOrganisationDialogVisible: false,
      showSubstationDialogVisible: false,
      showVoltageLevelDialogVisible: false,
      addDeviceNode: null,
      addOrganisationNode: null,
      addSubstationNode: null,
      addVoltageLevelNode: null,
      showOrganisationNode: null,
      showSubstationNode: null,
      showVoltageLevelNode: null,
      addBayDialogVisible: false,
      addBayNode: null,
      currentNodeId: null,
      activeTab: {},
      tabs: [],
      rightClickNode: null,
      selectedOwnerNodes: [],
      selectedLocationNodes: [],
      selectedNodes: [],
      locationList: [],
      showOwner: true,
      clientSlide: false,
      pathMapServer: [],
      pathMapClient: [],
      showTabContentServer: [],
      hideTabContentServer: [],
      showTabContentClient: [],
      hideTabContentClient: [],
      currentTabServer: "",
      sidebarCollapsed: false,
      properties: {
        Owner1: "",
        Owner2: "",
        Owner3: "",
        Location: "",
        VoltageLevel: "",
        Feeder: "",
      },
      propertiesPaneTab: "object",
      controlBlockAttributeRows: GOOSE_CONTROL_BLOCK_FIELDS.map((field) => ({
        label: field.label,
        value: "",
      })),
      controlBlockTitle: "",
      controlBlockVisible: false,
      contextMenuPosition: { x: 0, y: 0 },
      Information: {
        name: "",
        description: "",
        vendor: "",
        model: "",
        serialNumber: "",
        hardwareVersion: "",
        softwareVersion: "",
        orderCode: "",
        roles: "",
      },
      jobProperties: {
        name: "",
        work_order: "",
        creation_date: "",
        execution_date: "",
        tested_by: "",
        approved_by: "",
        ambient_condition: "",
        standard: "",
      },
      propertiesClient: {
        region: "",
        name: "",
        plant: "",
        address: "",
        city: "",
        state_province: "",
        postal_code: "",
        country: "",
        phone_no: "",
        email: "",
      },
      assetPropertiesClient: {
        asset: "",
        asset_type: "",
        serial_no: "",
        manufacturer: "",
        manufacturer_type: "",
        manufacturing_year: "",
        apparatus_id: "",
        country: "",
      },
      expandedNodes: new Set(),
      jobPropertiesClient: {
        name: "",
        work_order: "",
        creation_date: "",
        execution_date: "",
        tested_by: "",
        approved_by: "",
        ambient_condition: "",
        standard: "",
      },
      logSign: false,
      logSignClient: false,
      propertiesSign: true,
      propertiesSignClient: true,
      clientSlide: false,
      pageLocationSync: {
        first: 1,
        second: 2,
        third: 3,
        dot: "...",
        end: 10,
      },
      displayPageLocationSync: {
        second: true,
        third: true,
        dot: true,
        end: true,
      },
      pageLocationSyncInstance: {
        first: "",
        second: "",
        third: "",
        dot: "",
        end: "",
      },
      currentLocationSync: {
        nextP: "",
        previousP: "",
        current: 1,
      },
      optionLocationSync: {
        mode: "",
      },
      sl: 10,
      count: "",
      selectedParameterId: null,
      ownerServerList: [],
      // Cache thông tin IED theo iedId để tránh gọi lại API nhiều lần
      iedInfoCache: {},
      AssetType: [
        "Transformer",
        "Circuit breaker",
        "Current transformer",
        "Voltage transformer",
        "Disconnector",
        "Power cable",
        "Surge arrester",
      ],
      LocationType: ["location", "voltage", "feeder"],
      contextMenuVisible: false,
      assetPropertySign: true,
      hideOperationOff: false,
      showSCL: false,
      sclTreeData: [],
      sclLoading: false,
      sclTargetNode: null,
      // ActivityBar "SCL Import" shared state (tree in sidebar, table in tab).
      // Keep this object reference stable, so `provide/inject` stays reactive.
      sclImportStore: {
        sclTreeData: [],
        selectedNodes: [],
        isLoading: false,
        fileName: "",
        tableRootNode: null,
      },
      showParam: false,
      paramTreeData: [],
      paramLoading: false,
      resizing: false,
      sidebarWidthPercent: 20,
      internalOwnerWidthPercent: 100,
      ownerWidthPx: 300,
      sclWidthPx: 300,
      paramWidthPx: 300,
    };
  },

  methods: {
    ...useSidebarResize(),
    ...useTabs(),
    ...useContextMenu(),
    ...useSclImportStore(),
    handleControlBlockUpdate(node) {
      const mode = String(node?.mode || "").toLowerCase();
      const allowed = new Set(["goose", "urcb", "brcb", "settinggroup"]);
      let block =
        node?.controlBlock ??
        node?.controlblock ??
        node?.control_block ??
        null;
      if (block && typeof block === "string") {
        try {
          block = JSON.parse(block);
        } catch {
          block = null;
        }
      }
      if (block && block.controlBlock && typeof block.controlBlock === "object") {
        block = block.controlBlock;
      }
      if (!node || !allowed.has(mode)) {
        this.controlBlockAttributeRows = GOOSE_CONTROL_BLOCK_FIELDS.map((field) => ({
          label: field.label,
          value: "",
        }));
        this.controlBlockTitle = node?.name ? String(node.name) : "";
        this.controlBlockVisible = false;
        return;
      }
      const safeBlock = block && typeof block === "object" ? block : {};
      let fields = REPORT_CONTROL_BLOCK_FIELDS;
      if (mode === "goose") fields = GOOSE_CONTROL_BLOCK_FIELDS;
      if (mode === "settinggroup") fields = SETTING_GROUP_FIELDS;
      this.controlBlockAttributeRows = fields.map((field) => ({
        label: field.label,
        value: formatControlBlockValue(resolveControlBlockValue(safeBlock, field.key)),
      }));
      this.controlBlockTitle = node?.name ? String(node.name) : "";
      this.controlBlockVisible = true;
    },
    buildParentArrFromNode(node) {
      const arr = [];
      let current = node?.parentNode || null;
      while (current) {
        arr.unshift(current);
        current = current.parentNode || null;
      }
      return arr;
    },
    setActiveView(viewName) {
      if (this.sidebarCollapsed) {
        this.openSidebar();
      }
      this.activeView = viewName;
    },
    // Translation method
    $t(key, params = {}) {
      const currentLang = this.language || "en-vi";
      let text =
        translations[currentLang]?.[key] || translations["en-vi"][key] || key;

      Object.keys(params).forEach((param) => {
        text = text.replace(`{${param}}`, params[param]);
      });

      return text;
    },
    normalizeValue(value) {
      return String(value ?? "")
        .toLowerCase()
        .trim();
    },

    isOperationOffDirect(node) {
      if (!node) return false;
      const children = Array.isArray(node.children)
        ? node.children
        : Array.isArray(node.childrenFromData)
          ? node.childrenFromData
          : [];
      return children.some(
        (c) =>
          this.normalizeValue(c?.name) === "operation" &&
          this.normalizeValue(c?.value) === "off"
      );
    },

    handleNodeDblClick(node) {
      console.log("Node double-clicked, focusing existing tab:", node);
      if (!node) return;
      if (node.mode === "ied") {
        const existingTab = this.tabs.find((t) => t.node?.id === node.id);
        if (existingTab) {
          this.handleUpdateFocus({ iedId: node.id, focusNode: node });
        } else {
          const tab = {
            id: node.id,
            name: node.name,
            mode: node.mode,
            component: "SystemSettingTab",
            node,
            focusNode: node,
          };
          this.handleOpenTab(tab);
        }
        return;
      }

      const focusModes = new Set([
        "protectionFunction",
        "protectionLevel",
        "protectionGroup",
        "settingFunction",
        "systemSetting",
        "lineParameters",
      ]);

      if (focusModes.has(node.mode)) {
        const ancestorIed = getAncestorByMode(
          this.ownerServerList,
          node.id,
          "ied"
        );
        if (!ancestorIed) return;

        const existingTab = this.tabs.find(
          (t) => t.node?.id === ancestorIed.id
        );

        if (existingTab) {
          this.handleUpdateFocus({
            iedId: ancestorIed.id,
            focusNode: node,
          });
        } else {
          const tab = {
            id: ancestorIed.id,
            name: ancestorIed.name,
            mode: ancestorIed.mode,
            component: "SystemSettingTab",
            node: ancestorIed,
            focusNode: node,
          };
          this.handleOpenTab(tab);
        }
      }
    },

    handleUpdateFocus(payload) {
      if (!payload || !payload.iedId) {
        console.warn("handleUpdateFocus: payload invalid", payload);
        return;
      }

      const { iedId, focusNode, action } = payload;
      this.closeContextMenu();

      const hardwareTabId = `${iedId}-hardware`;
      const paramTabId = iedId;

      const findIedNode = () => {
        try {
          return this.findNodeById(this.ownerServerList, iedId);
        } catch {
          return null;
        }
      };
      const iedNode = findIedNode();
      const iedName =
        iedNode?.name ||
        focusNode?.name ||
        (this.activeTab?.name ? this.activeTab.name.split(" - ")[0] : "IED");

      if (action === "hardware") {
        let tab =
          this.tabs.find(
            (t) =>
              t.id === hardwareTabId ||
              (t.component === "HardWareInfoView" && t.node?.id === iedId)
          ) || null;

        if (!tab) {
          tab = {
            id: hardwareTabId,
            name: `${iedName} - Hardware Infomation`,
            mode: iedNode?.mode || "ied",
            component: "HardWareInfoView",
            node: iedNode || { id: iedId, name: iedName },
            focusNode: iedNode || { id: iedId, name: iedName },
          };
          this.tabs.push(tab);
        } else {
          tab.component = "HardWareInfoView";
          tab.name = `${iedName} - Hardware Infomation`;
          tab.node = iedNode || tab.node;
          tab.focusNode = iedNode || tab.focusNode;
        }

        this.activeTab = { ...tab };
        return;
      }

      const focusModes = new Set([
        "ied",
        "protectionFunction",
        "protectionLevel",
        "protectionGroup",
        "settingFunction",
        "systemSetting",
        "lineParameters",
      ]);

      let tab =
        this.tabs.find(
          (t) =>
            t.id === paramTabId ||
            (t.node?.id === iedId && t.component === "SystemSettingTab")
        ) || null;

      if (!tab) {
        tab = {
          id: paramTabId,
          name: `${iedName} - Parameter Settings`,
          mode: iedNode?.mode || "ied",
          component: "SystemSettingTab",
          node: iedNode || { id: iedId, name: iedName },
          focusNode: focusNode || iedNode,
        };
        this.tabs.push(tab);
      } else if (
        action === "parameter" ||
        (focusNode && focusModes.has(focusNode.mode))
      ) {
        tab.component = "SystemSettingTab";
        tab.name = `${iedName} - Parameter Settings`;
      }

      if (focusNode) {
        tab.focusNode = focusNode;
      }

      this.activeTab = { ...tab };
    },
    async resetAllServer() {
      this.pathMapServer = [];
      this.selectedNode = null;

      const collapseNodes = (nodes) => {
        if (!Array.isArray(nodes)) return;
        nodes.forEach((node) => {
          node.expanded = false;
          if (node.children && node.children.length > 0) {
            collapseNodes(node.children);
          }
        });
      };
      collapseNodes(this.ownerServerList);
    },

    async resetPathServer(index) {
      if (index === 0) {
        let currentNode = this.ownerServerList.find(
          (node) => node.id === this.pathMapServer[0]?.id
        );
        if (!currentNode) {
          return;
        }
        await this.clearSelection();
        await this.showPropertiesData(currentNode);

        const collapseChildren = (node) => {
          if (node.children && node.children.length > 0) {
            node.children.forEach((child) => {
              if (!("expanded" in child)) {
                child.expanded = false;
              } else {
                child.expanded = false;
              }
              collapseChildren(child);
            });
          }
        };
        collapseChildren(currentNode);

        if (!("expanded" in currentNode)) {
          currentNode.expanded = true;
        } else {
          currentNode.expanded = !currentNode.expanded;
        }
      } else {
        let currentNode = this.ownerServerList.find(
          (node) => node.id === this.pathMapServer[0]?.id
        );
        if (!currentNode) {
          return;
        }
        for (let i = 1; i <= index; i++) {
          if (!currentNode.children) return;
          currentNode = currentNode.children.find(
            (child) => child.id === this.pathMapServer[i]?.id
          );
          if (!currentNode) {
            return;
          }
        }
        await this.clearSelection();
        await this.showPropertiesData(currentNode);

        const collapseChildren = (node) => {
          if (node.children && node.children.length > 0) {
            node.children.forEach((child) => {
              if (!("expanded" in child)) {
                child.expanded = false;
              } else {
                child.expanded = false;
              }
              collapseChildren(child);
            });
          }
        };
        collapseChildren(currentNode);

        if (!("expanded" in currentNode)) {
          currentNode.expanded = true;
        } else {
          currentNode.expanded = !currentNode.expanded;
        }
      }
    },

    findNodeById(nodes, id) {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
          const found = this.findNodeById(n.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    saveExpandedState() {
      this.expandedNodes.clear();
      const traverse = (nodes) => {
        nodes.forEach((node) => {
          if (node.expanded) {
            this.expandedNodes.add(node.id);
          }
          if (node.children && node.children.length) {
            traverse(node.children);
          }
        });
      };
      traverse(this.ownerServerList);
    },

    restoreExpandedState(nodes) {
      nodes.forEach((node) => {
        if (this.expandedNodes.has(node.id)) {
          node.expanded = true;
        }
        if (node.children && node.children.length) {
          this.restoreExpandedState(node.children);
        }
      });
    },
    async reloadTree() {
      try {
        this.saveExpandedState();
        const data = await getEntityTreeRaw();
        this.ownerServerList = data;
        this.restoreExpandedState(this.ownerServerList);
      } catch (e) {
        console.error("reloadTree failed:", e);
      }
    },

    handleSelectParameter(node) {
      this.selectedParameterId = node.id;
    },

    handleToggleNode(node) {
      node.expanded = !node.expanded;
      this.pathMapServer = node.parentArr || [];
    },
    fetchParent(node) {
      return "setting1";
    },
    hideLogBar(sign) {
      this.logSign = false;
      const element = this.$refs.contentData;
      element.style.height = "100%";
    },

    showLogBar(sign) {
      this.logSign = true;
      const element = this.$refs.contentData;
      element.style.height = "80%";
      this.$nextTick(() => {
        const elementLog = this.$refs.logBar;
        elementLog.style.height = "20%";
      });
    },

    showLogBarClient(sign) {
      this.logSignClient = true;
      const element = this.$refs.contentDataClient;
      element.style.height = "80%";
      this.$nextTick(() => {
        const elementLog = this.$refs.logBarClient;
        elementLog.style.height = "20%";
      });
    },
    handleParameterTree(node) {
      if (!node) return;
      // Parameter tree moved into Parameter Settings tab.
      this.showParam = false;
      this.paramTreeData = [];
    },
    toggleParamNode(node) {
      if (!node) return;
      node.expanded = !node.expanded;
    },
    handleAddGroup(node) {
      if (!node) return;
      const children = Array.isArray(node.children)
        ? node.children
        : Array.isArray(node.childrenFromData)
          ? node.childrenFromData
          : [];
      const groups = children.filter((c) => c.mode === "protectionGroup");
      const current = Number(node.groupVisibleCount || 1);
      const next = Math.min(current + 1, groups.length || current + 1);
      node.groupVisibleCount = next;
      node.showAllGroups = false;
      this.$forceUpdate();
    },
    handleShowAllGroup(node) {
      if (!node) return;
      const children = Array.isArray(node.children)
        ? node.children
        : Array.isArray(node.childrenFromData)
          ? node.childrenFromData
          : [];
      const groups = children.filter((c) => c.mode === "protectionGroup");
      node.groupVisibleCount = groups.length || 0;
      node.showAllGroups = true;
      this.$forceUpdate();
    },
    openAddDeviceDialog(node) {
      this.addDeviceNode = node || null;
      this.addDeviceDialogVisible = true;
    },
    openAddOrganisationDialog(node) {
      this.addOrganisationNode = node || null;
      this.addOrganisationDialogVisible = true;
    },
    openAddSubstationDialog(node) {
      this.addSubstationNode = node || null;
      this.addSubstationDialogVisible = true;
    },
    openShowOrganisationDialog(node) {
      this.showOrganisationNode = node || null;
      this.showOrganisationDialogVisible = true;
    },
    openShowSubstationDialog(node) {
      this.showSubstationNode = node || null;
      this.showSubstationDialogVisible = true;
    },
    openShowVoltageLevelDialog(node) {
      this.showVoltageLevelNode = node || null;
      this.showVoltageLevelDialogVisible = true;
    },
    openAddVoltageLevelDialog(node) {
      this.addVoltageLevelNode = node || null;
      this.addVoltageLevelDialogVisible = true;
    },
    onDeviceCreated() {
      this.addDeviceDialogVisible = false;
      this.reloadTree();
    },
    onOrganisationCreated() {
      this.addOrganisationDialogVisible = false;
      this.reloadTree();
    },
    onSubstationCreated() {
      this.addSubstationDialogVisible = false;
      this.reloadTree();
    },
    onVoltageLevelCreated() {
      this.addVoltageLevelDialogVisible = false;
      this.reloadTree();
    },
    openAddBayDialog(node) {
      this.addBayNode = node;
      this.addBayDialogVisible = true;
    },
    onBayCreated() {
      this.addBayDialogVisible = false;
      this.reloadTree();
    },
    openSidebar() {
      this.sidebarCollapsed = false;
    },
    collapseSidebar() {
      this.sidebarCollapsed = true;
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    setHideOperation(value) {
      this.hideOperationOff = value;
    },

    showLocationRoot() {
      const locationRoot = this.$refs.locationRoot;
      const ownerRoot = this.$refs.ownerRootServer;
      if (locationRoot) {
        locationRoot.style.borderBottom = "2px #aba7a7 solid";
        locationRoot.style.color = "rgba(0, 0, 0, 1)";
      }
      if (ownerRoot) {
        ownerRoot.style.borderBottom = "2px #e6e4e4 solid";
        ownerRoot.style.color = "rgba(0, 0, 0, 0.5)";
      }

      if (this.selectedOwnerNodes.length > 0) {
        const children = this.selectedOwnerNodes[0].children || [];
        this.locationList = children.filter((child) =>
          this.LocationType.includes(child.mode)
        );
        this.selectedLocationNodes = [];
      } else {
        this.locationList = [];
      }

      this.showOwner = false;
    },
    updateSelection(selectedNodes) {
      if (this.showOwner) {
        this.selectedOwnerNodes = selectedNodes;
      } else {
        this.selectedLocationNodes = selectedNodes;
      }
    },
    updateSelectionOwner(node) {
      this.selectedOwnerNodes = [node];
    },
    clearSelectionOwner() {
      this.selectedOwnerNodes = [];
    },
    updateSelectionLocation(node) {
      this.selectedLocationNodes = [node];
    },
    clearSelectionLocation() {
      this.selectedLocationNodes = [];
    },

    clearSelection() {
      if (this.showOwner) {
        this.selectedOwnerNodes = [];
      } else {
        this.selectedLocationNodes = [];
      }
    },
    showOwnerServerRoot() {
      const ownerRoot = this.$refs.ownerRootServer;
      const locationRoot = this.$refs.locationRoot;
      if (ownerRoot) {
        ownerRoot.style.borderBottom = "2px #aba7a7 solid";
        ownerRoot.style.color = "rgba(0, 0, 0, 1)";
      }
      if (locationRoot) {
        locationRoot.style.borderBottom = "2px #e6e4e4 solid";
        locationRoot.style.color = "rgba(0, 0, 0, 0.5)";
      }

      this.showOwner = true;
    },

    async fetchChildren(node) {
      if (node.children && node.children.length > 0) return;

      const children = node.childrenFromData || [];

      Vue.$set(node, "children", children);

      for (const child of children) {
        child.parentNode = node;

        let parentArr = [];
        if (node.parentArr) {
          parentArr = [...node.parentArr];
        } else {
          let current = node.parentNode;
          while (current) {
            parentArr.unshift(current);
            current = current.parentNode;
          }
        }

        parentArr.push(node);
        child.parentArr = parentArr;
      }
    },
    async fetchChildrenServer(node) {
      // Tính parentArr cho node nếu chưa có, tránh gọi lại cho cùng node nhiều lần
      try {
        if (!Array.isArray(node.parentArr) || node.parentArr.length === 0) {
          const quickParents = this.buildParentArrFromNode(node);
          if (quickParents.length) {
            node.parentArr = quickParents;
          }
        }
      } catch (e) {
        console.error(
          "fetchChildrenServer: Error fetching ancestors for node:",
          e
        );
        node.parentArr = node.parentNode ? [node.parentNode] : [];
      }

      if (node.children && node.children.length > 0) return;

      let children = node.childrenFromData || [];

      const seen = new Set();
      children = children.filter((c) => {
        const id = String(c.id).trim();
        if (seen.has(id)) return false;
        seen.add(id);
        c.id = id;
        return true;
      });

      node.children = children;

      // Thiết lập parentNode và parentArr cho con dựa trên parentArr của node cha
      for (const child of node.children) {
        child.parentNode = node;

        if (!Array.isArray(child.parentArr) || child.parentArr.length === 0) {
          const baseAncestors = Array.isArray(node.parentArr)
            ? node.parentArr
            : [];
          const merged = [...baseAncestors, node];

          const uniqParentArr = merged.filter(
            (p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx
          );

          child.parentArr = uniqParentArr;
        }
      }

      if (
        this.nextSelectedNode?.id === node.id ||
        this.selectedOwnerNodes[0]?.id === node.id ||
        this.selectedLocationNodes[0]?.id === node.id
      ) {
        this.pathMapServer = node.parentArr
          ? [
            ...node.parentArr.map((parent) => ({
              id: parent.id,
              parent: parent.name,
            })),
            { id: node.id, parent: node.name },
          ]
          : [{ id: node.id, parent: node.name }];
      }
    },
    async hideProperties() {
      this.propertiesSign = false;
      const content = this.$refs.content;
      content.style.width = "100%";
    },

    async showProperties() {
      this.propertiesSign = true;
      const content = this.$refs.content;
      content.style.width = `calc(75% - 5px)`;
    },

    serverSwap(serverSign) {
      if (serverSign == true) {
        this.clientSlide = false;
      } else {
        this.clientSlide = true;
      }
    },

    async updateLocationSyncPage(pageStt) {
      try {
        if (this.optionLocationSync.mode == "update") {
          await ownerAPI
            .getOwnerByRole("OWNER1", pageStt, this.sl)
            .then((res) => {
              if (res != null && res.length != 0) {
                for (let i in res) {
                  res[i].id = res[i].mrid;
                  res[i].parentId = "";
                  res[i].parentName = "";
                  res[i].parentArr = [];
                }
                this.ownerServerList = res;
              }
            });
        }
      } catch (error) {
        this.$message.error("Some error occur");
        console.error(error);
      }
    },

    async showPropertiesData(node) {
      // Default properties view
      this.propertiesPaneTab = "object";
      this.handleControlBlockUpdate(node);

      this.selectedOwnerNodes = [node];
      this.refreshProps();
      this.assetPropertySign = true;
      this.jobPropertySign = true;

      let iedId = null;
      if (node.mode === "ied") {
        iedId = node.id;
      } else if (
        node.mode === "protectionFunction" ||
        node.mode === "protectionLevel" ||
        node.mode === "protectionGroup" ||
        node.mode === "settingFunction" ||
        node.mode === "systemSetting" ||
        node.mode === "lineParameters"
      ) {
        const ancestorIed = getAncestorByMode(
          this.ownerServerList,
          node.id,
          "ied"
        );
        if (ancestorIed) {
          iedId = ancestorIed.id;
        }
      }

      if (iedId) {
        try {
          const cacheKey = String(iedId);
          let deviceInfo = this.iedInfoCache[cacheKey];
          if (!deviceInfo) {
            deviceInfo = await getIedInfoById(iedId);
            this.iedInfoCache[cacheKey] = deviceInfo || {};
          }

          this.Information = {
            name: deviceInfo.name || "",
            description: deviceInfo.description || "",
            vendor: deviceInfo.vendor || "",
            model: deviceInfo.model || "",
            serialNumber: deviceInfo.serialNumber || "",
            hardwareVersion: deviceInfo.hardwareVersion || "",
            softwareVersion: deviceInfo.softwareVersion || "",
            orderCode: deviceInfo.orderCode || "",
            roles: deviceInfo.role || "",
          };
        } catch (err) {
          console.error("Không lấy được thông tin device:", err);
          this.Information = {
            name: node.name || "",
            description: node.description || "",
            vendor: node.vendor || "",
            model: node.model || "",
            serialNumber: node.serialNumber || "",
            hardwareVersion: node.hardwareVersion || "",
            softwareVersion: node.softwareVersion || "",
            orderCode: node.orderCode || "",
            roles: node.roles || "",
          };
        }
      }

      this.properties = await getPropertiesById(this.ownerServerList, node.id);

      if (!node.parentArr) {
        try {
          const quickParents = this.buildParentArrFromNode(node);
          if (quickParents.length) {
            node.parentArr = quickParents;
          } else {
            const ancestors = await getAncestorsById(
              this.ownerServerList,
              node.id
            );
            node.parentArr = [...ancestors];
          }
        } catch (e) {
          console.error("showPropertiesData: Error fetching ancestors:", e);
          node.parentArr = [];
        }
      }
      this.pathMapServer = node.parentArr
        ? [
          ...node.parentArr.map((parent) => ({
            id: parent.id,
            parent: parent.name,
          })),
          { id: node.id, parent: node.name },
        ]
        : [{ id: node.id, parent: node.name }];
    },

    updateSelectionOwner(node) {
      this.selectedOwnerNodes = [node];
      if (!node.parentArr) {
        try {
          const quickParents = this.buildParentArrFromNode(node);
          if (quickParents.length) {
            node.parentArr = quickParents;
          } else {
            const ancestors = getAncestorsById(this.ownerServerList, node.id);
            node.parentArr = [...ancestors];
          }
        } catch (e) {
          console.error("updateSelectionOwner: Error fetching ancestors:", e);
          node.parentArr = [];
        }
      }
      this.pathMapServer = node.parentArr
        ? [
          ...node.parentArr.map((parent) => ({
            id: parent.id,
            parent: parent.name,
          })),
          { id: node.id, parent: node.name },
        ]
        : [{ id: node.id, parent: node.name }];
    },

    updateSelectionLocation(node) {
      this.selectedLocationNodes = [node];
      if (!node.parentArr) {
        try {
          const quickParents = this.buildParentArrFromNode(node);
          if (quickParents.length) {
            node.parentArr = quickParents;
          } else {
            const ancestors = getAncestorsById(this.ownerServerList, node.id);
            node.parentArr = [...ancestors];
          }
        } catch (e) {
          console.error(
            "updateSelectionLocation: Error fetching ancestors:",
            e
          );
          node.parentArr = [];
        }
      }
      this.pathMapServer = node.parentArr
        ? [
          ...node.parentArr.map((parent) => ({
            id: parent.id,
            parent: parent.name,
          })),
          { id: node.id, parent: node.name },
        ]
        : [{ id: node.id, parent: node.name }];
    },

    async removeOwner(node) {
      this.ownerServerList = this.ownerServerList.filter(
        (owner) => owner.id !== node.id
      );
      this.$message.success("Xóa owner thành công (mock)");
    },
    async removeAsset(node) {
      this.ownerServerList.forEach((owner) => {
        if (owner.children) {
          owner.children = owner.children.filter((c) => c.id !== node.id);
        }
      });
      this.$message.success("Asset đã được xóa thành công (mock)");
    },
    async removeLocation(node) {
      this.ownerServerList.forEach((owner) => {
        if (owner.children) {
          owner.children = owner.children.filter((c) => c.id !== node.id);
        }
      });
      this.$message.success("Xóa location thành công (mock)");
    },
    refreshProps() {
      this.properties = this.selectedId
        ? getPropertiesById(this.ownerServerList, this.selectedId)
        : EMPTY_PROPS();
    },
  },
  async mounted() {
    try {
      const data = await getEntityTreeRaw();
      if (Array.isArray(data)) {
        this.ownerServerList = data;
      } else {
        console.warn("API trả về dữ liệu không phải mảng:", data);
        this.ownerServerList = [];
      }
    } catch (err) {
      console.error("Lỗi khi tải entity tree:", err);
      this.$message?.error?.("Không tải được dữ liệu cây");
    }
  },
  beforeUnmount() {
    if (this._resizeServerFrame) cancelAnimationFrame(this._resizeServerFrame);
    if (this._resizeContentFrame) cancelAnimationFrame(this._resizeContentFrame);
    if (this._resizeOwnerFrame) cancelAnimationFrame(this._resizeOwnerFrame);
    if (this._resizeSclFrame) cancelAnimationFrame(this._resizeSclFrame);
    if (this._resizeParamFrame) cancelAnimationFrame(this._resizeParamFrame);
  },
  beforeMount() { },
  watch: {
    selectedId() {
      this.refreshProps();
    },
    ownerServerList: {
      handler() {
        this.refreshProps();
      },
      deep: true,
    },
    showSCL(val) {
      if (val) {
        this.sidebarWidthPercent = Math.max(this.sidebarWidthPercent, 40);
        this.internalOwnerWidthPercent = 50;
      } else {
        this.sidebarWidthPercent = Math.min(this.sidebarWidthPercent, 20);
        this.internalOwnerWidthPercent = 100;
      }
    }
  },
};
