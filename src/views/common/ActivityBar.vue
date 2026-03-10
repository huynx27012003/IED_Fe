<template>
  <div class="activity-bar">
    <div class="activity-bar-top">
      <div
        v-for="item in topItems"
        :key="item.id"
        :class="['activity-bar-item', { active: activeView === item.id }]"
        :title="item.title"
        @click="$emit('view-change', item.id)"
      >
        <i :class="item.icon"></i>
        <div v-if="activeView === item.id" class="active-indicator"></div>
      </div>
    </div>
    <div class="activity-bar-bottom">
      <div
        v-for="item in bottomItems"
        :key="item.id"
        :class="[
          'activity-bar-item',
          {
            active:
              item.action === 'toggleSidebar'
                ? !sidebarCollapsed
                : activeView === item.id,
          },
        ]"
        :title="getBottomTitle(item)"
        @click="handleBottomClick(item)"
      >
        <i :class="[getBottomIcon(item), getBottomIconClass(item)]"></i>
        <div
          v-if="
            item.action === 'toggleSidebar'
              ? !sidebarCollapsed
              : item.action === 'noop'
                ? false
                : activeView === item.id
          "
          class="active-indicator"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActivityBar',
  props: {
    activeView: {
      type: String,
      default: 'explorer'
    },
    sidebarCollapsed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['view-change', 'toggle-sidebar'],
  data() {
    return {
      topItems: [
        {
          id: 'explorer',
          icon: 'fa-solid fa-folder-tree',
          title: 'Explorer - Tree View'
        },
        {
          id: 'mock1',
          icon: 'fa-solid fa-file-import',
          title: 'SCL Import'
        },
        // {
        //   id: 'mock2',
        //   icon: 'fa-brands fa-github',
        //   title: 'Source Control (Mock View 2)'
        // }
      ],
      bottomItems: [
        {
          id: 'whatsNew',
          icon: 'fa-solid fa-compass',
          title: "What's new",
          action: 'noop'
        },
        {
          id: 'help',
          icon: 'fa-solid fa-circle-question',
          title: 'Help',
          action: 'noop'
        },
        {
          id: 'toggleSidebar',
          titleExpand: 'Expand sidebar',
          titleCollapse: 'Collapse sidebar',
          action: 'toggleSidebar'
        }
      ]
    };
  },
  methods: {
    getBottomTitle(item) {
      if (item.action === 'toggleSidebar') {
        return this.sidebarCollapsed
          ? item.titleExpand || 'Expand sidebar'
          : item.titleCollapse || 'Collapse sidebar';
      }
      return item.title || '';
    },
    getBottomIcon(item) {
      if (item.action === 'toggleSidebar') {
        return 'fa-solid fa-right-to-bracket';
      }
      return item.icon || '';
    },
    getBottomIconClass(item) {
      if (item.action === 'toggleSidebar' && !this.sidebarCollapsed) {
        return 'toggle-collapse';
      }
      return '';
    },
    handleBottomClick(item) {
      if (item.action === 'toggleSidebar') {
        this.$emit('toggle-sidebar');
        return;
      }
      if (item.action === 'noop') return;
      this.$emit('view-change', item.id);
    }
  }
};
</script>

<style scoped>
.activity-bar {
  width: 48px;
  min-width: 48px;
  height: 100%;
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  background-attachment: fixed;
  background-size: 100% 100vh;
  background-position: 0 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: none;
  z-index: 10000;
}

.activity-bar-top,
.activity-bar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 25px 0;
}

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

.activity-bar-item i {
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.2s ease;
}
.activity-bar-item:hover i {
  transform: scale(1.1);
}

.activity-bar-item i.toggle-collapse {
  transform: scaleX(-1);
}

.activity-bar-item:hover i.toggle-collapse {
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
