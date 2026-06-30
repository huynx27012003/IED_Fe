<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="1080px"
    :close-on-click-modal="true"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="overcurrent-dialog">
      <div class="curve-toolbar">
        <div class="curve-field group-field">
          <span class="curve-label">{{ $tUi('group') }}</span>
          <span class="group-pill">1</span>
        </div>

        <div class="curve-field mode-field">
          <span class="curve-label">{{ $tUi('mode') }}</span>
          <button
            type="button"
            class="mode-toggle-btn"
            :disabled="loading || !activeIedEntries.length"
            :title="`Switch to ${nextDisplayModeLabel}`"
            @click="toggleDisplayMode"
          >
            {{ displayModeLabel }}
          </button>
        </div>

        <label class="curve-field">
          <span class="curve-label">{{ $tUi('curveType') }}</span>
          <select v-model="selectedType" class="curve-select" @change="handleTypeChange">
            <option
              v-for="option in typeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <label v-if="isCompareMode" class="curve-field compare-add-field">
          <span class="curve-label">{{ $tUi('addIed') }}</span>
          <select
            v-model="selectedCompareIedId"
            class="curve-select"
            :disabled="loading || compareIedLoading || !availableCompareIedOptions.length"
            @change="handleAddCompareIed"
          >
            <option value="">
              {{ compareIedLoading ? $tUi('loading') : $tUi('selectIed') }}
            </option>
            <option
              v-for="option in availableCompareIedOptions"
              :key="`compare-add-${option.id}`"
              :value="option.id"
            >
              {{ option.name }}
            </option>
          </select>
        </label>

        <label class="curve-field current-field">
          <span class="curve-label">{{ $tUi('current', { unit: currentUnit }) }}</span>
          <input
            v-model.trim="currentText"
            class="curve-input"
            inputmode="decimal"
            :placeholder="$tUi('placeholderCurrent')"
            @keydown.enter.prevent="fetchCurve"
          />
        </label>

        <button
          type="button"
          class="curve-load-btn"
          :disabled="loading || !activeIedEntries.length"
          @click="fetchCurve"
        >
          {{ loading ? $tUi('loading') : $tUi('load') }}
        </button>
      </div>

      <div v-if="errorMessage" class="curve-error">
        {{ errorMessage }}
      </div>

      <div class="curve-meta">
        <span>{{ iedMetaLabel }}</span>
        <span>Group source: {{ payload?.groupSource || "request" }}</span>
        <span>Display: {{ displayModeLabel }}</span>
      </div>

      <div class="curve-chart-wrap">
        <div v-if="loading" class="curve-state">Loading curve...</div>
        <div v-else-if="!hasCurveData" class="curve-state">{{ $tUi('noCurveData') }}</div>
        <svg
          v-else
          ref="svgRef"
          class="curve-svg"
          :class="{ 'is-panning': isPanningChart }"
          :viewBox="`0 0 ${chartSize.width} ${chartSize.height}`"
          role="img"
          :aria-label="$tUi('overcurrentChartAria')"
          @wheel.prevent="handleChartWheel"
          @mousemove="handleChartMouseMove"
          @mousedown="handleChartMouseDown"
          @mouseup="stopChartPan"
          @click="handleChartClick"
          @mouseleave="clearHoverCoord"
          @dblclick.prevent="resetZoom"
        >
          <defs>
            <clipPath id="overcurrent-plot-clip">
              <rect
                :x="plotArea.left"
                :y="plotArea.top"
                :width="plotArea.width"
                :height="plotArea.height"
              />
            </clipPath>
          </defs>

          <rect
            :x="plotArea.left"
            :y="plotArea.top"
            :width="plotArea.width"
            :height="plotArea.height"
            class="plot-bg"
          />

          <g v-for="tick in xTicks" :key="`x-${tick.value}`">
            <line
              :x1="tick.x"
              :x2="tick.x"
              :y1="plotArea.top"
              :y2="plotArea.bottom"
              class="grid-line"
            />
            <text :x="tick.x" :y="plotArea.bottom + 20" class="axis-tick" text-anchor="middle">
              {{ tick.label }}
            </text>
          </g>

          <g v-for="tick in yTicks" :key="`y-${tick.value}`">
            <line
              :x1="plotArea.left"
              :x2="plotArea.right"
              :y1="tick.y"
              :y2="tick.y"
              class="grid-line"
            />
            <text :x="plotArea.left - 10" :y="tick.y + 4" class="axis-tick" text-anchor="end">
              {{ tick.label }}
            </text>
          </g>

          <line :x1="plotArea.left" :x2="plotArea.right" :y1="plotArea.bottom" :y2="plotArea.bottom" class="axis-line" />
          <line :x1="plotArea.left" :x2="plotArea.left" :y1="plotArea.top" :y2="plotArea.bottom" class="axis-line" />

          <text :x="plotArea.left + plotArea.width / 2" :y="chartSize.height - 16" class="axis-label" text-anchor="middle">
            I/{{ currentUnit }}
          </text>
          <text
            :x="18"
            :y="plotArea.top + plotArea.height / 2"
            class="axis-label"
            text-anchor="middle"
            :transform="`rotate(-90 18 ${plotArea.top + plotArea.height / 2})`"
          >
            t/{{ timeUnit }}
          </text>

          <line
            v-if="cursorLine"
            :x1="cursorLine.x"
            :x2="cursorLine.x"
            :y1="plotArea.top"
            :y2="plotArea.bottom"
            class="cursor-line"
          />
          <g clip-path="url(#overcurrent-plot-clip)">
            <polyline
              v-for="line in compositePaths"
              :key="line.key"
              :points="line.points"
              fill="none"
              :stroke="line.color"
              stroke-width="2.8"
              class="composite-path"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </g>

          <g v-if="hoverPoint">
            <circle
              :cx="hoverPoint.x"
              :cy="hoverPoint.y"
              r="5"
              class="hover-point-marker"
            />
            <rect
              :x="hoverPoint.labelX"
              :y="hoverPoint.labelY - 18"
              :width="hoverPoint.labelWidth"
              height="36"
              rx="5"
              class="hover-point-bg"
            />
            <text :x="hoverPoint.labelX + 8" :y="hoverPoint.labelY - 4" class="hover-point-text">
              I={{ formatNumber(hoverPoint.current) }} {{ currentUnit }}
            </text>
            <text :x="hoverPoint.labelX + 8" :y="hoverPoint.labelY + 11" class="hover-point-text">
              t={{ formatNumber(hoverPoint.time) }} {{ timeUnit }}
            </text>
          </g>

          <g v-if="cursorReadout">
            <text :x="cursorReadout.x + 9" :y="cursorReadout.y + 16" class="cursor-readout-title">
              I={{ formatNumber(cursorCurrent) }} {{ currentUnit }}
            </text>
            <text
              v-for="(row, idx) in cursorReadout.rows"
              :key="row.key"
              :x="cursorReadout.x + 9"
              :y="cursorReadout.y + 34 + idx * 16"
              class="cursor-readout-row"
            >
              {{ row.label }}: {{ formatNumber(row.time) }} {{ timeUnit }}
            </text>
          </g>
        </svg>

        <div
          v-if="hoverCoord"
          class="coord-tooltip"
          :style="{ left: `${hoverPos.x + 12}px`, top: `${hoverPos.y + 12}px` }"
        >
          <div>I: {{ formatNumber(hoverCoord.current) }} {{ currentUnit }}</div>
          <div>t: {{ formatNumber(hoverCoord.time) }} {{ timeUnit }}</div>
        </div>

        <button
          v-if="zoomBounds"
          type="button"
          class="zoom-reset-btn"
          @click="resetZoom"
        >
          Reset zoom
        </button>
      </div>

      <div v-if="hasCurveData" class="curve-legend">
        <div v-for="line in legendPaths" :key="`legend-${line.key}`" class="legend-item">
          <span class="legend-dot" :style="{ backgroundColor: line.color }"></span>
          <span>{{ line.label }}</span>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { getPointsOvercurrent } from "@/api/pointsOvercurrent";
import { getAllActiveIeds } from "@/api/device";

const COLORS = [
  "#168a6a",
  "#7c3aed",
  "#dc2626",
  "#2563eb",
  "#f97316",
  "#0891b2",
  "#be185d",
  "#65a30d",
];
const DEFAULT_TYPE = "Neutral Overcurrent";

export default {
  name: "OvercurrentCurveDialog",
  props: {
    modelValue: { type: Boolean, default: false },
    iedId: { type: [Number, String], default: null },
    compareIeds: { type: Array, default: () => [] },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      loading: false,
      payload: null,
      comparePayloads: [],
      internalCompareIeds: [],
      allCompareIeds: [],
      selectedCompareIedId: "",
      compareIedLoading: false,
      selectedType: "",
      displayMode: "SECONDARY",
      currentText: "",
      typeOptions: [],
      errorMessage: "",
      requestId: 0,
      hoverCoord: null,
      hoverPos: { x: 0, y: 0 },
      hoverPoint: null,
      isPanningChart: false,
      panStartClient: { x: 0, y: 0 },
      panStartBounds: null,
      panMoved: false,
      suppressNextClick: false,
      zoomBounds: null,
    };
  },
  computed: {
    isCompareMode() {
      return (Array.isArray(this.compareIeds) && this.compareIeds.length > 1)
        || this.internalCompareIeds.length > 1;
    },
    activeIedEntries() {
      if (this.isCompareMode) {
        const source = this.internalCompareIeds.length ? this.internalCompareIeds : this.compareIeds;
        return source
          .map((item) => this.normalizeIedEntry(item))
          .filter((item) => item.id);
      }

      if (this.iedId == null || this.iedId === "") return [];
      return [{ id: this.iedId, name: String(this.iedId) }];
    },
    dialogTitle() {
      return this.isCompareMode ? "Compare Overcurrent Characteristic" : "Overcurrent Curve";
    },
    iedMetaLabel() {
      if (!this.activeIedEntries.length) return "IED: --";
      if (!this.isCompareMode) return `IED: ${this.activeIedEntries[0].id}`;
      return `IEDs: ${this.activeIedEntries.map((item) => item.name || item.id).join(", ")}`;
    },
    availableCompareIedOptions() {
      const selectedIds = new Set(this.activeIedEntries.map((item) => String(item.id)));
      return this.allCompareIeds.filter((item) => item.id && !selectedIds.has(String(item.id)));
    },
    sourcePayloads() {
      if (this.isCompareMode) {
        return this.comparePayloads.filter((item) => item?.payload);
      }
      return this.payload ? [{ id: this.iedId, name: String(this.iedId || "IED"), payload: this.payload }] : [];
    },
    chartSize() {
      return { width: 980, height: 500 };
    },
    plotArea() {
      const left = 74;
      const top = 24;
      const right = this.chartSize.width - 28;
      const bottom = this.chartSize.height - 58;
      return {
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top,
      };
    },
    cursorCurrent() {
      const raw = String(this.currentText || "").replace(",", ".").trim();
      if (!raw) return null;
      const value = Number(raw);
      return Number.isFinite(value) && value > 0 ? value : null;
    },
    normalizedDisplayMode() {
      return String(this.displayMode || "SECONDARY").trim().toUpperCase() === "PRIMARY"
        ? "PRIMARY"
        : "SECONDARY";
    },
    displayModeLabel() {
      return this.normalizedDisplayMode === "PRIMARY" ? "Primary" : "Secondary";
    },
    nextDisplayMode() {
      return this.normalizedDisplayMode === "PRIMARY" ? "SECONDARY" : "PRIMARY";
    },
    nextDisplayModeLabel() {
      return this.nextDisplayMode === "PRIMARY" ? "Primary" : "Secondary";
    },
    visibleTypes() {
      const entries = this.sourcePayloads.flatMap((source) => {
        const types = Array.isArray(source.payload?.types) ? source.payload.types : [];
        return types.map((typeItem) => ({ ...source, typeItem }));
      });
      if (!this.selectedType) return entries;

      const selected = this.normalizeText(this.selectedType);
      return entries.filter((entry) => {
        return [entry.typeItem?.name, entry.typeItem?.type].some((value) => this.normalizeText(value) === selected);
      });
    },
    plottedLevels() {
      const levels = [];
      this.visibleTypes.forEach((entry) => {
        const typeItem = entry.typeItem;
        const typeName = typeItem?.name || typeItem?.type || "Overcurrent";
        const typeCode = typeItem?.type || "";
        const sourceLevels = Array.isArray(typeItem?.levels)
          ? typeItem.levels
          : Array.isArray(typeItem?.points)
            ? [{ ...typeItem, level: typeItem?.level ?? null, points: typeItem.points }]
            : [];

        sourceLevels.forEach((level) => {
          const points = this.buildLevelPoints(level);

          if (!points.length) return;

          levels.push({
            iedId: entry.id,
            iedName: entry.name,
            typeName,
            typeCode,
            level,
            points,
          });
        });
      });
      return levels;
    },
    hasCurveData() {
      return this.domainCurves.length > 0;
    },
    currentUnit() {
      return this.sourcePayloads[0]?.payload?.currentAxisUnit || this.plottedLevels[0]?.level?.currentUnit || "A";
    },
    timeUnit() {
      return this.plottedLevels[0]?.level?.timeUnit || "s";
    },
    dataXBounds() {
      return this.getLogBounds(this.domainCurves.flatMap((item) => item.points.map((point) => point.x)));
    },
    dataYBounds() {
      return this.getLogBounds(this.domainCurves.flatMap((item) => item.points.map((point) => point.y)));
    },
    xBounds() {
      return this.zoomBounds
        ? { min: this.zoomBounds.xMin, max: this.zoomBounds.xMax }
        : this.dataXBounds;
    },
    yBounds() {
      return this.zoomBounds
        ? { min: this.zoomBounds.yMin, max: this.zoomBounds.yMax }
        : this.dataYBounds;
    },
    xTicks() {
      return this.getLogTicks(this.xBounds.min, this.xBounds.max).map((value) => ({
        value,
        x: this.mapX(value),
        label: this.formatNumber(value),
      }));
    },
    yTicks() {
      return this.getLogTicks(this.yBounds.min, this.yBounds.max).map((value) => ({
        value,
        y: this.mapY(value),
        label: this.formatNumber(value),
      }));
    },
    plottedPaths() {
      return this.plottedLevels.map((item, index) => {
        const color = COLORS[index % COLORS.length];
        const levelName = item.level?.level != null ? `L${item.level.level}` : `#${index + 1}`;
        const characteristic = item.level?.characteristic ? ` - ${item.level.characteristic}` : "";
        const operation = item.level?.operation === "Off" ? " (Off)" : "";

        return {
          key: `${item.typeCode || item.typeName}-${item.level?.id || index}`,
          label: `${item.typeName} ${levelName}${characteristic}${operation}`,
          color,
          off: item.level?.operation === "Off",
          points: item.points.map((point) => `${this.mapX(point.x)},${this.mapY(point.y)}`).join(" "),
        };
      });
    },
    levelsByType() {
      const groups = new Map();
      this.plottedLevels.forEach((item) => {
        const key = this.isCompareMode
          ? `${item.iedId || "ied"}|${item.typeCode || item.typeName}`
          : item.typeCode || item.typeName;
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            name: this.isCompareMode
              ? `${item.iedName || item.iedId || "IED"} - ${item.typeName}`
              : item.typeName,
            levels: [],
          });
        }
        groups.get(key).levels.push(item);
      });
      return Array.from(groups.values());
    },
    stitchedDomainCurves() {
      return this.levelsByType
        .map((group, index) => {
          const points = this.buildStitchedPoints(group.levels);
          if (points.length < 2) return null;

          return {
            key: `${group.key}-stitched`,
            label: `${group.name} Operating`,
            color: COLORS[index % COLORS.length],
            points,
          };
        })
        .filter(Boolean);
    },
    effectiveDomainCurves() {
      return this.visibleTypes
        .map((entry, index) => {
          const typeItem = entry.typeItem || {};
          const points = Array.isArray(typeItem.effectiveCurve?.points)
            ? typeItem.effectiveCurve.points
              .map((point) => this.normalizePoint(point))
              .filter((point) => Number.isFinite(point.x) && point.x > 0 && Number.isFinite(point.y) && point.y > 0)
            : [];
          if (points.length < 2) return null;

          const typeName = typeItem?.name || typeItem?.type || "Overcurrent";
          const labelName = this.isCompareMode
            ? `${entry.name || entry.id || "IED"} - ${typeName}`
            : typeName;
          const keyPrefix = this.isCompareMode ? `${entry.id || "ied"}|` : "";
          return {
            key: `${keyPrefix}${typeItem?.type || typeName}-effective`,
            label: `${labelName} Operating`,
            color: COLORS[index % COLORS.length],
            points,
          };
        })
        .filter(Boolean);
    },
    domainCurves() {
      return this.effectiveDomainCurves.length ? this.effectiveDomainCurves : this.stitchedDomainCurves;
    },
    compositePaths() {
      return this.domainCurves.map((curve) => ({
        ...curve,
        points: curve.points.map((point) => `${this.mapX(point.x)},${this.mapY(point.y)}`).join(" "),
      }));
    },
    legendPaths() {
      return this.compositePaths;
    },
    cursorLine() {
      if (!this.cursorCurrent) return null;
      if (this.cursorCurrent < this.xBounds.min || this.cursorCurrent > this.xBounds.max) return null;
      return { x: this.mapX(this.cursorCurrent) };
    },
    cursorTimeRows() {
      if (!this.cursorCurrent) return [];

      return this.domainCurves
        .map((curve) => {
          const time = this.getTimeOnPoints(curve.points, this.cursorCurrent);
          if (!Number.isFinite(time) || time <= 0) return null;
          return {
            key: curve.key,
            label: curve.label,
            time,
          };
        })
        .filter(Boolean);
    },
    cursorReadout() {
      if (!this.cursorLine || !this.cursorTimeRows.length) return null;

      const width = 230;
      const height = 28 + this.cursorTimeRows.length * 16;
      const curveY = this.mapY(this.cursorTimeRows[0].time);
      const gap = 14;
      const preferRight = this.cursorLine.x + width + 14 <= this.plotArea.right;
      const x = preferRight
        ? this.cursorLine.x + 12
        : Math.max(this.plotArea.left + 4, this.cursorLine.x - width - 12);
      const belowY = curveY + gap;
      const aboveY = curveY - height - gap;
      const hasRoomBelow = belowY + height <= this.plotArea.bottom - 8;
      const y = this.clamp(
        hasRoomBelow ? belowY : aboveY,
        this.plotArea.top + 8,
        this.plotArea.bottom - height - 8
      );

      return { x, y, width, height, rows: this.cursorTimeRows };
    },
  },
  watch: {
    modelValue(next) {
      if (next) {
        this.syncInternalCompareIeds();
        this.selectedType = "";
        this.typeOptions = [];
        this.comparePayloads = [];
        this.selectedCompareIedId = "";
        this.resetZoom();
        this.loadCompareIedOptions();
        this.fetchCurve();
      }
    },
    iedId(next, prev) {
      if (this.modelValue && next && next !== prev) {
        this.fetchCurve();
      }
    },
    compareIeds: {
      deep: true,
      handler(next, prev) {
        if (this.modelValue && next !== prev) {
          this.syncInternalCompareIeds();
          this.selectedType = "";
          this.typeOptions = [];
          this.comparePayloads = [];
          this.selectedCompareIedId = "";
          this.resetZoom();
          this.loadCompareIedOptions();
          this.fetchCurve();
        }
      },
    },
  },
  methods: {
    normalizeIedEntry(item) {
      return {
        id: item?.id == null ? "" : String(item.id).trim(),
        name: item?.name || item?.iedName || item?.label || item?.id || "IED",
      };
    },
    normalizeIedList(payload) {
      const source = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
            ? payload.result
            : [];

      return source
        .map((item) => this.normalizeIedEntry({
          id: item?.mrid ?? item?.mrd ?? item?.iedId ?? item?.id,
          name: item?.name ?? item?.iedName ?? item?.label,
        }))
        .filter((item) => item.id && item.name);
    },
    syncInternalCompareIeds() {
      this.internalCompareIeds = (Array.isArray(this.compareIeds) ? this.compareIeds : [])
        .map((item) => this.normalizeIedEntry(item))
        .filter((item) => item.id);
    },
    async loadCompareIedOptions() {
      if (!this.isCompareMode) return;
      this.compareIedLoading = true;
      try {
        const response = await getAllActiveIeds();
        this.allCompareIeds = this.normalizeIedList(response);
      } catch (error) {
        this.allCompareIeds = [];
        this.$notifyApiError?.(error, "Failed to load IED list");
      } finally {
        this.compareIedLoading = false;
      }
    },
    handleAddCompareIed() {
      const selectedId = String(this.selectedCompareIedId || "");
      if (!selectedId) return;

      const selected = this.allCompareIeds.find((item) => String(item.id) === selectedId);
      this.selectedCompareIedId = "";
      if (!selected) return;

      const existingIds = new Set(this.activeIedEntries.map((item) => String(item.id)));
      if (existingIds.has(String(selected.id))) return;

      this.internalCompareIeds = [...this.activeIedEntries, selected];
      this.fetchCurve();
    },
    normalizeText(value) {
      return String(value || "").trim().toLowerCase();
    },
    formatNumber(value) {
      const number = Number(value);
      if (!Number.isFinite(number)) return "";
      if (number >= 1000) return number.toFixed(0);
      if (number >= 100) return number.toFixed(1);
      if (number >= 10) return number.toFixed(2).replace(/\.00$/, "");
      if (number >= 1) return number.toFixed(2).replace(/\.00$/, "");
      return Number(number.toFixed(3)).toString();
    },
    getLog(value) {
      return Math.log10(Math.max(Number(value), Number.MIN_VALUE));
    },
    isDefiniteTime(level) {
      return String(level?.characteristic || "").toLowerCase().includes("definite");
    },
    normalizePoint(point) {
      return {
        x: Number(point?.current ?? point?.i),
        y: Number(point?.time ?? point?.t),
      };
    },
    getRawLevelPoints(level) {
      return Array.isArray(level?.points)
        ? level.points
          .map((point) => this.normalizePoint(point))
          .filter((point) => Number.isFinite(point.x) && point.x > 0 && Number.isFinite(point.y) && point.y > 0)
          .sort((a, b) => a.x - b.x)
        : [];
    },
    buildLevelPoints(level) {
      const rawPoints = this.getRawLevelPoints(level);
      const startValue = Number(level?.startValue);
      const delayTime = Number(level?.delayTime);

      if (this.isDefiniteTime(level) && Number.isFinite(startValue) && startValue > 0 && Number.isFinite(delayTime) && delayTime > 0) {
        const maxCurrent = Math.max(startValue, ...rawPoints.map((point) => point.x), startValue * 10);
        return [
          { x: startValue, y: delayTime },
          { x: maxCurrent, y: delayTime },
        ];
      }

      return rawPoints;
    },
    getLevelStart(plottedLevel) {
      const startValue = Number(plottedLevel?.level?.startValue);
      if (Number.isFinite(startValue) && startValue > 0) return startValue;
      return plottedLevel?.points?.[0]?.x || null;
    },
    pushCurvePoint(points, point) {
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x <= 0 || point.y <= 0) return;

      const prev = points[points.length - 1];
      if (prev && Math.abs(prev.x - point.x) < 1e-9 && Math.abs(prev.y - point.y) < 1e-9) return;
      points.push(point);
    },
    buildStitchedPoints(levels) {
      const sorted = [...levels]
        .filter((item) => Array.isArray(item.points) && item.points.length)
        .sort((a, b) => (this.getLevelStart(a) || 0) - (this.getLevelStart(b) || 0));

      const stitched = [];
      sorted.forEach((item, index) => {
        const currentPoints = item.points;
        const next = sorted[index + 1] || null;
        const nextStart = next ? this.getLevelStart(next) : null;
        const firstX = currentPoints[0].x;
        const lastX = currentPoints[currentPoints.length - 1].x;
        const start = Math.max(this.getLevelStart(item) || firstX, firstX);
        const end = Number.isFinite(nextStart) && nextStart > 0
          ? Math.min(nextStart, lastX)
          : lastX;

        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return;

        this.pushCurvePoint(stitched, { x: start, y: this.getTimeAtCurrent(item, start) });
        currentPoints
          .filter((point) => point.x > start && point.x < end)
          .forEach((point) => this.pushCurvePoint(stitched, point));
        this.pushCurvePoint(stitched, { x: end, y: this.getTimeAtCurrent(item, end) });

        if (next && Number.isFinite(nextStart) && nextStart > 0) {
          const nextTime = this.getTimeAtCurrent(next, nextStart);
          this.pushCurvePoint(stitched, { x: nextStart, y: nextTime });
        }
      });

      return stitched;
    },
    getLogBounds(values) {
      const valid = values.filter((value) => Number.isFinite(value) && value > 0);
      if (!valid.length) return { min: 0.1, max: 10 };

      let min = Math.min(...valid);
      let max = Math.max(...valid);
      if (min === max) {
        min = min / 10;
        max = max * 10;
      }

      const minLog = Math.floor(this.getLog(min));
      const maxLog = Math.ceil(this.getLog(max));
      return { min: 10 ** minLog, max: 10 ** maxLog };
    },
    getLogTicks(min, max) {
      const ticks = [];
      const startPower = Math.floor(this.getLog(min));
      const endPower = Math.ceil(this.getLog(max));
      for (let power = startPower; power <= endPower; power += 1) {
        [1, 2, 5].forEach((factor) => {
          const value = factor * 10 ** power;
          if (value >= min && value <= max) ticks.push(value);
        });
      }
      return ticks;
    },
    mapX(value) {
      const minLog = this.getLog(this.xBounds.min);
      const maxLog = this.getLog(this.xBounds.max);
      const ratio = (this.getLog(value) - minLog) / (maxLog - minLog || 1);
      return this.plotArea.left + ratio * this.plotArea.width;
    },
    mapY(value) {
      const minLog = this.getLog(this.yBounds.min);
      const maxLog = this.getLog(this.yBounds.max);
      const ratio = (this.getLog(value) - minLog) / (maxLog - minLog || 1);
      return this.plotArea.bottom - ratio * this.plotArea.height;
    },
    domainXFromSvg(svgX) {
      const ratio = (svgX - this.plotArea.left) / this.plotArea.width;
      const minLog = this.getLog(this.xBounds.min);
      const maxLog = this.getLog(this.xBounds.max);
      return 10 ** (minLog + ratio * (maxLog - minLog));
    },
    domainYFromSvg(svgY) {
      const ratio = (this.plotArea.bottom - svgY) / this.plotArea.height;
      const minLog = this.getLog(this.yBounds.min);
      const maxLog = this.getLog(this.yBounds.max);
      return 10 ** (minLog + ratio * (maxLog - minLog));
    },
    getSvgEventPoint(event) {
      const svg = this.$refs.svgRef || event.currentTarget;
      if (!svg || typeof svg.getBoundingClientRect !== "function") return null;

      const svgRect = svg.getBoundingClientRect();
      if (!svg.parentElement) return null;
      const wrapRect = svg.parentElement.getBoundingClientRect();
      const svgX = ((event.clientX - svgRect.left) / svgRect.width) * this.chartSize.width;
      const svgY = ((event.clientY - svgRect.top) / svgRect.height) * this.chartSize.height;

      return {
        svgX,
        svgY,
        wrapX: event.clientX - wrapRect.left,
        wrapY: event.clientY - wrapRect.top,
      };
    },
    resetZoom() {
      this.zoomBounds = null;
    },
    zoomLogBounds(bounds, anchor, factor) {
      const minLog = this.getLog(bounds.min);
      const maxLog = this.getLog(bounds.max);
      const anchorLog = this.getLog(anchor);
      let nextMinLog = anchorLog - (anchorLog - minLog) * factor;
      let nextMaxLog = anchorLog + (maxLog - anchorLog) * factor;
      const minSpan = 0.02;
      const maxSpan = 18;

      if (nextMaxLog - nextMinLog < minSpan) {
        return bounds;
      }
      if (nextMaxLog - nextMinLog > maxSpan) {
        const center = (nextMinLog + nextMaxLog) / 2;
        nextMinLog = center - maxSpan / 2;
        nextMaxLog = center + maxSpan / 2;
      }

      return {
        min: 10 ** nextMinLog,
        max: 10 ** nextMaxLog,
      };
    },
    shiftLogBounds(bounds, deltaLog) {
      const minLog = this.getLog(bounds.min);
      const maxLog = this.getLog(bounds.max);
      const nextMinLog = minLog + deltaLog;
      const nextMaxLog = maxLog + deltaLog;

      return {
        min: 10 ** nextMinLog,
        max: 10 ** nextMaxLog,
      };
    },
    handleChartWheel(event) {
      if (!this.hasCurveData) return;
      const point = this.getSvgEventPoint(event);
      if (!point || !this.isInPlotArea(point.svgX, point.svgY)) return;

      const anchorX = this.domainXFromSvg(point.svgX);
      const anchorY = this.domainYFromSvg(point.svgY);
      const factor = event.deltaY < 0 ? 0.82 : 1.22;
      const nextX = this.zoomLogBounds(this.xBounds, anchorX, factor);
      const nextY = this.zoomLogBounds(this.yBounds, anchorY, factor);

      this.zoomBounds = { xMin: nextX.min, xMax: nextX.max, yMin: nextY.min, yMax: nextY.max };

      this.hoverCoord = { current: anchorX, time: anchorY };
      this.hoverPos = { x: point.wrapX, y: point.wrapY };
      this.hoverPoint = this.findNearestCurvePoint(point.svgX, point.svgY);
    },
    isInPlotArea(svgX, svgY) {
      return svgX >= this.plotArea.left &&
        svgX <= this.plotArea.right &&
        svgY >= this.plotArea.top &&
        svgY <= this.plotArea.bottom;
    },
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    formatInputNumber(value) {
      const number = Number(value);
      if (!Number.isFinite(number)) return "";
      return Number(number.toPrecision(6)).toString();
    },
    setCursorFromSvgX(svgX) {
      const clampedX = this.clamp(svgX, this.plotArea.left, this.plotArea.right);
      this.currentText = this.formatInputNumber(this.domainXFromSvg(clampedX));
    },
    handleChartMouseMove(event) {
      const point = this.getSvgEventPoint(event);
      if (!point) return;
      const { svgX, svgY, wrapX, wrapY } = point;

      if (this.isPanningChart) {
        this.panChart(event);
      }

      if (!this.isInPlotArea(svgX, svgY)) {
        this.clearHoverCoord();
        return;
      }

      this.hoverCoord = {
        current: this.domainXFromSvg(svgX),
        time: this.domainYFromSvg(svgY),
      };
      this.hoverPoint = this.findNearestCurvePoint(svgX, svgY);
      this.hoverPos = {
        x: wrapX,
        y: wrapY,
      };
    },
    handleChartMouseDown(event) {
      const point = this.getSvgEventPoint(event);
      if (!point || !this.isInPlotArea(point.svgX, point.svgY)) return;

      this.startChartPan(event);
    },
    handleChartClick(event) {
      if (this.suppressNextClick) {
        this.suppressNextClick = false;
        return;
      }
      const point = this.getSvgEventPoint(event);
      if (!point || !this.isInPlotArea(point.svgX, point.svgY)) return;

      this.setCursorFromSvgX(point.svgX);
    },
    startChartPan(event) {
      if (!this.hasCurveData) return;
      this.isPanningChart = true;
      this.panMoved = false;
      this.panStartClient = { x: event.clientX, y: event.clientY };
      this.panStartBounds = {
        xMin: this.xBounds.min,
        xMax: this.xBounds.max,
        yMin: this.yBounds.min,
        yMax: this.yBounds.max,
      };
      document.removeEventListener("mousemove", this.handleDocumentPanMove);
      document.removeEventListener("mouseup", this.stopChartPan);
      document.addEventListener("mousemove", this.handleDocumentPanMove);
      document.addEventListener("mouseup", this.stopChartPan);
    },
    handleDocumentPanMove(event) {
      this.panChart(event);
    },
    panChart(event) {
      if (!this.isPanningChart || !this.panStartBounds) return;
      const svg = this.$refs.svgRef;
      if (!svg || typeof svg.getBoundingClientRect !== "function") return;

      const svgRect = svg.getBoundingClientRect();
      const dx = event.clientX - this.panStartClient.x;
      const dy = event.clientY - this.panStartClient.y;
      if (Math.hypot(dx, dy) > 3) {
        this.panMoved = true;
        this.suppressNextClick = true;
      }

      const plotPixelWidth = svgRect.width * (this.plotArea.width / this.chartSize.width);
      const plotPixelHeight = svgRect.height * (this.plotArea.height / this.chartSize.height);
      if (!plotPixelWidth || !plotPixelHeight) return;

      const startX = { min: this.panStartBounds.xMin, max: this.panStartBounds.xMax };
      const startY = { min: this.panStartBounds.yMin, max: this.panStartBounds.yMax };
      const xSpanLog = this.getLog(startX.max) - this.getLog(startX.min);
      const ySpanLog = this.getLog(startY.max) - this.getLog(startY.min);
      const nextX = this.shiftLogBounds(startX, -(dx / plotPixelWidth) * xSpanLog);
      const nextY = this.shiftLogBounds(startY, (dy / plotPixelHeight) * ySpanLog);

      this.zoomBounds = { xMin: nextX.min, xMax: nextX.max, yMin: nextY.min, yMax: nextY.max };

      const point = this.getSvgEventPoint(event);
      if (point && this.isInPlotArea(point.svgX, point.svgY)) {
        this.hoverCoord = {
          current: this.domainXFromSvg(point.svgX),
          time: this.domainYFromSvg(point.svgY),
        };
        this.hoverPos = { x: point.wrapX, y: point.wrapY };
      }
    },
    stopChartPan() {
      this.isPanningChart = false;
      this.panStartBounds = null;
      document.removeEventListener("mousemove", this.handleDocumentPanMove);
      document.removeEventListener("mouseup", this.stopChartPan);
    },
    clearHoverCoord() {
      this.hoverCoord = null;
      this.hoverPoint = null;
    },
    getTimeAtCurrent(plottedLevel, current) {
      const level = plottedLevel?.level || {};
      const startValue = Number(level?.startValue);
      const delayTime = Number(level?.delayTime);

      if (this.isDefiniteTime(level) && Number.isFinite(startValue) && current >= startValue && Number.isFinite(delayTime) && delayTime > 0) {
        return delayTime;
      }

      const points = Array.isArray(plottedLevel?.points) ? plottedLevel.points : [];
      if (!points.length || current < points[0].x || current > points[points.length - 1].x) return null;

      for (let i = 0; i < points.length - 1; i += 1) {
        const left = points[i];
        const right = points[i + 1];
        if (current < left.x || current > right.x) continue;
        if (left.x === right.x) return left.y;

        const currentLog = this.getLog(current);
        const leftXLog = this.getLog(left.x);
        const rightXLog = this.getLog(right.x);
        const ratio = (currentLog - leftXLog) / (rightXLog - leftXLog || 1);
        const timeLog = this.getLog(left.y) + ratio * (this.getLog(right.y) - this.getLog(left.y));
        return 10 ** timeLog;
      }

      return null;
    },
    getTimeOnPoints(points, current) {
      if (!Array.isArray(points) || !points.length || current < points[0].x || current > points[points.length - 1].x) return null;

      for (let i = 0; i < points.length - 1; i += 1) {
        const left = points[i];
        const right = points[i + 1];
        if (left.x === right.x && Math.abs(current - left.x) < 1e-9) return right.y;
      }

      for (let i = 0; i < points.length - 1; i += 1) {
        const left = points[i];
        const right = points[i + 1];
        if (current < left.x || current > right.x) continue;
        if (left.x === right.x) return right.y;

        const currentLog = this.getLog(current);
        const leftXLog = this.getLog(left.x);
        const rightXLog = this.getLog(right.x);
        const ratio = (currentLog - leftXLog) / (rightXLog - leftXLog || 1);
        const timeLog = this.getLog(left.y) + ratio * (this.getLog(right.y) - this.getLog(left.y));
        return 10 ** timeLog;
      }

      return null;
    },
    getCompositeTimeAtCurrent(levels, current, options = {}) {
      let best = null;
      const ignoredDtStart = Number(options.ignoreDtStart);

      levels.forEach((item) => {
        const level = item?.level || {};
        const startValue = Number(level?.startValue);
        if (
          Number.isFinite(ignoredDtStart) &&
          this.isDefiniteTime(level) &&
          Number.isFinite(startValue) &&
          Math.abs(startValue - ignoredDtStart) < 1e-9
        ) {
          return;
        }

        const time = this.getTimeAtCurrent(item, current);
        if (!Number.isFinite(time) || time <= 0) return;
        if (!best || time < best.time) best = { time, level: item };
      });

      return best;
    },
    buildCompositePoints(levels) {
      const sourceCurrents = levels.flatMap((item) => item.points.map((point) => point.x));
      const validCurrents = sourceCurrents.filter((value) => Number.isFinite(value) && value > 0);
      if (!validCurrents.length) return [];

      const min = Math.min(...validCurrents);
      const max = Math.max(...validCurrents);
      const minLog = this.getLog(min);
      const maxLog = this.getLog(max);
      const currentSet = new Set(validCurrents.map((value) => Number(value.toPrecision(12))));
      const dtStarts = [];

      levels.forEach((item) => {
        const startValue = Number(item?.level?.startValue);
        if (this.isDefiniteTime(item?.level) && Number.isFinite(startValue) && startValue > 0) {
          currentSet.add(Number(startValue.toPrecision(12)));
          dtStarts.push(startValue);
        }
      });

      for (let i = 0; i <= 160; i += 1) {
        const ratio = i / 160;
        currentSet.add(Number((10 ** (minLog + ratio * (maxLog - minLog))).toPrecision(12)));
      }

      const currents = Array.from(currentSet)
        .filter((value) => value >= min && value <= max)
        .sort((a, b) => a - b);

      const points = [];
      currents.forEach((current) => {
        const matchingDtStart = dtStarts.find((value) => Math.abs(value - current) < 1e-9);
        if (matchingDtStart != null) {
          const before = this.getCompositeTimeAtCurrent(levels, current, { ignoreDtStart: matchingDtStart });
          const after = this.getCompositeTimeAtCurrent(levels, current);
          if (before && after && after.time < before.time) {
            points.push({ x: current, y: before.time });
          }
          if (after) points.push({ x: current, y: after.time });
          return;
        }

        const best = this.getCompositeTimeAtCurrent(levels, current);
        if (best) points.push({ x: current, y: best.time });
      });

      return points;
    },
    findNearestCurvePoint(svgX, svgY) {
      let nearest = null;
      let nearestDistance = Infinity;

      this.domainCurves.forEach((curve) => {
        curve.points.forEach((point) => {
          const x = this.mapX(point.x);
          const y = this.mapY(point.y);
          const distance = Math.hypot(svgX - x, svgY - y);

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = { x, y, current: point.x, time: point.y };
          }
        });
      });

      if (!nearest || nearestDistance > 14) return null;

      const labelWidth = 128;
      const labelX = Math.min(
        Math.max(nearest.x + 12, this.plotArea.left + 4),
        this.plotArea.right - labelWidth - 4
      );
      const labelY = Math.min(
        Math.max(nearest.y - 12, this.plotArea.top + 22),
        this.plotArea.bottom - 22
      );

      return { ...nearest, labelX, labelY, labelWidth };
    },
    buildTypeOptions(types) {
      const existing = new Map(this.typeOptions.map((item) => [item.value, item]));
      (Array.isArray(types) ? types : []).forEach((item) => {
        const value = item?.name || item?.type || "";
        if (!value || existing.has(value)) return;

        const label = item?.name && item?.type
          ? `${item.name} (${item.type})`
          : value;
        existing.set(value, { value, label });
      });
      this.typeOptions = Array.from(existing.values());
    },
    selectDefaultType() {
      if (this.selectedType || !this.typeOptions.length) return;

      const neutralOption = this.typeOptions.find((option) => option.value === DEFAULT_TYPE)
        || this.typeOptions.find((option) => /neutral/i.test(option.label || option.value || ""));
      this.selectedType = neutralOption?.value || this.typeOptions[0].value;
    },
    parseCurrentForRequest() {
      const raw = String(this.currentText || "").replace(",", ".").trim();
      if (!raw) return null;

      const value = Number(raw);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Current must be a positive number");
      }
      return value;
    },
    handleTypeChange() {
      this.fetchCurve();
    },
    toggleDisplayMode() {
      if (this.loading) return;

      this.displayMode = this.nextDisplayMode;
      this.currentText = "";
      this.fetchCurve();
    },
    async fetchCurve() {
      const iedEntries = this.activeIedEntries;
      if (!iedEntries.length) {
        this.errorMessage = "Cannot determine IED id";
        return;
      }

      let current = null;
      try {
        current = this.parseCurrentForRequest();
      } catch (error) {
        this.errorMessage = error.message;
        return;
      }

      const requestId = this.requestId + 1;
      this.requestId = requestId;
      this.loading = true;
      this.errorMessage = "";

      try {
        const responses = await Promise.all(
          iedEntries.map(async (ied) => {
            const data = await getPointsOvercurrent({
              iedId: ied.id,
              group: 1,
              type: this.selectedType,
              current,
              displayMode: this.normalizedDisplayMode,
            });
            return { ...ied, payload: data || null };
          })
        );

        if (this.requestId !== requestId) return;
        this.comparePayloads = this.isCompareMode ? responses : [];
        this.payload = responses[0]?.payload || null;
        if (this.payload?.displayMode) {
          this.displayMode = this.payload.displayMode;
        }
        responses.forEach((item) => this.buildTypeOptions(item.payload?.types));
        this.selectDefaultType();
        this.resetZoom();
      } catch (error) {
        if (this.requestId === requestId) {
          this.payload = null;
          this.errorMessage = this.$apiErrorMessage?.(error, "Failed to load overcurrent curve") || "Failed to load overcurrent curve";
        }
      } finally {
        if (this.requestId === requestId) {
          this.loading = false;
        }
      }
    },
  },
  beforeUnmount() {
    this.stopChartPan();
  },
};
</script>

<style scoped>
.overcurrent-dialog {
  min-height: 620px;
}

.curve-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px;
  padding: 12px;
  margin-bottom: 10px;
  background: #f6f8fb;
  border: 1px solid #e1e6ef;
  border-radius: 8px;
}

.curve-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 220px;
}

.group-field {
  min-width: 70px;
}

.mode-field {
  min-width: 104px;
}

.current-field {
  min-width: 170px;
}

.curve-label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.group-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 48px;
  border-radius: 6px;
  background: #e8f0fe;
  color: #1d4ed8;
  font-weight: 700;
}

.mode-toggle-btn {
  height: 32px;
  min-width: 96px;
  border: 1px solid #2563eb;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  cursor: pointer;
}

.mode-toggle-btn:disabled {
  border-color: #cbd5e1;
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.curve-select,
.curve-input {
  height: 32px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0 10px;
  font-size: 13px;
  background: #fff;
}

.curve-load-btn {
  height: 32px;
  min-width: 96px;
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.curve-load-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.curve-error {
  margin-bottom: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

.curve-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
}

.curve-chart-wrap {
  position: relative;
  height: 540px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.curve-svg {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
}

.curve-svg.is-panning {
  cursor: grabbing;
}

.plot-bg {
  fill: #fff;
}

.grid-line {
  stroke: rgba(148, 163, 184, 0.35);
  stroke-width: 1;
}

.axis-line {
  stroke: #111827;
  stroke-width: 1.2;
}

.axis-tick {
  fill: #334155;
  font-size: 11px;
}

.axis-label {
  fill: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.cursor-line {
  stroke: #111827;
  stroke-width: 1.2;
  stroke-dasharray: 7 5;
}

.cursor-label {
  fill: #111827;
  font-size: 12px;
  font-weight: 700;
}

.cursor-readout-title {
  fill: #111827;
  font-size: 12px;
  font-weight: 800;
}

.cursor-readout-row {
  fill: #dc2626;
  font-size: 12px;
  font-weight: 700;
}

.hover-point-marker {
  fill: #dc2626;
  stroke: #fff;
  stroke-width: 2;
}

.hover-point-bg {
  fill: rgba(255, 255, 255, 0.96);
  stroke: #dc2626;
  stroke-width: 1;
}

.hover-point-text {
  fill: #dc2626;
  font-size: 12px;
  font-weight: 700;
}

.curve-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 10px;
  color: #334155;
  font-size: 12px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.coord-tooltip {
  position: absolute;
  z-index: 2;
  min-width: 118px;
  padding: 7px 9px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  color: #0f172a;
  font-size: 12px;
  line-height: 1.45;
  pointer-events: none;
}

.zoom-reset-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.zoom-reset-btn:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.curve-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-style: italic;
}
</style>
