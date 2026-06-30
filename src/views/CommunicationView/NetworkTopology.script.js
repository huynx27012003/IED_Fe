import NetworkTopologyDetailCard from '@/views/common/NetworkTopologyDetailCard.vue'

const STORAGE_KEY = 'network-topology-node-positions-v4'
const EDGE_ROUTE_STORAGE_KEY = 'network-topology-edge-routes-v3'

export default {
  name: 'NetworkTopology',

  components: {
    NetworkTopologyDetailCard
  },

  props: {
    ieds: {
      type: Array,
      default() {
        return []
      }
    }
  },

  data() {
    return {
      activeFilter: 'all',
      selectedDevice: null,
      selectedEdgeId: null,
      detailNode: null,
      detailEdge: null,

      W: 920,
      NODE_W: 210,
      HEADER_H: 32,
      PORT_H: 26,
      EDGE_GAP: 42,

      viewX: 0,
      viewY: 0,
      zoom: 1,
      minZoom: 0.25,
      maxZoom: 5,

      isPanning: false,
      panStartClient: { x: 0, y: 0 },
      panStartView: { x: 0, y: 0 },

      nodePositions: {},
      draggingNode: null,
      dragStartClient: { x: 0, y: 0 },
      dragStartPos: { cx: 0, cy: 0 },
      hasDragged: false,

      edgeRoutes: {},
      draggingRouteHandle: null,
      dragStartRouteClient: { x: 0, y: 0 },
      dragStartRoutePoints: [],

      frozenCanvasBounds: null,
      dragAutoRouteLocks: {},
      dragEdgeRouteSnapshots: {},
      pendingNodePosition: null,
      nodeDragRafId: null,
      pendingRouteUpdate: null,
      routeDragRafId: null,
      hoveredPortRef: null,
      activeTraceEdgeId: null,
      traceAnimationSeed: 0,
      routeActionStatus: '',
      routeActionStatusType: 'info',
      routeActionStatusTimer: null,

      EDGE_COLORS: [
        { key: 'goose', color: '#0f766e' },
        { key: 'mms', color: '#2563eb' },
        { key: 'dnp3', color: '#7c3aed' },
        { key: 'https', color: '#0891b2' },
        { key: 'time', color: '#0d9488' },
        { key: 'mgmt', color: '#ea580c' },
        { key: 'prp', color: '#f0a020' },
        { key: 'off', color: '#94a3b8' },
        { key: 'other', color: '#64748b' }
      ],

      FILTERS: [
        { key: 'all', label: 'All', color: '#64748b' },
        { key: 'goose', label: 'GOOSE / SMV', color: '#0f766e' },
        { key: 'mms', label: 'MMS', color: '#2563eb' },
        { key: 'dnp3', label: 'DNP3', color: '#7c3aed' },
        { key: 'https', label: 'HTTPS', color: '#0891b2' },
        { key: 'time', label: 'SNTP / PTP', color: '#0d9488' },
        { key: 'mgmt', label: 'SNMP / FTP', color: '#ea580c' },
        { key: 'prp', label: 'PRP', color: '#f0a020' },
        { key: 'off', label: 'Off', color: '#94a3b8' }
      ],

      LEGEND: [
        { label: 'GOOSE / SMV', color: '#0f766e', dash: '' },
        { label: 'MMS', color: '#2563eb', dash: '6 3' },
        { label: 'DNP3', color: '#7c3aed', dash: '8 4' },
        { label: 'HTTPS', color: '#0891b2', dash: '2 2' },
        { label: 'SNMP / FTP', color: '#ea580c', dash: '10 3' },
        { label: 'SNTP / PTP', color: '#0d9488', dash: '4 2' },
        { label: 'PRP', color: '#f0a020', dash: '6 3' },
        { label: 'Port Off', color: '#94a3b8', dash: '3 3' }
      ],

      DOT_LEGEND: [
        { label: 'GOOSE / SMV port', color: '#0f766e' },
        { label: 'MMS / Control port', color: '#2563eb' },
        { label: 'Management / Time port', color: '#ea580c' },
        { label: 'Port Off', color: '#94a3b8' }
      ]
    }
  },

  computed: {
    uniqueDevices() {
      const arr = this.ieds
      if (!arr || !arr.length) return []

      const isRawFormat = arr[0] && Array.isArray(arr[0].communication)

      if (isRawFormat) {
        const seen = {}
        const result = []

        arr.forEach((item) => {
          const key = String(item.iedName ?? item.iedId ?? '')
          if (!seen[key]) {
            seen[key] = true
            result.push({
              ...item,
              communication: (item.communication || []).map((port) => ({
                ...port,
                destination: port.destination || port.networkSwitch1 || '',
                destinationId: port.destinationId
              }))
            })
          }
        })

        return result
      }

      const groups = {}
      const order = []

      arr.forEach((row) => {
        const key = String(row.iedName || row.name || '')

        if (!groups[key]) {
          groups[key] = {
            iedId: row.iedId,
            iedName: key,
            communication: []
          }
          order.push(key)
        }

        groups[key].communication.push({
          mrid: row.mrid,
          iedId: row.iedId,
          port: row.port,
          name: row.name,
          operation: row.operation,
          redundancy: row.redundancy,
          type: row.type,
          subNetwork: row.subnetwork || row.subNetwork,
          ipAddress: row.ipAddress,
          subnetMask: row.subnetMask,
          defaultGateway: row.defaultGateway,
          mms: row.mms,
          goose: row.goose,
          smv: row.smv,
          https: row.https,
          ftp: row.ftp,
          dnp3: row.dnp3,
          snmp: row.snmp,
          sntp: row.sntp,
          ptp: row.ptp,
          destination: row.destination || row.networkSwitch1 || '',
          destinationId: row.destinationId
        })
      })

      return order.map((k) => groups[k])
    },

    layout() {
      const devices = this.uniqueDevices
      if (!devices.length) return []

      const cols = devices.length === 1 ? 1 : devices.length === 2 ? 2 : 3
      const colW = this.W / (cols + 1)

      return devices.map((ied, i) => {
        const ports = ied.communication || []
        const nodeH = this.HEADER_H + ports.length * this.PORT_H + 8
        const cfg = this.deviceConfig(ied.iedName)

        const col = i % cols
        const row = Math.floor(i / cols)
        const defaultCx = colW * (col + 1)
        const defaultCy = 100 + nodeH / 2 + row * 260

        const key = ied.iedName
        const stored = this.nodePositions[key]

        return {
          id: ied.iedName,
          iedId: ied.iedId,
          cx: stored?.cx ?? defaultCx,
          cy: stored?.cy ?? defaultCy,
          ports,
          nodeH,
          type: cfg.type,
          glyph: cfg.glyph,
          headerColor: cfg.headerColor,
          bgColor: cfg.bgColor,
          strokeColor: cfg.strokeColor
        }
      })
    },

    computedCanvasBounds() {
      if (!this.layout.length) {
        return {
          minX: 0,
          minY: 0,
          maxX: this.W,
          maxY: 700,
          width: this.W,
          height: 700
        }
      }

      const padding = 220
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      this.layout.forEach((node) => {
        const left = node.cx - this.NODE_W / 2
        const right = node.cx + this.NODE_W / 2
        const top = node.cy - node.nodeH / 2
        const bottom = node.cy + node.nodeH / 2

        if (left < minX) minX = left
        if (right > maxX) maxX = right
        if (top < minY) minY = top
        if (bottom > maxY) maxY = bottom
      })

      this.edges.forEach((edge) => {
        if (edge.minX < minX) minX = edge.minX
        if (edge.maxX > maxX) maxX = edge.maxX
        if (edge.minY < minY) minY = edge.minY
        if (edge.maxY > maxY) maxY = edge.maxY
      })

      minX -= padding
      minY -= padding
      maxX += padding
      maxY += padding

      return {
        minX,
        minY,
        maxX,
        maxY,
        width: Math.max(1200, maxX - minX),
        height: Math.max(800, maxY - minY)
      }
    },

    canvasBounds() {
      return this.frozenCanvasBounds || this.computedCanvasBounds
    },

    canvasW() {
      return this.canvasBounds.width
    },

    canvasH() {
      return this.canvasBounds.height
    },

    edges() {
      const nodeMap = {}
      this.layout.forEach((n) => {
        nodeMap[String(n.id).trim().toLowerCase()] = n
      })

      const idNodeMap = {}
      this.layout.forEach((n) => {
        idNodeMap[String(n.iedId)] = n
      })

      const nodeRects = this.layout.map((node) => ({
        id: node.id,
        left: this.getNodeLeft(node),
        right: this.getNodeRight(node),
        top: node.cy - node.nodeH / 2,
        bottom: node.cy + node.nodeH / 2
      }))
      const shouldRunAdvancedRouting = !this.draggingNode && !this.draggingRouteHandle
      const routingGrid = shouldRunAdvancedRouting ? this.createRoutingGrid(nodeRects) : null
      const routeUsage = shouldRunAdvancedRouting ? this.createRouteUsageContext() : null

      const pairCounts = {}
      this.layout.forEach((srcNode) => {
        srcNode.ports.forEach((port) => {
          const dstNode = this.resolveDestinationNode(port, nodeMap, idNodeMap)
          if (!dstNode || dstNode.id === srcNode.id) return

          const edgeServices = this.getEdgeServices(port)
          if (!edgeServices.length) return

          const pairKey = `${srcNode.id}=>${dstNode.id}`
          pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1
        })
      })

      const pairUsed = {}
      const existingRoutes = []
      const result = []

      this.layout.forEach((srcNode) => {
        srcNode.ports.forEach((port, pi) => {
          const dstNode = this.resolveDestinationNode(port, nodeMap, idNodeMap)

          if (!dstNode || dstNode.id === srcNode.id) return

          const edgeServices = this.getEdgeServices(port)
          if (!edgeServices.length) return

          const edgeId = `${srcNode.id}-${port.mrid || pi}-${dstNode.id}`
          const dominant = this.getDominantService(edgeServices, port)

          const pairKey = `${srcNode.id}=>${dstNode.id}`
          const laneIndex = pairUsed[pairKey] || 0
          pairUsed[pairKey] = laneIndex + 1

          const laneOffset = this.getLaneOffset(laneIndex, pairCounts[pairKey] || 1)

          const dstPortIndex = this.getDestinationPortIndex(dstNode, port, srcNode, pi)
          const routeInfo = this.getResolvedRoute(edgeId, srcNode, pi, dstNode, dstPortIndex, {
            laneOffset,
            existingRoutes,
            nodeRects,
            routingGrid,
            routeUsage
          })
          const route = this.enforceEndpointOrthogonalRoute(routeInfo.route, routeInfo)

          if (routeUsage && routingGrid) {
            this.registerRouteUsage(route, routeUsage, routingGrid)
          }
          existingRoutes.push(route)

          const path = this.pointsToPath(route)
          const hitPath = path

          const labelText = `${port.name || port.port || 'Port'}`
          const labelW = labelText.length * 6.2 + 20
          const labelSegment = this.getLabelSegment(route)
          const labelX = (labelSegment.a.x + labelSegment.b.x) / 2
          const labelY = (labelSegment.a.y + labelSegment.b.y) / 2 - 10

          const handles = route
            .slice(1, route.length - 1)
            .map((p, idx) => ({
              index: idx + 1,
              x: p.x,
              y: p.y
            }))

          const xs = route.map((p) => p.x).concat([labelX - labelW / 2, labelX + labelW / 2])
          const ys = route.map((p) => p.y).concat([labelY - 12, labelY + 12])

          result.push({
            id: edgeId,
            srcId: srcNode.id,
            dstId: dstNode.id,
            srcPortIndex: pi,
            srcPortMrid: port.mrid || null,
            dstPortIndex,
            portName: port.name || port.port || 'Port',
            operation: this.normalizeFlag(port.operation),
            redundancy: port.redundancy || '',
            services: edgeServices,
            path,
            hitPath,
            route,
            handles,
            color: dominant.color,
            colorKey: dominant.filterKey,
            dasharray: this.edgeDashArray(port, dominant),
            animated: edgeServices.some((svc) => svc.key === 'goose' || svc.key === 'smv'),
            label: labelText,
            labelX,
            labelY,
            labelW,
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys),
            ipAddress: port.ipAddress || '',
            subNetwork: port.subNetwork || '',
            defaultGateway: port.defaultGateway || '',
            subnetMask: port.subnetMask || '',
            includesFilter: (filterKey) => {
              if (filterKey === 'all') return true
              if (filterKey === 'off') return this.normalizeFlag(port.operation) === 'Off'
              if (filterKey === 'prp') return this.hasRedundancy(port)
              return edgeServices.some((svc) => svc.filterKey === filterKey)
            },
            involves: (id) => id === srcNode.id || id === dstNode.id
          })
        })
      })

      return result
    },

    visibleEdges() {
      if (this.activeFilter === 'all') return this.edges
      return this.edges.filter((e) => e.includesFilter(this.activeFilter))
    },

    totalLinks() {
      return this.edges.length
    },

    hasSavedRoutes() {
      return Object.keys(this.edgeRoutes || {}).length > 0
    },

    hasSavedNodePositions() {
      return Object.keys(this.nodePositions || {}).length > 0
    },

    isViewportAtDefault() {
      const threshold = 0.5
      return (
        Math.abs(this.zoom - 1) < 0.001 &&
        Math.abs(this.viewX - this.canvasBounds.minX) < threshold &&
        Math.abs(this.viewY - this.canvasBounds.minY) < threshold
      )
    },

    canResetAll() {
      return this.hasSavedRoutes || this.hasSavedNodePositions || !this.isViewportAtDefault
    },

    currentViewBox() {
      const vbW = this.canvasW / this.zoom
      const vbH = this.canvasH / this.zoom
      return `${this.viewX} ${this.viewY} ${vbW} ${vbH}`
    }
  },

  watch: {
    ieds: {
      immediate: true,
      handler() {
        this.loadSavedPositions()
        this.loadSavedRoutes()
        this.dragAutoRouteLocks = {}
        this.dragEdgeRouteSnapshots = {}
        this.pendingNodePosition = null
        this.pendingRouteUpdate = null
        if (this.nodeDragRafId != null) {
          cancelAnimationFrame(this.nodeDragRafId)
          this.nodeDragRafId = null
        }
        if (this.routeDragRafId != null) {
          cancelAnimationFrame(this.routeDragRafId)
          this.routeDragRafId = null
        }
        this.hoveredPortRef = null
        this.activeTraceEdgeId = null
        this.$nextTick(() => {
          if (!this.draggingNode && !this.isPanning && !this.draggingRouteHandle) {
            this.resetViewportToContent()
          }
        })
      }
    },

    nodePositions: {
      deep: true,
      handler(val) {
        if (this.draggingNode) return
        this.persistNodePositions(val)
      }
    },

    edgeRoutes: {
      deep: true,
      handler(val) {
        if (this.draggingRouteHandle) return
        this.persistEdgeRoutes(val)
      }
    }
  },

  mounted() {
    document.addEventListener('mousemove', this.handleCanvasMouseMove)
    document.addEventListener('mouseup', this.handleCanvasMouseUp)

    this.loadSavedPositions()
    this.loadSavedRoutes()

    this.$nextTick(() => {
      this.resetViewportToContent()
    })
  },

  beforeUnmount() {
    document.removeEventListener('mousemove', this.handleCanvasMouseMove)
    document.removeEventListener('mouseup', this.handleCanvasMouseUp)
    this.clearRouteActionStatusTimer()

    if (this.nodeDragRafId != null) {
      cancelAnimationFrame(this.nodeDragRafId)
      this.nodeDragRafId = null
    }

    if (this.routeDragRafId != null) {
      cancelAnimationFrame(this.routeDragRafId)
      this.routeDragRafId = null
    }
  },

  methods: {
    cloneBounds(bounds) {
      return bounds
        ? {
            minX: bounds.minX,
            minY: bounds.minY,
            maxX: bounds.maxX,
            maxY: bounds.maxY,
            width: bounds.width,
            height: bounds.height
          }
        : null
    },

    freezeCanvasBounds() {
      if (!this.frozenCanvasBounds) {
        this.frozenCanvasBounds = this.cloneBounds(this.computedCanvasBounds)
      }
    },

    unfreezeCanvasBounds() {
      this.frozenCanvasBounds = null
    },

    loadSavedPositions() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        this.nodePositions = raw ? JSON.parse(raw) : {}
      } catch (err) {
        this.nodePositions = {}
      }
    },

    loadSavedRoutes() {
      try {
        const raw = localStorage.getItem(EDGE_ROUTE_STORAGE_KEY)
        this.edgeRoutes = raw ? JSON.parse(raw) : {}
      } catch (err) {
        this.edgeRoutes = {}
      }
    },

    persistNodePositions(val = this.nodePositions) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val || {}))
      } catch (err) {
        void err
      }
    },

    persistEdgeRoutes(val = this.edgeRoutes) {
      try {
        localStorage.setItem(EDGE_ROUTE_STORAGE_KEY, JSON.stringify(val || {}))
      } catch (err) {
        void err
      }
    },

    clearRouteActionStatusTimer() {
      if (this.routeActionStatusTimer != null) {
        clearTimeout(this.routeActionStatusTimer)
        this.routeActionStatusTimer = null
      }
    },

    setRouteActionStatus(text, type = 'info') {
      this.clearRouteActionStatusTimer()
      this.routeActionStatus = text
      this.routeActionStatusType = type
      this.routeActionStatusTimer = setTimeout(() => {
        this.routeActionStatus = ''
        this.routeActionStatusType = 'info'
        this.routeActionStatusTimer = null
      }, 3800)
    },

    cloneRoutePoints(points) {
      return (points || []).map((p) => ({ x: Number(p.x), y: Number(p.y) }))
    },

    areRoutePointsEqual(a, b) {
      if (!Array.isArray(a) || !Array.isArray(b)) return false
      if (a.length !== b.length) return false

      for (let i = 0; i < a.length; i++) {
        if (Number(a[i].x) !== Number(b[i].x) || Number(a[i].y) !== Number(b[i].y)) {
          return false
        }
      }

      return true
    },

    captureCurrentEdgeRoutes() {
      const snapshot = {}
      this.edges.forEach((edge) => {
        snapshot[edge.id] = this.cloneRoutePoints(edge.route)
      })
      return snapshot
    },

    captureDragRouteSnapshots(nodeId) {
      const targetId = String(nodeId || '')
      if (!targetId) {
        this.dragEdgeRouteSnapshots = {}
        return
      }

      const snapshots = {}
      this.edges.forEach((edge) => {
        if (edge.srcId === targetId || edge.dstId === targetId) return
        snapshots[edge.id] = {
          route: (edge.route || []).map((p) => ({ x: p.x, y: p.y }))
        }
      })

      this.dragEdgeRouteSnapshots = snapshots
    },

    captureRouteHandleSnapshots(activeEdgeId) {
      const targetEdgeId = String(activeEdgeId || '')
      if (!targetEdgeId) {
        this.dragEdgeRouteSnapshots = {}
        return
      }

      const snapshots = {}
      this.edges.forEach((edge) => {
        if (String(edge.id) === targetEdgeId) return
        snapshots[edge.id] = {
          route: (edge.route || []).map((p) => ({ x: p.x, y: p.y }))
        }
      })

      this.dragEdgeRouteSnapshots = snapshots
    },

    queueNodePositionUpdate(nodeId, cx, cy) {
      this.pendingNodePosition = { nodeId, cx, cy }

      if (this.nodeDragRafId != null) return

      this.nodeDragRafId = requestAnimationFrame(() => {
        this.nodeDragRafId = null
        this.flushPendingNodePosition()
      })
    },

    flushPendingNodePosition() {
      const pending = this.pendingNodePosition
      if (!pending) return

      this.pendingNodePosition = null

      this.nodePositions = {
        ...this.nodePositions,
        [pending.nodeId]: { cx: pending.cx, cy: pending.cy }
      }
    },

    queueRoutePointsUpdate(edgeId, points) {
      this.pendingRouteUpdate = {
        edgeId,
        points: (points || []).map((p) => ({ x: p.x, y: p.y }))
      }

      if (this.routeDragRafId != null) return

      this.routeDragRafId = requestAnimationFrame(() => {
        this.routeDragRafId = null
        this.flushPendingRouteUpdate()
      })
    },

    flushPendingRouteUpdate() {
      const pending = this.pendingRouteUpdate
      if (!pending || !pending.edgeId) return

      this.pendingRouteUpdate = null

      this.edgeRoutes = {
        ...this.edgeRoutes,
        [pending.edgeId]: {
          points: pending.points
        }
      }
    },

    autoRouteAll() {
      const beforeRoutes = this.captureCurrentEdgeRoutes()

      this.activeTraceEdgeId = null
      this.hoveredPortRef = null
      this.dragEdgeRouteSnapshots = {}
      this.pendingRouteUpdate = null
      if (this.routeDragRafId != null) {
        cancelAnimationFrame(this.routeDragRafId)
        this.routeDragRafId = null
      }

      this.edgeRoutes = {}

      this.$nextTick(() => {
        const snapshot = {}
        let changedCount = 0

        this.edges.forEach((edge) => {
          const points = this.cloneRoutePoints(edge.route)
          snapshot[edge.id] = {
            points
          }

          if (!this.areRoutePointsEqual(beforeRoutes[edge.id] || [], points)) {
            changedCount += 1
          }
        })

        this.edgeRoutes = snapshot

        const total = Object.keys(snapshot).length
        if (!total) {
          this.setRouteActionStatus('No links to auto route', 'warn')
          return
        }

        if (changedCount === 0) {
          this.setRouteActionStatus('Auto Route applied (no visible path change)', 'warn')
        } else {
          this.setRouteActionStatus(`Auto Route updated ${changedCount}/${total} links`, 'success')
        }
      })
    },

    resetAllLayout() {
      const hadSavedRoutes = this.hasSavedRoutes
      const hadSavedPositions = this.hasSavedNodePositions
      const hadCustomView = !this.isViewportAtDefault

      if (!hadSavedRoutes && !hadSavedPositions && !hadCustomView) {
        this.setRouteActionStatus('Topology is already at default', 'warn')
        return
      }

      this.edgeRoutes = {}
      this.nodePositions = {}
      this.activeTraceEdgeId = null
      this.hoveredPortRef = null
      this.dragAutoRouteLocks = {}
      this.dragEdgeRouteSnapshots = {}
      this.pendingRouteUpdate = null
      this.pendingNodePosition = null
      this.selectedDevice = null
      this.selectedEdgeId = null
      this.detailNode = null
      this.detailEdge = null
      this.draggingNode = null
      this.draggingRouteHandle = null
      this.isPanning = false

      if (this.routeDragRafId != null) {
        cancelAnimationFrame(this.routeDragRafId)
        this.routeDragRafId = null
      }

      if (this.nodeDragRafId != null) {
        cancelAnimationFrame(this.nodeDragRafId)
        this.nodeDragRafId = null
      }

      try {
        localStorage.removeItem(EDGE_ROUTE_STORAGE_KEY)
        localStorage.removeItem(STORAGE_KEY)
      } catch (err) {
        void err
      }

      this.$nextTick(() => {
        this.resetViewportToContent()
        const parts = []
        if (hadSavedPositions) parts.push('positions')
        if (hadSavedRoutes) parts.push('routes')
        if (hadCustomView) parts.push('zoom/pan')
        this.setRouteActionStatus(`Reset All restored ${parts.join(', ')}`, 'success')
      })
    },

    getPortRef(node, port, index) {
      return {
        nodeId: node.id,
        mrid: port?.mrid != null ? String(port.mrid) : null,
        index
      }
    },

    isSamePortRef(a, b) {
      if (!a || !b) return false
      if (a.nodeId !== b.nodeId) return false
      if (a.mrid != null || b.mrid != null) return a.mrid != null && b.mrid != null && a.mrid === b.mrid
      return a.index === b.index
    },

    isEdgeFromPort(edge, portRef) {
      if (!edge || !portRef) return false
      if (edge.srcId !== portRef.nodeId) return false

      if (portRef.mrid != null) {
        return edge.srcPortMrid != null && String(edge.srcPortMrid) === portRef.mrid
      }

      return Number(edge.srcPortIndex) === Number(portRef.index)
    },

    isPortHovered(node, port, index) {
      return this.isSamePortRef(this.hoveredPortRef, this.getPortRef(node, port, index))
    },

    isPortTraced(node, port, index) {
      if (!this.activeTraceEdgeId) return false
      const edge = this.edges.find((item) => item.id === this.activeTraceEdgeId)
      return this.isEdgeFromPort(edge, this.getPortRef(node, port, index))
    },

    onPortHover(node, port, index) {
      this.hoveredPortRef = this.getPortRef(node, port, index)
    },

    onPortLeave(node, port, index) {
      const ref = this.getPortRef(node, port, index)
      if (this.isSamePortRef(this.hoveredPortRef, ref)) {
        this.hoveredPortRef = null
      }
    },

    findEdgeByPortRef(portRef) {
      if (!portRef) return null
      return this.edges.find((edge) => this.isEdgeFromPort(edge, portRef)) || null
    },

    onPortDoubleClick(node, port, index) {
      if (this.hasDragged) {
        this.hasDragged = false
        return
      }

      const ref = this.getPortRef(node, port, index)
      const edge = this.findEdgeByPortRef(ref)

      if (!edge) {
        this.$message?.warning?.(this.$tUi('portNoDestination'))
        return
      }

      if (this.activeTraceEdgeId === edge.id) {
        this.activeTraceEdgeId = null
        return
      }

      this.activeTraceEdgeId = edge.id
      this.traceAnimationSeed += 1
      this.selectedEdgeId = edge.id
      this.detailEdge = edge
      this.selectedDevice = null
      this.detailNode = null
    },

    getTraceDuration(edge) {
      const len = this.getRouteLength(edge?.route || [])
      const seconds = Math.max(1.2, Math.min(4.6, len / 260))
      return `${seconds.toFixed(2)}s`
    },

    getRouteLength(points) {
      if (!Array.isArray(points) || points.length < 2) return 0
      let len = 0
      for (let i = 0; i < points.length - 1; i++) {
        len += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y)
      }
      return len
    },

    getEdgeStrokeWidth(edge) {
      let width = this.selectedDevice && !edge.involves(this.selectedDevice) ? 1.2 : 2.4

      if (this.isEdgeFromPort(edge, this.hoveredPortRef)) {
        width = Math.max(width, 3.2)
      }

      if (this.activeTraceEdgeId === edge.id) {
        width = Math.max(width, 3.8)
      }

      return width
    },

    getEdgeStrokeOpacity(edge) {
      let opacity = this.selectedDevice && !edge.involves(this.selectedDevice) ? 0.12 : 0.88

      if (this.isEdgeFromPort(edge, this.hoveredPortRef)) {
        opacity = 1
      }

      if (this.activeTraceEdgeId === edge.id) {
        opacity = 1
      }

      return opacity
    },

    normalizeFlag(value) {
      if (value === 1 || value === '1' || value === true || value === 'On') return 'On'
      return 'Off'
    },

    isEnabled(value) {
      return value === 1 || value === '1' || value === true
    },

    hasRedundancy(port) {
      return !!String(port.redundancy || '').trim()
    },

    deviceConfig(name) {
      const n = String(name || '').toLowerCase()

      if (n.includes('switch')) {
        return {
          type: 'Network Switch',
          glyph: 'SW',
          headerColor: '#0f766e',
          bgColor: '#f0fdf4',
          strokeColor: '#86efac'
        }
      }

      if (n.includes('hmi') || n.includes('scada')) {
        return {
          type: 'HMI',
          glyph: 'HMI',
          headerColor: '#4c1d95',
          bgColor: '#faf5ff',
          strokeColor: '#c4b5fd'
        }
      }

      return {
        type: 'IED / Relay',
        glyph: 'IED',
        headerColor: '#1e3a8a',
        bgColor: '#eff6ff',
        strokeColor: '#93c5fd'
      }
    },

    portColor(port) {
      if (this.normalizeFlag(port.operation) === 'Off') return '#94a3b8'
      if (this.hasRedundancy(port)) return '#f0a020'
      if (this.isEnabled(port.goose) || this.isEnabled(port.smv)) return '#0f766e'
      if (this.isEnabled(port.mms)) return '#2563eb'
      if (this.isEnabled(port.dnp3)) return '#7c3aed'
      if (this.isEnabled(port.snmp) || this.isEnabled(port.ftp)) return '#ea580c'
      if (this.isEnabled(port.sntp) || this.isEnabled(port.ptp)) return '#0d9488'
      if (this.isEnabled(port.https)) return '#0891b2'
      return '#64748b'
    },

    serviceMeta() {
      return [
        { key: 'goose', label: 'GOOSE', filterKey: 'goose', color: '#0f766e', priority: 100 },
        { key: 'smv', label: 'SMV', filterKey: 'goose', color: '#0f766e', priority: 95 },
        { key: 'mms', label: 'MMS', filterKey: 'mms', color: '#2563eb', priority: 80 },
        { key: 'dnp3', label: 'DNP3', filterKey: 'dnp3', color: '#7c3aed', priority: 70 },
        { key: 'https', label: 'HTTPS', filterKey: 'https', color: '#0891b2', priority: 60 },
        { key: 'snmp', label: 'SNMP', filterKey: 'mgmt', color: '#ea580c', priority: 50 },
        { key: 'ftp', label: 'FTP', filterKey: 'mgmt', color: '#ea580c', priority: 45 },
        { key: 'sntp', label: 'SNTP', filterKey: 'time', color: '#0d9488', priority: 40 },
        { key: 'ptp', label: 'PTP', filterKey: 'time', color: '#0d9488', priority: 35 }
      ]
    },

    activeServices(port) {
      return this.serviceMeta().filter((svc) => this.isEnabled(port[svc.key]))
    },

    getEdgeServices(port) {
      if (this.normalizeFlag(port.operation) === 'Off') {
        return [
          { key: 'off', label: 'OFF', filterKey: 'off', color: '#94a3b8', priority: 999 }
        ]
      }

      const services = this.activeServices(port)
      if (services.length) return services

      if (this.hasRedundancy(port)) {
        return [
          { key: 'prp', label: 'PRP', filterKey: 'prp', color: '#f0a020', priority: 90 }
        ]
      }

      return [
        { key: 'other', label: 'LINK', filterKey: 'other', color: '#64748b', priority: 1 }
      ]
    },

    getDominantService(services, port) {
      if (this.normalizeFlag(port.operation) === 'Off') {
        return { key: 'off', label: 'OFF', filterKey: 'off', color: '#94a3b8', priority: 999 }
      }

      if (this.hasRedundancy(port)) {
        const prpCandidate = services.find((svc) => svc.filterKey === 'prp')
        if (prpCandidate) return prpCandidate
      }

      return [...services].sort((a, b) => b.priority - a.priority)[0]
    },

    edgeDashArray(port, dominantSvc) {
      if (dominantSvc.filterKey === 'off') return '3 3'
      if (dominantSvc.filterKey === 'prp') return '6 3'
      if (dominantSvc.key === 'mms') return '6 3'
      if (dominantSvc.key === 'dnp3') return '8 4'
      if (dominantSvc.key === 'https') return '2 2'
      if (dominantSvc.key === 'snmp' || dominantSvc.key === 'ftp') return '10 3'
      if (dominantSvc.key === 'sntp' || dominantSvc.key === 'ptp') return '4 2'
      return ''
    },

    resolveDestinationNode(port, nodeMap, idNodeMap) {
      let dstNode = null

      if (port.destinationId != null) {
        dstNode = idNodeMap[String(port.destinationId)]
      }

      if (!dstNode) {
        const destinationName = String(port.destination || '').trim()
        if (destinationName) {
          dstNode = nodeMap[destinationName.toLowerCase()]
        }
      }

      return dstNode || null
    },

    getLaneOffset(index, total) {
      if (!Number.isFinite(index) || !Number.isFinite(total) || total <= 1) return 0
      const center = (total - 1) / 2
      return Math.round((index - center) * 16)
    },

    createRouteUsageContext() {
      return {
        edgeUsage: {},
        nodeUsage: {}
      }
    },

    createRoutingGrid(nodeRects) {
      const cell = 24
      const fallback = {
        minX: -this.W * 0.25,
        minY: 0,
        maxX: this.W * 1.25,
        maxY: 980
      }

      let minX = fallback.minX
      let minY = fallback.minY
      let maxX = fallback.maxX
      let maxY = fallback.maxY

      ;(nodeRects || []).forEach((rect) => {
        if (rect.left < minX) minX = rect.left
        if (rect.top < minY) minY = rect.top
        if (rect.right > maxX) maxX = rect.right
        if (rect.bottom > maxY) maxY = rect.bottom
      })

      const pad = 160
      const originX = Math.floor((minX - pad) / cell) * cell
      const originY = Math.floor((minY - pad) / cell) * cell
      const limitX = Math.ceil((maxX + pad) / cell) * cell
      const limitY = Math.ceil((maxY + pad) / cell) * cell

      const cols = Math.max(16, Math.round((limitX - originX) / cell))
      const rows = Math.max(12, Math.round((limitY - originY) / cell))

      return {
        cell,
        originX,
        originY,
        cols,
        rows
      }
    },

    clampGridIndex(value, max) {
      if (value < 0) return 0
      if (value > max) return max
      return value
    },

    toGridPoint(point, grid) {
      return {
        x: this.clampGridIndex(Math.round((point.x - grid.originX) / grid.cell), grid.cols),
        y: this.clampGridIndex(Math.round((point.y - grid.originY) / grid.cell), grid.rows)
      }
    },

    gridPointToWorld(point, grid) {
      return {
        x: grid.originX + point.x * grid.cell,
        y: grid.originY + point.y * grid.cell
      }
    },

    getGridPointKey(point) {
      return `${point.x},${point.y}`
    },

    getGridEdgeKey(a, b) {
      if (a.x === b.x) {
        return `v:${a.x}:${Math.min(a.y, b.y)}`
      }
      return `h:${Math.min(a.x, b.x)}:${a.y}`
    },

    buildBlockedGrid(nodeRects, grid, srcNodeId, dstNodeId) {
      const blocked = new Set()
      const ignore = {
        [String(srcNodeId)]: true,
        [String(dstNodeId)]: true
      }
      const pad = 10

      ;(nodeRects || []).forEach((rect) => {
        if (ignore[String(rect.id)]) return

        const minX = this.clampGridIndex(Math.floor((rect.left - pad - grid.originX) / grid.cell), grid.cols)
        const maxX = this.clampGridIndex(Math.ceil((rect.right + pad - grid.originX) / grid.cell), grid.cols)
        const minY = this.clampGridIndex(Math.floor((rect.top - pad - grid.originY) / grid.cell), grid.rows)
        const maxY = this.clampGridIndex(Math.ceil((rect.bottom + pad - grid.originY) / grid.cell), grid.rows)

        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            blocked.add(`${x},${y}`)
          }
        }
      })

      return blocked
    },

    getAStarStepCost(current, next, dir, prevDir, routeUsage) {
      let cost = 1

      if (prevDir && prevDir !== dir) {
        cost += 0.45
      }

      if (routeUsage) {
        const edgeKey = this.getGridEdgeKey(current, next)
        const edgeUse = routeUsage.edgeUsage[edgeKey] || 0
        if (edgeUse > 0) {
          cost -= Math.min(0.5, edgeUse * 0.12)
        }

        const orientation = dir === 'L' || dir === 'R' ? 'h' : 'v'
        const opposite = orientation === 'h' ? 'v' : 'h'
        const nodeUsage = routeUsage.nodeUsage[this.getGridPointKey(next)]
        if (nodeUsage) {
          if (nodeUsage[opposite]) {
            cost += Math.min(1.5, nodeUsage[opposite] * 0.42)
          }
          if (nodeUsage[orientation]) {
            cost -= Math.min(0.24, nodeUsage[orientation] * 0.07)
          }
        }
      }

      return Math.max(0.22, cost)
    },

    findGridRouteAStar(start, end, blocked, grid, routeUsage) {
      const startKey = this.getGridPointKey(start)
      const endKey = this.getGridPointKey(end)

      blocked.delete(startKey)
      blocked.delete(endKey)

      const open = []
      const scoreByState = {}
      const closed = {}
      const cameFrom = {}
      const stateMap = {}

      const heuristic = (x, y) => (Math.abs(x - end.x) + Math.abs(y - end.y)) * 0.22
      const makeStateKey = (x, y, dir) => `${x},${y},${dir || 'S'}`

      const startStateKey = makeStateKey(start.x, start.y, null)
      const startState = {
        x: start.x,
        y: start.y,
        dir: null,
        g: 0,
        f: heuristic(start.x, start.y),
        key: startStateKey
      }

      open.push(startState)
      scoreByState[startStateKey] = 0
      stateMap[startStateKey] = startState

      const directions = [
        { x: 1, y: 0, key: 'R' },
        { x: -1, y: 0, key: 'L' },
        { x: 0, y: 1, key: 'D' },
        { x: 0, y: -1, key: 'U' }
      ]

      let finalKey = null
      let guard = 0

      while (open.length) {
        guard++
        if (guard > 28000) break

        let bestIndex = 0
        for (let i = 1; i < open.length; i++) {
          if (open[i].f < open[bestIndex].f) bestIndex = i
        }

        const current = open.splice(bestIndex, 1)[0]
        if (!current) break

        if (current.x === end.x && current.y === end.y) {
          finalKey = current.key
          break
        }

        closed[current.key] = true

        directions.forEach((dir) => {
          const nx = current.x + dir.x
          const ny = current.y + dir.y

          if (nx < 0 || ny < 0 || nx > grid.cols || ny > grid.rows) return

          const pointKey = `${nx},${ny}`
          if (blocked.has(pointKey)) return

          const nextKey = makeStateKey(nx, ny, dir.key)
          if (closed[nextKey]) return

          const stepCost = this.getAStarStepCost(
            { x: current.x, y: current.y },
            { x: nx, y: ny },
            dir.key,
            current.dir,
            routeUsage
          )

          const tentative = current.g + stepCost
          if (tentative >= (scoreByState[nextKey] ?? Number.MAX_SAFE_INTEGER)) return

          scoreByState[nextKey] = tentative
          cameFrom[nextKey] = current.key

          const nextState = {
            x: nx,
            y: ny,
            dir: dir.key,
            g: tentative,
            f: tentative + heuristic(nx, ny),
            key: nextKey
          }

          stateMap[nextKey] = nextState

          const existingIndex = open.findIndex((item) => item.key === nextKey)
          if (existingIndex >= 0) {
            open[existingIndex] = nextState
          } else {
            open.push(nextState)
          }
        })
      }

      if (!finalKey) return null

      const points = []
      let cursor = finalKey
      while (cursor) {
        const st = stateMap[cursor]
        if (!st) break
        points.push({ x: st.x, y: st.y })
        cursor = cameFrom[cursor]
      }

      points.reverse()
      return points.length ? points : null
    },

    normalizeGridPolyline(points) {
      if (!Array.isArray(points) || points.length < 2) return points || []

      const compact = []
      points.forEach((p) => {
        const last = compact[compact.length - 1]
        if (!last || last.x !== p.x || last.y !== p.y) {
          compact.push({ x: p.x, y: p.y })
        }
      })

      if (compact.length < 3) return compact

      const reduced = [compact[0]]
      for (let i = 1; i < compact.length - 1; i++) {
        const prev = reduced[reduced.length - 1]
        const curr = compact[i]
        const next = compact[i + 1]
        const sameX = prev.x === curr.x && curr.x === next.x
        const sameY = prev.y === curr.y && curr.y === next.y
        if (!sameX && !sameY) {
          reduced.push(curr)
        }
      }
      reduced.push(compact[compact.length - 1])

      return reduced
    },

    splitDiagonalGridSegment(a, b) {
      if (!a || !b) return []
      if (a.x === b.x || a.y === b.y) return [a, b]
      return [a, { x: b.x, y: a.y }, b]
    },

    routeToGridPolyline(route, grid) {
      const snapped = this.normalizeGridPolyline((route || []).map((p) => this.toGridPoint(p, grid)))
      if (snapped.length < 2) return snapped

      const expanded = [snapped[0]]
      for (let i = 0; i < snapped.length - 1; i++) {
        const pieces = this.splitDiagonalGridSegment(snapped[i], snapped[i + 1])
        for (let j = 1; j < pieces.length; j++) {
          expanded.push(pieces[j])
        }
      }

      return this.normalizeGridPolyline(expanded)
    },

    registerRouteUsage(route, routeUsage, grid) {
      if (!routeUsage || !grid) return
      const polyline = this.routeToGridPolyline(route, grid)
      if (!polyline || polyline.length < 2) return

      for (let i = 0; i < polyline.length - 1; i++) {
        let cx = polyline[i].x
        let cy = polyline[i].y
        const tx = polyline[i + 1].x
        const ty = polyline[i + 1].y

        while (cx !== tx || cy !== ty) {
          const nx = cx + (tx === cx ? 0 : tx > cx ? 1 : -1)
          const ny = cy + (ty === cy ? 0 : ty > cy ? 1 : -1)
          const from = { x: cx, y: cy }
          const to = { x: nx, y: ny }

          const edgeKey = this.getGridEdgeKey(from, to)
          routeUsage.edgeUsage[edgeKey] = (routeUsage.edgeUsage[edgeKey] || 0) + 1

          const nodeKey = this.getGridPointKey(to)
          const orientation = nx === cx ? 'v' : 'h'
          const nodeUse = routeUsage.nodeUsage[nodeKey] || { h: 0, v: 0 }
          nodeUse[orientation] += 1
          routeUsage.nodeUsage[nodeKey] = nodeUse

          cx = nx
          cy = ny
        }
      }
    },

    buildAStarOrthogonalRoute(start, end, srcNode, dstNode, options = {}) {
      const grid = options.routingGrid || this.createRoutingGrid(options.nodeRects || [])
      const startPoint = this.toGridPoint(start, grid)
      const endPoint = this.toGridPoint(end, grid)

      const blocked = this.buildBlockedGrid(
        options.nodeRects || [],
        grid,
        srcNode?.id,
        dstNode?.id
      )

      const gridRoute = this.findGridRouteAStar(
        startPoint,
        endPoint,
        blocked,
        grid,
        options.routeUsage
      )
      if (!gridRoute || gridRoute.length < 2) return null

      const worldRoute = this.normalizeGridPolyline(
        gridRoute.map((gp) => this.gridPointToWorld(gp, grid))
      )

      if (!worldRoute.length) return null

      worldRoute[0] = { ...start }
      worldRoute[worldRoute.length - 1] = { ...end }

      return this.normalizeOrthogonalPoints(worldRoute)
    },

    getDestinationPortIndex(dstNode, srcPort, srcNode, srcPortIndex) {
      const srcName = String(srcPort.name || srcPort.port || '').trim().toLowerCase()
      const idx = (dstNode.ports || []).findIndex((p) => {
        const dn = String(p.name || p.port || '').trim().toLowerCase()
        return dn && dn === srcName
      })

      if (idx >= 0) return idx

      if (srcNode && Number.isFinite(srcPortIndex) && (dstNode.ports || []).length) {
        return Math.max(0, Math.min(srcPortIndex, (dstNode.ports || []).length - 1))
      }

      return 0
    },

    getNodeLeft(node) {
      return node.cx - this.NODE_W / 2
    },

    getNodeRight(node) {
      return node.cx + this.NODE_W / 2
    },

    getPortAnchor(node, portIndex, side) {
      const safeIndex = Math.max(0, Math.min(portIndex, Math.max((node.ports?.length || 1) - 1, 0)))
      const rowY =
        node.cy -
        node.nodeH / 2 +
        this.HEADER_H +
        safeIndex * this.PORT_H +
        this.PORT_H / 2

      if (side === 'top' || side === 'bottom') {
        const portCount = Math.max(node.ports?.length || 1, 1)
        const padding = 14
        const usableWidth = Math.max(0, this.NODE_W - padding * 2)
        const x =
          portCount <= 1
            ? node.cx
            : this.getNodeLeft(node) + padding + (usableWidth * safeIndex) / (portCount - 1)

        return {
          x,
          y: side === 'top' ? node.cy - node.nodeH / 2 : node.cy + node.nodeH / 2
        }
      }

      return {
        x: side === 'left' ? this.getNodeLeft(node) : this.getNodeRight(node),
        y: rowY
      }
    },

    getHorizontalSideFromPoint(node, point) {
      return point.x >= node.cx ? 'right' : 'left'
    },

    getVerticalSideFromPoint(node, point) {
      return point.y <= node.cy ? 'top' : 'bottom'
    },

    getDefaultSourceSide(srcNode, dstNode) {
      return dstNode.cx >= srcNode.cx ? 'right' : 'left'
    },

    getDefaultDestinationSide(srcNode, dstNode) {
      return srcNode.cy <= dstNode.cy ? 'top' : 'bottom'
    },

    getSavedRouteSides(savedPoints, srcNode, dstNode) {
      if (!Array.isArray(savedPoints) || savedPoints.length < 2) return null

      const second = savedPoints[1] || savedPoints[0]
      const beforeLast = savedPoints[savedPoints.length - 2] || savedPoints[savedPoints.length - 1]

      return {
        sourceSide: this.getHorizontalSideFromPoint(srcNode, second),
        destinationSide: this.getVerticalSideFromPoint(dstNode, beforeLast)
      }
    },

    buildOrthogonalRoute(start, end, srcNode, dstNode, sourceSide, destinationSide, corridorOffset = 0) {
      const leftOuter = Math.min(this.getNodeLeft(srcNode), this.getNodeLeft(dstNode)) - this.EDGE_GAP
      const rightOuter = Math.max(this.getNodeRight(srcNode), this.getNodeRight(dstNode)) + this.EDGE_GAP
      const shiftedLeftOuter = leftOuter + corridorOffset
      const shiftedRightOuter = rightOuter + corridorOffset

      let points = []

      if (destinationSide === 'top' || destinationSide === 'bottom') {
        const sourceGap = Math.max(16, this.EDGE_GAP)
        const destinationGap = Math.max(16, Math.round(this.EDGE_GAP * 0.8))
        const sourceX =
          sourceSide === 'right'
            ? start.x + sourceGap + corridorOffset
            : start.x - sourceGap + corridorOffset
        const preEndY =
          destinationSide === 'top'
            ? end.y - destinationGap
            : end.y + destinationGap

        points = [
          { x: start.x, y: start.y },
          { x: sourceX, y: start.y },
          { x: sourceX, y: preEndY },
          { x: end.x, y: preEndY },
          { x: end.x, y: end.y }
        ]

        return this.normalizeOrthogonalPoints(points)
      }

      if (sourceSide === 'right' && destinationSide === 'left') {
        if (start.x <= end.x - 24) {
          const midX = Math.round((start.x + end.x) / 2 + corridorOffset)
          points = [
            { x: start.x, y: start.y },
            { x: midX, y: start.y },
            { x: midX, y: end.y },
            { x: end.x, y: end.y }
          ]
        } else {
          points = [
            { x: start.x, y: start.y },
            { x: shiftedRightOuter, y: start.y },
            { x: shiftedRightOuter, y: end.y },
            { x: end.x, y: end.y }
          ]
        }
      } else if (sourceSide === 'left' && destinationSide === 'right') {
        if (start.x >= end.x + 24) {
          const midX = Math.round((start.x + end.x) / 2 + corridorOffset)
          points = [
            { x: start.x, y: start.y },
            { x: midX, y: start.y },
            { x: midX, y: end.y },
            { x: end.x, y: end.y }
          ]
        } else {
          points = [
            { x: start.x, y: start.y },
            { x: shiftedLeftOuter, y: start.y },
            { x: shiftedLeftOuter, y: end.y },
            { x: end.x, y: end.y }
          ]
        }
      } else if (sourceSide === 'right' && destinationSide === 'right') {
        points = [
          { x: start.x, y: start.y },
          { x: shiftedRightOuter, y: start.y },
          { x: shiftedRightOuter, y: end.y },
          { x: end.x, y: end.y }
        ]
      } else {
        points = [
          { x: start.x, y: start.y },
          { x: shiftedLeftOuter, y: start.y },
          { x: shiftedLeftOuter, y: end.y },
          { x: end.x, y: end.y }
        ]
      }

      return this.normalizeOrthogonalPoints(points)
    },

    getRouteSegments(points) {
      const segments = []
      if (!Array.isArray(points) || points.length < 2) return segments

      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]
        const b = points[i + 1]
        if (!a || !b) continue
        if (a.x === b.x && a.y === b.y) continue
        segments.push({ a, b })
      }

      return segments
    },

    isInnerIntersectionPoint(point, segment) {
      if (!point || !segment) return false
      if (segment.a.x === segment.b.x) {
        return point.x === segment.a.x && point.y > Math.min(segment.a.y, segment.b.y) && point.y < Math.max(segment.a.y, segment.b.y)
      }
      if (segment.a.y === segment.b.y) {
        return point.y === segment.a.y && point.x > Math.min(segment.a.x, segment.b.x) && point.x < Math.max(segment.a.x, segment.b.x)
      }
      return false
    },

    getSegmentCrossPoint(segA, segB) {
      const aVertical = segA.a.x === segA.b.x
      const bVertical = segB.a.x === segB.b.x
      if (aVertical === bVertical) return null

      const vertical = aVertical ? segA : segB
      const horizontal = aVertical ? segB : segA

      const x = vertical.a.x
      const y = horizontal.a.y

      const withinHorizontal = x >= Math.min(horizontal.a.x, horizontal.b.x) && x <= Math.max(horizontal.a.x, horizontal.b.x)
      const withinVertical = y >= Math.min(vertical.a.y, vertical.b.y) && y <= Math.max(vertical.a.y, vertical.b.y)
      if (!withinHorizontal || !withinVertical) return null

      return { x, y }
    },

    getSegmentOverlapLength(segA, segB) {
      const aVertical = segA.a.x === segA.b.x
      const bVertical = segB.a.x === segB.b.x
      if (aVertical !== bVertical) return 0

      if (aVertical) {
        if (segA.a.x !== segB.a.x) return 0
        const minA = Math.min(segA.a.y, segA.b.y)
        const maxA = Math.max(segA.a.y, segA.b.y)
        const minB = Math.min(segB.a.y, segB.b.y)
        const maxB = Math.max(segB.a.y, segB.b.y)
        return Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB))
      }

      if (segA.a.y !== segB.a.y) return 0
      const minA = Math.min(segA.a.x, segA.b.x)
      const maxA = Math.max(segA.a.x, segA.b.x)
      const minB = Math.min(segB.a.x, segB.b.x)
      const maxB = Math.max(segB.a.x, segB.b.x)
      return Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB))
    },

    segmentIntersectsRect(segment, rect, padding = 12) {
      if (!segment || !rect) return false

      const left = rect.left - padding
      const right = rect.right + padding
      const top = rect.top - padding
      const bottom = rect.bottom + padding

      if (segment.a.x === segment.b.x) {
        const x = segment.a.x
        if (x < left || x > right) return false
        const minY = Math.min(segment.a.y, segment.b.y)
        const maxY = Math.max(segment.a.y, segment.b.y)
        return maxY >= top && minY <= bottom
      }

      if (segment.a.y === segment.b.y) {
        const y = segment.a.y
        if (y < top || y > bottom) return false
        const minX = Math.min(segment.a.x, segment.b.x)
        const maxX = Math.max(segment.a.x, segment.b.x)
        return maxX >= left && minX <= right
      }

      return false
    },

    getRouteNodeCollisionCount(points, nodeRects, srcNodeId, dstNodeId) {
      if (!Array.isArray(nodeRects) || !nodeRects.length) return 0

      const ignore = {
        [String(srcNodeId)]: true,
        [String(dstNodeId)]: true
      }

      let collisions = 0
      const segments = this.getRouteSegments(points)

      segments.forEach((segment) => {
        nodeRects.forEach((rect) => {
          if (ignore[String(rect.id)]) return
          if (this.segmentIntersectsRect(segment, rect, 10)) collisions++
        })
      })

      return collisions
    },

    getRouteCrossingCount(points, existingRoutes) {
      if (!Array.isArray(existingRoutes) || !existingRoutes.length) return 0

      const segments = this.getRouteSegments(points)
      let crossings = 0

      segments.forEach((segment) => {
        existingRoutes.forEach((route) => {
          this.getRouteSegments(route).forEach((other) => {
            const cross = this.getSegmentCrossPoint(segment, other)
            if (!cross) return
            if (!this.isInnerIntersectionPoint(cross, segment)) return
            if (!this.isInnerIntersectionPoint(cross, other)) return
            crossings++
          })
        })
      })

      return crossings
    },

    getRouteOverlapPenalty(points, existingRoutes) {
      if (!Array.isArray(existingRoutes) || !existingRoutes.length) return 0

      const segments = this.getRouteSegments(points)
      let overlap = 0

      segments.forEach((segment) => {
        existingRoutes.forEach((route) => {
          this.getRouteSegments(route).forEach((other) => {
            const overlapLen = this.getSegmentOverlapLength(segment, other)
            if (overlapLen > 0) overlap += overlapLen
          })
        })
      })

      return overlap
    },

    getRouteScore(points, context = {}) {
      if (!points || points.length < 2) return Number.MAX_SAFE_INTEGER

      let len = 0
      for (let i = 0; i < points.length - 1; i++) {
        len += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y)
      }

      const bends = Math.max(0, points.length - 2)
      let score = len + bends * 20

      const nodeCollisions = this.getRouteNodeCollisionCount(
        points,
        context.nodeRects,
        context.srcNodeId,
        context.dstNodeId
      )
      const crossings = this.getRouteCrossingCount(points, context.existingRoutes)
      const overlapPenalty = this.getRouteOverlapPenalty(points, context.existingRoutes)

      score += nodeCollisions * 9000
      score += crossings * 1000
      score += overlapPenalty * 0.15

      return score
    },

    getBestRoute(srcNode, srcPortIndex, dstNode, dstPortIndex) {
      const sourceSide = this.getDefaultSourceSide(srcNode, dstNode)
      const destinationSide = this.getDefaultDestinationSide(srcNode, dstNode)

      const start = this.getPortAnchor(srcNode, srcPortIndex, sourceSide)
      const end = this.getPortAnchor(dstNode, dstPortIndex, destinationSide)

      const route = this.buildOrthogonalRoute(
        start,
        end,
        srcNode,
        dstNode,
        sourceSide,
        destinationSide,
        0
      )

      return {
        sourceSide,
        destinationSide,
        start,
        end,
        route,
        score: 0
      }
    },

    getResolvedRoute(edgeId, srcNode, srcPortIndex, dstNode, dstPortIndex, options = {}) {
      const draggingEdgeId = this.draggingRouteHandle?.edgeId
        ? String(this.draggingRouteHandle.edgeId)
        : null

      if (draggingEdgeId && String(edgeId) !== draggingEdgeId) {
        const snapshot = this.dragEdgeRouteSnapshots[edgeId]
        if (snapshot && Array.isArray(snapshot.route) && snapshot.route.length >= 2) {
          const route = snapshot.route.map((p) => ({ x: p.x, y: p.y }))
          const inferred = this.getSavedRouteSides(route, srcNode, dstNode) || {
            sourceSide: this.getDefaultSourceSide(srcNode, dstNode),
            destinationSide: this.getDefaultDestinationSide(srcNode, dstNode)
          }

          return {
            sourceSide: inferred.sourceSide,
            destinationSide: inferred.destinationSide,
            start: route[0],
            end: route[route.length - 1],
            route
          }
        }
      }

      const draggingNodeId = this.draggingNode != null ? String(this.draggingNode) : null
      const edgeTouchesDraggingNode =
        draggingNodeId && (String(srcNode.id) === draggingNodeId || String(dstNode.id) === draggingNodeId)

      if (draggingNodeId && !edgeTouchesDraggingNode) {
        const snapshot = this.dragEdgeRouteSnapshots[edgeId]
        if (snapshot && Array.isArray(snapshot.route) && snapshot.route.length >= 2) {
          const route = snapshot.route.map((p) => ({ x: p.x, y: p.y }))
          const inferred = this.getSavedRouteSides(route, srcNode, dstNode) || {
            sourceSide: this.getDefaultSourceSide(srcNode, dstNode),
            destinationSide: this.getDefaultDestinationSide(srcNode, dstNode)
          }

          return {
            sourceSide: inferred.sourceSide,
            destinationSide: inferred.destinationSide,
            start: route[0],
            end: route[route.length - 1],
            route
          }
        }
      }

      const saved = this.edgeRoutes[edgeId]

      if (saved && Array.isArray(saved.points) && saved.points.length >= 2) {
        const inferred = this.getSavedRouteSides(saved.points, srcNode, dstNode) || {
          sourceSide: this.getDefaultSourceSide(srcNode, dstNode),
          destinationSide: this.getDefaultDestinationSide(srcNode, dstNode)
        }

        const start = this.getPortAnchor(srcNode, srcPortIndex, inferred.sourceSide)
        const end = this.getPortAnchor(dstNode, dstPortIndex, inferred.destinationSide)

        const points = saved.points.map((p) => ({ x: p.x, y: p.y }))
        points[0] = { ...start }
        points[points.length - 1] = { ...end }

        return {
          sourceSide: inferred.sourceSide,
          destinationSide: inferred.destinationSide,
          start,
          end,
          route: this.normalizeOrthogonalPoints(points)
        }
      }

      const locked = this.dragAutoRouteLocks[edgeId]
      if (locked) {
        const start = this.getPortAnchor(srcNode, srcPortIndex, locked.sourceSide)
        const end = this.getPortAnchor(dstNode, dstPortIndex, locked.destinationSide)

        const route = this.buildOrthogonalRoute(
          start,
          end,
          srcNode,
          dstNode,
          locked.sourceSide,
          locked.destinationSide
        )

        return {
          sourceSide: locked.sourceSide,
          destinationSide: locked.destinationSide,
          start,
          end,
          route
        }
      }

      return this.getBestRoute(srcNode, srcPortIndex, dstNode, dstPortIndex, options)
    },

    enforceEndpointOrthogonalRoute(route, routeInfo = {}) {
      if (!Array.isArray(route) || route.length < 2) return route || []

      const normalized = this.normalizeOrthogonalPoints(
        route.map((p) => ({ x: p.x, y: p.y }))
      )
      if (!normalized.length) return []

      const start = routeInfo.start
        ? { x: routeInfo.start.x, y: routeInfo.start.y }
        : { ...normalized[0] }
      const end = routeInfo.end
        ? { x: routeInfo.end.x, y: routeInfo.end.y }
        : { ...normalized[normalized.length - 1] }

      const sourceSide =
        routeInfo.sourceSide === 'left' || routeInfo.sourceSide === 'right'
          ? routeInfo.sourceSide
          : end.x >= start.x
            ? 'right'
            : 'left'
      const destinationSide =
        routeInfo.destinationSide === 'top' || routeInfo.destinationSide === 'bottom'
          ? routeInfo.destinationSide
          : start.y <= end.y
            ? 'top'
            : 'bottom'

      const minGap = Math.max(12, Math.round(this.EDGE_GAP * 0.6))
      const middle = normalized.slice(1, normalized.length - 1)
      const sourceGuide = middle[0] || null
      const destinationGuide = middle[middle.length - 1] || null

      const sourcePoint = {
        x:
          sourceSide === 'right'
            ? Math.max(start.x + minGap, sourceGuide?.x ?? start.x + minGap)
            : Math.min(start.x - minGap, sourceGuide?.x ?? start.x - minGap),
        y: start.y
      }

      const destinationPoint =
        destinationSide === 'top'
          ? {
              x: end.x,
              y: Math.min(end.y - minGap, destinationGuide?.y ?? end.y - minGap)
            }
          : {
              x: end.x,
              y: Math.max(end.y + minGap, destinationGuide?.y ?? end.y + minGap)
            }

      const interior = middle.length > 2
        ? middle.slice(1, -1).map((p) => ({ x: p.x, y: p.y }))
        : []

      const forcedRoute = this.normalizeOrthogonalPoints([
        { ...start },
        sourcePoint,
        ...interior,
        destinationPoint,
        { ...end }
      ])

      if (!forcedRoute.length) return [{ ...start }, { ...end }]

      forcedRoute[0] = { ...start }
      forcedRoute[forcedRoute.length - 1] = { ...end }

      return this.normalizeOrthogonalPoints(forcedRoute)
    },

    buildDragAutoRouteLocks(nodeId) {
      const targetId = String(nodeId || '')
      if (!targetId) {
        this.dragAutoRouteLocks = {}
        return
      }

      const nodeById = {}
      this.layout.forEach((node) => {
        nodeById[node.id] = node
      })

      const locks = {}

      this.edges.forEach((edge) => {
        if (edge.srcId !== targetId && edge.dstId !== targetId) return
        if (this.edgeRoutes[edge.id]) return

        const srcNode = nodeById[edge.srcId]
        const dstNode = nodeById[edge.dstId]
        if (!srcNode || !dstNode || !Array.isArray(edge.route) || edge.route.length < 2) return

        const inferred = this.getSavedRouteSides(edge.route, srcNode, dstNode)
        if (!inferred) return

        locks[edge.id] = {
          sourceSide: inferred.sourceSide,
          destinationSide: inferred.destinationSide
        }
      })

      this.dragAutoRouteLocks = locks
    },

    normalizeOrthogonalPoints(points) {
      if (!points || points.length < 2) return points || []

      let cleaned = points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }))

      cleaned[0] = { ...points[0] }
      cleaned[cleaned.length - 1] = { ...points[points.length - 1] }

      const deduped = []
      for (const p of cleaned) {
        const last = deduped[deduped.length - 1]
        if (!last || last.x !== p.x || last.y !== p.y) {
          deduped.push({ ...p })
        }
      }

      cleaned = deduped

      if (cleaned.length < 2) return cleaned

      let i = 0
      while (i < cleaned.length - 1) {
        const a = cleaned[i]
        const b = cleaned[i + 1]

        if (a.x !== b.x && a.y !== b.y) {
          cleaned.splice(i + 1, 0, { x: b.x, y: a.y })
        } else {
          i++
        }
      }

      let changed = true
      while (changed) {
        changed = false
        for (let j = 1; j < cleaned.length - 1; j++) {
          const a = cleaned[j - 1]
          const b = cleaned[j]
          const c = cleaned[j + 1]

          const sameX = a.x === b.x && b.x === c.x
          const sameY = a.y === b.y && b.y === c.y

          if (sameX || sameY) {
            cleaned.splice(j, 1)
            changed = true
            break
          }
        }
      }

      return cleaned
    },

    pointsToPath(points) {
      if (!points.length) return ''
      let d = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`
      }
      return d
    },

    getLabelSegment(points) {
      if (points.length < 2) {
        return {
          a: { x: 0, y: 0 },
          b: { x: 0, y: 0 }
        }
      }

      let bestIndex = 0
      let bestLength = -1

      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]
        const b = points[i + 1]
        const len = Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
        if (len > bestLength) {
          bestLength = len
          bestIndex = i
        }
      }

      return {
        a: points[bestIndex],
        b: points[bestIndex + 1]
      }
    },

    openDetail(node) {
      this.detailNode = node
      this.detailEdge = null
      this.selectedEdgeId = null
    },

    closeDetail() {
      this.detailNode = null
      this.selectedDevice = null
    },

    onNodeClick(node) {
      if (this.hasDragged) {
        this.hasDragged = false
        return
      }

      this.selectedEdgeId = null
      this.detailEdge = null

      this.selectedDevice = this.selectedDevice === node.id ? null : node.id

      if (this.selectedDevice) {
        this.openDetail(node)
      } else {
        this.detailNode = null
      }
    },

    onEdgeClick(edge) {
      if (this.hasDragged) {
        this.hasDragged = false
        return
      }

      this.selectedDevice = null
      this.detailNode = null
      this.selectedEdgeId = edge.id
      this.detailEdge = edge
    },

    closeEdgeDetail() {
      this.detailEdge = null
      this.selectedEdgeId = null
    },

    getCanvasCoord(event) {
      const canvas = this.$refs.canvasRef
      if (!canvas) return null

      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return null

      const vbW = this.canvasW / this.zoom
      const vbH = this.canvasH / this.zoom

      const ratioX = (event.clientX - rect.left) / rect.width
      const ratioY = (event.clientY - rect.top) / rect.height

      return {
        x: this.viewX + ratioX * vbW,
        y: this.viewY + ratioY * vbH,
        ratioX,
        ratioY
      }
    },

    handleWheel(event) {
      const point = this.getCanvasCoord(event)
      if (!point) return

      let nextZoom = event.deltaY < 0 ? this.zoom * 1.15 : this.zoom / 1.15
      if (nextZoom < this.minZoom) nextZoom = this.minZoom
      if (nextZoom > this.maxZoom) nextZoom = this.maxZoom
      if (nextZoom === this.zoom) return

      const nextVbW = this.canvasW / nextZoom
      const nextVbH = this.canvasH / nextZoom

      this.viewX = point.x - point.ratioX * nextVbW
      this.viewY = point.y - point.ratioY * nextVbH
      this.zoom = nextZoom
    },

    startPanOrNodeDrag(event) {
      if (event.button !== 0) return

      const nodeEl = event.target.closest('.dev-node')

      if (nodeEl) {
        const nodeId = nodeEl.getAttribute('data-node-id')
        const node = this.layout.find((n) => n.id === nodeId)

        if (node) {
          this.freezeCanvasBounds()
          this.buildDragAutoRouteLocks(node.id)
          this.captureDragRouteSnapshots(node.id)
          this.hoveredPortRef = null
          this.pendingRouteUpdate = null
          if (this.routeDragRafId != null) {
            cancelAnimationFrame(this.routeDragRafId)
            this.routeDragRafId = null
          }
          this.draggingNode = node.id
          this.hasDragged = false
          this.pendingNodePosition = null
          this.dragStartClient = { x: event.clientX, y: event.clientY }
          this.dragStartPos = { cx: node.cx, cy: node.cy }
          return
        }
      }

      if (
        !event.target.closest('.edge-hitbox') &&
        !event.target.closest('.edge-path') &&
        !event.target.closest('.route-handle-hit') &&
        !event.target.closest('.route-handle-dot') &&
        !event.target.closest('.edge-label-group')
      ) {
        this.selectedDevice = null
        this.detailNode = null
        this.selectedEdgeId = null
        this.detailEdge = null
      }

      this.isPanning = true
      this.panStartClient = { x: event.clientX, y: event.clientY }
      this.panStartView = { x: this.viewX, y: this.viewY }
    },

    startRouteHandleDrag(event, edge, handle) {
      if (event.button !== 0) return

      this.freezeCanvasBounds()

      this.draggingRouteHandle = {
        edgeId: edge.id,
        index: handle.index
      }
      this.dragAutoRouteLocks = {}
      this.captureRouteHandleSnapshots(edge.id)
      this.hoveredPortRef = null
      this.hasDragged = false
      this.pendingRouteUpdate = null
      if (this.routeDragRafId != null) {
        cancelAnimationFrame(this.routeDragRafId)
        this.routeDragRafId = null
      }
      this.dragStartRouteClient = { x: event.clientX, y: event.clientY }
      this.dragStartRoutePoints = edge.route.map((p) => ({ x: p.x, y: p.y }))
      this.selectedEdgeId = edge.id
      this.detailEdge = edge
      this.detailNode = null
      this.selectedDevice = null
    },

    moveIntermediatePointFreely(points, index, targetX, targetY) {
      const next = points.map((p) => ({ x: p.x, y: p.y }))
      const prev = next[index - 1]
      const curr = next[index]
      const after = next[index + 1]

      if (!prev || !curr || !after) return next

      curr.x = targetX
      curr.y = targetY

      const prevWasHorizontal = prev.y === this.dragStartRoutePoints[index].y
      const prevWasVertical = prev.x === this.dragStartRoutePoints[index].x

      const nextWasHorizontal = after.y === this.dragStartRoutePoints[index].y
      const nextWasVertical = after.x === this.dragStartRoutePoints[index].x

      if (prevWasHorizontal) prev.y = curr.y
      if (prevWasVertical) prev.x = curr.x

      if (nextWasHorizontal) after.y = curr.y
      if (nextWasVertical) after.x = curr.x

      if (prev.x !== curr.x && prev.y !== curr.y) {
        prev.x = curr.x
      }

      if (curr.x !== after.x && curr.y !== after.y) {
        after.y = curr.y
      }

      return this.normalizeOrthogonalPoints(next)
    },

    handleCanvasMouseMove(event) {
      const canvas = this.$refs.canvasRef
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const vbW = this.canvasW / this.zoom
      const vbH = this.canvasH / this.zoom

      if (this.draggingNode) {
        const dxPx = event.clientX - this.dragStartClient.x
        const dyPx = event.clientY - this.dragStartClient.y

        const dxSvg = (dxPx / rect.width) * vbW
        const dySvg = (dyPx / rect.height) * vbH

        const newCx = this.dragStartPos.cx + dxSvg
        const newCy = this.dragStartPos.cy + dySvg

        if (Math.abs(dxPx) > 3 || Math.abs(dyPx) > 3) {
          this.hasDragged = true
        }

        this.queueNodePositionUpdate(this.draggingNode, newCx, newCy)

        return
      }

      if (this.draggingRouteHandle) {
        const dxPx = event.clientX - this.dragStartRouteClient.x
        const dyPx = event.clientY - this.dragStartRouteClient.y

        const dxSvg = (dxPx / rect.width) * vbW
        const dySvg = (dyPx / rect.height) * vbH

        if (Math.abs(dxPx) > 3 || Math.abs(dyPx) > 3) {
          this.hasDragged = true
        }

        const index = this.draggingRouteHandle.index
        const original = this.dragStartRoutePoints[index]
        if (!original) return

        const targetX = original.x + dxSvg
        const targetY = original.y + dySvg

        const moved = this.moveIntermediatePointFreely(
          this.dragStartRoutePoints,
          index,
          targetX,
          targetY
        )

        this.queueRoutePointsUpdate(this.draggingRouteHandle.edgeId, moved)

        return
      }

      if (!this.isPanning) return

      const dxPx = event.clientX - this.panStartClient.x
      const dyPx = event.clientY - this.panStartClient.y

      this.viewX = this.panStartView.x - (dxPx / rect.width) * vbW
      this.viewY = this.panStartView.y - (dyPx / rect.height) * vbH
    },

    handleCanvasMouseUp() {
      const hadDragNode = !!this.draggingNode
      const hadDragRoute = !!this.draggingRouteHandle

      if (this.nodeDragRafId != null) {
        cancelAnimationFrame(this.nodeDragRafId)
        this.nodeDragRafId = null
      }

      if (this.routeDragRafId != null) {
        cancelAnimationFrame(this.routeDragRafId)
        this.routeDragRafId = null
      }

      this.flushPendingNodePosition()
      this.flushPendingRouteUpdate()

      if (this.draggingNode) {
        this.draggingNode = null
      }

      if (this.draggingRouteHandle) {
        this.draggingRouteHandle = null
      }

      this.isPanning = false
      this.hoveredPortRef = null

      if (hadDragNode) {
        this.dragAutoRouteLocks = {}
        this.dragEdgeRouteSnapshots = {}
        this.persistNodePositions(this.nodePositions)
      }

      if (hadDragNode || hadDragRoute) {
        this.unfreezeCanvasBounds()
      }

      if (hadDragRoute) {
        this.dragEdgeRouteSnapshots = {}
        this.pendingRouteUpdate = null
        this.persistEdgeRoutes(this.edgeRoutes)
      }
    },

    resetViewportToContent() {
      this.unfreezeCanvasBounds()
      this.viewX = this.canvasBounds.minX
      this.viewY = this.canvasBounds.minY
      this.zoom = 1
    },

    resetZoom() {
      this.resetViewportToContent()
    },

    zoomIn() {
      const nextZoom = Math.min(this.maxZoom, this.zoom * 1.25)
      const vbW = this.canvasW / nextZoom
      const vbH = this.canvasH / nextZoom

      this.viewX = this.viewX + (this.canvasW / this.zoom - vbW) / 2
      this.viewY = this.viewY + (this.canvasH / this.zoom - vbH) / 2
      this.zoom = nextZoom
    },

    zoomOut() {
      const nextZoom = Math.max(this.minZoom, this.zoom / 1.25)
      const vbW = this.canvasW / nextZoom
      const vbH = this.canvasH / nextZoom

      this.viewX = this.viewX - (vbW - this.canvasW / this.zoom) / 2
      this.viewY = this.viewY - (vbH - this.canvasH / this.zoom) / 2
      this.zoom = nextZoom
    }
  }
}
