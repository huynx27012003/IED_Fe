<template>
  <div class="scl-management-tab">
    <SCLManage
      mode="ied"
      :title="`SCL Management for ${iedName}`"
      @control-block-update="(node) => $emit('control-block-update', node)"
    />
  </div>
</template>

<script>
import SCLManage from "@/views/common/SCLManage.vue";

export default {
  name: "SCLManagementTab",
  components: { SCLManage },
  emits: ["control-block-update"],
  props: {
    ownerData: { type: Object, default: () => ({}) },
  },
  computed: {
    iedName() {
      return (
        this.ownerData?.node?.name ||
        this.ownerData?.name ||
        this.ownerData?.label ||
        "IED"
      );
    },
  },
};
</script>

<style scoped>
.scl-management-tab {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #fff;
}
</style>
