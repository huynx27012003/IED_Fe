<template>
  <div class="hardware-info-view">
    <div v-if="isLoading" class="loading">Loading hardware info...</div>
    <div v-else-if="visibleRows.length" class="table-container">
      <table class="hardware-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
            <th>Connector</th>
            <th>References</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="row in visibleRows" 
            :key="row.id"
            :class="['row-' + row.mode, { 'group-row': row.isGroup && row.mode !== 'hwInOut' && !isExcludedFromBold(row) }]"
          >
            <td class="param-name" :style="{ paddingLeft: (row.depth * 20 + 10) + 'px' }">
              {{ row.name }}
            </td>
            <td :class="['value-col', cellClass(row.value, row.mode)]">{{ row.value || '' }}</td>
            <td :class="['connector-col', cellClass(row.connector, row.mode)]">{{ row.connector || '' }}</td>
            <td :class="['references-col', cellClass(row.references, row.mode)]">{{ row.references || '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="no-data">No hardware information available.</div>
  </div>
</template>

<script>
import { getHardwareByIed } from "@/api/device";

export default {
  name: "HardWareInfoView",
  props: {
    ownerData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      hardwareData: null,
      isLoading: false,
      visibleRows: [],
    };
  },
  computed: {
    iedId() {
      return this.ownerData?.node?.id || this.ownerData?.id;
    },
  },
  watch: {
    iedId: {
      handler(newId) {
        if (newId) {
          this.fetchHardwareInfo(newId);
        }
      },
      immediate: true,
    },
  },
  methods: {
    async fetchHardwareInfo(iedId) {
      if (!iedId) return;
      this.isLoading = true;
      try {
        const data = await getHardwareByIed(iedId);
        this.hardwareData = data;
        this.visibleRows = this.flattenHardware(data);
        console.log("Hardware Info Response:", data);
      } catch (error) {
        console.error("Failed to fetch hardware info:", error);
        this.hardwareData = null;
        this.visibleRows = [];
      } finally {
        this.isLoading = false;
      }
    },
    flattenHardware(node, depth = 0) {
      if (!node) return [];
      
      let rows = [];
      const isGroup = node.children && node.children.length > 0;
      
      // Map data based on mode
      const connector = node.mode === "hwInOut" ? node.description : "";
      const references = node.mode !== "hwInOut" ? node.description : "";

      rows.push({
        id: node.id,
        name: node.name,
        value: node.value,
        mode: node.mode,
        connector: connector,
        references: references,
        depth: depth,
        isGroup: isGroup
      });

      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          rows = rows.concat(this.flattenHardware(child, depth + 1));
        });
      }
      
      return rows;
    },
    isNullish(v) {
      return (
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
      );
    },
    cellClass(v, mode) {
      if (mode === 'hardwareModule' || mode === 'hardwareInformation') return "";
      return this.isNullish(v) ? "null-cell" : "";
    },
    isExcludedFromBold(row) {
      const name = (row.name || "").toLowerCase();
      return name === "binary input" || name === "binary output";
    },
    // Resize Logic
    initResize() {
      const table = this.$el.querySelector('.hardware-table');
      if (!table) return;
      const headers = table.querySelectorAll('th');
      
      headers.forEach(header => {
        if (header.querySelector('.resizer-handle')) return;

        const resizer = document.createElement('div');
        resizer.classList.add('resizer-handle');
        resizer.style.height = '100vh'; // Kéo dài xuống tận đáy màn hình để tạo cảm giác kéo dọc bảng
        resizer.style.width = '7px'; // Tăng lên một chút cho dễ tóm
        resizer.style.position = 'absolute';
        resizer.style.right = '-3px'; // Căn giữa vào đường biên
        resizer.style.top = '0';
        resizer.style.cursor = 'col-resize';
        resizer.style.userSelect = 'none';
        resizer.style.zIndex = '10'; // Đảm bảo nằm trên nội dung cell
        
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
        e.preventDefault(); // Prevent text selection
        e.stopPropagation();
      });
      
      // Stop propagation to prevent sorting or other header clicks
      resizer.addEventListener('click', (e) => e.stopPropagation());
    }
  },
  mounted() {
    // Init resize after data render or verify DOM
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
.hardware-info-view {
  width: 100%;
  height: 100%;
  background-color: #fff;
}

.table-container {
  padding-bottom: 50px;
}

.hardware-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed; /* Quan trọng để resize hoạt động mượt mà */
}

.hardware-table th {
  height: 30px;
  padding: 0 8px;
  line-height: 30px;
  white-space: nowrap;
  box-sizing: border-box;
  position: relative; /* Quan trọng cho resizer */
  border: 1px solid #ccc;
}

.hardware-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis; /* Thêm ellipsis cho đẹp */
  white-space: nowrap;
}

.hardware-table th:hover .resizer-handle {
  background-color: #ddd; /* Hiện màu khi hover header để biết chỗ kéo */
}

.resizer-handle:hover {
  background-color: #409eff !important; /* Màu xanh khi di chuột chuẩn bị kéo */
}

thead {
  background-color: #e1e1e1;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid #999;
  box-shadow: 0 -20px 0 20px #fff;
}

.param-name {
  white-space: nowrap;
}

.group-row {
  font-weight: bold;
}

/* Background colors matching SystemSettingTab hierarchy */
.row-hardwareInformation {
  background-color: #b3c7f2;
  position: sticky;
  top: 30px; /* Khớp chính xác với height của header */
  z-index: 9;
}

.row-hardwareModule {
  background-color: #b0dce8;
}

.row-hwParameter,
.row-hwInOut {
  background-color: transparent;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 14px;
}

.null-cell {
  background-color: #f3f3f3;
  color: #666;
  font-style: italic;
}
</style>
