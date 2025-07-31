<template>
    <div>
      <canvas ref="pieChart"></canvas>
    </div>
  </template>
  
  <script>
  import { Chart, registerables } from 'chart.js';
  
  export default {
    name: "PieChart",
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
  
      // Khởi tạo biểu đồ
      new Chart(this.$refs.pieChart, {
        type: "pie",
        data: this.chartData,
        options: this.chartOptions
      });
    }
  };
  </script>