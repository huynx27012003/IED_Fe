<template>
  <el-dialog
    :model-value="modelValue"
    :title="$tUi('protectionZone')"
    width="920px"
    :close-on-click-modal="true"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div
      class="zone-diagram-wrap"
      ref="wrapRef"
      tabindex="0"
      @keydown="handleKeydown"
    >
      <div v-if="distanceFilters.length || groupFilters.length" class="diagram-filters" @click.stop>
        <div
          v-for="item in distanceFilters"
          :key="item.type"
          class="diagram-filter-chip"
        >
          <label class="diagram-filter-item">
            <input
              type="checkbox"
              :checked="selectedTypes.includes(item.type)"
              @change="toggleType(item.type)"
            />
            <span>{{ item.name }}</span>
          </label>

          <button
            class="diagram-filter-arrow"
            type="button"
            @click.stop="toggleLevelDropdown(item.type)"
            :aria-label="$tUi('selectLevels')"
            :title="$tUi('selectLevels')"
          >
            ▾
          </button>

          <div
            v-if="openLevelDropdownType === item.type"
            class="level-dropdown"
            @click.stop
          >
            <label
              v-for="lv in item.levels"
              :key="`${item.type}-${lv}`"
              class="level-option"
            >
              <input
                type="checkbox"
                :checked="isLevelSelected(item.type, lv)"
                @change="toggleLevelSelection(item.type, lv)"
              />
              <span>{{ $tUi('level', { n: lv }) }}</span>
            </label>
            <div v-if="!item.levels.length" class="level-empty">{{ $tUi('noLevels') }}</div>
          </div>
        </div>

        <div
          v-for="g in groupFilters"
          :key="g.group"
          class="diagram-filter-chip group-chip"
        >
          <label class="diagram-filter-item">
            <input
              type="checkbox"
              :checked="selectedGroups.includes(g.group)"
              @change="toggleGroup(g.group)"
            />
            <span>Group {{ g.group }}</span>
          </label>
        </div>
      </div>

      <svg
        v-if="!loading"
        ref="svgRef"
        class="zone-svg"
        :viewBox="currentViewBox"
        xmlns="http://www.w3.org/2000/svg"
        @click="clearSelection"
        @wheel.prevent="handleWheel"
        @mousedown="startPan"
        @mousemove="handleMouseMove"
        @mouseup="stopPan"
        @mouseleave="handleMouseLeave"
      >
        <line
          :x1="zoneGraph.origin.x"
          :y1="viewBounds.top - axisExtendPadding"
          :x2="zoneGraph.origin.x"
          :y2="viewBounds.bottom + axisExtendPadding"
          stroke="#4e87b7"
          stroke-width="3"
        />
        <line
          :x1="viewBounds.left - axisExtendPadding"
          :y1="zoneGraph.origin.y"
          :x2="viewBounds.right + axisExtendPadding"
          :y2="zoneGraph.origin.y"
          stroke="#4e87b7"
          stroke-width="3"
        />

        <g v-for="tick in rTicks" :key="`r-${tick}`">
          <line
            :x1="mapRToSvgX(tick)"
            :y1="zoneGraph.origin.y - 6"
            :x2="mapRToSvgX(tick)"
            :y2="zoneGraph.origin.y + 6"
            stroke="#4e87b7"
            stroke-width="1"
          />
          <text
            :x="mapRToSvgX(tick)"
            :y="zoneGraph.origin.y + 22"
            class="tick-label"
            text-anchor="middle"
          >
            {{ formatTick(tick) }}
          </text>
        </g>

        <g v-for="tick in xTicks" :key="`x-${tick}`">
          <line
            :x1="zoneGraph.origin.x - 6"
            :y1="mapXToSvgY(tick)"
            :x2="zoneGraph.origin.x + 6"
            :y2="mapXToSvgY(tick)"
            stroke="#4e87b7"
            stroke-width="1"
          />
          <text
            :x="zoneGraph.origin.x - 12"
            :y="mapXToSvgY(tick) + 4"
            class="tick-label"
            text-anchor="end"
          >
            {{ formatTick(tick) }}
          </text>
        </g>

        <text :x="zoneGraph.origin.x - 34" y="26" class="axis-label">X</text>
        <text :x="zoneGraph.width - 26" :y="zoneGraph.origin.y + 34" class="axis-label">R</text>

        <template v-for="(shape, idx) in plottedShapes" :key="shape.key || `shape-${idx}`">
          <polygon
            :points="shape.path"
            fill="none"
            :stroke="selectedShapeKey === shape.key || hoveredShapeKey === shape.key ? '#d6001c' : shape.color"
            :stroke-width="selectedShapeKey === shape.key || hoveredShapeKey === shape.key ? 3.2 : 2.6"
            :opacity="selectedShapeKey && selectedShapeKey !== shape.key ? 0.22 : 1"
            stroke-linejoin="round"
            stroke-linecap="round"
            @click.stop="selectShape(shape)"
            @mouseenter="onShapeEnter(shape, $event)"
            @mousemove="onShapeMove($event)"
            @mouseleave="onShapeLeave"
          />

          <template v-if="selectedShapeKey === shape.key">
            <g
              v-for="label in selectedShapeLabels"
              :key="`${shape.key || idx}-label-${label.index}`"
            >
              <line
                :x1="label.pointX"
                :y1="label.pointY"
                :x2="label.leaderX"
                :y2="label.leaderY"
                stroke="#6b7280"
                stroke-width="0.9"
                opacity="0.8"
              />
              <text
                :x="label.x"
                :y="label.y"
                :text-anchor="label.anchor"
                class="coord-text"
              >
                {{ label.text }}
              </text>
            </g>
          </template>
        </template>
      </svg>

      <div v-else class="diagram-loading">Loading diagram...</div>

      <div
        v-if="hoverCoord && !hoveredShapeLabel"
        class="hover-coord"
        :style="{ left: `${hoverPos.x + 12}px`, top: `${hoverPos.y + 12}px` }"
      >
        R: {{ hoverCoord.r }}, X: {{ hoverCoord.x }}
      </div>

      <div
        v-if="hoveredShapeLabel"
        class="shape-hover-badge"
      >
        {{ hoveredShapeLabel }}
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "Diagram",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Array,
      default: () => [
        { r: -2.4, x: 5.8 },
        { r: 8.6, x: 5.8 },
        { r: 4.8, x: 0 },
        { r: 4.8, x: -1.2 },
        { r: 0, x: 0 },
      ],
    },
    polygons: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      viewX: 0,
      viewY: 0,
      zoom: 1,
      minZoom: 0.01,
      maxZoom: 1000,
      isPanning: false,
      panStartClient: { x: 0, y: 0 },
      panStartView: { x: 0, y: 0 },
      hoverCoord: null,
      hoverPos: { x: 0, y: 0 },
      hoveredShapeKey: null,
      hoveredShapeLabel: "",
      shapeHoverPos: { x: 0, y: 0 },
      selectedShapeKey: null,
      axisExtendPadding: 20000,
      selectedTypes: [],
      selectedLevelsByType: {},
      openLevelDropdownType: null,
      selectedGroups: [],
    };
  },
  computed: {
    normalizedPolygons() {
      if (Array.isArray(this.polygons) && this.polygons.length) {
        return this.polygons
          .map((shape, idx) => {
            const rawPoints = Array.isArray(shape?.points) ? shape.points : [];
            const points = rawPoints
              .map((p) => ({
                r: Number(p?.r),
                x: Number(p?.x),
              }))
              .filter((p) => Number.isFinite(p.r) && Number.isFinite(p.x));

            const rawLevel = shape?.level;
            const normalizedLevel = rawLevel === null || rawLevel === undefined
              ? null
              : String(rawLevel).trim();

            return {
              key: shape?.key || `shape-${idx}`,
              color: shape?.color || "#c0001a",
              type: shape?.type || shape?.distanceType || "UNKNOWN",
              name: shape?.distanceName || shape?.name || shape?.type || "Distance",
              level: normalizedLevel === "" ? null : normalizedLevel,
              group: Number.isFinite(Number(shape?.group)) ? Number(shape?.group) : 0,
              points,
            };
          })
          .filter((s) => s.points.length >= 2);
      }

      const fallbackPoints = (Array.isArray(this.points) ? this.points : [])
        .map((p) => ({ r: Number(p?.r), x: Number(p?.x) }))
        .filter((p) => Number.isFinite(p.r) && Number.isFinite(p.x));

      return fallbackPoints.length
        ? [{ key: "default", color: "#c0001a", type: "DEFAULT", name: "Default", points: fallbackPoints }]
        : [];
    },
    distanceFilters() {
      const map = new Map();
      this.normalizedPolygons.forEach((p) => {
        if (!map.has(p.type)) {
          map.set(p.type, { type: p.type, name: p.name, levels: new Set() });
        }
        if (p.level !== null) {
          map.get(p.type).levels.add(p.level);
        }
      });
      return Array.from(map.values()).map((item) => ({
        type: item.type,
        name: item.name,
        levels: Array.from(item.levels).sort((a, b) => this.compareLevels(a, b)),
      }));
    },
    groupFilters() {
      const groups = new Set();
      this.normalizedPolygons.forEach((p) => {
        if (Number.isFinite(p.group)) {
          groups.add(p.group);
        }
      });
      return Array.from(groups).sort((a, b) => a - b).map((g) => ({ group: g }));
    },
    filteredPolygons() {
      if (!this.distanceFilters.length && !this.groupFilters.length) return this.normalizedPolygons;
      return this.normalizedPolygons.filter((p) => {
        if (this.distanceFilters.length) {
          if (!this.selectedTypes.length) return false;
          const typeSet = new Set(this.selectedTypes);
          if (!typeSet.has(p.type)) return false;
          const allowedLevels = this.selectedLevelsByType[p.type];
          if (Array.isArray(allowedLevels) && allowedLevels.length && !allowedLevels.includes(p.level)) return false;
        }
        if (this.groupFilters.length) {
          if (!this.selectedGroups.length) return false;
          if (!this.selectedGroups.includes(p.group)) return false;
        }
        return true;
      });
    },
    allPoints() {
      const merged = [];
      this.filteredPolygons.forEach((shape) => {
        merged.push(...shape.points);
      });
      return merged;
    },
    zoneGraph() {
      const width = 860;
      const height = 520;
      const margin = { top: 34, right: 44, bottom: 54, left: 44 };

      const source = this.allPoints.length
        ? this.allPoints
        : [
            { r: -2.4, x: 5.8 },
            { r: 8.6, x: 5.8 },
            { r: 4.8, x: 0 },
            { r: 4.8, x: -1.2 },
            { r: 0, x: 0 },
          ];

      const rs = source.map((p) => p.r);
      const xs = source.map((p) => p.x);

      const minR = Math.min(...rs, 0) - 1.8;
      const maxR = Math.max(...rs, 0) + 4.2;
      const minX = Math.min(...xs, 0) - 1.8;
      const maxX = Math.max(...xs, 0) + 1.8;

      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const spanR = Math.max(1, maxR - minR);
      const spanX = Math.max(1, maxX - minX);

      const mapPoint = (point) => {
        const x = margin.left + ((point.r - minR) / spanR) * innerW;
        const y = margin.top + ((maxX - point.x) / spanX) * innerH;
        return { x, y };
      };

      const origin = mapPoint({ r: 0, x: 0 });
      return {
        width,
        height,
        margin,
        minR,
        maxR,
        minX,
        maxX,
        origin,
      };
    },
    currentViewBox() {
      const w = this.zoneGraph.width / this.zoom;
      const h = this.zoneGraph.height / this.zoom;
      return `${this.viewX} ${this.viewY} ${w} ${h}`;
    },
    viewBounds() {
      const width = this.zoneGraph.width / this.zoom;
      const height = this.zoneGraph.height / this.zoom;
      return {
        left: this.viewX,
        right: this.viewX + width,
        top: this.viewY,
        bottom: this.viewY + height,
      };
    },
    plottedShapes() {
      const mapPoint = (point) => {
        const { minR, maxR, minX, maxX, margin, width, height } = this.zoneGraph;
        const innerW = width - margin.left - margin.right;
        const innerH = height - margin.top - margin.bottom;
        const spanR = Math.max(1, maxR - minR);
        const spanX = Math.max(1, maxX - minX);
        return {
          x: margin.left + ((point.r - minR) / spanR) * innerW,
          y: margin.top + ((maxX - point.x) / spanX) * innerH,
        };
      };

      return this.filteredPolygons.map((shape) => {
        const points = shape.points.map(mapPoint);
        return {
          key: shape.key,
          color: shape.color,
          name: shape.name,
          level: shape.level,
          rawPoints: shape.points,
          points,
          path: points.map((p) => `${p.x},${p.y}`).join(" "),
        };
      });
    },
    selectedShapeLabels() {
      if (!this.selectedShapeKey) return [];
      const shape = this.plottedShapes.find((item) => item.key === this.selectedShapeKey);
      if (!shape) return [];

      const placedRects = [];
      const boundsPadding = 8;
      const maxX = this.zoneGraph.width - boundsPadding;
      const minX = boundsPadding;
      const maxY = this.zoneGraph.height - boundsPadding;
      const minY = boundsPadding;
      const candidates = [
        { dx: 8, dy: -10, anchor: "start" },
        { dx: 8, dy: 14, anchor: "start" },
        { dx: -8, dy: -10, anchor: "end" },
        { dx: -8, dy: 14, anchor: "end" },
        { dx: 0, dy: -16, anchor: "middle" },
        { dx: 0, dy: 18, anchor: "middle" },
      ];

      const toRect = (x, y, width, anchor) => {
        let left = x;
        if (anchor === "end") left = x - width;
        if (anchor === "middle") left = x - width / 2;
        const top = y - 13;
        return {
          left,
          right: left + width,
          top,
          bottom: top + 15,
        };
      };

      const clampRect = (rect) => {
        const next = { ...rect };
        const width = next.right - next.left;
        const height = next.bottom - next.top;

        if (next.left < minX) {
          next.left = minX;
          next.right = minX + width;
        }
        if (next.right > maxX) {
          next.right = maxX;
          next.left = maxX - width;
        }
        if (next.top < minY) {
          next.top = minY;
          next.bottom = minY + height;
        }
        if (next.bottom > maxY) {
          next.bottom = maxY;
          next.top = maxY - height;
        }
        return next;
      };

      const intersects = (a, b) => {
        return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      };

      return shape.points.map((point, index) => {
        const raw = shape.rawPoints[index] || {};
        const text = `(${raw.r}, ${raw.x})`;
        const width = Math.max(32, text.length * 7.1 + 4);

        let chosen = null;
        for (const candidate of candidates) {
          const y = point.y + candidate.dy;
          const x = point.x + candidate.dx;
          let rect = toRect(x, y, width, candidate.anchor);
          rect = clampRect(rect);
          const overlapped = placedRects.some((r) => intersects(r, rect));
          if (!overlapped) {
            chosen = {
              x,
              y,
              anchor: candidate.anchor,
              rect,
            };
            break;
          }
        }

        if (!chosen) {
          const stackedY = Math.min(maxY - 2, Math.max(minY + 12, point.y - 12 + index * 14));
          let rect = toRect(point.x + 8, stackedY, width, "start");
          rect = clampRect(rect);
          chosen = {
            x: point.x + 8,
            y: stackedY,
            anchor: "start",
            rect,
          };
        }

        placedRects.push(chosen.rect);

        return {
          index,
          text,
          pointX: point.x,
          pointY: point.y,
          x: chosen.x,
          y: chosen.y,
          anchor: chosen.anchor,
          leaderX: chosen.anchor === "end"
            ? chosen.rect.right
            : chosen.anchor === "middle"
              ? (chosen.rect.left + chosen.rect.right) / 2
              : chosen.rect.left,
          leaderY: chosen.rect.top + 7,
        };
      });
    },
    rTicks() {
      const visibleMin = this.domainRFromSvgX(this.viewBounds.left);
      const visibleMax = this.domainRFromSvgX(this.viewBounds.right);
      const min = Math.ceil(Math.min(visibleMin, visibleMax));
      const max = Math.floor(Math.max(visibleMin, visibleMax));
      const step = this.calcTickStep(min, max);
      const ticks = [];
      for (let v = min; v <= max && ticks.length < 400; v += step) ticks.push(v);
      return ticks;
    },
    xTicks() {
      const visibleMin = this.domainXFromSvgY(this.viewBounds.bottom);
      const visibleMax = this.domainXFromSvgY(this.viewBounds.top);
      const min = Math.ceil(Math.min(visibleMin, visibleMax));
      const max = Math.floor(Math.max(visibleMin, visibleMax));
      const step = this.calcTickStep(min, max);
      const ticks = [];
      for (let v = min; v <= max && ticks.length < 400; v += step) ticks.push(v);
      return ticks;
    },
  },
  watch: {
    modelValue(next) {
      if (next) {
        this.resetViewport();
        window.addEventListener("keydown", this.handleKeydown);
        document.addEventListener("click", this.closeLevelDropdown);
        this.$nextTick(() => {
          this.$refs.wrapRef?.focus?.();
        });
      } else {
        window.removeEventListener("keydown", this.handleKeydown);
        document.removeEventListener("click", this.closeLevelDropdown);
        this.openLevelDropdownType = null;
      }
    },
    polygons: {
      immediate: true,
      handler() {
        this.selectedTypes = this.distanceFilters.map((x) => x.type);
        const levelMap = {};
        this.distanceFilters.forEach((item) => {
          levelMap[item.type] = [...item.levels];
        });
        this.selectedLevelsByType = levelMap;
        this.selectedGroups = this.groupFilters.map((x) => x.group);
      },
    },
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeydown);
    document.removeEventListener("click", this.closeLevelDropdown);
  },
  methods: {
    resetViewport() {
      this.zoom = 1;
      this.viewX = 0;
      this.viewY = 0;
      this.hoverCoord = null;
      this.hoveredShapeKey = null;
      this.hoveredShapeLabel = "";
      this.selectedShapeKey = null;
      this.isPanning = false;
    },
    getSvgCoord(event) {
      const svg = this.$refs.svgRef;
      if (!svg) return null;

      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;

      const vbWidth = this.zoneGraph.width / this.zoom;
      const vbHeight = this.zoneGraph.height / this.zoom;

      const ratioX = (event.clientX - rect.left) / rect.width;
      const ratioY = (event.clientY - rect.top) / rect.height;

      return {
        x: this.viewX + ratioX * vbWidth,
        y: this.viewY + ratioY * vbHeight,
        ratioX,
        ratioY,
      };
    },
    toDomainCoord(svgPoint) {
      const { minR, maxR, minX, maxX, margin, width, height } = this.zoneGraph;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const r = minR + ((svgPoint.x - margin.left) / innerW) * (maxR - minR);
      const x = maxX - ((svgPoint.y - margin.top) / innerH) * (maxX - minX);

      return {
        r: Number.isFinite(r) ? r.toFixed(3).replace(/\.000$/, "") : "-",
        x: Number.isFinite(x) ? x.toFixed(3).replace(/\.000$/, "") : "-",
      };
    },
    mapRToSvgX(rVal) {
      const { minR, maxR, margin, width } = this.zoneGraph;
      const innerW = width - margin.left - margin.right;
      return margin.left + ((rVal - minR) / (maxR - minR)) * innerW;
    },
    calcTickStep(min, max) {
      const span = Math.max(1, max - min);
      const targetTicks = 18;
      const raw = Math.ceil(span / targetTicks);
      return Math.max(1, raw);
    },
    formatTick(value) {
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    },
    domainRFromSvgX(svgX) {
      const { minR, maxR, margin, width } = this.zoneGraph;
      const innerW = width - margin.left - margin.right;
      return minR + ((svgX - margin.left) / innerW) * (maxR - minR);
    },
    mapXToSvgY(xVal) {
      const { minX, maxX, margin, height } = this.zoneGraph;
      const innerH = height - margin.top - margin.bottom;
      return margin.top + ((maxX - xVal) / (maxX - minX)) * innerH;
    },
    domainXFromSvgY(svgY) {
      const { minX, maxX, margin, height } = this.zoneGraph;
      const innerH = height - margin.top - margin.bottom;
      return maxX - ((svgY - margin.top) / innerH) * (maxX - minX);
    },
    handleMouseMove(event) {
      const svgPoint = this.getSvgCoord(event);
      if (!svgPoint) return;

      this.hoverCoord = this.toDomainCoord(svgPoint);

      const wrap = this.$refs.wrapRef;
      if (wrap) {
        const wrapRect = wrap.getBoundingClientRect();
        this.hoverPos = {
          x: event.clientX - wrapRect.left,
          y: event.clientY - wrapRect.top,
        };
      }

      if (!this.isPanning) return;

      const svg = this.$refs.svgRef;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const vbWidth = this.zoneGraph.width / this.zoom;
      const vbHeight = this.zoneGraph.height / this.zoom;

      const dxPx = event.clientX - this.panStartClient.x;
      const dyPx = event.clientY - this.panStartClient.y;

      this.viewX = this.panStartView.x - (dxPx / rect.width) * vbWidth;
      this.viewY = this.panStartView.y - (dyPx / rect.height) * vbHeight;
    },
    handleMouseLeave() {
      this.hoverCoord = null;
      this.onShapeLeave();
      this.stopPan();
    },
    startPan(event) {
      if (event.button !== 0) return;
      this.isPanning = true;
      this.panStartClient = { x: event.clientX, y: event.clientY };
      this.panStartView = { x: this.viewX, y: this.viewY };
    },
    stopPan() {
      this.isPanning = false;
    },
    handleWheel(event) {
      const point = this.getSvgCoord(event);
      if (!point) return;

      let nextZoom = event.deltaY < 0 ? this.zoom * 1.12 : this.zoom / 1.12;
      if (nextZoom < this.minZoom) nextZoom = this.minZoom;
      if (nextZoom > this.maxZoom) nextZoom = this.maxZoom;

      if (nextZoom === this.zoom) return;

      const nextVbWidth = this.zoneGraph.width / nextZoom;
      const nextVbHeight = this.zoneGraph.height / nextZoom;

      this.viewX = point.x - point.ratioX * nextVbWidth;
      this.viewY = point.y - point.ratioY * nextVbHeight;
      this.zoom = nextZoom;
    },
    resetViewToOrigin() {
      const viewWidth = this.zoneGraph.width / this.zoom;
      const viewHeight = this.zoneGraph.height / this.zoom;
      this.viewX = this.zoneGraph.origin.x - viewWidth / 2;
      this.viewY = this.zoneGraph.origin.y - viewHeight / 2;
    },
    handleKeydown(event) {
      const isBackspace = event.key === "Backspace";
      const isSpace = event.key === " " || event.code === "Space";
      if (!isBackspace && !isSpace) return;
      event.preventDefault();
      this.resetViewToOrigin();
    },
    toggleType(type) {
      if (!type) return;
      if (this.selectedTypes.includes(type)) {
        this.selectedTypes = this.selectedTypes.filter((x) => x !== type);
      } else {
        this.selectedTypes = [...this.selectedTypes, type];
      }
    },
    toggleGroup(group) {
      if (!Number.isFinite(group)) return;
      if (this.selectedGroups.includes(group)) {
        this.selectedGroups = this.selectedGroups.filter((g) => g !== group);
      } else {
        this.selectedGroups = [...this.selectedGroups, group];
      }
    },
    toggleLevelDropdown(type) {
      this.openLevelDropdownType = this.openLevelDropdownType === type ? null : type;
    },
    closeLevelDropdown() {
      this.openLevelDropdownType = null;
    },
    isLevelSelected(type, level) {
      const values = this.selectedLevelsByType[type] || [];
      return values.includes(level);
    },
    toggleLevelSelection(type, level) {
      const values = Array.isArray(this.selectedLevelsByType[type])
        ? [...this.selectedLevelsByType[type]]
        : [];

      if (values.includes(level)) {
        this.selectedLevelsByType = {
          ...this.selectedLevelsByType,
          [type]: values.filter((v) => v !== level),
        };
      } else {
        this.selectedLevelsByType = {
          ...this.selectedLevelsByType,
          [type]: [...values, level].sort((a, b) => this.compareLevels(a, b)),
        };
      }
    },
    compareLevels(a, b) {
      const aNum = Number(a);
      const bNum = Number(b);
      const aIsNum = Number.isFinite(aNum);
      const bIsNum = Number.isFinite(bNum);

      if (aIsNum && bIsNum) return aNum - bNum;
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      return String(a).localeCompare(String(b));
    },
    onShapeEnter(shape, event) {
      if (this.selectedShapeKey && this.selectedShapeKey !== shape?.key) return;
      this.hoveredShapeKey = shape?.key || null;
      this.hoveredShapeLabel = `${shape?.name || shape?.key || "Shape"} - Level ${shape?.level ?? "?"}`;
      this.onShapeMove(event);
    },
    onShapeMove(event) {
      const wrap = this.$refs.wrapRef;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      this.shapeHoverPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },
    onShapeLeave() {
      if (this.selectedShapeKey) return;
      this.hoveredShapeKey = null;
      this.hoveredShapeLabel = "";
    },
    selectShape(shape) {
      this.selectedShapeKey = shape?.key || null;
      this.hoveredShapeKey = shape?.key || null;
      this.hoveredShapeLabel = `${shape?.name || shape?.key || "Shape"} - Level ${shape?.level ?? "?"}`;
    },
    clearSelection() {
      this.selectedShapeKey = null;
      this.hoveredShapeKey = null;
      this.hoveredShapeLabel = "";
    },
  },
};
</script>

<style scoped>
.zone-diagram-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
  scrollbar-width: none;
  outline: none;
}

.diagram-filters {
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 4;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.diagram-filter-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(171, 198, 232, 0.7);
  font-size: 12px;
  color: #1f4a7f;
  font-weight: 600;
  user-select: none;
}

.diagram-filter-chip {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 28px;
  align-items: center;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(171, 198, 232, 0.7);
  border-radius: 8px;
  overflow: visible;
}

.diagram-filter-chip .diagram-filter-item {
  margin: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 6px 10px;
}

.diagram-filter-arrow {
  width: 28px;
  min-height: 30px;
  border: 0;
  border-left: 1px solid rgba(171, 198, 232, 0.7);
  background: rgba(255, 255, 255, 0.6);
  color: #1f4a7f;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.diagram-filter-arrow:hover {
  background: rgba(221, 236, 255, 0.7);
}

.level-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 130px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(171, 198, 232, 0.8);
  background: #fff;
  box-shadow: 0 8px 18px rgba(25, 49, 88, 0.18);
  z-index: 20;
}

.level-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #224f84;
  padding: 4px 0;
}

.level-empty {
  font-size: 12px;
  color: #6a7f97;
  padding: 2px 0;
}

.diagram-filter-chip.group-chip {
  grid-template-columns: 1fr;
}

.zone-diagram-wrap::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.zone-svg {
  width: 100%;
  min-width: 780px;
  height: auto;
  background: #ffffff;
  user-select: none;
  cursor: default;
}

.diagram-loading {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5b6f86;
  font-size: 14px;
  font-weight: 600;
  background: #ffffff;
}

.axis-label {
  font-size: 22px;
  font-weight: 500;
  fill: #101010;
}

.coord-text {
  font-size: 14px;
  fill: #222;
}

.tick-label {
  font-size: 11px;
  fill: #3b5f7f;
}

.hover-coord {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  background: rgba(18, 27, 40, 0.85);
  color: #fff;
  font-size: 12px;
  border-radius: 6px;
  padding: 4px 8px;
  white-space: nowrap;
}

.shape-hover-badge {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 5;
  pointer-events: none;
  background: rgba(31, 41, 55, 0.94);
  color: #fff;
  font-size: 11px;
  border-radius: 6px;
  padding: 4px 8px;
  width: max-content;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
