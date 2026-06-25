<template>
  <div
    :class="['activity-bar-item', { active }]"
    :title="title"
    @click="$emit('click', $event)"
  >
    <i :class="[icon, iconClass]"></i>
    <div v-if="active" class="active-indicator"></div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'ActivityBarItem',
  props: {
    icon: { type: String, required: true },
    iconClass: { type: String, default: '' },
    title: { type: String, default: '' },
    active: { type: Boolean, default: false }
  },
  emits: ['click']
};
</script>

<style scoped>
.activity-bar-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.5);
}

.activity-bar-item:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.activity-bar-item.active {
  color: #fff;
}

.activity-bar-item > i {
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.2s ease;
}

.activity-bar-item:hover > i {
  transform: scale(1.1);
}

.activity-bar-item > i.toggle-collapse {
  transform: scaleX(-1);
}

.activity-bar-item:hover > i.toggle-collapse {
  transform: scaleX(-1) scale(1.1);
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: #00d2ff;
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.8);
  border-radius: 0 2px 2px 0;
}
</style>
