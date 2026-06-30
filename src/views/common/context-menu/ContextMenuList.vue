<template>
  <ul
    v-for="section in sections"
    :key="section.key"
    class="context-menu-section"
  >
    <li
      v-for="item in section.items"
      :key="`${section.key}-${item.action || item.submenuKey || item.label}`"
      class="context-menu-item"
      :class="{
        danger: item.danger,
        disabled: item.disabled,
        'paste-enabled': item.pasteEnabled,
      }"
      @click.stop="handleItemClick(item)"
    >
      <span>{{ item.label }}</span>
      <span v-if="item.submenuKey" class="arrow">▶</span>

      <div
        v-if="item.submenuKey && isOpen(0, item.submenuKey)"
        class="submenu"
        :class="item.submenuClass"
        @click.stop
      >
        <template v-if="item.submenuType === 'compareSetting'">
          <div v-if="compareSettingLoading" class="submenu-item compare-submenu-status">
            Loading IED list...
          </div>
          <div v-else-if="!compareSettingOptions.length" class="submenu-item compare-submenu-status">
            No IED available
          </div>
          <template v-else>
            <div
              v-for="option in compareSettingOptions"
              :key="`compare-ied-${option.id}`"
              class="submenu-item"
              :class="{ 'compare-submenu-item-selected': selectedCompareIedId === option.id }"
              @click.stop="$emit('select-compare-setting', option)"
            >
              {{ option.name }}
            </div>
          </template>
        </template>

        <template v-else-if="item.submenuType === 'compareOvercurrentCharacteristic'">
          <div v-if="compareOvercurrentLoading" class="submenu-item compare-submenu-status">
            Loading IED list...
          </div>
          <div v-else-if="!compareOvercurrentOptions.length" class="submenu-item compare-submenu-status">
            No IED available
          </div>
          <template v-else>
            <div
              v-for="option in compareOvercurrentOptions"
              :key="`compare-overcurrent-ied-${option.id}`"
              class="submenu-item"
              :class="{ 'compare-submenu-item-selected': selectedCompareOvercurrentIedId === option.id }"
              @click.stop="$emit('select-compare-overcurrent', option)"
            >
              {{ option.name }}
            </div>
          </template>
        </template>

        <template v-else>
          <div
            v-for="child in item.children || []"
            :key="child.action || child.label"
            class="submenu-item"
            :class="{ danger: child.danger }"
            @click.stop="$emit('action', child.action)"
          >
            {{ child.label }}
          </div>
        </template>
      </div>
    </li>
  </ul>
</template>

<script>
export default {
  name: "ContextMenuList",
  props: {
    sections: { type: Array, default: () => [] },
    activePath: { type: Array, default: () => [] },
    compareSettingLoading: { type: Boolean, default: false },
    compareSettingOptions: { type: Array, default: () => [] },
    selectedCompareIedId: { type: [String, Number], default: null },
    compareOvercurrentLoading: { type: Boolean, default: false },
    compareOvercurrentOptions: { type: Array, default: () => [] },
    selectedCompareOvercurrentIedId: { type: [String, Number], default: null },
  },
  emits: ["action", "open-submenu", "select-compare-setting", "select-compare-overcurrent"],
  methods: {
    isOpen(level, key) {
      return this.activePath[level] === key;
    },
    handleItemClick(item) {
      if (item.action) {
        this.$emit("action", item.action);
        return;
      }
      if (item.submenuKey) {
        this.$emit("open-submenu", item.submenuKey);
      }
    },
  },
};
</script>

<style scoped>
.context-menu-section {
  list-style: none;
  margin: 0;
  padding: 0;
}

.context-menu-item {
  padding: 10px 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  transition: background 0.2s;
}

.context-menu-item:hover {
  background-color: #f5f5f5;
}

.context-menu-item.disabled {
  color: #9aa3af;
  cursor: not-allowed;
}

.context-menu-item.disabled:hover {
  background-color: transparent;
}

.context-menu-item.paste-enabled {
  color: #111;
  font-weight: 500;
}

.arrow {
  font-size: 12px;
  color: #999;
}

.submenu {
  position: absolute;
  top: 0;
  left: calc(100% + 2px);
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);
  min-width: 180px;
  padding: 8px 0;
  z-index: 1001;
}

.submenu-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: #f5f5f5;
}

.danger {
  color: red;
  font-weight: 500;
}

.context-menu-item.danger:hover,
.submenu-item.danger:hover {
  background-color: #ffeaea;
  color: #d60000;
}

.compare-submenu {
  max-height: 300px;
  overflow: auto;
}

.compare-submenu-status {
  color: #666;
  cursor: default;
}

.compare-submenu-item-selected {
  background: #eaf4ff;
  color: #174f8f;
}
</style>
