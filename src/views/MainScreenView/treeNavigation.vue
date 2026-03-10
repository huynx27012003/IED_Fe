<template>
  <div :class="['explorer', { 'is-resizing': resizing }]">
    <input
      ref="sclFileInput"
      type="file"
      accept=".scl,.scd,.icd,.cid,.xml"
      style="display: none"
      @change="onSclFileSelected"
    />
      <div class="main-layout">
        <div class="activity-bar-fixed">
          <ActivityBar
            :active-view="activeView"
            :sidebar-collapsed="sidebarCollapsed"
            @view-change="setActiveView"
            @toggle-sidebar="toggleSidebar"
          />
        </div>

        <div class="main-column">
          <div v-show="!clientSlide" class="toolbar">
            <div style="display: flex; align-items: center">
              <div @click="resetAllServer" class="path-hover">{{ $t("home") }}</div>
              <i
                v-if="pathMapServer.length"
                style="margin-left: 10px"
                class="fa-solid fa-angle-right"
              ></i>
            </div>

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

          <div class="activity-bar-wrapper">
            <div class="resizable-sidebar">
        <!-- Sidebar Server -->
        <div
          ref="sidebarServer"
          :class="['sidebar', { collapsed: sidebarCollapsed, 'no-transition': resizing }]"
          :style="sidebarCollapsed ? { width: '0px', minWidth: '0px' } : { width: sidebarTotalWidthPx + 'px' }"
        >
          <!-- Explorer View (Tree View) -->
          <div v-show="activeView === 'explorer'" style="display: flex; height: 100%; width: 100%; overflow: hidden;">
           <div ref="ownerPane" class="sidebar-pane" :style="{ flex: 'none', width: ownerWidthPx + 'px', height: '100%', display: 'flex', flexDirection: 'column', minWidth: '0', position: 'relative' }">
            <div class="title-temp" v-if="!sidebarCollapsed">
              <div ref="tabContainer" class="tab-container tab-with-actions">
                <div ref="ownerRootServer" @click="showOwnerServerRoot" class="tab">
                  {{ $t("owner") }}
                </div>
              </div>
            </div>

            <div v-if="showOwner" class="child-nav">
              <ul>
                <TreeNode
                  v-for="item in renderOwnerList"
                  :key="item.id"
                  :node="item"
                  :selectedNodes="selectedNodes"
                  :selectedParameterId="selectedParameterId"
                  :hide-operation-off="hideOperationOff"
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
                  :hide-operation-off="hideOperationOff"
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
            v-if="showSCL && !sidebarCollapsed"
            @mousedown="startResizeOwner"
            class="resizer-handle"
            title="Resize Owner Tree"
          ></div>

          <div v-if="showSCL && !sidebarCollapsed" ref="sclPane" class="sidebar-pane" :style="{ flex: 'none', width: sclWidthPx + 'px', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #ddd', minWidth: '0', backgroundColor: 'white' }">
            <div class="title-temp scl-pane-header" style="padding-right: 10px; align-items: center;">
              <div class="tab-container">
                <div class="tab">
                  SCL Management for {{ sclTargetName }}
                </div>
              </div>
              <div style="cursor: pointer;" @click="showSCL = false" title="Close">
                <i class="fa-solid fa-xmark"></i>
              </div>
            </div>
            <div class="scl-pane-body">
              <SCLManage mode="ied" @control-block-update="handleControlBlockUpdate" />
            </div>
          </div>
          <div
            v-if="showSCL && !sidebarCollapsed"
            @mousedown="startResizeScl"
            class="resizer"
            title="Resize SCL Pane"
          ></div>

          <div v-if="false" ref="paramPane" class="sidebar-pane" :style="{ flex: 'none', width: paramWidthPx + 'px', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #ddd', minWidth: '0', backgroundColor: 'white' }">
            <div class="title-temp" style="padding-right: 10px; align-items: center; position: relative;">
              <div class="visibility-actions header-actions">
                <i
                  class="fa-solid fa-eye toggle-icon"
                  :class="{ active: !hideOperationOff }"
                  @click.stop="setHideOperation(false)"
                  title="Show nodes with Operation = Off"
                ></i>
                <i
                  class="fa-solid fa-eye-slash toggle-icon"
                  :class="{ active: hideOperationOff }"
                  @click.stop="setHideOperation(true)"
                  title="Hide nodes with Operation = Off"
                ></i>
              </div>
              <div class="tab-container"><div class="tab">Parameter Setting</div></div>
              <div style="cursor: pointer;" @click="showParam = false" title="Close">
                <i class="fa-solid fa-xmark"></i>
              </div>
            </div>
            <div class="child-nav">
              <div v-if="paramLoading" class="scl-loading">Loading...</div>
              <div v-else-if="!paramTreeData.length" class="empty-location-message" style="padding: 12px; color: #666;">
                Parameter tree not loaded.
              </div>
              <ul v-else>
                <TreeNode
                  v-for="item in paramTreeData"
                  :key="item.id"
                  :node="item"
                  :selectedNodes="selectedNodes"
                  :selectedParameterId="selectedParameterId"
                  :hide-operation-off="hideOperationOff"
                  @select-parameter="handleSelectParameter"
                  @fetch-children="noopFetchChildren"
                  @show-properties="showPropertiesData"
                  @update-selection="updateSelectionOwner"
                  @clear-selection="clearSelectionOwner"
                  @open-context-menu="openContextMenuParam"
                  @toggle-node="toggleParamNode"
                  @node-dblclick="handleNodeDblClick"
                />
              </ul>
            </div>
          </div>

          <div
            v-if="false"
            @mousedown="startResizeParam"
            class="resizer"
            title="Resize Parameter Pane"
          ></div>
          </div>

          <div v-show="activeView === 'mock1'" class="mock-view-container">
            <SCLManage
              mode="global"
              layout="tree"
              @open-subtree-tab="openSclImportSubtreeTab"
              @control-block-update="handleControlBlockUpdate"
            />
          </div>

          <div v-show="activeView === 'mock2'" class="mock-view-container">
            <MockView2 />
          </div>

        </div>
      <!-- Collapsed Handle moved to ActivityBar -->
      <div
        @mousedown="startResizeServer"
        v-if="!clientSlide && !sidebarCollapsed"
        ref="resizerServer"
        class="resizer"
      ></div>
      <div
        ref="contextDataServer"
        v-show="!clientSlide"
        :class="['context-data', { 'full-width': sidebarCollapsed }]"
        :style="sidebarCollapsed ? { width: '100%' } : {}"
      >
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
                @open-context-menu="openContextMenu"
                @node-dblclick="handleNodeDblClick"
                @control-block-update="handleControlBlockUpdate"
              />
            </div>
          </div>
           <div
             @mousedown="startResizeContentServer"
             ref="resizerContentServer"
             class="resizer"
           ></div>
            <PropertiesPane
              v-if="propertiesSign"
              ref="properties"
              v-model:paneTab="propertiesPaneTab"
              :properties="properties"
              :asset-property-sign="assetPropertySign"
              :information="Information"
              :control-block-attribute-rows="controlBlockAttributeRows"
              :control-block-title="controlBlockTitle"
              :control-block-visible="controlBlockVisible"
              :t="$t"
              @hide="hideProperties"
            />
           <div
             v-if="!propertiesSign"
             @click="showProperties"
             class="trapezoid"
          ></div>
        </div>
      </div>
            </div> <!-- Close resizable-sidebar -->
          </div> <!-- Close activity-bar-wrapper -->
        </div> <!-- Close main-column -->
      </div> <!-- Close main-layout -->

    <ContextMenu
      v-if="contextMenuVisible"
      :visible="contextMenuVisible"
      :position="contextMenuPosition"
      :selectedNode="rightClickNode"
      :tree="ownerServerList"
      @refresh-tree="reloadTree"
      @close="closeContextMenu"
      @open-tab="handleOpenTab"
      @update-focus="handleUpdateFocus"
      @open-add-device="openAddDeviceDialog"
      @open-add-organisation="openAddOrganisationDialog"
      @open-add-substation="openAddSubstationDialog"
      @open-show-organisation="openShowOrganisationDialog"
      @open-show-substation="openShowSubstationDialog"
      @open-show-voltagelevel="openShowVoltageLevelDialog"
      @open-add-voltage-level="openAddVoltageLevelDialog"
      @open-add-bay="openAddBayDialog"
      @add-group="handleAddGroup"
      @show-all-group="handleShowAllGroup"
    />

    <el-dialog
      v-model="addDeviceDialogVisible"
      title="Add Device"
      width="60%"
      :close-on-click-modal="true"
      :destroy-on-close="true"
    >
      <AddDevice
        v-if="addDeviceDialogVisible"
        :ownerData="{ node: addDeviceNode }"
        @device-created="onDeviceCreated"
      />
    </el-dialog>

    <el-dialog
      v-model="addOrganisationDialogVisible"
      title="Add Organisation"
      width="70%"
      :close-on-click-modal="true"
      :destroy-on-close="true"
    >
      <AddOrganisation
        v-if="addOrganisationDialogVisible"
        :ownerData="addOrganisationNode ? { node: addOrganisationNode } : {}"
        @refresh-tree="onOrganisationCreated"
      />
    </el-dialog>

    <el-dialog
      v-model="addSubstationDialogVisible"
      title="Add Substation"
      width="70%"
      :close-on-click-modal="true"
      :destroy-on-close="true"
    >
      <AddSubstation
        v-if="addSubstationDialogVisible"
        :ownerData="addSubstationNode ? { node: addSubstationNode } : {}"
        @refresh-tree="onSubstationCreated"
      />
    </el-dialog>

    <el-dialog
      v-model="addVoltageLevelDialogVisible"
      title="Add Voltage Level"
      width="70%"
      :close-on-click-modal="true"
      :destroy-on-close="true"
    >
      <AddVoltageLevel
        v-if="addVoltageLevelDialogVisible"
        :ownerData="addVoltageLevelNode ? { node: addVoltageLevelNode } : {}"
        @refresh-tree="onVoltageLevelCreated"
      />
    </el-dialog>

    <el-dialog
      v-model="addBayDialogVisible"
      title="Add Bay"
      width="50%"
      destroy-on-close
    >
      <AddBay
        v-if="addBayDialogVisible"
        :nodeData="addBayNode"
        @cancel="addBayDialogVisible = false"
        @success="onBayCreated"
      />
    </el-dialog>

    <el-dialog
      v-model="showOrganisationDialogVisible"
      title="Organisation"
      width="70%"
      :close-on-click-modal="true"
      :destroy-on-close="true"
    >
      <OwnerView
        v-if="showOrganisationDialogVisible"
        :ownerData="showOrganisationNode ? { node: showOrganisationNode } : {}"
      />
    </el-dialog>

    <el-dialog
      v-model="showSubstationDialogVisible"
      title="Substation"
      width="70%"
      :close-on-click-modal="true"
      :destroy-on-close="true"
    >
      <SubstationView
        v-if="showSubstationDialogVisible"
        :ownerData="showSubstationNode ? { node: showSubstationNode } : {}"
      />
    </el-dialog>

    <el-dialog
      v-model="showVoltageLevelDialogVisible"
      title="Voltage Level"
      width="70%"
      :close-on-click-modal="true"
      :destroy-on-close="true"
    >
      <VoltageLevelView
        v-if="showVoltageLevelDialogVisible"
        :ownerData="showVoltageLevelNode ? { node: showVoltageLevelNode } : {}"
      />
    </el-dialog>
  </div>
</template>

<script src="./treeNavigation.script.js"></script>

<style scoped>
/* style.css */
.explorer {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-size: 12px;
  height: calc(100vh - 4vh - 2.5vh);
  display: flex;
  flex-direction: column;
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

.activity-bar-wrapper {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.main-layout {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  padding-left: 48px;
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  background-attachment: fixed;
  background-size: 100% 100vh;
  background-position: 0 0;
}

.activity-bar-fixed {
  position: fixed;
  top: calc(4vh - 2px);
  left: 0;
  bottom: 0;
  width: 48px;
  z-index: 10000;
}

.activity-bar-fixed :deep(.activity-bar) {
  height: 100%;
}

.main-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  border-radius: 14px 0 0 14px;
  overflow: hidden;
  background: #f5f5f5;
}

.main-column::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.main-column > * {
  position: relative;
  z-index: 1;
}

.resizable-sidebar {
  display: flex;
  height: 100%;
  position: relative;
  width: 100%;
  flex: 1;
}

.mock-view-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sidebar {
  width: 20%;
  background-color: white;
  color: #555;
  flex-shrink: 0;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.sidebar.no-transition {
  transition: none !important;
}
.explorer.is-resizing {
  user-select: none !important;
}
.explorer.is-resizing * {
  pointer-events: none !important;
}
.explorer.is-resizing .resizer {
  pointer-events: auto !important;
}
.explorer.is-resizing .resizer-handle {
  pointer-events: auto !important;
}
.resizer-handle {
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  flex-shrink: 0;
  transition: background-color 0.2s;
  z-index: 10;
}
.resizer-handle:hover {
  background-color: #0078d4;
}
.sidebar.collapsed {
  width: 0;
  min-width: 0;
  overflow: hidden;
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
  margin-right: 8px; /* Khong cch gia icon v vn bn */
  width: 16px; /* Kch thc icon */
  text-align: center;
  font-size: 12px; /* C ch cho icon */
}

.resizer {
  width: 5px;
  background-color: white;
  cursor: ew-resize; /* Con tr i thnh mi tn ko ngang */
}

.content {
  flex: 1;
  min-width: 0;
  background-color: white;
  font-size: 12px; /* C ch cho ni dung */
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
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.child-nav::-webkit-scrollbar {
  display: none;
}
.sidebar.collapsed .child-nav {
  display: none;
}
.title-node {
  margin-top: 50px;
}
.title-temp {
  height: 40px;
  color: #555;
  font-weight: 600;
  display: flex;
  position: relative;
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
  padding-top: 1vh;
  padding-bottom: 0.5vh;
  padding-left: 10px;
}

.context-data {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  height: 100%;
}
.context-data.full-width {
  width: 100%;
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
.tab-with-actions {
  justify-content: center;
  gap: 8px;
}
.tab-with-actions .tab {
  flex: 1;
  width: 100%;
}
.visibility-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 8px;
}
.header-actions {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}
.scl-pane-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.collapse-btn {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: #f3f3f3;
  border: 1px solid #d3d3d3;
  border-radius: 10px;
  padding: 4px 6px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  z-index: 3;
}

.collapse-btn i {
  font-size: 12px;
  color: #555;
}

.collapse-btn:hover {
  background: #e6e6e6;
}
.toggle-icon {
  color: #9c9c9c;
  cursor: pointer;
  font-size: 14px;
}
.toggle-icon.active {
  color: #4a4a4a;
}
.toggle-icon:hover {
  color: #007bff;
}
.sidebar-toggle {
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: #f5f5f5;
  border: 1px solid #d3d3d3;
  border-radius: 12px;
  cursor: pointer;
  font-size: 11px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  user-select: none;
  color: #333;
}
.sidebar-toggle .arrow {
  font-weight: 700;
  font-size: 14px;
  color: #333;
}
.sidebar-toggle .label {
  font-weight: 600;
  color: #333;
}
.collapsed-bar {
  width: 16px;
  min-width: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f0f0f0;
  border-right: 1px solid #d3d3d3;
  cursor: pointer;
  user-select: none;
  box-shadow: inset -1px 0 2px rgba(0, 0, 0, 0.06);
}
.collapsed-bar .arrow {
  font-weight: 700;
  font-size: 14px;
  color: #333;
}
.collapsed-bar .label {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-weight: 600;
  font-size: 11px;
  color: #333;
}

.collapsed-handle-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  z-index: 20;
}

.collapsed-handle {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 40px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border: 1px solid rgba(0, 198, 255, 0.3);
  border-left: none;
  border-radius: 0 20px 20px 0;
  box-shadow: 3px 0 12px rgba(0, 0, 0, 0.3), inset 1px 1px 0 rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  z-index: 100;
}

.collapsed-handle:hover {
  width: 40px;
  background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
  box-shadow: 5px 0 18px rgba(0, 210, 255, 0.4);
}

.collapsed-handle.expanded {
  background: linear-gradient(135deg, #0f2027 0%, #203a43 100%);
  border-color: rgba(255, 255, 255, 0.2);
}

.handle-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 2;
}

.handle-icon {
  color: #00d2ff;
  font-size: 14px;
  filter: drop-shadow(0 0 5px rgba(0, 210, 255, 0.8));
  transition: transform 0.4s ease;
}

.collapsed-handle:hover .handle-icon {
  color: #fff;
  transform: rotate(360deg) scale(1.2);
}

.handle-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  user-select: none;
  color: #e0e0e0;
  font-weight: 800;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
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
  top: 50%; /* Cn gia theo chiu dc */
  right: 0; /* y st mp phi */
  transform: translateY(-50%); /* Cn gia theo chiu dc */
  width: 1vh !important; /*  rng */
  height: 10vh; /*  cao */
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



