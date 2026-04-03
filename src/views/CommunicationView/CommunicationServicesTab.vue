<template>
  <div class="communication-tab">
    <div class="communication-layout">
      <div class="param-tree-pane" :style="{ width: paramTreeWidthPx + 'px' }">
        <div class="param-tree-header">
          <div class="param-tree-title">Parameter Setting</div>
        </div>

        <div class="param-tree-body">
          <div v-if="paramTreeLoading" class="param-tree-loading">Loading...</div>
          <div v-else-if="!paramTreeRoot" class="param-tree-empty">No parameter tree</div>
          <ul v-else class="param-tree-list">
            <TreeNode
              :node="paramTreeRoot"
              :selectedNodes="paramSelectedNodes"
              :hide-operation-off="hideOperationOffTree"
              :disable-context-menu="true"
              @fetch-children="noopFetchChildren"
              @show-properties="handleParamTreeSelect"
              @update-selection="updateParamSelection"
              @clear-selection="clearParamSelection"
              @toggle-node="toggleParamNode"
              @node-dblclick="handleParamTreeNodeOpen"
            />
          </ul>
        </div>
      </div>

      <div class="param-tree-resizer" @mousedown="startResizeParamTree"></div>

      <div class="table-pane">
        <div class="table-pane-title">
          <div class="table-pane-title-left">
            <span>Data</span>
            <span
              v-if="currentNode?.name || currentNode?.serial_no"
              class="pane-subtitle"
            >
              for {{ currentNode?.name || currentNode?.serial_no }}
            </span>
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
              <button
                type="button"
                class="table-pane-action-btn"
                @click="onClickSetOperation('On')"
                aria-label="Turn On"
                title="Turn On"
              >
                <i class="fa-solid fa-toggle-on"></i>
              </button>
              <button
                type="button"
                class="table-pane-action-btn"
                @click="onClickSetOperation('Off')"
                aria-label="Turn Off"
                title="Turn Off"
              >
                <i class="fa-solid fa-toggle-off"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="table-pane-body">
          <div v-if="!renderTable" class="table-loading">Loading...</div>
          <table v-else class="parameter-table communication-table">
            <thead>
              <tr>
                <th colspan="18" class="comm-device-title">{{ communicationDeviceTitle }}</th>
              </tr>
              <tr>
                <th rowspan="2">Port</th>
                <th rowspan="2">Name</th>
                <th rowspan="2">Operation</th>
                <th rowspan="2">Redundancy</th>
                <th rowspan="2">Subnetwork</th>
                <th rowspan="2">IP Address</th>
                <th rowspan="2">Subnet mask</th>
                <th rowspan="2">Default gateway</th>
                <th colspan="9">Services</th>
                <th colspan="1">Destination</th>
              </tr>
              <tr>
                <th>MMS</th>
                <th>GOOSE</th>
                <th>SMV</th>
                <th>HTTPS</th>
                <th>FTP</th>
                <th>DNP3.0</th>
                <th>SNMP</th>
                <th>SNTP</th>
                <th>PTP</th>
                <th>Network switch 1</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in communicationRows" :key="`comm-row-${idx}`">
                <td>{{ row.port }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.operation }}</td>
                <td>{{ row.redundancy }}</td>
                <td>{{ row.subnetwork }}</td>
                <td>{{ row.ipAddress }}</td>
                <td>{{ row.subnetMask }}</td>
                <td>{{ row.defaultGateway }}</td>
                <td>{{ row.mms }}</td>
                <td>{{ row.goose }}</td>
                <td>{{ row.smv }}</td>
                <td>{{ row.https }}</td>
                <td>{{ row.ftp }}</td>
                <td>{{ row.dnp3 }}</td>
                <td>{{ row.snmp }}</td>
                <td>{{ row.sntp }}</td>
                <td>{{ row.ptp }}</td>
                <td>{{ row.networkSwitch1 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
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
  overflow-x: hidden;
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
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
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
  background-color: #e1e1e1;
}

.parameter-table thead th {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #e1e1e1;
  border-bottom: 2px solid #999;
}

.communication-table {
  font-size: 11px;
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
</style>
