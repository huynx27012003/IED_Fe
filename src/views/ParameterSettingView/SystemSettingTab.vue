<template>
  <div class="system-setting-tab" ref="rootEl">
    <Loading v-if="isLoadingEdit" />
    <div class="system-setting-layout">
      <div class="param-tree-pane" :style="{ width: paramTreeWidthPx + 'px' }">
        <div class="param-tree-header">
          <div class="param-tree-actions">
            <i
              class="fa-solid fa-eye toggle-icon"
              :class="{ active: !hideOperationOffTree }"
              @click.stop="setHideOperationOffTree(false)"
              title="Show nodes with Operation = Off"
            ></i>
            <i
              class="fa-solid fa-eye-slash toggle-icon"
              :class="{ active: hideOperationOffTree }"
              @click.stop="setHideOperationOffTree(true)"
              title="Hide nodes with Operation = Off"
            ></i>
          </div>
          <div class="param-tree-title">Parameter Setting</div>
        </div>

        <div class="param-tree-body">
          <div v-if="paramTreeLoading" class="param-tree-loading">Loading...</div>
          <div v-else-if="!paramTreeRoot" class="param-tree-empty">
            No parameter tree
          </div>
          <ul v-else class="param-tree-list">
            <TreeNode
              :node="paramTreeRoot"
              :selectedNodes="paramSelectedNodes"
              :hide-operation-off="hideOperationOffTree"
              @fetch-children="noopFetchChildren"
              @show-properties="handleParamTreeSelect"
              @update-selection="updateParamSelection"
              @clear-selection="clearParamSelection"
              @open-context-menu="handleParamTreeContextMenu"
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
              v-if="
                (freshFocusNode || focusNode || ownerData?.node)?.name ||
                (freshFocusNode || focusNode || ownerData?.node)?.serial_no
              "
              class="pane-subtitle"
            >
              for
              {{
                (freshFocusNode || focusNode || ownerData?.node)?.name ||
                (freshFocusNode || focusNode || ownerData?.node)?.serial_no
              }}
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
            <template v-else>
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
            </template>

            <div class="table-pane-action-divider"></div>

            <button
              type="button"
              class="table-pane-action-btn"
              @click="collapseMutedRows"
              aria-label="Collapse muted rows"
              title="Collapse muted rows"
            >
              <i class="fa-solid fa-compress"></i>
            </button>
            <button
              type="button"
              class="table-pane-action-btn"
              @click="expandAllRows"
              aria-label="Expand all rows"
              title="Expand all rows"
            >
              <i class="fa-solid fa-expand"></i>
            </button>

            <div class="table-pane-action-divider"></div>
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
        <div class="table-pane-body" @scroll="handleTableScroll">
          <div v-if="!renderTable" class="table-loading">Loading...</div>
          <template v-else>
            <table class="parameter-table" :class="{ 'table-resized': hasUserResized }" :style="tableColumnStyles">
              <thead>
                <tr>
                  <th>
                    {{ tableHeaders.parameter }}
                    <div class="resizer-handle" @mousedown="startColumnResize($event, 0)"></div>
                  </th>
                  <th class="value-col">
                    {{ tableHeaders.value }}
                    <div class="resizer-handle" @mousedown="startColumnResize($event, 1)"></div>
                  </th>
                  <th>
                    {{ tableHeaders.unit }}
                    <div class="resizer-handle" @mousedown="startColumnResize($event, 2)"></div>
                  </th>
                  <th>
                    {{ tableHeaders.min }}
                    <div class="resizer-handle" @mousedown="startColumnResize($event, 3)"></div>
                  </th>
                  <th>
                    {{ tableHeaders.max }}
                    <div class="resizer-handle" @mousedown="startColumnResize($event, 4)"></div>
                  </th>
                  <th>
                    {{ tableHeaders.description }}
                    <div class="resizer-handle" @mousedown="startColumnResize($event, 5)"></div>
                  </th>
                </tr>
              </thead>
              <tbody v-if="visibleRows.length">
                <tr v-if="useVirtualization" class="table-spacer">
                  <td :colspan="6" :style="{ height: virtualPaddingTop + 'px' }"></td>
                </tr>
        <template v-for="row in virtualRows" :key="row.key">
          <tr
            v-if="row.isGroup"
            class="paramgroup-header"
            :class="[row.mode ? 'row-' + row.mode : '']"
          >
            <td
              colspan="6"
              :style="{ paddingLeft: row.padding + 'px', fontWeight: 'bold' }"
            >
              {{ row.name }}
            </td>
          </tr>

          <tr
            v-else
            class="param-row"
            :class="[
              row.mode ? 'row-' + row.mode : '',
              { 'muted-row': row.muted || row.characteristicMuted },
              { 'only-value': row.onlyValue },
              { 'signal-row': row.isSignal },
            ]"
          >
            <td class="param-name" :style="{ paddingLeft: row.padding + 'px' }">
              {{ row.name }}
            </td>
            <td
              :class="['value-col', row.valueClass]"
              :colspan="row.isSignal ? 5 : 1"
            >
              <div class="cell">
                <template v-if="!isEditing">
                  <span v-if="row.isOnOff" class="switch-label">{{
                    getSwitchLabel(row)
                  }}</span>
                  <el-switch
                    v-if="row.isOnOff"
                    :model-value="getSwitchValue(row)"
                    active-value="On"
                    inactive-value="Off"
                    disabled
                  />
                  <span v-else class="cell-text">{{
                    formatValue(row, row.value)
                  }}</span>
                </template>

                <template v-else>
                  <el-select
                    v-if="row.options && !row.isOnOff"
                    v-model="editStates[row.id]"
                    :placeholder="selectPlaceholder"
                    style="width: 100%"
                    popper-append-to-body
                    teleported
                    popper-class="system-setting-dropdown"
                  >
                    <el-option
                      v-for="opt in row.options"
                      :key="opt"
                      :label="opt"
                      :value="opt"
                    />
                  </el-select>

                  <div
                    v-else-if="row.isOnOff"
                    style="display: flex; align-items: center; width: 100%"
                  >
                    <span class="switch-label">{{
                      getSwitchLabel(row, editStates[row.id])
                    }}</span>
                    <el-switch
                      v-model="editStates[row.id]"
                      active-value="On"
                      inactive-value="Off"
                    />
                  </div>

                  <input
                    v-else
                    v-model="editStates[row.id]"
                    class="cell-input"
                  />
                </template>
              </div>
            </td>

            <template v-if="!row.isSignal">
              <td :class="cellClass(row.unit)">
                <span class="cell-text">{{ row.displayUnit }}</span>
              </td>
              <td :class="cellClass(row.minVal)">
                <span class="cell-text">{{ row.displayMin }}</span>
              </td>
              <td :class="cellClass(row.maxVal)">
                <span class="cell-text">{{ row.displayMax }}</span>
              </td>
              <td :class="cellClass(row.description)">
                <span class="cell-text">{{
                  row.displayDesc
                }}</span>
              </td>
            </template>
          </tr>
        </template>
                <tr v-if="useVirtualization" class="table-spacer">
                  <td :colspan="6" :style="{ height: virtualPaddingBottom + 'px' }"></td>
                </tr>
      </tbody>
            </table>
           </template>
          </div>
        </div>
     </div>
  </div>
</template>

<script src="./SystemSettingTab.script.js"></script>
<style scoped>
.muted-row td,
.muted-row {
  background-color: #f3f3f3;
  color: #666;
  font-style: italic;
}

.null-cell {
  background-color: #f3f3f3;
  color: #666;
  font-style: italic;
}

.signal-row .value-col {
  width: auto;
  max-width: none;
  min-width: 300px;
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

.signal-row .cell-text {
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.4;
  padding: 4px 0;
}

.row-ied,
.row-systemSetting,
.row-lineParameters,
.row-protectionGroup {
  background-color: #b3c7f2;
}

.row-settingFunction,
.row-protectionFunction {
  background-color: #b0dce8;
}

.row-protectionLevel {
  background-color: #d6e7f0;
}

.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  position: relative;
}

.parameter-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 80px;
  overflow: visible;
  table-layout: fixed;
}

.parameter-table.table-resized th:nth-child(1),
.parameter-table.table-resized td:nth-child(1) {
  width: var(--col-1);
}

.parameter-table.table-resized th:nth-child(2),
.parameter-table.table-resized td:nth-child(2) {
  width: var(--col-2);
}

.parameter-table.table-resized th:nth-child(3),
.parameter-table.table-resized td:nth-child(3) {
  width: var(--col-3);
}

.parameter-table.table-resized th:nth-child(4),
.parameter-table.table-resized td:nth-child(4) {
  width: var(--col-4);
}

.parameter-table.table-resized th:nth-child(5),
.parameter-table.table-resized td:nth-child(5) {
  width: var(--col-5);
}

.parameter-table.table-resized th:nth-child(6),
.parameter-table.table-resized td:nth-child(6) {
  width: var(--col-6);
}

.parameter-table th {
  height: 30px;
  border: 1px solid #ccc;
  padding: 0 8px;
  line-height: 30px;
  text-align: left;
  position: relative;
  white-space: nowrap;
  box-sizing: border-box;
}

.parameter-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}



.parameter-table th:hover .resizer-handle {
  background-color: #ddd;
}

.resizer-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 7px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
  z-index: 2;
  transition: background-color 0.2s;
}

.resizer-handle:hover {
  background-color: #ddd;
}

.parameter-table th::-webkit-resizer,
.parameter-table td::-webkit-resizer {
  display: none;
}

thead {
  background-color: #e1e1e1;
}

.parameter-table thead th {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #e1e1e1;
  border-bottom: 2px solid #999;
  border-top: 0;
}

.value-col {
  width: 220px;
}

.cell {
  display: flex;
  align-items: center;
  min-height: 22px;
  position: relative;
}

.system-setting-tab {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.system-setting-layout {
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
  position: relative;
}

.param-tree-title {
  font-weight: 600;
  color: #555;
}

.param-tree-actions {
  position: absolute;
  left: 10px;
  display: flex;
  gap: 10px;
}

.toggle-icon {
  cursor: pointer;
  font-size: 16px;
  color: #666;
}

.toggle-icon.active {
  color: #146ebe;
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

.table-pane-action-divider {
  width: 1px;
  height: 18px;
  background: #ddd;
  margin: 0 2px;
}

.pane-subtitle {
  font-weight: 600;
  color: #777;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-pane-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.table-spacer td {
  padding: 0;
  border: none;
  height: 0;
}

.cell-text {
  flex: 1 1 auto;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  word-break: break-word;
}

.cell-input {
  flex: 1 1 auto;
  min-width: 0;
  border: 1px solid #ddd;
  padding: 4px 8px;
  border-radius: 4px;
}

.switch-label {
  margin-right: 15px;
  font-size: 14px;
  flex-shrink: 0;
}

.cell .el-switch {
  margin: 0;
  flex-shrink: 0;
}
</style>

<style>
.system-setting-dropdown {
  z-index: 999999 !important;
}
.el-select-dropdown {
  z-index: 999999 !important;
}
.system-setting-dropdown .el-select-dropdown__item {
  color: #333;
  padding: 8px 16px;
}
.system-setting-dropdown .el-select-dropdown__item:hover {
  background-color: #f5f5f5;
  color: #333;
}
.system-setting-dropdown .el-select-dropdown__item.selected {
  background-color: #409eff;
  color: #fff;
  font-weight: bold;
}
.drag-handle {
  cursor: grab;
}
.dragging .drag-handle {
  cursor: grabbing;
}

.dragging {
  user-select: none;
}

.el-select {
  width: 100% !important;
}

.el-select .el-input {
  width: 100% !important;
}

.el-select .el-input__inner {
  width: 100% !important;
}
</style>
