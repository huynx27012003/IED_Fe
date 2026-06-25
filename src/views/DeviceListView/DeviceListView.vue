<template>
  <div class="device-list-view">
    <div v-if="isLoading" class="loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Loading device list...</span>
    </div>

    <template v-else-if="deviceList && deviceList.length">
      <div class="dashboard-section">
        <div class="dashboard-grid">
          <div class="dashboard-row dashboard-row-top">
            <!-- Summary Card -->
            <div class="chart-card summary-card">
              <div class="summary-icon-wrap">
                <i class="fa-solid fa-microchip summary-icon"></i>
              </div>
              <div class="summary-value">{{ totalDevices }}</div>
              <div class="summary-label">Total Devices</div>
              <div class="summary-sub">{{ nodeMode }} · {{ nodeName }}</div>
            </div>

            <!-- By Type -->
            <div class="chart-card">
              <div class="chart-header">
                <span class="chart-title">By Type</span>
                <span class="chart-badge">{{ typeStats.length }} types</span>
              </div>
              <div class="chart-body">
                <canvas ref="typeChart" role="img" :aria-label="`Doughnut chart: device types`"></canvas>
              </div>
              <div class="chart-legend" id="typeLegend"></div>
            </div>

            <!-- By Role -->
            <div class="chart-card">
              <div class="chart-header">
                <span class="chart-title">By Role</span>
                <span class="chart-badge">{{ roleStats.length }} roles</span>
              </div>
              <div class="chart-body">
                <canvas ref="roleChart" role="img" :aria-label="`Bar chart: device roles`"></canvas>
              </div>
            </div>
          </div>

          <div class="dashboard-row dashboard-row-bottom">
            <!-- By Vendor -->
            <div class="chart-card">
              <div class="chart-header">
                <span class="chart-title">By Vendor</span>
                <div class="tab-group">
                  <button
                    v-for="t in ['Count','A–Z']"
                    :key="t"
                    :class="['tab-btn', vendorSort === t ? 'active' : '']"
                    @click="setVendorSort(t)"
                  >{{ t }}</button>
                </div>
              </div>
              <div class="chart-body">
                <canvas ref="vendorChart" role="img" :aria-label="`Bar chart: devices by vendor`"></canvas>
              </div>
            </div>

            <!-- By Model -->
            <div class="chart-card">
              <div class="chart-header">
                <span class="chart-title">By Model</span>
                <span class="chart-badge">top {{ Math.min(modelStats.length, 10) }}</span>
              </div>
              <div class="chart-body chart-body--hbar" :style="{ height: Math.max(160, modelStats.slice(0,10).length * 36 + 40) + 'px' }">
                <canvas ref="modelChart" role="img" :aria-label="`Horizontal bar chart: devices by model`"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="list-section">
        <div class="table-toolbar">
          <span class="table-count">{{ deviceList.length }} devices</span>
        </div>
        <div class="table-container">
          <table class="device-table">
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
                class="device-row"
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
      <i class="fa-solid fa-inbox" style="font-size:32px;margin-bottom:12px;opacity:0.3"></i>
      <span>No devices found for {{ nodeMode }} ({{ nodeName }})</span>
    </div>
  </div>
</template>

<script>
import { getDeviceListByOrganisation } from "@/api/organisation";
import { getDeviceListBySubstation } from "@/api/substation";
import { getDeviceListByVoltageLevel } from "@/api/voltagelevel";
import { getDeviceListByBay } from "@/api/bay";

// ─── Palette ────────────────────────────────────────────────────────────────
const COLORS = [
  "#378ADD", "#1D9E75", "#BA7517", "#D4537E",
  "#7F77DD", "#639922", "#D85A30", "#888780",
  "#E24B4A", "#0F6E56",
];
const COLORS_ALPHA = COLORS.map((c) => c + "55");
const COLORS_HOVER = COLORS.map((c) => c + "99");

// ─── Shared tooltip config ───────────────────────────────────────────────────
const TOOLTIP_BASE = {
  backgroundColor: "#fff",
  borderColor: "rgba(0,0,0,0.10)",
  borderWidth: 1,
  titleColor: "#111",
  bodyColor: "#666",
  padding: 10,
  cornerRadius: 8,
  boxPadding: 4,
};

// ─── Chart.js loader (v4) ────────────────────────────────────────────────────
function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (window.Chart) { resolve(window.Chart); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => resolve(window.Chart);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default {
  name: "DeviceListView",

  props: {
    ownerData: { type: Object, required: true },
  },

  data() {
    return {
      deviceList: [],
      isLoading: false,
      chartInstances: {},
      vendorSort: "Count",
    };
  },

  computed: {
    node()     { return this.ownerData?.node || this.ownerData || null; },
    nodeId()   { return this.node?.id   || null; },
    nodeMode() { return this.node?.mode || ""; },
    nodeName() { return this.node?.name || ""; },

    totalDevices() { return this.deviceList.length; },

    tableColumns() {
      const order = [];
      const seen  = new Set();
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

    typeStats()   { return this.computeStats("type"); },
    roleStats()   { return this.computeStats("role"); },
    vendorStats() { return this.computeStats("vendor"); },
    modelStats()  { return this.computeStats("model"); },

    sortedVendorStats() {
      const data = [...this.vendorStats];
      if (this.vendorSort === "A–Z") data.sort((a, b) => a.key.localeCompare(b.key));
      return data;
    },
  },

  watch: {
    nodeId: {
      handler(newId) { if (newId) this.fetchDeviceList(); },
      immediate: true,
    },
  },

  methods: {
    // ── Data helpers ──────────────────────────────────────────────────────────
    computeStats(field) {
      const counts = {};
      this.deviceList.forEach((device) => {
        if (!device) return;
        const key = this.isNullish(device[field]) ? "(Empty)" : String(device[field]);
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },

    isNullish(v) {
      return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
    },

    cellClass(v)     { return this.isNullish(v) ? "null-cell" : ""; },

    formatCellValue(v) {
      if (this.isNullish(v)) return "";
      if (typeof v === "object") { try { return JSON.stringify(v); } catch { return String(v); } }
      return String(v);
    },

    formatColumnName(key) {
      if (!key) return "";
      return String(key)
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/^./, (c) => c.toUpperCase());
    },

    // ── Chart lifecycle ───────────────────────────────────────────────────────
    destroyChart(key) {
      if (this.chartInstances[key]) {
        this.chartInstances[key].destroy();
        delete this.chartInstances[key];
      }
    },

    async renderCharts() {
      await loadChartJs();
      await this.$nextTick();
      this.renderTypeChart();
      this.renderRoleChart();
      this.renderVendorChart();
      this.renderModelChart();
    },

    // ── Type — Doughnut ───────────────────────────────────────────────────────
    renderTypeChart() {
      this.destroyChart("type");
      const canvas = this.$refs.typeChart;
      if (!canvas) return;
      const stats = this.typeStats;

      this.chartInstances.type = new window.Chart(canvas, {
        type: "doughnut",
        data: {
          labels: stats.map((s) => s.key),
          datasets: [{
            data:            stats.map((s) => s.count),
            backgroundColor: COLORS.slice(0, stats.length),
            borderColor:     "#fff",
            borderWidth:     3,
            hoverOffset:     8,
          }],
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          cutout:              "68%",
          layout: { padding: 8 },
          plugins: {
            legend:  { display: false },
            tooltip: {
              ...TOOLTIP_BASE,
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} devices`,
              },
            },
          },
          animation: { animateScale: true, duration: 600, easing: "easeOutQuart" },
        },
      });

      // Custom HTML legend
      const legendEl = this.$el.querySelector("#typeLegend");
      if (legendEl) {
        legendEl.innerHTML = stats.map((s, i) => `
          <span class="legend-item">
            <span class="legend-dot" style="background:${COLORS[i % COLORS.length]}"></span>
            <span class="legend-key">${s.key}</span>
            <span class="legend-val">${s.count}</span>
          </span>`).join("");
      }
    },

    // ── Role — Horizontal bar ─────────────────────────────────────────────────
    renderRoleChart() {
      this.destroyChart("role");
      const canvas = this.$refs.roleChart;
      if (!canvas) return;
      const stats = this.roleStats;

      this.chartInstances.role = new window.Chart(canvas, {
        type: "bar",
        data: {
          labels: stats.map((s) => s.key),
          datasets: [{
            data:                 stats.map((s) => s.count),
            backgroundColor:      stats.map((_, i) => COLORS_ALPHA[i % COLORS_ALPHA.length]),
            borderColor:          stats.map((_, i) => COLORS[i % COLORS.length]),
            borderWidth:          1.5,
            borderRadius:         { topRight: 5, bottomRight: 5 },
            borderSkipped:        "left",
            hoverBackgroundColor: stats.map((_, i) => COLORS_HOVER[i % COLORS_HOVER.length]),
            maxBarThickness:      28,
            barPercentage:        0.65,
          }],
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          indexAxis:           "y",
          plugins: {
            legend:  { display: false },
            tooltip: {
              ...TOOLTIP_BASE,
              callbacks: { label: (ctx) => ` ${ctx.parsed.x} devices` },
            },
          },
          scales: {
            x: {
              grid:   { color: "rgba(0,0,0,0.05)" },
              border: { display: false },
              ticks:  {
                color: "#999",
                font:  { size: 11 },
                stepSize: 1,
                callback: (v) => (Number.isInteger(v) ? v : null),
              },
              beginAtZero: true,
            },
            y: {
              grid:   { display: false },
              border: { display: false },
              ticks:  { color: "#444", font: { size: 11 } },
            },
          },
          animation: { duration: 600, easing: "easeOutQuart" },
        },
      });
    },

    // ── Vendor — Vertical bar ─────────────────────────────────────────────────
    renderVendorChart() {
      this.destroyChart("vendor");
      const canvas = this.$refs.vendorChart;
      if (!canvas) return;
      const stats = this.sortedVendorStats;

      this.chartInstances.vendor = new window.Chart(canvas, {
        type: "bar",
        data: {
          labels: stats.map((s) => s.key),
          datasets: [{
            data:                 stats.map((s) => s.count),
            backgroundColor:      stats.map((_, i) => COLORS_ALPHA[i % COLORS_ALPHA.length]),
            borderColor:          stats.map((_, i) => COLORS[i % COLORS.length]),
            borderWidth:          1.5,
            borderRadius:         { topLeft: 5, topRight: 5 },
            borderSkipped:        "bottom",
            hoverBackgroundColor: stats.map((_, i) => COLORS_HOVER[i % COLORS_HOVER.length]),
            maxBarThickness:      56,
            barPercentage:        0.6,
            categoryPercentage:   0.7,
          }],
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          plugins: {
            legend:  { display: false },
            tooltip: {
              ...TOOLTIP_BASE,
              callbacks: { label: (ctx) => ` ${ctx.parsed.y} devices` },
            },
          },
          scales: {
            x: {
              grid:   { display: false },
              border: { display: false },
              ticks:  { color: "#444", font: { size: 11 }, maxRotation: 30, autoSkip: true },
            },
            y: {
              grid:   { color: "rgba(0,0,0,0.05)" },
              border: { display: false },
              ticks:  {
                color: "#999",
                font:  { size: 11 },
                stepSize: 1,
                callback: (v) => (Number.isInteger(v) ? v : null),
              },
              beginAtZero: true,
            },
          },
          animation: { duration: 500, easing: "easeOutQuart" },
        },
      });
    },

    // ── Model — Horizontal bar ────────────────────────────────────────────────
    renderModelChart() {
      this.destroyChart("model");
      const canvas = this.$refs.modelChart;
      if (!canvas) return;
      const stats = this.modelStats.slice(0, 10);

      this.chartInstances.model = new window.Chart(canvas, {
        type: "bar",
        data: {
          labels: stats.map((s) => s.key),
          datasets: [{
            data:                 stats.map((s) => s.count),
            backgroundColor:      stats.map((_, i) => COLORS_ALPHA[i % COLORS_ALPHA.length]),
            borderColor:          stats.map((_, i) => COLORS[i % COLORS.length]),
            borderWidth:          1.5,
            borderRadius:         { topRight: 5, bottomRight: 5 },
            borderSkipped:        "left",
            hoverBackgroundColor: stats.map((_, i) => COLORS_HOVER[i % COLORS_HOVER.length]),
            maxBarThickness:      28,
            barPercentage:        0.7,
          }],
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          indexAxis:           "y",
          plugins: {
            legend:  { display: false },
            tooltip: {
              ...TOOLTIP_BASE,
              callbacks: { label: (ctx) => ` ${ctx.parsed.x} devices` },
            },
          },
          scales: {
            x: {
              grid:   { color: "rgba(0,0,0,0.05)" },
              border: { display: false },
              ticks:  {
                color: "#999",
                font:  { size: 11 },
                stepSize: 1,
                callback: (v) => (Number.isInteger(v) ? v : null),
              },
              beginAtZero: true,
            },
            y: {
              grid:   { display: false },
              border: { display: false },
              ticks:  { color: "#444", font: { size: 11 } },
            },
          },
          animation: { duration: 600, easing: "easeOutQuart" },
        },
      });
    },

    // ── Vendor sort toggle ────────────────────────────────────────────────────
    setVendorSort(val) {
      this.vendorSort = val;
      this.$nextTick(() => this.renderVendorChart());
    },

    // ── Fetch ─────────────────────────────────────────────────────────────────
    async fetchDeviceList() {
      if (!this.node?.id) return;
      this.isLoading = true;
      try {
        let data = [];
        const { nodeMode: mode, nodeId: id } = this;
        if      (mode === "organisation") data = await getDeviceListByOrganisation(id);
        else if (mode === "substation")   data = await getDeviceListBySubstation(id);
        else if (mode === "voltageLevel") data = await getDeviceListByVoltageLevel(id);
        else if (mode === "bay")          data = await getDeviceListByBay(id);
        else console.warn(`Unsupported mode: ${mode}`);
        this.deviceList = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error(this.$apiErrorMessage?.(err, "Failed to fetch device list"), err);
        this.deviceList = [];
      } finally {
        this.isLoading = false;
        this.$nextTick(() => {
          this.renderCharts();
          this.initResize();
        });
      }
    },

    // ── Column resize ─────────────────────────────────────────────────────────
    initResize() {
      const table = this.$el.querySelector(".device-table");
      if (!table) return;
      table.querySelectorAll("th").forEach((header) => {
        if (header.querySelector(".resizer-handle")) return;
        const resizer = document.createElement("div");
        resizer.className = "resizer-handle";
        header.appendChild(resizer);
        this.addResizeEvent(resizer, header);
      });
    },

    addResizeEvent(resizer, header) {
      let startX, startWidth;
      const onMove = (e) => { if (startX !== undefined) header.style.width = `${startWidth + e.pageX - startX}px`; };
      const onUp   = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); document.body.style.cursor = ""; startX = undefined; };
      resizer.addEventListener("mousedown", (e) => {
        startX = e.pageX; startWidth = header.offsetWidth;
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        document.body.style.cursor = "col-resize";
        e.preventDefault(); e.stopPropagation();
      });
      resizer.addEventListener("click", (e) => e.stopPropagation());
    },
  },

  mounted()      { this.$nextTick(() => this.initResize()); },
  updated()      { this.$nextTick(() => this.initResize()); },
  beforeUnmount(){ Object.keys(this.chartInstances).forEach((k) => this.destroyChart(k)); },
};
</script>

<style scoped>
/* ── Root layout ─────────────────────────────────────────────────────────── */
.device-list-view {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ── Dashboard section ───────────────────────────────────────────────────── */
.dashboard-section {
  flex: 0 0 auto;
  padding: 14px;
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

.dashboard-row-top  > .chart-card:first-child { flex: 0 0 180px; }
.dashboard-row-top  > .chart-card + .chart-card { flex: 1 1 0; min-width: 0; }
.dashboard-row-bottom > .chart-card { flex: 1 1 0; min-width: 0; }

/* ── Chart card ──────────────────────────────────────────────────────────── */
.chart-card {
  background: #fff;
  border: 0.5px solid rgba(0,0,0,0.10);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.chart-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.07);
  border-color: rgba(0,0,0,0.16);
}

/* ── Chart header ────────────────────────────────────────────────────────── */
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 0;
  flex-shrink: 0;
}

.chart-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #888;
}

.chart-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  background: #f0f0f0;
  color: #888;
}

/* ── Chart body ──────────────────────────────────────────────────────────── */
.chart-body {
  position: relative;
  height: 168px;
  padding: 10px 12px 12px;
  flex-shrink: 0;
}

.chart-body--hbar {
  padding: 6px 12px 8px;
}

.chart-body canvas {
  display: block;
}

/* ── Custom legend ───────────────────────────────────────────────────────── */
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 0 14px 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #666;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-key { color: #444; }

.legend-val {
  font-weight: 600;
  color: #222;
}

/* ── Summary card ────────────────────────────────────────────────────────── */
.summary-card {
  justify-content: center;
  align-items: flex-start;
  padding: 20px 18px;
  background: linear-gradient(145deg, #fff 0%, #f8fbff 100%);
  border-color: #d7e4f7;
}

.summary-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #E6F1FB;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.summary-icon {
  color: #185FA5;
  font-size: 20px;
}

.summary-value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  color: #111;
  letter-spacing: -1px;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #888;
  margin-top: 6px;
}

.summary-sub {
  font-size: 11px;
  color: #aaa;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.tab-group {
  display: flex;
  gap: 3px;
}

.tab-btn {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 20px;
  border: none;
  background: transparent;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.tab-btn:hover { background: #f0f0f0; }

.tab-btn.active {
  background: #E6F1FB;
  color: #185FA5;
  font-weight: 600;
}

.list-section {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-top: 1px solid rgba(0,0,0,0.07);
}

.table-toolbar {
  padding: 8px 14px;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  flex-shrink: 0;
}

.table-count {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.3px;
}

.table-container {
  flex: 1 1 0;
  overflow-y: auto;
  overflow-x: auto;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

.device-table th {
  padding: 7px 8px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: #555;
  background: #f7f8fa;
  border-bottom: 1.5px solid #e0e0e0;
  border-right: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  vertical-align: middle;
  cursor: default;
  user-select: none;
}

.device-table th:last-child { border-right: none; }

.device-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
  vertical-align: top;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: #222;
  line-height: 1.4;
}

.device-table td:last-child { border-right: none; }

.device-row:hover td { background: #fafbff; }

.device-table tr:nth-child(even) td { background: #fafafa; }
.device-row:hover td { background: #f0f5ff !important; }

.null-cell {
  color: #bbb;
  font-style: italic;
  background: #fafafa;
}

/* ── Column resizer ──────────────────────────────────────────────────────── */
.resizer-handle {
  position: absolute;
  right: -3px;
  top: 0;
  width: 7px;
  height: 100vh;
  cursor: col-resize;
  z-index: 11;
  user-select: none;
}

.resizer-handle:hover { background: rgba(55,138,221,0.3); }

/* ── Loading / empty states ──────────────────────────────────────────────── */
.loading,
.no-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #aaa;
  font-size: 14px;
}

.loading i { font-size: 24px; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .dashboard-row { flex-direction: column; }
  .dashboard-row-top > .chart-card:first-child { flex: none; }
}
</style>
