<template>
  <transition name="panel">
    <div v-if="detailNode" class="detail-panel">
      <div class="detail-card">
        <div class="detail-header" :style="{ background: detailNode.headerColor }">
          <span class="detail-glyph-box">{{ detailNode.glyph }}</span>
          <div style="flex: 1">
            <div class="detail-name">{{ detailNode.id }}</div>
            <div class="detail-type">{{ detailNode.type }}</div>
          </div>
          <button class="detail-close" @click="$emit('close-node')">✕</button>
        </div>

        <div class="detail-ports">
          <div
            v-for="(port, idx) in detailNode.ports"
            :key="port.mrid || `${detailNode.id}-detail-${idx}`"
            class="detail-port"
          >
            <div class="dp-header">
              <span class="dp-dot" :style="{ background: portColor(port) }" />
              <span class="dp-name">{{ port.name }}</span>
              <span class="dp-badge" :class="normalizeFlag(port.operation) === 'On' ? 'on' : 'off'">
                {{ normalizeFlag(port.operation) }}
              </span>
              <span v-if="hasRedundancy(port)" class="dp-badge prp">{{ port.redundancy }}</span>
            </div>

            <div class="dp-grid">
              <div class="dp-row"><span>IP</span><strong>{{ port.ipAddress || '—' }}</strong></div>
              <div class="dp-row"><span>Mask</span><strong>{{ port.subnetMask || '—' }}</strong></div>
              <div class="dp-row"><span>Gateway</span><strong>{{ port.defaultGateway || '—' }}</strong></div>
              <div class="dp-row"><span>Subnet</span><strong>{{ port.subNetwork || '—' }}</strong></div>
              <div class="dp-row"><span>Type</span><strong>{{ port.type || '—' }}</strong></div>
              <div class="dp-row">
                <span>Destination</span>
                <strong style="color: #0f766e">{{ port.destination || '—' }}</strong>
              </div>
            </div>

            <div class="dp-services">
              <span v-for="svc in activeServices(port)" :key="svc.key" class="svc-pill">
                {{ svc.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <transition name="panel">
    <div v-if="detailEdge" class="detail-panel">
      <div class="detail-card">
        <div class="detail-header" :style="{ background: detailEdge.color }">
          <span class="detail-glyph-box">LN</span>
          <div style="flex: 1">
            <div class="detail-name">{{ detailEdge.srcId }} → {{ detailEdge.dstId }}</div>
            <div class="detail-type">{{ detailEdge.portName }}</div>
          </div>
          <button class="detail-close" @click="$emit('close-edge')">✕</button>
        </div>

        <div class="detail-ports">
          <div class="detail-port">
            <div class="dp-header">
              <span class="dp-dot" :style="{ background: detailEdge.color }" />
              <span class="dp-name">{{ detailEdge.label }}</span>
              <span class="dp-badge" :class="detailEdge.operation === 'On' ? 'on' : 'off'">
                {{ detailEdge.operation }}
              </span>
              <span v-if="detailEdge.redundancy" class="dp-badge prp">{{ detailEdge.redundancy }}</span>
            </div>

            <div class="dp-grid">
              <div class="dp-row"><span>Source IED</span><strong>{{ detailEdge.srcId }}</strong></div>
              <div class="dp-row"><span>Destination</span><strong>{{ detailEdge.dstId }}</strong></div>
              <div class="dp-row"><span>Port</span><strong>{{ detailEdge.portName || '—' }}</strong></div>
              <div class="dp-row"><span>IP</span><strong>{{ detailEdge.ipAddress || '—' }}</strong></div>
              <div class="dp-row"><span>Subnet</span><strong>{{ detailEdge.subNetwork || '—' }}</strong></div>
              <div class="dp-row"><span>Gateway</span><strong>{{ detailEdge.defaultGateway || '—' }}</strong></div>
            </div>

            <div class="dp-services">
              <span
                v-for="svc in detailEdge.services"
                :key="svc.key"
                class="svc-pill"
                :style="{
                  color: svc.color,
                  borderColor: svc.color + '33',
                  background: svc.color + '14'
                }"
              >
                {{ svc.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'NetworkTopologyDetailCard',
  props: {
    detailNode: {
      type: Object,
      default: null
    },
    detailEdge: {
      type: Object,
      default: null
    }
  },
  emits: ['close-node', 'close-edge'],
  methods: {
    normalizeFlag(value) {
      if (value === 1 || value === '1' || value === true || value === 'On') return 'On'
      return 'Off'
    },

    isEnabled(value) {
      return value === 1 || value === '1' || value === true
    },

    hasRedundancy(port) {
      return !!String(port?.redundancy || '').trim()
    },

    portColor(port) {
      if (!port || this.normalizeFlag(port.operation) === 'Off') return '#94a3b8'
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
      return this.serviceMeta().filter((svc) => this.isEnabled(port?.[svc.key]))
    }
  }
}
</script>

<style scoped>
.detail-panel {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  pointer-events: none;
}

.detail-card {
  pointer-events: auto;
  width: 340px;
  max-height: 100%;
  overflow-y: auto;
  background: white;
  border-radius: 16px 0 0 16px;
  border: 1px solid #e2e8f0;
  border-right: none;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
  font-size: 12px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px 0 0 0;
  color: white;
  position: relative;
}

.detail-glyph-box {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.detail-name {
  font-size: 15px;
  font-weight: 700;
}

.detail-type {
  font-size: 11px;
  opacity: 0.8;
}

.detail-close {
  position: absolute;
  top: 10px;
  right: 12px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.detail-ports {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-port {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.dp-header {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.dp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1.5px solid white;
  box-shadow: 0 0 0 1px #e2e8f0;
}

.dp-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 12px;
  flex: 1;
}

.dp-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
}

.dp-badge.on {
  background: #dcfce7;
  color: #15803d;
}

.dp-badge.off {
  background: #fee2e2;
  color: #dc2626;
}

.dp-badge.prp {
  background: #fef3c7;
  color: #92400e;
}

.dp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 8px 12px;
}

.dp-row {
  padding: 3px 0;
  display: flex;
  flex-direction: column;
}

.dp-row span {
  font-size: 9px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dp-row strong {
  font-size: 11px;
  color: #0f172a;
  margin-top: 1px;
}

.dp-services {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 12px 10px;
}

.svc-pill {
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #dbeafe;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
