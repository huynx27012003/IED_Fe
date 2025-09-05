<!-- eslint-disable -->
<template>
  <div ref="customTabs" class="custom-tabs">
    <div class="tabs-header">
      <div class="scroll-btn left" @click="scrollLeft">
        <i class="fa-solid fa-chevron-left"></i>
      </div>

      <div class="tabs-header-data" ref="tabsHeader" @scroll="checkScroll">
        <div
          v-for="(tab, index) in tabs"
          :key="tab?.id || index"
          @click="selectTab(tab, index)"
          @mouseover="hoveredTab = tab?.id"
          @mouseleave="hoveredTab = null"
          class="tab-item"
          :class="{ active: modelActive?.id === tab?.id }"
          ref="tabItems"
          :data-tabid="String(tab?.id)"
        >
          <i
            style="color: #fdd835; margin-right: 8px"
            class="fa-solid fa-folder-open mgr-10 mgl-10"
          ></i>

          <!-- label -->
          <span v-if="dataTypeOwner.includes(tab?.mode)" class="tab-label">
            {{ tab?.name }}
          </span>
          <span v-else-if="dataType.includes(tab?.mode)" class="tab-label">
            {{ tab?.name }}
          </span>
          <span v-else-if="assetType.includes(tab?.asset)" class="tab-label">
            {{ tab?.serial_no }}
          </span>
          <span v-else-if="tab?.type === 'job'" class="tab-label">
            {{ tab?.name }}
          </span>
          <span v-else-if="tab?.type === 'test'" class="tab-label">
            {{ tab?.name }}
          </span>
          <span v-else class="tab-label">
            {{ tab?.name || "Untitled" }}
          </span>

          <!-- close icon -->
          <span
            class="close-icon mgr-10 mgl-10"
            :class="{
              visible: hoveredTab === tab?.id || modelActive?.id === tab?.id,
            }"
            @click.stop="closeTab(index)"
            >✖</span
          >
        </div>
      </div>

      <div class="scroll-btn right" @click="scrollRight">
        <i class="fa-solid fa-angle-right"></i>
      </div>
    </div>

    <div class="tabs-content">
      <div v-for="(item, idx) in tabs" :key="item?.id || 'tab-' + idx">
        <component
          v-show="modelActive?.id === item?.id"
          ref="componentLoadData"
          :sideData="sideSign"
          :is="checkTab(item)"
          :ownerData="item"
          :tree="tree"
          :expandedGroup="item.node?.id"
          :focusNode="item.focusNode"
          @saveAll="$emit('node-dblclick', $event)"
          @edit-start="handleEditStart"
          @device-saved="$emit('refresh-tree')"
          @device-created="$emit('refresh-tree')"
        ></component>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import SystemSettingTab from "@/views/ParameterSettingView/SystemSettingTab.vue";
import TestManagementTab from "@/views/GroupView/TestManagementTab.vue";
import AddDevice from "@/views/AddDeviceView/AddDevice.vue";
import OwnerView from "@/views/OrganisationView/index.vue";

export default {
  name: "Tabs",
  components: { SystemSettingTab, TestManagementTab, AddDevice, OwnerView },

  props: {
    modelValue: { type: Object, default: () => ({}) },
    tabs: Array,
    side: { type: String, required: true },
    tree: { type: Array, default: () => [] },
  },
  emits: ["update:modelValue", "close-tab", "refresh-tree"],

  data() {
    return {
      sideSign: this.side,
      hoveredTab: null,
      canScrollLeft: false,
      canScrollRight: false,
      dataType: ["location", "voltage", "feeder"],
      dataTypeOwner: ["organisation"],
      assetType: [
        "Transformer",
        "Circuit breaker",
        "Current transformer",
        "Disconnector",
        "Surge arrester",
        "Power cable",
        "Voltage transformer",
      ],
    };
  },

  computed: {
    modelActive: {
      get() {
        return this.modelValue || {};
      },
      set(v) {
        this.$emit("update:modelValue", v);
      },
    },
  },

  watch: {
    modelValue: {
      handler() {
        this.$nextTick(() => this.scrollToActiveTab());
      },
      immediate: true,
    },
    tabs() {
      this.$nextTick(() => this.checkScroll());
    },
  },

  mounted() {
    this.$nextTick(() => this.scrollToActiveTab());
  },

  methods: {
    selectTab(tab) {
      this.modelActive = tab;
    },

    scrollToActiveTab() {
      this.$nextTick(() => {
        const tabsHeader = this.$refs.tabsHeader;
        let tabItems = this.$refs.tabItems;
        if (!Array.isArray(tabItems)) tabItems = tabItems ? [tabItems] : [];

        const activeId =
          this.modelActive?.id != null ? String(this.modelActive.id) : "";
        // console.log("scrollToActiveTab: Checking", {
        //   tabsHeader,
        //   tabItemsCount: tabItems.length,
        //   activeTabId: activeId || undefined,
        // });

        if (!tabsHeader || !tabItems.length || !activeId) return;

        let activeEl =
          tabItems.find((el) => el?.dataset?.tabid === activeId) ||
          tabsHeader.querySelector(`[data-tabid="${activeId}"]`);

        if (activeEl) {
          activeEl.scrollIntoView({ behavior: "smooth", inline: "center" });
          // console.log("Scrolled to active tab:", activeId);
        }
      });
    },

    closeTab(index) {
      this.$emit("close-tab", index);
    },

    checkScroll() {
      this.$nextTick(() => {
        const header = this.$refs.tabsHeader;
        if (!header) return;
        this.canScrollLeft = header.scrollLeft > 0;
        this.canScrollRight =
          header.scrollLeft + header.clientWidth < header.scrollWidth;
      });
    },

    scrollLeft() {
      this.scrollTabs(-2);
    },
    scrollRight() {
      this.scrollTabs(2);
    },

    scrollTabs(step) {
      this.$nextTick(() => {
        const header = this.$refs.tabsHeader;
        const tabItems = this.$refs.tabItems;
        const first = Array.isArray(tabItems) ? tabItems[0] : tabItems;
        if (!header || !first) return;
        header.scrollBy({
          left: step * (first.offsetWidth || 50),
          behavior: "smooth",
        });
        setTimeout(this.checkScroll, 300);
      });
    },

    checkTab(tab) {
      if (tab?.component === "SystemSettingTab") return "SystemSettingTab";
      if (tab?.component === "TestManagementTab") return "TestManagementTab";
      if (tab?.component === "AddDevice") return "AddDevice";
      if (this.dataType.includes(tab?.mode)) return "LocationViewData";
      if (tab?.component === "OwnerView") return "OwnerView";
      if (tab?.asset !== undefined) {
        if (tab.asset === "Transformer") return "Transformer";
        if (tab.asset === "Circuit breaker") return "CircuitBreaker";
        return "Transformer";
      }
      return "LocationViewData";
    },

    handleEditStart() {
      const comps = this.$refs.componentLoadData || [];
      const current = comps.find(
        (c) => c?.$vnode?.key === this.modelActive?.id
      );
      if (current) current.isEditing = true;
    },

    verifyActiveTab() {
      this.scrollToActiveTab();
    },
  },
};
</script>

<style scoped>
.custom-tabs {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding-bottom: 30px;
}
.tabs-header {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  height: 35px;
}
.tabs-header-data {
  display: flex;
  height: 100%;
  box-sizing: border-box;
  width: calc(100% - 40px);
  border-bottom: 1px rgb(224, 222, 222) solid;
  flex-wrap: nowrap;
  overflow-x: hidden;
  overflow-y: hidden;
  padding: 0 10px;
  margin: 0 10px;
  gap: 8px;
}
.tab-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  position: relative;
  border-radius: 4px;
  border-right: 0.5px solid #f4f4f4;
}
.tab-item:last-child {
  border-right: none;
}
.tab-item:hover {
  background-color: #efefef;
}
.tab-item.active {
  background-color: #fff;
  border-bottom: 3px solid #012596;
  font-weight: bold;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.close-icon {
  cursor: pointer;
  color: rgb(97, 97, 97);
  font-size: 10px;
  visibility: hidden;
  width: 20px;
  height: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 50%;
}
.close-icon.visible {
  visibility: visible;
}
.close-icon:hover {
  background-color: #e8e8e8;
}
.scroll-btn {
  display: flex;
  height: 100%;
  cursor: pointer;
  font-size: 15px;
  color: #012596;
  align-items: center;
  justify-content: center;
  width: 20px;
}
.tabs-content {
  width: calc(100% - 50px);
  height: calc(100% - 15px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  margin-left: 20px;
  padding-top: 10px;
}
.tabs-content::-webkit-scrollbar {
  width: 0;
}
</style>
