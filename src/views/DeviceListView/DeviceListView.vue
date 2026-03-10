<template>
  <div class="device-list-view">
    <div v-if="isLoading" class="loading">Loading device list...</div>
    <div v-else-if="deviceList && deviceList.length" class="table-container">
      <table class="device-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Vendor</th>
            <th>Model</th>
            <th>Serial Number</th>
            <th>Hardware Version</th>
            <th>Software Version</th>
            <th>Order Code</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="device in deviceList" :key="device.id || device.name">
            <td :class="cellClass(device.name)">{{ device.name || '' }}</td>
            <td :class="cellClass(device.description)">{{ device.description || '' }}</td>
            <td :class="cellClass(device.vendor)">{{ device.vendor || '' }}</td>
            <td :class="cellClass(device.model)">{{ device.model || '' }}</td>
            <td :class="cellClass(device.serialNumber)">{{ device.serialNumber || '' }}</td>
            <td :class="cellClass(device.hardwareVersion)">{{ device.hardwareVersion || '' }}</td>
            <td :class="cellClass(device.softwareVersion)">{{ device.softwareVersion || '' }}</td>
            <td :class="cellClass(device.orderCode)">{{ device.orderCode || '' }}</td>
            <td :class="cellClass(device.role)">{{ device.role || '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="no-data">
      No devices found for {{ nodeMode }} ({{ nodeName }}).
    </div>
  </div>
</template>

<script>
import { getDeviceListByOrganisation } from "@/api/organisation";
import { getDeviceListBySubstation } from "@/api/substation";
import { getDeviceListByVoltageLevel } from "@/api/voltagelevel";
import { getDeviceListByBay } from "@/api/bay";

export default {
  name: "DeviceListView",
  props: {
    ownerData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      deviceList: [],
      isLoading: false,
    };
  },
  computed: {
    node() {
      return this.ownerData?.node || this.ownerData || null;
    },
    nodeId() {
      return this.node?.id || null;
    },
    nodeMode() {
      return this.node?.mode || "";
    },
    nodeName() {
      return this.node?.name || "";
    },
  },
  watch: {
    nodeId: {
      handler(newId) {
        if (newId) {
          this.fetchDeviceList();
        }
      },
      immediate: true,
    },
  },
  methods: {
    async fetchDeviceList() {
      if (!this.node || !this.node.id) return;
      this.isLoading = true;
      try {
        let data = [];
        const mode = this.nodeMode;
        const id = this.nodeId;

        if (mode === 'organisation') {
           data = await getDeviceListByOrganisation(id);
        } else if (mode === 'substation') {
           data = await getDeviceListBySubstation(id);
        } else if (mode === 'voltageLevel') {
           data = await getDeviceListByVoltageLevel(id);
        } else if (mode === 'bay') {
           data = await getDeviceListByBay(id);
        } else {
           console.warn(`Unsupported mode for device list: ${mode}`);
        }

        this.deviceList = Array.isArray(data) ? data : [];
        console.log("Device List Response:", data);
      } catch (error) {
        console.error("Failed to fetch device list:", error);
        this.deviceList = [];
      } finally {
        this.isLoading = false;
        this.$nextTick(() => {
          this.initResize();
        });
      }
    },
    isNullish(v) {
      return (
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
      );
    },
    cellClass(v) {
      return this.isNullish(v) ? "null-cell" : "";
    },
    // Resize Logic
    initResize() {
      const table = this.$el.querySelector('.device-table');
      if (!table) return;
      const headers = table.querySelectorAll('th');
      
      headers.forEach(header => {
        if (header.querySelector('.resizer-handle')) return;

        const resizer = document.createElement('div');
        resizer.classList.add('resizer-handle');
        resizer.style.height = '100vh';
        resizer.style.width = '7px';
        resizer.style.position = 'absolute';
        resizer.style.right = '-3px';
        resizer.style.top = '0';
        resizer.style.cursor = 'col-resize';
        resizer.style.userSelect = 'none';
        resizer.style.zIndex = '10';
        
        header.appendChild(resizer);
        this.addResizeEvent(resizer, header);
      });
    },
    addResizeEvent(resizer, header) {
      let startX, startWidth;

      const onMouseMove = (e) => {
        if (startX === undefined) return;
        const diff = e.pageX - startX;
        header.style.width = `${startWidth + diff}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        startX = undefined;
      };

      resizer.addEventListener('mousedown', (e) => {
        startX = e.pageX;
        startWidth = header.offsetWidth;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
        e.stopPropagation();
      });
      
      resizer.addEventListener('click', (e) => e.stopPropagation());
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initResize();
    });
  },
  updated() {
    this.$nextTick(() => {
      this.initResize();
    });
  }
};
</script>

<style scoped>
.device-list-view {
  width: 100%;
  height: 100%;
  background-color: #fff;
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.table-container {
  padding-bottom: 50px;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}

.device-table th {
  height: 30px;
  padding: 0 8px;
  line-height: 30px;
  white-space: nowrap;
  box-sizing: border-box;
  position: relative;
  border: 1px solid #ccc;
  text-align: left;
}

.device-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.device-table th:hover .resizer-handle {
  background-color: #ddd;
}

.resizer-handle:hover {
  background-color: #409eff !important;
}

thead {
  background-color: #e1e1e1;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid #999;
  box-shadow: 0 -20px 0 20px #fff;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 14px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.null-cell {
  background-color: #f3f3f3;
  color: #666;
  font-style: italic;
}
</style>
