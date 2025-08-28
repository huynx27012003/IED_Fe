<template>
  <div class="explorer">
    <div v-show="!clientSlide" class="toolbar">
      <div style="display: flex; align-items: center">
        <div @click="resetAllServer" class="path-hover">{{ $t("home") }}</div>
        <i
          v-if="pathMapServer.length"
          style="margin-left: 10px"
          class="fa-solid fa-angle-right"
        ></i>
      </div>

      <!-- tôi muốn chuột phải ở các node có mode  "protectionFunction",
        "protectionLevel",
        "protectionGroup",
        "settingFunction",
        "systemSetting", thì chuyển thành double click, còn các node khác vẫn giữ nguyên là chuột phải, double click không còn bôi đen chữ và không colapse hay expand như click-->
      <div
        style="display: flex; align-items: center"
        v-for="(item, index) in pathMapServer"
        :key="index"
      >
        <div @click="resetPathServer(index)" class="path-hover">
          {{ item.parent }}
        </div>
        <i
          v-if="index < pathMapServer.length - 1"
          style="margin-left: 10px"
          class="fa-solid fa-angle-right"
        ></i>
      </div>
    </div>

    <div class="resizable-sidebar">
      <!-- Sidebar Server -->
      <div ref="sidebarServer" v-show="!clientSlide" class="sidebar">
        <div class="title-temp">
          <div ref="tabContainer" class="tab-container">
            <!-- <div ref="locationRoot" @click="showLocationRoot" class="location">
              {{ $t("location") }}
            </div> -->
            <div ref="ownerRootServer" @click="showOwnerServerRoot" class="tab">
              {{ $t("owner") }}
            </div>
          </div>
        </div>
        <div v-if="showOwner" class="child-nav">
          <ul>
            <TreeNode
              v-for="item in ownerServerList"
              :key="item.id"
              :node="item"
              :selectedNodes="selectedNodes"
              :selectedParameterId="selectedParameterId"
              @select-parameter="handleSelectParameter"
              @fetch-children="fetchChildrenServer"
              @show-properties="showPropertiesData"
              @update-selection="updateSelectionOwner"
              @clear-selection="clearSelectionOwner"
              @open-context-menu="openContextMenu"
              @toggle-node="handleToggleNode"
              @node-dblclick="handleNodeDblClick"
            />
          </ul>
        </div>

        <div v-else class="child-nav">
          <div
            v-if="!selectedOwnerNodes.length"
            class="no-selection-message"
          ></div>
          <div v-else-if="!locationList.length" class="empty-location-message">
            <p
              style="
                padding: 20px;
                text-align: center;
                color: #666;
                font-style: italic;
              "
            >
              {{
                $t("ownerHasNoLocations", {
                  ownerName: selectedOwnerNodes[0].name,
                })
              }}
            </p>
          </div>
          <ul v-else>
            <TreeNode
              v-for="item in locationList"
              :key="item.id"
              :node="item"
              :selectedNodes="selectedNodes"
              @fetch-children="fetchChildrenServer"
              @show-properties="showPropertiesData"
              @update-selection="updateSelectionLocation"
              @clear-selection="clearSelectionLocation"
              @open-context-menu="openContextMenu"
            />
          </ul>
        </div>
      </div>
      <div
        @mousedown="startResizeServer"
        v-if="!clientSlide"
        ref="resizerServer"
        class="resizer"
      ></div>
      <div ref="contextDataServer" v-show="!clientSlide" class="context-data">
        <div ref="contentData" class="content-data">
          <div ref="content" class="content">
            <div class="title-content"></div>
            <div class="content-content">
              <Tabs
                ref="tabsServer"
                :side="'server'"
                :tree="ownerServerList"
                v-model="activeTab"
                :tabs="tabs"
                @refresh-tree="reloadTree"
                @close-tab="removeTab"
                @update-focus="handleUpdateFocus"
              />
            </div>
          </div>
          <div
            @mousedown="startResizeContentServer"
            ref="resizerContentServer"
            class="resizer"
          ></div>
          <div v-if="propertiesSign" ref="properties" class="properties">
            <!-- Form hiển thị thông tin -->
            <div class="title-properties">
              <div class="title-wrapper">
                <div class="title-name">{{ $t("objectProperties") }}</div>
                <div style="margin-right: 5px">
                  <i
                    @click="hideProperties"
                    class="fa-solid fa-square-caret-right"
                  ></i>
                </div>
              </div>
            </div>
            <div class="content-properties">
              <div class="content-properties-header">
                <i
                  class="fa-solid fa-chevron-down"
                  style="padding-right: 5px; font-size: 10px"
                ></i>
                {{ $t("ownerAndPosition") }}
              </div>
              <div class="content-properties-table">
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("owner1") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Owner1 }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("owner2") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Owner2 }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("owner3") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Owner3 }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("location") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Location }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("voltageLevel") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.VoltageLevel }}
                  </div>
                </div>

                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("feeder") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Feeder }}
                  </div>
                </div>
              </div>
              <div v-if="assetPropertySign" class="content-properties-header">
                <i
                  class="fa-solid fa-chevron-down"
                  style="padding-right: 5px; font-size: 10px"
                ></i>
                {{ $t("deviceInformation") }}
              </div>
              <div v-if="assetPropertySign" class="content-properties-table">
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("name") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ Information.name }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("description") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ Information.description }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("vendor") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ Information.vendor }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("model") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ Information.model }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("serialNumber") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ Information.serialNumber }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("hardwareVersion") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ Information.hardwareVersion }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("softwareVersion") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ Information.softwareVersion }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("orderCode") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ Information.orderCode }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("roles") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ Information.roles }}
                  </div>
                </div>
              </div>
              <div class="content-properties-header">
                <i
                  class="fa-solid fa-chevron-down"
                  style="padding-right: 5px; font-size: 10px"
                ></i>
                {{ $t("configurationVersion") }}
              </div>
              <div class="content-properties-table">
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("lastModified") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  ></div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("author") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  ></div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    {{ $t("lastSavedBy") }}
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="!propertiesSign"
            @click="showProperties"
            class="trapezoid"
          ></div>
        </div>
      </div>
    </div>
    <ContextMenu
      v-if="contextMenuVisible"
      class="context-menu"
      :visible="contextMenuVisible"
      :position="contextMenuPosition"
      :selectedNode="rightClickNode"
      :tree="ownerServerList"
      @refresh-tree="reloadTree"
      @close="closeContextMenu"
      @open-tab="handleOpenTab"
      @update-focus="handleUpdateFocus"
    />
  </div>
</template>

<script>
/* eslint-disable */
import TreeNode from "./common/TreeNode.vue";
import Tabs from "./common/Tabs.vue";
import ContextMenu from "./common/ContextMenu.vue";
import {
  getEntityTreeRaw,
  getPropertiesById,
  getAncestorsById,
  getAncestorByMode,
} from "@/api/treenode";
import { getIedInfoById } from "@/api/device";
import { mapGetters } from "vuex";

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

export default {
  name: "TreeNavigation",
  components: {
    TreeNode,
    Tabs,
    ContextMenu,
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
  },

  data() {
    return {
      menuVisible: false,
      menuPosition: { x: 0, y: 0 },
      selectedNode: {},
      tree: [],
      addDeviceDialogVisible: false,
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
      properties: {
        Owner1: "",
        Owner2: "",
        Owner3: "",
        Location: "",
        VoltageLevel: "",
        Feeder: "",
      },
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
    };
  },

  methods: {
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

    handleNodeDblClick(node) {
      const ancestorIed = getAncestorByMode(
        this.ownerServerList,
        node.id,
        "ied"
      );
      if (!ancestorIed) return;

      const existingTab = this.tabs.find((t) => t.node?.id === ancestorIed.id);

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
    },
    handleUpdateFocus(payload) {
      if (!payload || !payload.iedId) {
        console.warn("handleUpdateFocus: payload invalid", payload);
        return;
      }

      const { iedId, focusNode } = payload;
      this.closeContextMenu();

      const tab = this.tabs.find((t) => t.node?.id === iedId);
      if (tab) {
        tab.focusNode = focusNode;

        if (this.modelActive && this.modelActive.id === tab.id) {
          this.modelActive = { ...tab };
        }
      }
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

      if (!node.expanded && node.children && node.children.length > 0) {
        const collapseChildren = (children) => {
          children.forEach((child) => {
            child.expanded = false;
            if (child.children && child.children.length > 0) {
              collapseChildren(child.children);
            }
          });
        };
        collapseChildren(node.children);
      }
    },
    fetchParent(node) {
      return "setting1";
    },
    handleOpenTab(payload) {
      this.closeContextMenu();
      if (!payload || !payload.id || !payload.node) return;

      const newTab = { ...payload };

      const exists = this.tabs.find((t) => t.id === newTab.id);
      if (!exists) {
        this.tabs.push(newTab);
        this.activeTab = { ...newTab };
      } else {
        this.activeTab = { ...exists };
      }

      if (newTab.node.mode === "parameter") {
        const parentId = this.fetchParent(newTab.node);
        const idx = this.tabs.findIndex((t) => t.node?.id === parentId);
        if (idx !== -1 && this.tabs[idx].id !== newTab.id) {
          this.tabs.splice(idx, 1);
        }
      }

      this.$emit("input", this.activeTab);
      this.$nextTick(() => {
        this.$nextTick(() => {
          if (this.activeTab.id && this.$refs.tabsServer) {
            this.$refs.tabsServer.scrollToActiveTab();
          } else {
            console.warn(
              "activeTab.id still undefined or tabsServer not ready"
            );
          }
        });
      });
    },
    scrollToActiveTab() {
      this.$nextTick(() => {
        const tabsHeader =
          this.$refs.contentData.querySelector(".tabs-header-data");
        const tabItems = this.$refs.contentData.querySelectorAll(".tab-item");
        if (tabsHeader && tabItems) {
          const activeTabElement = Array.from(tabItems).find((el) =>
            el.classList.contains("active")
          );
          if (activeTabElement) {
            activeTabElement.scrollIntoView({
              behavior: "smooth",
              inline: "center",
            });
          } else {
            console.warn(
              "No active tab element found for ID:",
              this.activeTab.id
            );
            const matchingTab = this.tabs.find(
              (t) => t.id === this.activeTab.id
            );
            if (matchingTab) {
              this.activeTab = { ...matchingTab };
              this.$emit("input", this.activeTab);

              this.$nextTick(() => {
                const newActiveTabElement = Array.from(tabItems).find((el) =>
                  el.classList.contains("active")
                );
                if (newActiveTabElement) {
                  newActiveTabElement.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                  });
                }
              });
            }
          }
        }
      });
    },

    openTabForNode(node) {
      if (!node || !node.id) return;
      const existingIndex = this.tabs.findIndex((tab) => tab.id === node.id);
      if (existingIndex !== -1) {
        this.activeTab = this.tabs[existingIndex];
      } else {
        this.tabs.push(node);
        this.activeTab = node;
      }
      this.closeContextMenu();
    },

    openContextMenu(event, node) {
      event.preventDefault();
      if (!node || !node.id) return;

      // const focusModes = new Set([
      //   "protectionFunction",
      //   "protectionLevel",
      //   "protectionGroup",
      //   "settingFunction",
      //   "systemSetting",
      // ]);

      // if (focusModes.has(node.mode)) {
      //   const ancestorIed = getAncestorByMode(
      //     this.ownerServerList,
      //     node.id,
      //     "ied"
      //   );
      //   if (ancestorIed) {
      //     this.handleUpdateFocus({ iedId: ancestorIed.id, focusNode: node });
      //   }
      //   return;
      // }

      this.rightClickNode = node;
      this.contextMenuVisible = true;
      let posX = event.clientX;
      let posY = event.clientY;
      this.$nextTick(() => {
        const menuEl = document.querySelector(".context-menu");
        if (menuEl) {
          const menuRect = menuEl.getBoundingClientRect();
          const maxHeight = window.innerHeight * 0.8;
          const menuHeight = Math.min(menuRect.height, maxHeight);
          if (posY + menuHeight > window.innerHeight) posY = 70;
          if (posX + menuRect.width > window.innerWidth) {
            posX = window.innerWidth - menuRect.width - 10;
          }
          if (posY < 10) posY = 10;
          if (posX < 10) posX = 10;
          this.contextMenuPosition = { x: posX, y: posY };
        } else {
          this.contextMenuPosition = { x: posX, y: posY };
        }
      });
      document.addEventListener("click", this.handleOutsideClick);
    },
    closeContextMenu() {
      this.contextMenuVisible = false;
      this.rightClickNode = null;
      document.removeEventListener("click", this.handleOutsideClick);
    },

    handleOutsideClick(e) {
      if (!this.$el) {
        console.warn("this.$el is not available");
        this.closeContextMenu();
        return;
      }
      const menu = this.$el.querySelector(".context-menu");
      if (menu && !menu.contains(e.target)) {
        this.closeContextMenu();
      }
    },
    removeTab(index) {
      const closedTabId = this.tabs[index].id;
      this.tabs.splice(index, 1);
      if (this.activeTab.id === closedTabId) {
        if (this.tabs.length > 0) {
          this.activeTab = { ...this.tabs[this.tabs.length - 1] };
        } else {
          this.activeTab = {};
        }
        this.$emit("input", this.activeTab);
      }
    },
    hideLogBar(sign) {
      this.logSign = false;
      const element = this.$refs.contentData;
      element.style.height = "100%";
    },

    startResizeServer() {
      document.addEventListener("mousemove", this.resizeServer);
      document.addEventListener("mouseup", this.stopResizeServer);
    },
    resizeServer(event) {
      if (!this.$refs.sidebarServer || !this.$refs.sidebarServer.offsetParent)
        return;

      const sidebarLeft =
        this.$refs.sidebarServer.offsetParent.getBoundingClientRect().left;
      const newWidth = event.clientX - sidebarLeft;
      const containerWidth = this.$refs.sidebarServer.offsetParent.clientWidth;

      let percentWidth = (newWidth / containerWidth) * 100;
      let finalWidth = Math.max(10, Math.min(40, percentWidth));

      this.$refs.sidebarServer.style.width = finalWidth + "%";
      this.$refs.contextDataServer.style.width = 100 - finalWidth + "%";
    },
    stopResizeServer() {
      document.removeEventListener("mousemove", this.resizeServer);
      document.removeEventListener("mouseup", this.stopResizeServer);
    },
    startResizeContentServer() {
      document.addEventListener("mousemove", this.resizeContentServer);
      document.addEventListener("mouseup", this.stopResizeContentServer);
    },
    resizeContentServer(event) {
      if (!this.$refs.properties || !this.$refs.contentData) return;
      const parentWidth = this.$refs.contextDataServer.clientWidth;
      let newWidth =
        parentWidth -
        event.clientX +
        this.$refs.contextDataServer.getBoundingClientRect().left;
      const minWidth = parentWidth * 0.1;
      const maxWidth = parentWidth * 0.4;
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      newWidth = (newWidth / parentWidth) * 100;
      this.$refs.properties.style.width = `${newWidth}%`;
      this.$refs.content.style.width = `${100 - newWidth}%`;
    },
    stopResizeContentServer() {
      document.removeEventListener("mousemove", this.resizeContentServer);
      document.removeEventListener("mouseup", this.stopResizeContentServer);
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
      try {
        const ancestors = await getAncestorsById(this.ownerServerList, node.id);
        node.parentArr = [...ancestors];
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

      for (const child of node.children) {
        child.parentNode = node;
        try {
          const ancestors = await getAncestorsById(
            this.ownerServerList,
            child.id
          );
          const merged = [...ancestors, node];
          const uniqParentArr = merged.filter(
            (p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx
          );
          child.parentArr = uniqParentArr;

          console.log(
            "fetchChildrenServer: parentArr for child:",
            child.id,
            JSON.stringify(
              uniqParentArr.map((a) => ({ id: a.id, name: a.name })),
              null,
              2
            )
          );
        } catch (e) {
          console.error(
            "fetchChildrenServer: Error fetching ancestors for child:",
            e
          );
          child.parentArr = [node];
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

        console.log(
          "fetchChildrenServer: pathMapServer result:",
          JSON.stringify(this.pathMapServer, null, 2)
        );
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
        node.mode === "systemSetting"
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
          const deviceInfo = await getIedInfoById(iedId);

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
          const ancestors = await getAncestorsById(
            this.ownerServerList,
            node.id
          );
          node.parentArr = [...ancestors];
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
          const ancestors = getAncestorsById(this.ownerServerList, node.id);
          node.parentArr = [...ancestors];
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
          const ancestors = getAncestorsById(this.ownerServerList, node.id);
          node.parentArr = [...ancestors];
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
  beforeMount() {},
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
  },
};
</script>

<style scoped>
/* style.css */
.explorer {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-size: 12px;
}
.context-menu {
  position: fixed;
  z-index: 1000;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  min-width: 220px;
  padding: 8px 0;
  font-family: "Segoe UI", sans-serif;
  max-height: 80vh;
  /* overflow-y: auto; */
}

.explorer {
  display: flex;
  flex-direction: column;
  height: calc(100%) !important;
}

.resizable-sidebar {
  display: flex;
  height: calc(88vh);
}

.sidebar {
  width: 20%;
  background-color: white;
  color: #555;
  flex-shrink: 0;
  height: 100%;
  box-sizing: border-box;
}

.sidebar ul {
  list-style: none;
  padding-left: 20px;
  height: 100%;
}

.sidebar li {
  margin: 5px 0;
  cursor: pointer;
}

.sidebar .folder,
.sidebar .file {
  display: block;
  padding: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}

.sidebar .folder:hover,
.sidebar .file:hover {
  background-color: #555;
  color: white;
}

.sidebar .folder i,
.sidebar .file i {
  margin-right: 8px; /* Khoảng cách giữa icon và văn bản */
  width: 16px; /* Kích thước icon */
  text-align: center;
  font-size: 12px; /* Cỡ chữ cho icon */
}

.resizer {
  width: 5px;
  background-color: white;
  cursor: ew-resize; /* Con trỏ đổi thành mũi tên kéo ngang */
}

.content {
  width: calc(80% - 5px);
  background-color: white;
  font-size: 12px; /* Cỡ chữ cho nội dung */
  box-sizing: border-box;
}

.title-content {
  width: 100%;
  height: 5px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.content-content {
  width: 100%;
  height: calc(100% - 5px);
  box-sizing: border-box;
  border: 1px rgb(224, 222, 222) solid;
  border-bottom: none;
  overflow: hidden;
}

.content-content:hover {
  overflow: auto;
}

.folder-item {
  text-align: center;
  padding: 10px;
  border: 1px solid #ddd;
  cursor: pointer;
  font-size: 12px;
}

.folder-item:hover {
  background-color: #f0f0f0;
}
.child-nav {
  overflow-y: hidden;
  height: calc(100vh - 147px);
  box-sizing: border-box;
}
.child-nav:hover {
  overflow-y: auto;
}
.title-node {
  margin-top: 50px;
}
.title-temp {
  height: 40px;
  color: #555;
  font-weight: 600;
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
  background-color: white;
}
.toolbar {
  background-color: #d9d9d9;
  height: 25px;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: #555;
  font-weight: 600;
  box-sizing: border-box;
  width: 100%;
  padding-top: 4px;
  padding-left: 10px;
}

.properties {
  width: 25%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.title-properties {
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  /* overflow-y: auto; */
}

.title-wrapper {
  width: 100%;
  height: 30px;
  border: 2px #b6b3b3 solid;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.title-name {
  width: 100%;
  margin-left: 10px;
  color: black;
  font-weight: 750;
}

.content-properties {
  width: 100%;
  height: calc(100% - 40px);
  box-sizing: border-box;
  border: 1px #dad7d7 solid;
  border-bottom: none;
  overflow-y: auto;
  background-color: #e2e8f0;
}

.content-properties-header {
  width: 100%;
  height: 40px;
  display: flex;
  background-color: #e2e8f0;
  align-items: center;
  box-sizing: border-box;
  padding-left: 10px;
}

.content-properties-table {
  width: 100%;
  box-sizing: border-box;
}

.content-properties-table-flex {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding-left: 10px;
  background-color: white;
  box-sizing: border-box;
}

.content-properties-table-header {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 50%;
  box-sizing: border-box;
  padding-top: 5px;
  padding-bottom: 5px;
}

.content-properties-table-content {
  width: 50%;
  padding-top: 5px;
  padding-bottom: 5px;
  box-sizing: border-box;
  border-left: 3px #e2e8f0 solid;
}

.context-data {
  box-sizing: border-box;
  width: calc(80% - 5px);
  height: 100%;
}

.content-data {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
}

.log-bar {
  box-sizing: border-box;
  width: 100%;
  height: 20%;
  border: 1px rgb(224, 222, 222) solid;
}

.hide-icon i {
  visibility: hidden;
}

.hide-icon:hover i {
  visibility: visible;
}

.tab-container {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.location {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 5px;
  cursor: pointer;
  border-bottom: 2px #e6e4e4 solid;
  box-sizing: border-box;
}

.tab {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  padding-left: 5px;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 2px #e6e4e4 solid;
}

.trapezoid {
  position: absolute;
  top: 50%; /* Căn giữa theo chiều dọc */
  right: 0; /* Đẩy sát mép phải */
  transform: translateY(-50%); /* Căn giữa theo chiều dọc */
  width: 1vh !important; /* Độ rộng */
  height: 10vh; /* Độ cao */
  background: #d9d9d9;
  clip-path: polygon(100% 0%, 100% 100%, 0% 80%, 0% 20%);
}

.page-align {
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

.path-hover:hover {
  color: black;
  text-decoration: underline;
  cursor: pointer;
}
</style>

<style scoped>
.dropdown {
  width: 35%;
  margin-right: 10px;
}

.dropdown-input {
  width: 100%;
  padding-right: 80px;
  cursor: pointer;
  background-color: #fff;
  padding: 0 0 0 10px;
  height: 40px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  margin: 5px 0;
  list-style: none;
  display: none;
  z-index: 10;
}

.dropdown-menu li {
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-menu li:hover {
  background-color: #f0f0f0;
}
</style>

<style scoped>
.fixed-box {
  box-sizing: border-box;
}

.pl10 {
  padding-left: 10px;
}

.pt10 {
  padding-top: 10px;
}

.pb10 {
  padding-bottom: 10px;
}

.break-word {
  word-break: break-word;
}
</style>
