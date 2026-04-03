<template>
  <div class="device-list-view">
    <div v-if="isLoading" class="loading">Loading device list...</div>

    <template v-else-if="deviceList && deviceList.length">
      <div class="dashboard-section">
        <div class="dashboard-grid">
          <div class="dashboard-row dashboard-row-top">
            <div class="chart-card summary-card">
              <div class="summary-main">
                <div class="summary-icon-wrap">
                  <i class="fa-solid fa-microchip summary-icon"></i>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ totalDevices }}</div>
                  <div class="summary-label">Devices count</div>
                </div>
              </div>
            </div>

            <div class="chart-card by-type-card">
              <div class="chart-title">By Type</div>
              <div class="chart-content">
                <canvas ref="typeChart"></canvas>
              </div>
            </div>

            <div class="chart-card role-card">
              <div class="chart-title">By Role</div>
              <div class="chart-content">
                <canvas ref="roleChart"></canvas>
              </div>
            </div>
          </div>

          <div class="dashboard-row dashboard-row-bottom">
            <div class="chart-card vendor-card">
              <div class="chart-title">By Vendor</div>
              <div class="chart-content">
                <canvas ref="vendorChart"></canvas>
              </div>
            </div>

            <div class="chart-card model-card">
              <div class="chart-title">By Model</div>
              <div class="chart-content">
                <canvas ref="modelChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="list-section">
        <div class="table-container">
          <table class="device-table device-table-fit">
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

const TYPE_COUNT_LABEL_PLUGIN = {
  id: "type-count-label-plugin",
  afterDatasetsDraw(chart) {
    const dataset = chart.config?.data?.datasets?.[0];
    if (!dataset) return;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const ctx = chart.chart.ctx;
    const area = chart.chartArea || { top: 0, bottom: 0 };
    const labelsCount = Array.isArray(dataset.data) ? dataset.data.length : 0;
    const useCompactLabels = labelsCount < 10;
    const minGap = useCompactLabels ? 8 : 14;

    const points = meta.data.map((arc, index) => {
      const m = arc?._model;
      if (!m) return null;
      const angle = (m.startAngle + m.endAngle) / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const side = cos >= 0 ? "right" : "left";

      return {
        index,
        text: String(dataset.data[index] ?? ""),
        side,
        edgeX: m.x + cos * m.outerRadius,
        edgeY: m.y + sin * m.outerRadius,
        rawY: m.y + sin * (m.outerRadius + (useCompactLabels ? 5 : 20)),
        textX: m.x + (side === "right" ? m.outerRadius + (useCompactLabels ? 7 : 34) : -(m.outerRadius + (useCompactLabels ? 7 : 34))),
      };
    }).filter(Boolean);

    const adjustVertical = (items) => {
      if (!items.length) return;
      items.sort((a, b) => a.rawY - b.rawY);
      items[0].y = Math.max(area.top + 8, items[0].rawY);
      for (let i = 1; i < items.length; i += 1) {
        items[i].y = Math.max(items[i].rawY, items[i - 1].y + minGap);
      }

      const overflow = items[items.length - 1].y - (area.bottom - 8);
      if (overflow > 0) {
        for (let i = items.length - 1; i >= 0; i -= 1) {
          items[i].y -= overflow;
          if (i > 0 && items[i].y - items[i - 1].y < minGap) {
            items[i - 1].y = items[i].y - minGap;
          }
        }
      }
    };

    adjustVertical(points.filter((p) => p.side === "left"));
    adjustVertical(points.filter((p) => p.side === "right"));

    ctx.save();
    ctx.font = "600 11px Arial";
    ctx.fillStyle = "#3f4450";
    ctx.strokeStyle = "rgba(120,126,140,0.8)";
    ctx.lineWidth = 1;

    points.forEach((p) => {
      if (!useCompactLabels) {
        const elbowX = p.side === "right" ? p.textX - 8 : p.textX + 8;
        ctx.beginPath();
        ctx.moveTo(p.edgeX, p.edgeY);
        ctx.lineTo(elbowX, p.y);
        ctx.stroke();
      }

      ctx.textAlign = p.side === "right" ? "left" : "right";
      ctx.textBaseline = "middle";
      ctx.fillText(p.text, p.textX, p.y);
    });

    ctx.restore();
  },
};

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
    totalDevices() {
      return this.deviceList.length;
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
        plugins: [TYPE_COUNT_LABEL_PLUGIN],
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
          layout: {
            padding: { top: 10, bottom: 10, left: 18, right: 18 },
          },
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-row {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.dashboard-row-top .summary-card {
  flex: 0 0 25%;
  min-width: 0;
}

.dashboard-row-top .by-type-card,
.dashboard-row-top .role-card {
  flex: 1 1 0;
  min-width: 0;
}

.dashboard-row-bottom .vendor-card,
.dashboard-row-bottom .model-card {
  flex: 1 1 0;
  min-width: 0;
}

.summary-card {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  border: 1px solid #d7e4f7;
  padding: 0;
}

.summary-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  width: auto;
}

.summary-icon-wrap {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background: #f8d8d8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-icon {
  color: #cc5252;
  font-size: 32px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  text-align: center;
}

.summary-value {
  font-size: 46px;
  line-height: 1;
  font-weight: 700;
  color: #1f2d3d;
}

.summary-label {
  font-size: 14px;
  color: #6b7788;
  letter-spacing: 0.2px;
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
  overflow-x: hidden;
  padding-bottom: 50px;
  box-sizing: border-box;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}

.device-table-fit {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
  font-size: 11px;
}

.device-table th {
  padding: 6px 4px;
  line-height: 1.2;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  box-sizing: border-box;
  position: relative;
  border: 1px solid #ccc;
  text-align: left;
  vertical-align: middle;
}

.device-table td {
  border: 1px solid #ccc;
  padding: 6px 4px;
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  overflow: visible;
  text-overflow: clip;
  vertical-align: top;
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
  .dashboard-row {
    flex-direction: column;
  }

  .dashboard-row-top .summary-card,
  .dashboard-row-top .by-type-card,
  .dashboard-row-top .role-card,
  .dashboard-row-bottom .vendor-card,
  .dashboard-row-bottom .model-card {
    flex: 1 1 auto;
  }
}
</style>
