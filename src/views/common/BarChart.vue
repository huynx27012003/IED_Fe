<template>
  <div class="chart-container">
    <div class="chart-title">Biểu đồ Cột</div>
    <canvas ref="barChart"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';

export default {
  name: "BarChart",
  props: {
    chartData: {
      type: Object,
      required: true
    },
    chartOptions: {
      type: Object,
      default: () => ({})
    }
  },
  mounted() {
    // Đăng ký các thành phần của Chart.js
    Chart.register(...registerables);

    // Tạo biểu đồ cột với responsive và tùy chọn maintainAspectRatio = false để có thể điều chỉnh kích thước theo container
    new Chart(this.$refs.barChart, {
      type: "bar",
      data: this.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...this.chartOptions
      }
    });
  }
};
</script>

<style scoped>
/* Container mở rộng đầy đủ chiều rộng và chiều cao có thể điều chỉnh theo nhu cầu */
.chart-container {
  width: 100%;
  max-width: 100%;
  height: 300px; 
  margin: 20px auto;
  padding: 40px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Đảm bảo canvas chiếm toàn bộ container */
.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

/* Tùy chỉnh tiêu đề biểu đồ */
.chart-title {
  text-align: center;
  font-size: 1.4em;
  margin-bottom: 10px;
  color: #333;
}
</style>
