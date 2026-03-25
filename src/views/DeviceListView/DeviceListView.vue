<template>
  <div class="device-list-view">
    <div v-if="isLoading" class="loading">Loading device list...</div>

    <template v-else-if="deviceList && deviceList.length">
      <div class="dashboard-section">
        <div class="dashboard-grid">
          <div class="chart-card">
            <div class="chart-title">By Type</div>
            <div class="chart-content">
              <canvas ref="typeChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-title">By Vendor</div>
            <div class="chart-content">
              <canvas ref="vendorChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-title">By Model</div>
            <div class="chart-content">
              <canvas ref="modelChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-title">By Role</div>
            <div class="chart-content">
              <canvas ref="roleChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="list-section">
        <div class="table-container">
          <table class="device-table" :style="{ minWidth: `${tableMinWidth}px` }">
            <thead>
              <tr>
                <th v-for="column in tableColumns" :key="`header-${column}`">
                  {{ formatColumnName(column) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(device, index) in deviceList"
                :key="device.id || device.name || `device-${index}`"
              >
                <td
                  v-for="column in tableColumns"
                  :key="`cell-${device.id || device.name || index}-${column}`"
                  :class="cellClass(device[column])"
                >
                  {{ formatCellValue(device[column]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

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

const PALETTE = [
  "#378ADD", "#1D9E75", "#BA7517", "#D4537E",
  "#7F77DD", "#639922", "#D85A30", "#888780",
  "#E24B4A", "#0F6E56",
];
const PALETTE_ALPHA = PALETTE.map((c) => c + "CC");
const GRID_COLOR = "rgba(0,0,0,0.07)";
const TICK_COLOR = "#999";

function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve(window.Chart);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js";
    script.onload = () => resolve(window.Chart);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

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
      chartInstances: {},
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
    tableColumns() {
      const order = [];
      const seen = new Set();
      this.deviceList.forEach((device) => {
        if (!device || typeof device !== "object") return;
        Object.keys(device).forEach((key) => {
          if (seen.has(key)) return;
          seen.add(key);
          order.push(key);
        });
      });
      return order;
    },
    tableMinWidth() {
      return Math.max(900, this.tableColumns.length * 160);
    },
  },
  watch: {
    nodeId: {
      handler(newId) {
        if (newId) this.fetchDeviceList();
      },
      immediate: true,
    },
  },
  methods: {
    computeStats(field) {
      const counts = {};
      this.deviceList.forEach((device) => {
        if (!device) return;
        const key = this.isNullish(device[field])
          ? "(Empty)"
          : String(device[field]);
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },

    destroyChart(key) {
      if (this.chartInstances[key]) {
        this.chartInstances[key].destroy();
        delete this.chartInstances[key];
      }
    },

    async renderCharts() {
      const Chart = await loadChartJs();
      await this.$nextTick();
      this.renderTypeChart(Chart);
      this.renderVendorChart(Chart);
      this.renderModelChart(Chart);
      this.renderRoleChart(Chart);
    },

    renderTypeChart(Chart) {
      this.destroyChart("type");
      const ref = this.$refs.typeChart;
      if (!ref) return;
      const stats = this.computeStats("type");
      const baseColors = PALETTE.slice(0, stats.length);
      this.chartInstances.type = new Chart(ref, {
        type: "doughnut",
        data: {
          labels: stats.map((s) => s.key),
          datasets: [
            {
              data: stats.map((s) => s.count),
              backgroundColor: baseColors,
              borderColor: "#fff",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: {
            position: "right",
            labels: { boxWidth: 10, fontSize: 11, fontColor: TICK_COLOR, padding: 8 },
          },
          tooltips: {
            callbacks: {
              label: (item, data) => {
                const label = data.labels[item.index];
                const val = data.datasets[0].data[item.index];
                return ` ${label}: ${val}`;
              },
            },
          },
          animation: { animateScale: true, duration: 500 },
        },
      });
    },

    renderVendorChart(Chart) {
      this.destroyChart("vendor");
      const ref = this.$refs.vendorChart;
      if (!ref) return;
      const stats = this.computeStats("vendor");
      this.chartInstances.vendor = new Chart(ref, {
        type: "bar",
        data: {
          labels: stats.map((s) => s.key),
          datasets: [
            {
              data: stats.map((s) => s.count),
              backgroundColor: PALETTE_ALPHA.slice(0, stats.length),
              borderColor: PALETTE.slice(0, stats.length),
              borderWidth: 1.5,
              hoverBackgroundColor: PALETTE.slice(0, stats.length),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 500 },
          legend: { display: false },
          scales: {
            xAxes: [
              {
                gridLines: { color: GRID_COLOR },
                ticks: {
                  fontSize: 11,
                  fontColor: TICK_COLOR,
                  maxRotation: 30,
                  autoSkip: true,
                },
              },
            ],
            yAxes: [
              {
                gridLines: { color: GRID_COLOR },
                ticks: {
                  fontSize: 11,
                  fontColor: TICK_COLOR,
                  beginAtZero: true,
                  stepSize: 1,
                  callback: (v) => (Number.isInteger(v) ? v : null),
                },
              },
            ],
          },
        },
      });
    },

    renderModelChart(Chart) {
      this.destroyChart("model");
      const ref = this.$refs.modelChart;
      if (!ref) return;
      const stats = this.computeStats("model");
      this.chartInstances.model = new Chart(ref, {
        type: "horizontalBar",
        data: {
          labels: stats.map((s) => s.key),
          datasets: [
            {
              data: stats.map((s) => s.count),
              backgroundColor: PALETTE_ALPHA.slice(0, stats.length),
              borderColor: PALETTE.slice(0, stats.length),
              borderWidth: 1.5,
              hoverBackgroundColor: PALETTE.slice(0, stats.length),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 500 },
          legend: { display: false },
          scales: {
            xAxes: [
              {
                gridLines: { color: GRID_COLOR },
                ticks: {
                  fontSize: 11,
                  fontColor: TICK_COLOR,
                  beginAtZero: true,
                  stepSize: 1,
                  callback: (v) => (Number.isInteger(v) ? v : null),
                },
              },
            ],
            yAxes: [
              {
                gridLines: { display: false },
                ticks: { fontSize: 11, fontColor: TICK_COLOR },
              },
            ],
          },
        },
      });
    },

    renderRoleChart(Chart) {
      this.destroyChart("role");
      const ref = this.$refs.roleChart;
      if (!ref) return;
      const stats = this.computeStats("role");
      this.chartInstances.role = new Chart(ref, {
        type: "polarArea",
        data: {
          labels: stats.map((s) => s.key),
          datasets: [
            {
              data: stats.map((s) => s.count),
              backgroundColor: PALETTE.slice(0, stats.length).map((c) => c + "BB"),
              borderColor: PALETTE.slice(0, stats.length),
              borderWidth: 1.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { animateScale: true, duration: 500 },
          legend: {
            position: "right",
            labels: {
              boxWidth: 10,
              fontSize: 11,
              fontColor: TICK_COLOR,
              padding: 8,
            },
          },
          scale: {
            gridLines: { color: GRID_COLOR },
            ticks: { display: false },
          },
        },
      });
    },

    async fetchDeviceList() {
      if (!this.node || !this.node.id) return;
      this.isLoading = true;
      try {
        let data = [];
        const mode = this.nodeMode;
        const id = this.nodeId;

        if (mode === "organisation") {
          data = await getDeviceListByOrganisation(id);
        } else if (mode === "substation") {
          data = await getDeviceListBySubstation(id);
        } else if (mode === "voltageLevel") {
          data = await getDeviceListByVoltageLevel(id);
        } else if (mode === "bay") {
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
          this.renderCharts();
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
    formatCellValue(v) {
      if (this.isNullish(v)) return "";
      if (typeof v === "object") {
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      }
      return String(v);
    },
    formatColumnName(key) {
      if (!key) return "";
      return String(key)
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/^./, (char) => char.toUpperCase());
    },

    initResize() {
      const table = this.$el.querySelector(".device-table");
      if (!table) return;
      const headers = table.querySelectorAll("th");

      headers.forEach((header) => {
        if (header.querySelector(".resizer-handle")) return;
        const resizer = document.createElement("div");
        resizer.classList.add("resizer-handle");
        resizer.style.height = "100vh";
        resizer.style.width = "7px";
        resizer.style.position = "absolute";
        resizer.style.right = "-3px";
        resizer.style.top = "0";
        resizer.style.cursor = "col-resize";
        resizer.style.userSelect = "none";
        resizer.style.zIndex = "10";
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
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        startX = undefined;
      };

      resizer.addEventListener("mousedown", (e) => {
        startX = e.pageX;
        startWidth = header.offsetWidth;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "col-resize";
        e.preventDefault();
        e.stopPropagation();
      });

      resizer.addEventListener("click", (e) => e.stopPropagation());
    },
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
  },

  beforeUnmount() {
    Object.keys(this.chartInstances).forEach((key) => this.destroyChart(key));
  },
};
</script>

<style scoped>
.device-list-view {
  width: 100%;
  height: 100%;
  background-color: #fff;
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-section {
  flex: 0 0 auto;
  padding: 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.chart-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.chart-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #c0c4cc;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.chart-content {
  padding: 12px;
  flex: 1;
  position: relative;
  height: 180px;
}

.chart-content canvas {
  display: block;
}

.list-section {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  margin-top: 0;
}

.table-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
  padding-bottom: 50px;
  box-sizing: border-box;
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

.loading,
.no-data {
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

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>