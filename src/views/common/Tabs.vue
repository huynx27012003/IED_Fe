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
          :class="{ active: activeTab?.id === tab?.id }"
          ref="tabItems"
        >
          <i
            style="color: #fdd835; margin-right: 8px"
            class="fa-solid fa-folder-open mgr-10 mgl-10"
          ></i>
          <span v-if="dataTypeOwner.includes(tab?.mode)" class="tab-label">
            {{ tab?.name }}
          </span>
          <span v-else-if="dataType.includes(tab?.mode)" class="tab-label">
            {{ tab?.name }}
          </span>
          <span v-else-if="assetType.includes(tab?.asset)" class="tab-label">
            {{ tab?.serial_no }}
          </span>
          <span v-else-if="tab?.type === 'job'" class="tab-label">{{
            tab?.name
          }}</span>
          <span v-else-if="tab?.type === 'test'" class="tab-label">{{
            tab?.name
          }}</span>
          <span v-else class="tab-label">
            {{ tab?.name || "Untitled" }}
          </span>
          <span
            class="close-icon mgr-10 mgl-10"
            :class="{
              visible: hoveredTab === tab?.id || activeTab?.id === tab?.id,
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
      <div v-for="item in tabs" :key="item?.id || 'tab-' + index">
        <component
          v-show="activeTab?.id === item?.id"
          ref="componentLoadData"
          :sideData="sideSign"
          :is="checkTab(item)"
          :ownerData="item"
          :expandedGroup="item.node?.id"
          @edit-start="handleEditStart"
        ></component>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import SystemSettingTab from "@/views/common/SystemSettingTab.vue";
import TestManagementTab from "@/views/common/TestManagementTab.vue";

export default {
  name: "Tabs",
  components: {
    SystemSettingTab,
    TestManagementTab,
  },
  model: {
    prop: "value",
    event: "input",
  },
  props: {
    value: Object,
    tabs: Array,
    side: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      activeTab: this.value || {},
      sideSign: this.side,
      hoveredTab: null,
      canScrollLeft: false,
      canScrollRight: false,
      dataType: ["location", "voltage", "feeder"],
      dataTypeOwner: ["OWNER1", "OWNER2", "OWNER3", "OWNER4", "OWNER5"],
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
  watch: {
    value(newVal) {
      if (newVal && (!this.activeTab || newVal.id !== this.activeTab.id)) {
        this.activeTab = { ...newVal }; // Đồng bộ activeTab với value
        this.$nextTick(() => {
          this.scrollToActiveTab(); // Cuộn đến tab active sau khi cập nhật
        });
      }
    },
    tabs(newVal, oldVal) {
      if (newVal.length > oldVal.length) {
        const newTab = newVal[newVal.length - 1]; // Lấy tab mới nhất
        this.activeTab = { ...newTab }; // Đặt làm active
        this.$emit("input", newTab); // Phát sự kiện để đồng bộ với parent
        this.$nextTick(() => {
          this.scrollToActiveTab(); // Cuộn đến tab active
        });
      }
      this.checkScroll();
    },
  },
  methods: {
    async selectTab(tab, index) {
      if (tab && tab.id !== this.activeTab?.id) {
        this.activeTab = { ...tab };
        this.$emit("input", tab);
        console.log("🖱️ Tabs.vue selectTab:", tab.id);
        this.$nextTick(() => {
          this.verifyActiveTab();
        });
      }
    },
    scrollToActiveTab() {
      this.$nextTick(() => {
        const tabItems = this.$refs.tabItems;
        if (tabItems && this.activeTab?.id) {
          const activeTabElement = Array.from(tabItems).find((el) =>
            el.classList.contains("active")
          );
          if (activeTabElement) {
            activeTabElement.scrollIntoView({
              behavior: "smooth",
              inline: "center",
            });
            console.log("Scrolled to active tab:", this.activeTab.id);
          } else {
            console.warn(
              "No active tab element found for ID:",
              this.activeTab.id
            );
            const matchingTab = this.tabs.find(
              (t) => t.id === this.activeTab.id
            );
            if (matchingTab) {
              this.activeTab = { ...matchingTab };
              this.$emit("input", this.activeTab);
              this.$nextTick(() => {
                this.scrollToActiveTab(); // Thử lại sau khi cập nhật
              });
            }
          }
        }
      });
    },
    closeTab(index) {
      this.$emit("close-tab", index);
    },
    checkScroll() {
      this.$nextTick(() => {
        const header = this.$refs.tabsHeader;
        if (header) {
          this.canScrollLeft = header.scrollLeft > 0;
          this.canScrollRight =
            header.scrollLeft + header.clientWidth < header.scrollWidth;
        }
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
        if (!header || !tabItems || tabItems.length === 0) return;
        const moveBy = step * (tabItems[0].offsetWidth || 50);
        if (moveBy) {
          header.scrollBy({ left: moveBy, behavior: "smooth" });
          setTimeout(this.checkScroll, 300);
        }
      });
    },
    checkTab(tab) {
      if (tab?.component === "SystemSettingTab") {
        return "SystemSettingTab";
      }
      if (tab?.component === "TestManagementTab") {
        return "TestManagementTab";
      }
      if (this.dataType.includes(tab?.mode)) {
        return "LocationViewData";
      } else if (this.dataTypeOwner.includes(tab?.mode)) {
        return "OwnerView";
      } else {
        if (tab?.asset !== undefined) {
          if (tab.asset === "Transformer") {
            return "Transformer";
          } else if (tab.asset === "Circuit breaker") {
            return "CircuitBreaker";
          } else {
            return "Transformer";
          }
        } else {
          return "LocationViewData";
        }
      }
    },
    handleEditStart() {
      const currentComponent = this.$refs.componentLoadData.find(
        (comp) => comp?.$vnode?.key === this.activeTab?.id
      );
      if (currentComponent) {
        currentComponent.isEditing = true;
      }
    },
    verifyActiveTab() {
      this.scrollToActiveTab(); // Gọi scrollToActiveTab thay vì logic cũ
    },
  },
};
</script>

<style scoped>
/* CSS giữ nguyên không đổi */
</style>

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
  padding: 3px;
  gap: 8px;
  box-sizing: border-box;
  width: calc(100% - 40px);
  border-bottom: 1px rgb(224, 222, 222) solid;
  flex-wrap: nowrap; /* Không cho xuống dòng */
  overflow-x: hidden;
  overflow-y: hidden;
  padding: 0px 10px;
  margin: 0px 10px;
}
.tab-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px; /* Khoảng trống trái, phải cho nút tab */
  cursor: pointer; /* Dấu hiệu có thể bấm được */
  transition: all 0.3s; /* Tạo hiệu ứng mượt mà khi hover hoặc active */
  white-space: nowrap; /* Giữ nội dung tab trên một dòng */
  position: relative; /* Giúp ta can thiệp một số phần tử pseudo (nếu cần) */
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
  background-color: rgb(255, 255, 255);
  border-bottom: 3px solid #012596; /* Màu xanh đặc trưng của Google, có thể đổi */
  font-weight: bold;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.close-icon:hover {
  background-color: #e8e8e8;
}
.close-icon {
  cursor: pointer;
  color: rgb(97, 97, 97);
  font-size: 10px;
  visibility: hidden;
  width: 20px;
  height: 20px; /* Đảm bảo chiều cao bằng với chiều rộng để hiển thị hình tròn */
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid transparent; /* Thêm đường viền */
  border-radius: 50%;
}
.close-icon.visible {
  visibility: visible;
}
.scroll-btn {
  box-sizing: border-box;
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
  /* margin-right: 10px; */
}

.tabs-content::-webkit-scrollbar {
  width: 0;
}
</style>
