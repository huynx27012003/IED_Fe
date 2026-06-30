<template>
  <div class="topology-root">
    <div class="topo-toolbar">
      <div class="topo-title">
        <span class="topo-title-dot" />
        {{ $tUi('networkTopology') }}
        <span class="topo-count">{{ uniqueDevices.length }} devices · {{ totalLinks }} links</span>
      </div>

      <div class="topo-filters">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          class="filter-btn"
          :class="{ active: activeFilter === f.key }"
          @click="activeFilter = f.key"
        >
          <span class="filter-dot" :style="{ background: f.color }" />
          {{ f.label }}
        </button>
      </div>

      <div class="topo-route-actions">
        <button class="route-btn" @click="autoRouteAll" :title="$tUi('autoRouteAll')">{{ $tUi('autoRoute') }}</button>
        <button
          class="route-btn ghost"
          :disabled="!canResetAll"
          @click="resetAllLayout"
          :title="$tUi('resetTopology')"
        >
          {{ $tUi('resetAll') }}
        </button>
        <span v-if="routeActionStatus" class="route-status" :class="routeActionStatusType">
          {{ routeActionStatus }}
        </span>
      </div>

      <div class="topo-zoom-controls">
        <button class="zoom-btn" @click="resetZoom" :title="$tUi('resetZoom')">⤢</button>
        <button class="zoom-btn" @click="zoomIn" :title="$tUi('zoomIn')">+</button>
        <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
        <button class="zoom-btn" @click="zoomOut" :title="$tUi('zoomOut')">−</button>
      </div>
    </div>

    <div
      ref="canvasRef"
      class="topo-canvas"
      @wheel.prevent="handleWheel"
      @mousedown="startPanOrNodeDrag"
    >
        <svg
          :viewBox="currentViewBox"
          preserveAspectRatio="xMidYMid meet"
          class="topo-svg"
          :style="{
            cursor: isPanning || draggingNode || draggingRouteHandle ? 'grabbing' : 'grab'
          }"
        >
        <defs>
          <marker
            v-for="c in EDGE_COLORS"
            :key="'arr-' + c.key"
            :id="'arr-' + c.key"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M1 1.5L8.5 5L1 8.5"
              fill="none"
              :stroke="c.color"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </marker>

          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.10)" />
          </filter>
        </defs>

        <g class="edges-layer">
          <template v-for="edge in visibleEdges" :key="edge.id">
            <path
              :d="edge.hitPath"
              fill="none"
              stroke="transparent"
              stroke-width="18"
              class="edge-hitbox"
              @click.stop="onEdgeClick(edge)"
            />

            <path
              :d="edge.path"
              fill="none"
              :stroke="edge.color"
              :stroke-width="getEdgeStrokeWidth(edge)"
              :stroke-dasharray="edge.dasharray"
              :stroke-opacity="getEdgeStrokeOpacity(edge)"
              :class="{ 'link-animated': edge.animated, selected: selectedEdgeId === edge.id }"
              :marker-end="`url(#arr-${edge.colorKey})`"
              class="edge-path"
              @click.stop="onEdgeClick(edge)"
            />

            <path
              v-if="activeTraceEdgeId === edge.id"
              :d="edge.path"
              fill="none"
              stroke="#f97316"
              stroke-width="4.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="edge-trace-path"
            />

            <g v-if="activeTraceEdgeId === edge.id" :key="`trace-${edge.id}-${traceAnimationSeed}`" class="edge-trace-flow">
              <path d="M -7 -4 L 6 0 L -7 4 z" class="trace-arrow">
                <animateMotion
                  :dur="getTraceDuration(edge)"
                  repeatCount="indefinite"
                  rotate="auto"
                  :path="edge.path"
                />
              </path>
              <circle class="trace-packet" r="3.5">
                <animateMotion
                  :dur="getTraceDuration(edge)"
                  begin="0.55s"
                  repeatCount="indefinite"
                  :path="edge.path"
                />
              </circle>
              <circle class="trace-packet secondary" r="3">
                <animateMotion
                  :dur="getTraceDuration(edge)"
                  begin="1.1s"
                  repeatCount="indefinite"
                  :path="edge.path"
                />
              </circle>
            </g>

            <g
              v-if="edge.label && (!selectedDevice || edge.involves(selectedDevice))"
              class="edge-label-group"
              @click.stop="onEdgeClick(edge)"
            >
              <text
                :x="edge.labelX"
                :y="edge.labelY + 4"
                text-anchor="middle"
                class="edge-label"
                :fill="edge.color"
              >
                {{ edge.label }}
              </text>
            </g>

            <g v-if="selectedEdgeId === edge.id" class="route-handles">
              <template v-for="handle in edge.handles" :key="`${edge.id}-${handle.index}`">
                <circle
                  :cx="handle.x"
                  :cy="handle.y"
                  r="11"
                  fill="transparent"
                  class="route-handle-hit"
                  @mousedown.stop="startRouteHandleDrag($event, edge, handle)"
                />
                <circle
                  :cx="handle.x"
                  :cy="handle.y"
                  r="5"
                  fill="white"
                  :stroke="edge.color"
                  stroke-width="1.5"
                  class="route-handle-dot"
                  @mousedown.stop="startRouteHandleDrag($event, edge, handle)"
                />
              </template>
            </g>
          </template>
        </g>

        <g class="nodes-layer">
          <g
            v-for="node in layout"
            :key="node.id"
            :data-node-id="node.id"
            :transform="`translate(${node.cx}, ${node.cy})`"
            class="dev-node"
            :class="{
              hovered: selectedDevice === node.id,
              dimmed: selectedDevice && selectedDevice !== node.id,
              dragging: draggingNode === node.id
            }"
            :filter="selectedDevice === node.id ? 'url(#glow)' : 'url(#shadow)'"
            @click="onNodeClick(node)"
          >
            <rect
              :x="-NODE_W / 2"
              :y="-node.nodeH / 2"
              :width="NODE_W"
              :height="node.nodeH"
              rx="10"
              :fill="node.bgColor"
              :stroke="node.strokeColor"
              stroke-width="1.5"
              class="dev-body"
            />

            <rect
              :x="-NODE_W / 2"
              :y="-node.nodeH / 2"
              :width="NODE_W"
              :height="HEADER_H"
              rx="10"
              :fill="node.headerColor"
            />
            <rect
              :x="-NODE_W / 2"
              :y="-node.nodeH / 2 + HEADER_H - 10"
              :width="NODE_W"
              height="10"
              :fill="node.headerColor"
            />

            <rect
              :x="-NODE_W / 2 + 8"
              :y="-node.nodeH / 2 + 7"
              width="22"
              height="14"
              rx="3"
              fill="rgba(255,255,255,0.20)"
            />
            <text
              :x="-NODE_W / 2 + 19"
              :y="-node.nodeH / 2 + 17"
              text-anchor="middle"
              class="dev-glyph"
            >
              {{ node.glyph }}
            </text>

            <text :x="-NODE_W / 2 + 36" :y="-node.nodeH / 2 + 14" class="dev-name">
              {{ node.id }}
            </text>
            <text :x="-NODE_W / 2 + 36" :y="-node.nodeH / 2 + 24" class="dev-type">
              {{ node.type }}
            </text>

            <g
              v-for="(port, i) in node.ports"
              :key="port.mrid || `${node.id}-${i}`"
              @mouseenter="onPortHover(node, port, i)"
              @mouseleave="onPortLeave(node, port, i)"
              @dblclick.stop="onPortDoubleClick(node, port, i)"
            >
              <rect
                :x="-NODE_W / 2 + 2"
                :y="-node.nodeH / 2 + HEADER_H + i * PORT_H + 1"
                :width="NODE_W - 4"
                :height="PORT_H - 2"
                rx="6"
                class="port-hit-area"
                :class="{
                  hovered: isPortHovered(node, port, i),
                  traced: isPortTraced(node, port, i)
                }"
              />

              <line
                :x1="-NODE_W / 2 + 8"
                :y1="-node.nodeH / 2 + HEADER_H + i * PORT_H"
                :x2="NODE_W / 2 - 8"
                :y2="-node.nodeH / 2 + HEADER_H + i * PORT_H"
                stroke="#e2e8f0"
                stroke-width="0.5"
              />

              <circle
                :cx="-NODE_W / 2"
                :cy="-node.nodeH / 2 + HEADER_H + i * PORT_H + PORT_H / 2"
                r="5"
                :fill="portColor(port)"
                stroke="white"
                stroke-width="1.5"
                :class="{ 'port-dot-active': isPortHovered(node, port, i) || isPortTraced(node, port, i) }"
              />

              <circle
                :cx="NODE_W / 2"
                :cy="-node.nodeH / 2 + HEADER_H + i * PORT_H + PORT_H / 2"
                r="5"
                :fill="portColor(port)"
                stroke="white"
                stroke-width="1.5"
                :class="{ 'port-dot-active': isPortHovered(node, port, i) || isPortTraced(node, port, i) }"
              />

              <text
                :x="-NODE_W / 2 + 14"
                :y="-node.nodeH / 2 + HEADER_H + i * PORT_H + PORT_H / 2 + 4"
                class="port-name"
                :class="{ 'port-text-active': isPortHovered(node, port, i) || isPortTraced(node, port, i) }"
                :fill="normalizeFlag(port.operation) === 'On' ? '#1e293b' : '#94a3b8'"
              >
                {{ port.name }}
              </text>

              <text
                :x="NODE_W / 2 - 8"
                :y="-node.nodeH / 2 + HEADER_H + i * PORT_H + PORT_H / 2 + 4"
                text-anchor="end"
                class="port-ip"
                :class="{ 'port-text-active': isPortHovered(node, port, i) || isPortTraced(node, port, i) }"
              >
                {{ port.ipAddress }}
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>

    <div class="topo-legend">
      <div v-for="item in LEGEND" :key="item.label" class="legend-item">
        <svg width="28" height="10" style="flex-shrink: 0">
          <line
            x1="0"
            y1="5"
            x2="28"
            y2="5"
            :stroke="item.color"
            stroke-width="2"
            :stroke-dasharray="item.dash || ''"
          />
        </svg>
        {{ item.label }}
      </div>

      <div class="legend-sep" />

      <div v-for="dot in DOT_LEGEND" :key="dot.label" class="legend-item">
        <svg width="12" height="12" style="flex-shrink: 0">
          <circle cx="6" cy="6" r="5" :fill="dot.color" />
        </svg>
        {{ dot.label }}
      </div>
    </div>

    <NetworkTopologyDetailCard
      :detail-node="detailNode"
      :detail-edge="detailEdge"
      @close-node="closeDetail"
      @close-edge="closeEdgeDetail"
    />
  </div>
</template>

<script src="./NetworkTopology.script.js"></script>

<style scoped src="./NetworkTopology.style.css"></style>
