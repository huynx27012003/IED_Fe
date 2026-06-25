<template>
  <div class="communication-tab">
    <div class="communication-layout">
      <div class="param-tree-pane" :style="{ width: paramTreeWidthPx + 'px' }">
        <div class="param-tree-header">
          <div class="param-tree-title">Tree View</div>
        </div>

        <div class="param-tree-body">
          <div v-if="paramTreeLoading" class="param-tree-loading">Loading...</div>
          <div v-else-if="!paramTreeRoot" class="param-tree-empty">No parameter tree</div>
          <ul v-else class="param-tree-list">
            <TreeNode
              :node="paramTreeRoot"
              :selectedNodes="paramSelectedNodes"
              :hide-operation-off="hideOperationOffTree"
              @fetch-children="noopFetchChildren"
              @update-selection="updateParamSelection"
              @clear-selection="clearParamSelection"
              @toggle-node="toggleParamNode"
              @node-dblclick="handleParamTreeNodeOpen"
              @show-properties="handleCommunicationNodeClick"
              @open-context-menu="handleParamTreeContextMenu"
            />
          </ul>
        </div>
      </div>
      
      <div class="param-tree-resizer" @mousedown="startResizeParamTree"></div>
      <div class="table-pane">
        <div class="table-pane-title">
          <div class="table-pane-title-left">
            <span>Communications and Services</span>
          </div>

           <div class="table-pane-actions">
             <button
               v-if="!isEditing"
               type="button"
               class="table-pane-action-btn"
               @click="onClickEdit"
               aria-label="Edit"
               title="Edit"
             >
               <i class="fa-solid fa-pen"></i>
             </button>
             
             <button
               v-if="!isEditing"
               type="button"
               class="table-pane-action-btn"
               @click="showDiagramDialog = true"
               aria-label="Show Diagram"
               title="Show Diagram"
             >
               <i class="fa-solid fa-project-diagram"></i>
             </button>

             <div v-else class="edit-mode-group">
               <button
                 type="button"
                 class="table-pane-action-btn"
                 @click="saveAll"
                 aria-label="Save"
                 title="Save"
               >
                 <i class="fa-solid fa-check"></i>
               </button>
               <button
                 type="button"
                 class="table-pane-action-btn"
                 @click="cancelAll"
                 aria-label="Cancel"
                 title="Cancel"
               >
                 <i class="fa-solid fa-times"></i>
               </button>
             </div>
           </div>
        </div>

        <div class="table-pane-body">
          <div v-if="!renderTable" class="table-loading">Loading...</div>
          <table v-else class="parameter-table communication-table">
            <thead>
              <tr>
                <th colspan="19" class="comm-device-title">{{ communicationDeviceTitle }}</th>
              </tr>
              <tr>
                <th rowspan="2" class="info-col">IED Name</th>
                <th rowspan="2" class="info-col">Port</th>
                <th rowspan="2" class="info-col">Name</th>
                <th rowspan="2" class="info-col">Operation</th>
                <th rowspan="2" class="info-col">Redundancy</th>
                <th rowspan="2" class="info-col">Subnetwork</th>
                <th rowspan="2" class="info-col">IP Address</th>
                <th rowspan="2" class="info-col">Subnet mask</th>
                <th rowspan="2" class="info-col">Default gateway</th>
                <th colspan="9">Services</th>
                <th rowspan="2" class="dest-col">Destination</th>
              </tr>
              <tr>
                <th class="svc-col">MMS</th>
                <th class="svc-col">GOOSE</th>
                <th class="svc-col">SMV</th>
                <th class="svc-col">HTTPS</th>
                <th class="svc-col">FTP</th>
                <th class="svc-col">DNP3.0</th>
                <th class="svc-col">SNMP</th>
                <th class="svc-col">SNTP</th>
                <th class="svc-col">PTP</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(group, gIdx) in groupedCommunicationRows" :key="`ied-group-${gIdx}`">
                <tr v-for="(row, rIdx) in group.rows" :key="`comm-row-${gIdx}-${rIdx}`" :class="{ 'ied-group-start': rIdx === 0 && gIdx > 0 }">
                  <td v-if="rIdx === 0" :rowspan="group.rows.length" class="ied-name-cell info-col">{{ group.iedName }}</td>
                  <td class="info-col">{{ row.port }}</td>
                  <td class="info-col">{{ row.name }}</td>
                  <td class="info-col">{{ row.operation }}</td>
                  <td class="info-col">{{ row.redundancy }}</td>
                  <td class="info-col">{{ row.subnetwork }}</td>
                  <td class="info-col">{{ row.ipAddress }}</td>
                  <td class="info-col">{{ row.subnetMask }}</td>
                  <td class="info-col">{{ row.defaultGateway }}</td>
                  <td class="svc-cell">{{ row.mms }}</td>
                  <td class="svc-cell">{{ row.goose }}</td>
                  <td class="svc-cell">{{ row.smv }}</td>
                  <td class="svc-cell">{{ row.https }}</td>
                  <td class="svc-cell">{{ row.ftp }}</td>
                  <td class="svc-cell">{{ row.dnp3 }}</td>
                  <td class="svc-cell">{{ row.snmp }}</td>
                  <td class="svc-cell">{{ row.sntp }}</td>
                  <td class="svc-cell">{{ row.ptp }}</td>
                  <td class="dest-col">
                    <el-select
                      v-if="isEditing"
                      v-model="row.networkSwitch1"
                      placeholder="Select IED"
                      size="small"
                      filterable
                      clearable
                    >
                      <el-option
                        v-for="ied in getIedOptionsForRow(row)"
                        :key="ied.mrid"
                        :label="ied.name"
                        :value="ied.name"
                      />
                    </el-select>
                    <span v-else>{{ row.networkSwitch1 }}</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showContextMenu" class="comm-context-menu" :style="{ left: menuX + 'px', top: menuY + 'px' }">
    <ul>
      <li @click="triggerFileInput">Import</li>
    </ul>
  </div>

  <input ref="commFileInput" type="file" style="display: none" @change="handleFileSelect" />

   <el-dialog
  v-model="showDiagramDialog"
  title="Network Topology Diagram"
  width="66%"
  top="4vh"
  :before-close="handleCloseDialog"
  class="network-topology-dialog"
>
  <NetworkTopology
    v-if="communicationRowsData && communicationRowsData.length > 0"
    class="network-topology-host"
    :ieds="allCommunicationData"
  />
  <div v-else class="empty-diagram-state">
    <p>No communication data available to display diagram</p>
  </div>
</el-dialog>
 </template>

<script src="./CommunicationServicesTab.script.js"></script>

<style scoped>
.communication-tab {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.communication-layout {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
}

.param-tree-pane {
  flex: none;
  display: flex;
  flex-direction: column;
  min-width: 160px;
  max-width: 540px;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  overflow: hidden;
}

.param-tree-header {
  height: 40px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.param-tree-title {
  font-weight: 600;
  color: #555;
}

.param-tree-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 0;
}

.param-tree-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.param-tree-loading,
.param-tree-empty {
  padding: 12px;
  color: #777;
  font-style: italic;
}

.param-tree-pane :deep(li > ul) {
  padding-left: 8px !important;
}

.param-tree-resizer {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  flex: none;
}

.param-tree-resizer:hover {
  background: rgba(0, 0, 0, 0.08);
}

.table-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  overflow: hidden;
}

.table-pane-title {
  height: 40px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  font-weight: 700;
  color: #444;
  background: linear-gradient(180deg, #f6f7f8 0%, #ffffff 100%);
  border-bottom: 1px solid #e6e6e6;
  font-size: 12px;
}

.table-pane-title-left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pane-subtitle {
  font-weight: 600;
  color: #777;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-pane-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.table-pane-action-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: transparent;
  color: #222;
  border: 1px solid #e5e5e5;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.table-pane-action-btn:hover {
  background: #f0f8ff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.table-pane-action-btn:active {
  transform: scale(0.97);
}

.edit-mode-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.18);
}

.table-pane-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: auto;
}

.table-loading {
  height: 100%;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-style: italic;
}

.parameter-table {
  width: auto;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  margin-bottom: 80px;
}

.parameter-table th,
.parameter-table td {
  border: 1px solid #ccc;
  text-align: left;
  padding: 4px 3px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.2;
  vertical-align: middle;
}

.parameter-table thead {
  background-color: #b0dce8;
}

.parameter-table thead th {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #b0dce8;
  border-bottom: 2px solid #999;
}

.communication-table {
  font-size: 14px;
}

.communication-table th,
.communication-table td {
  padding: 6px 5px;
  line-height: 1.5;
}

.communication-table .comm-device-title {
  color: #b30000;
  font-weight: 700;
  text-align: center;
  background: #fff;
}

.communication-table thead tr:nth-child(2) th,
.communication-table thead tr:nth-child(3) th {
  text-align: center;
}

.communication-table tbody tr.ied-group-start {
  border-top: 3px solid #999;
}

.communication-table .ied-name-cell {
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
  background: #f8f9fa;
}

.communication-table th.svc-col,
.communication-table td.svc-cell {
  white-space: nowrap;
  width: auto;
  min-width: 40px;
  text-align: center;
  font-size: 14px;
}

.communication-table th.dest-col,
.communication-table td.dest-col {
  white-space: nowrap;
  width: auto;
  min-width: 60px;
}

.communication-table th.info-col,
.communication-table td.info-col {
  white-space: nowrap;
  width: auto;
}

.communication-table th.info-col {
  min-width: 50px;
}

.communication-table td.info-col {
  min-width: 60px;
}

.comm-context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 140px;
}

.comm-context-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.comm-context-menu li {
  padding: 8px 16px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.comm-context-menu li:hover {
  background: #f0f4f8;
}

.import-confirm-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #333;
}
:deep(.network-topology-dialog) {
  margin: 0 !important;
}

:deep(.network-topology-dialog .el-dialog) {
  position: fixed;
  top: 6vh;
  left: 50%;
  transform: translateX(-50%);
  margin: 0 !important;
  width: 66vw !important;
  max-width: 66vw !important;
  height: 72vh !important;
  max-height: 72vh !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.network-topology-dialog .el-dialog__header) {
  flex: 0 0 auto;
}

:deep(.network-topology-dialog .el-dialog__body) {
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
  overflow: hidden;
  padding: 8px !important;
  display: flex;
}

:deep(.network-topology-dialog .el-dialog__body > *) {
  flex: 1 1 auto;
  min-height: 0;
}

.network-topology-host {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.network-topology-host :deep(.topology-root) {
  height: 100%;
  min-height: 0;
}
</style>
