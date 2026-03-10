export function useTabs() {
  return {
    handleOpenTab(payload) {
      this.closeContextMenu();
      if (!payload || !payload.id || !payload.node) return;

      const newTab = { ...payload };
      const exists = this.tabs.find((t) => t.id === newTab.id);
      if (!exists) {
        this.tabs.push(newTab);
        this.activeTab = { ...newTab };
      } else {
        Object.assign(exists, newTab);
        this.activeTab = { ...exists };
      }

      if (newTab.node.mode === "parameter") {
        const parentId = this.fetchParent(newTab.node);
        const idx = this.tabs.findIndex((t) => t.node?.id === parentId);
        if (idx !== -1 && this.tabs[idx].id !== newTab.id) {
          this.tabs.splice(idx, 1);
        }
      }

      this.$emit("input", this.activeTab);
      this.$nextTick(() => {
        this.$nextTick(() => {
          if (this.activeTab.id && this.$refs.tabsServer) {
            this.$refs.tabsServer.scrollToActiveTab();
          } else {
            console.warn("activeTab.id still undefined or tabsServer not ready");
          }
        });
      });
    },
    scrollToActiveTab() {
      this.$nextTick(() => {
        const tabsHeader =
          this.$refs.contentData.querySelector(".tabs-header-data");
        const tabItems = this.$refs.contentData.querySelectorAll(".tab-item");
        if (tabsHeader && tabItems) {
          const activeTabElement = Array.from(tabItems).find((el) =>
            el.classList.contains("active")
          );
          if (activeTabElement) {
            activeTabElement.scrollIntoView({
              behavior: "smooth",
              inline: "center",
            });
          } else {
            console.warn(
              "No active tab element found for ID:",
              this.activeTab.id
            );
            const matchingTab = this.tabs.find((t) => t.id === this.activeTab.id);
            if (matchingTab) {
              this.activeTab = { ...matchingTab };
              this.$emit("input", this.activeTab);

              this.$nextTick(() => {
                const newActiveTabElement = Array.from(tabItems).find((el) =>
                  el.classList.contains("active")
                );
                if (newActiveTabElement) {
                  newActiveTabElement.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                  });
                }
              });
            }
          }
        }
      });
    },
    openTabForNode(node) {
      if (!node || !node.id) return;
      const existingIndex = this.tabs.findIndex((tab) => tab.id === node.id);
      if (existingIndex !== -1) {
        this.activeTab = this.tabs[existingIndex];
      } else {
        this.tabs.push(node);
        this.activeTab = node;
      }
      this.closeContextMenu();
    },
    removeTab(index) {
      const closedTabId = this.tabs[index].id;
      this.tabs.splice(index, 1);
      if (this.activeTab.id === closedTabId) {
        if (this.tabs.length > 0) {
          this.activeTab = { ...this.tabs[this.tabs.length - 1] };
        } else {
          this.activeTab = {};
        }
        this.$emit("input", this.activeTab);
      }
    },
  };
}
