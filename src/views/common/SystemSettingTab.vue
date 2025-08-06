<template>
  <div class="system-setting-tab">
    <h3>{{ ownerData.id }}</h3>
    <h3>Parent: {{ parentName }}</h3>
    <h3>System Setting: {{ ownerData.node.name }}</h3>
    <table class="parameter-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Value</th>
          <th>Unit</th>
          <th>Min</th>
          <th>Max</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in parameterGroups" :key="group.id">
          <tr class="group-header">
            <td :colspan="6">{{ group.name }}</td>
          </tr>
          <tr v-for="param in group.children" :key="param.id">
            <td>{{ param.name }}</td>
            <td>{{ param.value }}</td>
            <td>{{ param.Unit }}</td>
            <td>{{ param.MinVal }}</td>
            <td>{{ param.MaxVal }}</td>
            <td>{{ param.Description }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "SystemSettingTab",
  props: {
    ownerData: {
      type: Object,
      required: true,
    },
    expandedGroup: {
      type: String,
      default: null,
    },
  },
  computed: {
    parameterGroups() {
      return this.ownerData.node?.children || [];
    },

    parentName() {
      const node = this.ownerData?.node || {};
      const parentArr = node.parentArr || [];

      console.log("🔍 Debug parentArr:", parentArr);
      console.log("🔍 Debug ownerData.parent:", this.ownerData.parent);
      console.log("🔍 Debug node.parent:", node.parent);

      if (parentArr.length >= 1) {
        const last = parentArr[parentArr.length - 1];
        console.log("✅ parentName from parentArr:", last.name || last.parent);
        return last.name || last.parent || "(unnamed parent)";
      }

      if (this.ownerData.parent?.name) {
        console.log(
          "✅ parentName from ownerData.parent:",
          this.ownerData.parent.name
        );
        return this.ownerData.parent.name;
      }

      if (node.parent?.name) {
        console.log("✅ parentName from node.parent:", node.parent.name);
        return node.parent.name;
      }

      console.log("⚠️ parentName fallback to '(no parent)'");
      return "(no parent)";
    },
  },
  mounted() {
    console.log("✅ Mounted with ownerData:", this.ownerData);
    console.log("Node:", this.ownerData.node);
  },
};
</script>
<style scoped>
.parameter-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 30px;
}

.parameter-table th,
.parameter-table td {
  border: 1px solid #ccc;
  padding: 6px;
  text-align: left;
}
.group-header {
  background-color: #d9e3f0;
  font-weight: bold;
}
thead {
  background-color: #e1e1e1;
}
.group-header td {
  background-color: #eaf4ff;
}
</style>
