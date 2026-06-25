<template>
  <button
    class="sidebar-toggle-modern"
    :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
    @click="$emit('toggle')"
  >
    <i :class="collapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"></i>
  </button>
</template>

<script>
export default {
  name: 'SidebarToggleButton',
  props: {
    collapsed: { type: Boolean, default: false }
  },
  emits: ['toggle']
};
</script>

<style scoped>
.sidebar-toggle-modern {
  width: 34px;
  height: 34px;
  margin-bottom: 10px;
  border: 1px solid rgba(191, 220, 255, 0.35);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.07));
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 6px 12px rgba(8, 22, 47, 0.25);
}

.sidebar-toggle-modern:hover {
  transform: translateY(-1px);
  border-color: rgba(191, 220, 255, 0.55);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.12));
}

.sidebar-toggle-modern i {
  font-size: 14px;
}
</style>
