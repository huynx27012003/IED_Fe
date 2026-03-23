<template>
  <div class="scl-management-tab">
    <SCLManage
      :mode="sclManageMode"
      :title="sclManageTitle"
      :ied-id="iedId"
      :scl-id="sclId"
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
    sclId() {
      return (
        this.ownerData?.sclId ??
        this.ownerData?.node?.sclId ??
        (this.ownerData?.node?.mode === 'sclFile' ? this.ownerData?.node?.id : null) ??
        null
      );
    },
    iedId() {
      return (
        this.ownerData?.node?.id ??
        this.ownerData?.id ??
        null
      );
    },
    sclManageMode() {
      return this.sclId ? 'scl' : 'ied';
    },
    sclManageTitle() {
      if (this.sclId) {
        const fileName = this.ownerData?.fileName || this.ownerData?.node?.name || 'SCL file';
        return `SCL Management for ${fileName}`;
      }
      return `SCL Management for ${this.iedName}`;
    },
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
