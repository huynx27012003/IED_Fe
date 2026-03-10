<template>
  <div class="scl-import-subtree-tab">
    <SCLManage
      mode="global"
      layout="table"
      @control-block-update="(node) => $emit('control-block-update', node)"
    />
  </div>
</template>

<script>
import SCLManage from "@/views/common/SCLManage.vue";

export default {
  name: "SCLImportSubtreeTab",
  components: { SCLManage },
  emits: ["control-block-update"],
};
</script>

<style scoped>
.scl-import-subtree-tab {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #fff;
}
</style>
