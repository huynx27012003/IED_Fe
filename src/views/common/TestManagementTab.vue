<template>
    <div class="test-management-tab">
      <h3>Test Management Tab</h3>
      <p>This is the tab for test management of: {{ ownerData.id }}</p>
    </div>
  </template>
  
  <script>
  export default {
    name: "TestManagementTab",
    props: {
      ownerData: Object,
    },
  };
  </script>
  
  <style scoped>
  .test-management-tab {
    padding: 20px;
  }
  </style>
  