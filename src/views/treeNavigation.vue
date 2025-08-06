<template>
  <div class="explorer">
    <!-- Thanh công cụ -->
    <div v-show="!clientSlide" class="toolbar">
      <div style="display: flex; align-items: center">
        <div @click="resetAllServer" class="path-hover">Database manage</div>
        <i style="margin-left: 10px" class="fa-solid fa-angle-right"></i>
      </div>
      <div
        style="display: flex; align-items: center"
        v-for="(item, index) in pathMapServer"
        :key="index"
      >
        <div @click="resetPathServer(index)" class="path-hover">
          {{ item.parent }}
        </div>
        <i style="margin-left: 10px" class="fa-solid fa-angle-right"></i>
      </div>
    </div>

    <div class="resizable-sidebar">
      <!-- Sidebar Server -->
      <div ref="sidebarServer" v-show="!clientSlide" class="sidebar">
        <div class="title-temp">
          <div ref="tabContainer" class="tab-container">
            <div ref="locationRoot" @click="showLocationRoot" class="location">
              Location
            </div>
            <div ref="ownerRootServer" @click="showOwnerServerRoot" class="tab">
              Owner
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
              Owner "{{ selectedOwnerNodes[0].name }}" has no Locations
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
                :side="'server'"
                v-model="activeTab"
                :tabs="tabs"
                @close-tab="removeTab"
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
                <div class="title-name">Object Properties</div>
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
                Owner & Position
              </div>
              <div class="content-properties-table">
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Owner 1</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Owner1 }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Owner 2</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Owner2 }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Owner 3</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Owner3 }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Location</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Location }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Voltage Level
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.VoltageLevel }}
                  </div>
                </div>

                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Feeder</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Feeder }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Panel</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ properties.Panel }}
                  </div>
                </div>
              </div>
              <div v-if="assetPropertySign" class="content-properties-header">
                <i
                  class="fa-solid fa-chevron-down"
                  style="padding-right: 5px; font-size: 10px"
                ></i>
                Information
              </div>
              <div v-if="assetPropertySign" class="content-properties-table">
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Name</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetProperties.asset }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Description</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetProperties.asset_type }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Vendor</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetProperties.serial_no }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Model</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetProperties.manufacturer }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Serial Number
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetProperties.manufacturer_type }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Hardware version
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetProperties.manufacturing_year }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Sofware Version
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetProperties.country }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Order Code</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetProperties.apparatus_id }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Roles</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetProperties.apparatus_id }}
                  </div>
                </div>
              </div>
              <div class="content-properties-header">
                <i
                  class="fa-solid fa-chevron-down"
                  style="padding-right: 5px; font-size: 10px"
                ></i>
                Configuration Version
              </div>
              <div class="content-properties-table">
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Last Modified
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  ></div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Author</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  ></div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Last Saved By
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
      <!-- Sidebar Client -->
      <div ref="contextDataClient" v-show="clientSlide" class="context-data">
        <div ref="contentDataClient" class="content-data">
          <div ref="contentClient" class="content">
            <div class="title-content"></div>
            <div class="content-content">
              <Tabs
                :side="'client'"
                v-model="activeTab"
                :tabs="tabs"
                @close-tab="removeTab"
              />
            </div>
          </div>
          <div
            @mousedown="startResizeContentClient"
            ref="resizerContentClient"
            class="resizer"
          ></div>
          <div
            v-if="propertiesSignClient"
            ref="propertiesClient"
            class="properties"
          >
            <!-- Form hiển thị thông tin client -->
            <div class="title-properties">
              <div class="title-wrapper">
                <div class="title-name">Object Properties</div>
                <div style="margin-right: 5px">
                  <i
                    @click="hidePropertiesClient"
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
                Owner & Position
              </div>
              <div class="content-properties-table">
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Name</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.name }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Region</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.region }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Plant</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.plant }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Address</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.address }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">City</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.city }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    State/Province
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.state_province }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Postal code</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.postal_code }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Country</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.country }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Geo coordinates
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  ></div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Phone number
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.phone_no }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Email</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ propertiesClient.email }}
                  </div>
                </div>
              </div>
              <div
                v-if="assetPropertySignClient"
                class="content-properties-header"
              >
                <i
                  class="fa-solid fa-chevron-down"
                  style="padding-right: 5px; font-size: 10px"
                ></i>
                Asset Properties
              </div>
              <div
                v-if="assetPropertySignClient"
                class="content-properties-table"
              >
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Asset</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetPropertiesClient.asset }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Asset type</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetPropertiesClient.asset_type }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Serial number
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetPropertiesClient.serial_no }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Manufacturer
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetPropertiesClient.manufacturer }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Manufacturer type
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetPropertiesClient.manufacturer_type }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Manufacturing year
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetPropertiesClient.manufacturing_year }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Country</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetPropertiesClient.country }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Apparatus id
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ assetPropertiesClient.apparatus_id }}
                  </div>
                </div>
              </div>
              <div
                v-if="jobPropertySignClient"
                class="content-properties-header"
              >
                <i
                  class="fa-solid fa-chevron-down"
                  style="padding-right: 5px; font-size: 10px"
                ></i>
                Job Properties
              </div>
              <div
                v-if="jobPropertySignClient"
                class="content-properties-table"
              >
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Name</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ jobPropertiesClient.name }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Work order</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ jobPropertiesClient.work_order }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Creation date
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ jobPropertiesClient.creation_date }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Execution date
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ jobPropertiesClient.execution_date }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Tested by</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ jobPropertiesClient.tested_by }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Approved by</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ jobPropertiesClient.approved_by }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Ambient condition
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ jobPropertiesClient.ambient_condition }}
                  </div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Standard</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  >
                    {{ jobPropertiesClient.standard }}
                  </div>
                </div>
              </div>
              <div class="content-properties-header">
                <i
                  class="fa-solid fa-chevron-down"
                  style="padding-right: 5px; font-size: 10px"
                ></i>
                Configuration Version
              </div>
              <div class="content-properties-table">
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Last Modified
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  ></div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">Author</div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  ></div>
                </div>
                <div class="content-properties-table-flex">
                  <div class="content-properties-table-header">
                    Last Saved By
                  </div>
                  <div
                    class="content-properties-table-content fixed-box pl10 break-word"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="!propertiesSignClient"
            @click="showPropertiesClient"
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
      @close="closeContextMenu"
      @open-tab="handleOpenTab"
    />
  </div>
</template>

<script>
/* eslint-disable */
import TreeNode from "./common/TreeNode.vue";
import Tabs from "./common/Tabs.vue";
import ContextMenu from "./common/ContextMenu.vue";

export default {
  name: "TreeNavigation",
  components: {
    TreeNode,
    Tabs,
    ContextMenu,
  },
  data() {
    return {
      activeTab: {},
      tabs: [],
      rightClickNode: null,
      selectedOwnerNodes: [], // separate selection for Owner tab
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
        Owner1: "Owner 1",
        Owner2: "",
        Owner3: "",
        Location: "",
        VoltageLevel: "",
        Feeder: "",
        Panel: "",
      },
      contextMenuPosition: { x: 0, y: 0 },
      Information: {
        Name: "",
        Description: "",
        Vendor: "",
        Model: "",
        SerialNumber: "",
        HardwareVersion: "",
        SoftwareVersion: "",
        OrderCode: "",
        Roles: "",
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
      showOwner: true,

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
      ownerServerList: [
        {
          id: "owner1",
          name: "Bắc Ninh",
          mode: "OWNER1",
          children: [
            // {
            //             id: "owner3-loc1",
            //             name: "Location of Bắc Ninh",
            //             mode: "location",
            //             children: [], // can be empty or with mock assets
            //           },
            {
              id: "owner2",
              name: "Lương Tài",
              mode: "OWNER2",
              children: [
                {
                  id: "owner3",
                  name: "Phú Hòa",
                  mode: "OWNER3",
                  children: [
                    // {
                    //   id: "owner3-loc1",
                    //   name: "Location of Phú Hòa",
                    //   mode: "location",
                    //   children: [], // can be empty or with mock assets
                    // },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "owner1",
          name: "Hà Nội",
          mode: "OWNER1",
          children: [
            {
              id: "owner3-loc1",
              name: "Location of Hà Nội",
              mode: "location",
              children: [
                {
                  id: "Voltage Level1",
                  name: "VL2",
                  mode: "voltage",
                  children: [],
                },
              ],
            },
            {
              id: "owner2",
              name: "Hà Đông",
              mode: "OWNER2",
              children: [
                {
                  id: "owner3",
                  name: "Văn Quán",
                  mode: "OWNER3",
                  children: [
                    {
                      id: "owner3-loc1",
                      name: "Location of Văn Quán",
                      mode: "location",
                      children: [
                        {
                          id: "Voltage Level1",
                          name: "VL1",
                          mode: "voltage",
                          children: [
                            {
                              id: "FD",
                              name: "FD",
                              mode: "feeder",
                              children: [
                                {
                                  id: "IED1",
                                  name: "IED1",
                                  mode: "ied",
                                  children: [
                                    {
                                      id: "setting1",
                                      name: "System Setting",
                                      mode: "systemsetting",
                                      children: [
                                        {
                                          id: "Voltage Input 2",
                                          name: "Voltage Input 2",
                                          mode: "parameter",
                                          children: [
                                            {
                                              id: "Primary Voltage 1",
                                              name: "Primary Voltage 1",
                                              value: "1000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Primary Value",
                                            },
                                            {
                                              id: "Second Voltage 1",
                                              name: "Second Voltage 1",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Secondary Value",
                                            },
                                            {
                                              id: "VT Ratio 1",
                                              name: "VT Ratio 1",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "VT Ratio",
                                            },
                                          ],
                                        },
                                        {
                                          id: "Current Input 2",
                                          name: "Current Input 2",
                                          mode: "parameter",
                                          children: [
                                            {
                                              id: "Primary Voltage 1",
                                              name: "Primary Voltage 1",
                                              value: "1000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Primary Value",
                                            },
                                            {
                                              id: "Second Voltage 1",
                                              name: "Second Voltage 1",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Secondary Value",
                                            },
                                            {
                                              id: "CT Ratio 1",
                                              name: "CT Ratio 1",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "CT Ratio",
                                            },
                                          ],
                                        },
                                        {
                                          id: "Neutral Voltage Input 2",
                                          name: "Neutral Voltage Input 2",
                                          mode: "parameter",
                                          children: [
                                            {
                                              id: "Primary Voltage 1",
                                              name: "Primary Voltage 1",
                                              value: "1000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Primary Value",
                                              mode: "parameterValue",
                                            },
                                            {
                                              id: "Second Voltage 1",
                                              name: "Second Voltage 1",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Secondary Value",
                                              mode: "parameterValue",
                                            },
                                            {
                                              id: "Neutral VT Ratio 1",
                                              name: "Neutral VT Ratio 1",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Neutral VT Ratio 1",
                                              mode: "parameterValue",
                                            },
                                          ],
                                        },
                                        {
                                          id: "Neutral Current Input 2",
                                          name: "Neutral Curent Input 2",
                                          mode: "parameter",
                                          children: [
                                            {
                                              id: "Primary Voltage 4",
                                              name: "Primary Voltage 4",
                                              value: "1000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Primary Value",
                                              mode: "parameterValue",
                                            },
                                            {
                                              id: "Second Voltage 4",
                                              name: "Second Voltage 4",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Secondary Value",
                                              mode: "parameterValue",
                                            },
                                            {
                                              id: "Neutral CT Ratio 4",
                                              name: "Neutral CT Ratio 4",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Neutral VT Ratio ",
                                              mode: "parameterValue",
                                            },
                                          ],
                                        },
                                        {
                                          id: "Rated Frequency 1",
                                          name: "Rated Frequency 1",
                                          mode: "parameter",
                                          children: [
                                            {
                                              id: "Primary Voltage 5",
                                              name: "Primary Voltage 5",
                                              value: "1000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Primary Value",
                                              mode: "parameterValue",
                                            },
                                            {
                                              id: "Second Voltage 5",
                                              name: "Second Voltage 5",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Secondary Value",
                                              mode: "parameterValue",
                                            },
                                            {
                                              id: "Neutral CT Ratio 5",
                                              name: "Neutral CT Ratio 5",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Neutral VT Ratio ",
                                              mode: "parameterValue",
                                            },
                                          ],
                                        },
                                        {
                                          id: "Active Group 1",
                                          name: "Active Group 1",
                                          mode: "parameter",
                                          children: [
                                            {
                                              id: "Primary Voltage 6",
                                              name: "Primary Voltage 6",
                                              value: "1000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Primary Value",
                                              mode: "parameterValue",
                                            },
                                            {
                                              id: "Second Voltage 6",
                                              name: "Second Voltage 6",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Secondary Value",
                                              mode: "parameterValue",
                                            },
                                            {
                                              id: "Neutral CT Ratio 6",
                                              name: "Neutral CT Ratio 6",
                                              value: "2000",
                                              Unit: "V",
                                              MinVal: "0",
                                              MaxVal: "10000",
                                              Description: "Neutral VT Ratio ",
                                              mode: "parameterValue",
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                    {
                                      id: "setting2",
                                      name: "System Setting 2",
                                      mode: "systemsetting",
                                      children: [
                                        {
                                          id: "Voltage Input 1",
                                          name: "Voltage Input 1",
                                          mode: "parameter",
                                          children: [],
                                        },
                                        {
                                          id: "Current Input 1",
                                          name: "Current Input 1",
                                          mode: "parameter",
                                          children: [],
                                        },
                                        {
                                          id: "Neutral Voltage Input 1",
                                          name: "Neutral Voltage Input 1",
                                          mode: "parameter",
                                          children: [],
                                        },
                                      ],
                                    },
                                    {
                                      id: "group1",
                                      name: "Group 1",
                                      mode: "group",
                                      children: [
                                        {
                                          id: "protection1",
                                          name: "Phase Overcurrent",
                                          mode: "protection",
                                          children: [],
                                        },
                                        {
                                          id: "protection2",
                                          name: "Neutral Overcurrent",
                                          mode: "protection",
                                          children: [],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
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
      contextMenuPosition: { x: 0, y: 0 },
      rightClickNode: null,
    };
  },
  beforeMount() {},
  methods: {
    methods: {
      handleSelectParameter(node) {
        this.selectedParameterId = node.id;
      },
    },
    handleToggleNode(node) {
      node.expanded = !node.expanded;
    },
    handleOpenTab(payload) {
      if (!payload || !payload.id) {
        console.error("Tab thiếu id:", payload);
        return;
      }

      const newTab = {
        ...payload, // ✅ Lấy toàn bộ tab và node
      };

      const existing = this.tabs.find((t) => t.id === newTab.id);
      if (!existing) {
        this.tabs.push(newTab);
      }

      this.activeTab = newTab;
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

      if (!node || !node.id) {
        console.warn("⚠️ Không thể mở context menu: node không hợp lệ", node);
        return;
      }

      this.contextMenuVisible = true;
      this.contextMenuPosition = { x: event.clientX, y: event.clientY };
      this.rightClickNode = node;
      console.log("Right clicked node:", node);
      document.addEventListener("click", this.handleOutsideClick);
    },
    closeContextMenu() {
      this.contextMenuVisible = false;
      this.rightClickNode = null;
      document.removeEventListener("click", this.handleOutsideClick);
    },

    handleOutsideClick(e) {
      const menu = this.$el.querySelector(".context-menu");
      if (menu && !menu.contains(e.target)) {
        this.closeContextMenu();
      }
    },
    removeTab(index) {
      if (this.activeTab.id == this.tabs[index].id) {
        this.activeTab = {};
      }
      this.tabs.splice(index, 1);
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
      let finalWidth = Math.max(10, Math.min(40, percentWidth)); // giới hạn trong khoảng 10–40%

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
      // Cập nhật width của sidebar và context-data
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
        this.selectedLocationNodes = []; // reset location selection
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
      // console.log("📥 Fetching children for node:");
      // console.log("🆔 ID: ", node.id);
      // console.log("📛 Name: ", node.name);
      // console.log("📦 Mode: ", node.mode);
      // console.log(
      //   "🔗 ParentArr: ",
      //   node.parentArr?.map((p) => p.name)
      // );
      // console.log("↩️ ParentNode: ", node.parentNode?.name || "None");
      // Nếu đã có children, không fetch lại
      if (node.children && node.children.length > 0) return;

      // Ví dụ lấy children từ tree (tuỳ logic bạn dùng, có thể dùng API hoặc clone)
      const children = node.childrenFromData || []; // hoặc node._rawChildren nếu có

      // Gán mảng children vào node
      this.$set(node, "children", children);

      for (const child of children) {
        // Gán cha trực tiếp
        child.parentNode = node;

        // Gán mảng tổ tiên
        let parentArr = [];
        if (node.parentArr) {
          parentArr = [...node.parentArr];
        } else {
          // Nếu chưa có parentArr, build từ parentNode
          let current = node.parentNode;
          while (current) {
            parentArr.unshift(current);
            current = current.parentNode;
          }
        }

        // Thêm node hiện tại vào mảng tổ tiên
        parentArr.push(node);
        child.parentArr = parentArr;

        // Đệ quy nếu cần preload
        // this.fetchChildren(child); // nếu bạn muốn gán sẵn hết cây
      }
    },
    async fetchChildrenServer(node) {
      // if (!node.children || node.children.length === 0) {
      //   // Tìm các phần tử con từ ownerServerList theo id node cha:
      //   const childNodes = this.ownerServerList.filter(
      //     (item) => item.parentId === node.id
      //   );
      //   // Gán các node con này vào node.children một cách reactive:
      //   Vue.set(node, "children", childNodes);
      // }
      console.log("Fetching children for node:");
      console.log("ID: ", node);
      console.log("Name: ", node.name);
      console.log("Mode: ", node.mode);
      console.log(
        "🔗 ParentArr: ",
        node.parentArr?.map((p) => p.name)
      );
      console.log("↩️ ParentNode: ", node.parentNode?.name || "None");
      if (node.children && node.children.length > 0) return;

      const children = node.childrenFromData || [];
      this.$set(node, "children", children);
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

        // Thêm node hiện tại vào mảng tổ tiên
        parentArr.push(node);
        child.parentArr = parentArr;

        // Đệ quy nếu cần preload
        // this.fetchChildren(child); // nếu bạn muốn gán sẵn hết cây
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

    async showOwnerServerRoot() {
      const ownerRootServer = this.$refs.ownerRootServer;
      const locationRoot = this.$refs.locationRoot;

      if (ownerRootServer) {
        ownerRootServer.style.borderBottom = "2px #aba7a7 solid";
        ownerRootServer.style.color = "rgba(0, 0, 0, 1)";
      }

      if (locationRoot) {
        locationRoot.style.borderBottom = "2px #e6e4e4 solid";
        locationRoot.style.color = "rgba(0, 0, 0, 0.5)";
      }

      this.showOwner = true;
    },

    async showPropertiesData(node) {
      this.assetPropertySign = true;
      this.jobPropertySign = true;
      this.properties = {
        name: node.name || "Mock Name",
        region: "Mock Region",
        address: "Mock Address",
        city: "Mock City",
        state_province: "Mock State",
        postal_code: "12345",
        country: "Mock Country",
        phone_no: "0123456789",
        email: "mock@email.com",
      };
      this.assetProperties = {
        asset: node.name || "Mock Asset",
        asset_type: node.asset || "Mock Type",
        serial_no: node.serial_no || "SN-001",
        manufacturer: "Mock Manufacturer",
        manufacturer_type: "Mock Type",
        manufacturing_year: "2020",
        apparatus_id: "AP-001",
        country: "VN",
      };
      this.jobProperties = {
        name: "Job 1",
        work_order: "WO-001",
        creation_date: "2024-01-01",
        execution_date: "2024-01-02",
        tested_by: "Tester",
        approved_by: "Manager",
        ambient_condition: "Normal",
        standard: "IEC",
      };
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
      // Xóa location khỏi children của parent
      this.ownerServerList.forEach((owner) => {
        if (owner.children) {
          owner.children = owner.children.filter((c) => c.id !== node.id);
        }
      });
      this.$message.success("Xóa location thành công (mock)");
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
  font-size: 12px; /* Cỡ chữ cho các mục trong nội dung */
}

.folder-item:hover {
  background-color: #f0f0f0;
}
.child-nav {
  overflow-y: hidden;
  height: calc(100vh - 125px);
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
/* Kiểu dáng dropdown */
.dropdown {
  width: 35%;
  margin-right: 10px;
}

/* Ô input */
.dropdown-input {
  width: 100%;
  padding-right: 80px;
  cursor: pointer;
  background-color: #fff;
  padding: 0 0 0 10px;
  height: 40px;
}

/* Style menu dropdown */
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
  display: none; /* Ẩn mặc định */
  z-index: 10;
}

/* Style cho từng mục */
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
