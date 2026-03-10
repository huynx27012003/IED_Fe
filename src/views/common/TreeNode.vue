<template>
  <li @contextmenu.prevent="handleRightClick($event, node)">
    <span
      :class="{
        selected: selectedNodes?.some((n) => n.id === node.id),
      }"
      class="folder no-select"
      @click="handleRowClick($event)"
      @dblclick.stop="handleRowDblClick($event)"
    >
      <div class="icon-wrapper">
        <template
            v-if="
              node.mode !== 'settingFunction' && node.mode !== 'protectionLevel'
            "
        >
          <div
            class="toggle-icon-container"
            :class="{ loading: isLoading }"
            @click.stop="handleToggleClick($event)"
          >
            <template
            v-if="
              hasChildrenForToggle &&
              !(
                node.mode === 'protectionFunction' &&
                !node.children.some((c) => c.mode === 'protectionLevel')
                ) &&
                !(node.mode === 'ied' && !node.isSclTree && !node.showParamTree)
              "
            >
              <i
                class="fa-solid fa-caret-right toggle-arrow"
                :class="{ rotated: node.expanded, hidden: isLoading }"
              ></i>
            </template>
            <template v-else>
              <span style="display: inline-block; width: 16px; height: 20px"></span>
            </template>
            
            <span class="spinner-inline" :class="{ active: isLoading }"></span>
          </div>
        </template>

        <template v-if="node.mode === 'voltageLevel'">
          <img
            :src="icons.voltage"
            alt="Voltage"
            style="width: 20px; height: 20px"
          />
        </template>
        <template v-if="node.mode === 'settingFunction'">
          <img
            :src="icons.settings"
            alt="Parameter"
            style="width: 16px; height: 16px; margin-left: 25px"
          />
        </template>

        <template v-if="node.mode === 'protectionLevel'">
          <img
            :src="icons.level"
            alt="Parameter"
            style="width: 16px; height: 16px; margin-left: 25px"
          />
        </template>

        <template v-else-if="node.mode === 'systemSetting' || node.mode === 'lineParameters'">
          <img
            :src="icons.systemSetting"
            alt="System Setting"
            style="width: 16px; height: 17px"
          />
        </template>
        <template v-else-if="node.mode === 'protectionFunction'">
          <img
            :src="icons.protection"
            alt="Protection"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.mode === 'protectionGroup'">
          <img
            :src="icons.group"
            alt="Group"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.isSclTree && sclModes.includes(node.mode) && node.mode !== 'service'">
          <span
            v-if="sclBadge"
            class="scl-mode-badge"
            :class="'badge-' + sclBadge.toLowerCase()"
          >{{ sclBadge }}</span>
        </template>

        <template v-else-if="parameterModes.includes(node.mode)">
          <img
            :src="icons.ied"
            alt="Parameter"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.mode === 'bay'">
          <img
            :src="icons.feeder"
            alt="Feeder"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.mode === 'ied'">
          <img
            :src="icons.ied"
            alt="IED"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.mode === 'substation'">
          <img
            :src="icons.location"
            alt="substation"
            style="width: 20px; height: 20px"
          />
        </template>
        <template v-else-if="node.mode === 'organisation'">
          <img
            :src="icons.owner"
            alt="organisation"
            style="width: 25px; height: 25px"
          />
        </template>
        <template v-else-if="assetType.includes(node.asset)">
          <icon size="16px" folderType="asset" badgeColor="146EBE" />
        </template>
        <template v-else-if="node.type === 'job'">
          <icon size="16px" folderType="job" badgeColor="FF0000" />
        </template>
        <template v-else-if="node.type === 'test'">
          <icon size="16px" folderType="test" badgeColor="008001" />
        </template>

        <div class="accent-line" v-if="selectedNodes?.some((n) => n.id === node.id)"></div>
        <span class="node-name">{{ node.name || node.serial_no }}</span>
      </div>
    </span>

    <ul v-if="node.expanded && node.mode !== 'settingFunction'">
      <TreeNode
        v-for="child in visibleChildren"
        :key="child.id"
        :node="child"
        :selectedNodes="selectedNodes"
        :selectedParameterId="selectedParameterId"
        :hide-operation-off="hideOperationOff"
        @fetch-children="(n) => $emit('fetch-children', n)"
        @show-properties="(n) => $emit('show-properties', n)"
        @update-selection="updateSelection"
        @clear-selection="clearSelection"
        @open-context-menu="
          (event, childNode) => $emit('open-context-menu', event, childNode)
        "
        @toggle-node="(node) => $emit('toggle-node', node)"
        @node-dblclick="$emit('node-dblclick', $event)"
      />
    </ul>
  </li>
</template>

<script>
import icon from "@/views/common/Icon.vue";
import collapseIcon from "@/assets/images/colapse.png";
import expandIcon from "@/assets/images/expand.png";
import voltageIcon from "@/assets/images/Voltage_Level.png";
import settingsIcon from "@/assets/images/settings.png";
import levelIcon from "@/assets/images/level.png";
import systemSettingIcon from "@/assets/images/systemSetting.png";
import protectionIcon from "@/assets/images/protection.png";
import groupIcon from "@/assets/images/group.png";
import feederIcon from "@/assets/images/feeder.png";
import iedIcon from "@/assets/images/IED.png";
import locationIcon from "@/assets/images/location.png";
import ownerIcon from "@/assets/images/owner.png";
import dataSetsIcon from "@/assets/images/DataSets.png";
import ldIcon from "@/assets/images/LD.png";
import lnIcon from "@/assets/images/LN.png";
import rIcon from "@/assets/images/R.png";
import daIcon from "@/assets/images/DA.png";
import doIcon from "@/assets/images/DO.png";
import sgIcon from "@/assets/images/SG.png";
import gIcon from "@/assets/images/G.png";

const SCL_BADGE_BY_MODE = {
  dataset: "DS",
  logicalDevice: "LD",
  logicalNode: "LN",
  settingGroup: "SG",
  goose: "G",
  urcb: "R",
  brcb: "R",
  reportControl: "R",
  dataObject: "DO",
  dataAttribute: "DA",
};

const ALL_ICONS = [
  collapseIcon,
  expandIcon,
  voltageIcon,
  settingsIcon,
  levelIcon,
  systemSettingIcon,
  protectionIcon,
  groupIcon,
  feederIcon,
  iedIcon,
  locationIcon,
  ownerIcon,
];
let iconsPreloaded = false;
function preloadIcons() {
  if (iconsPreloaded) return;
  ALL_ICONS.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
  iconsPreloaded = true;
}
preloadIcons();
export default {
  props: ["node", "selectedNodes", "selectedParameterId", "hideOperationOff"],
  name: "TreeNode",
  components: {
    icon,
  },
  data() {
    return {
      loadingTimer: null,
      isLoading: false,
      dataType: ["organisation"],
      dataOwnerType: ["substation", "bay"],
      assetType: [
        "Transformer",
        "Circuit breaker",
        "Current transformer",
        "Disconnector",
        "Surge arrester",
        "Power cable",
        "Voltage transformer",
      ],
      sclModes: [
        "root",
        "service",
        "logicalDevice",
        "logicalNode",
        "goose",
        "dataset",
        "settingGroup",
        "urcb",
        "brcb",
        "reportControl",
        "dataObject",
        "dataAttribute",
        "folder",
      ],
      parameterModes: [
        "parameterRoot",
        "parameter",
        "parameterGroup",
      ],
      icons: {
        collapse: collapseIcon,
        expand: expandIcon,
        voltage: voltageIcon,
        settings: settingsIcon,
        level: levelIcon,
        systemSetting: systemSettingIcon,
        protection: protectionIcon,
        group: groupIcon,
        feeder: feederIcon,
        ied: iedIcon,
        location: locationIcon,
        owner: ownerIcon,
        dataSets: dataSetsIcon,
        ld: ldIcon,
        ln: lnIcon,
        r: rIcon,
        da: daIcon,
        do: doIcon,
        sg: sgIcon,
        g: gIcon,
      },
    };
  },
  created() {
    // no-op (preload already executed at module load)
  },
  computed: {
    sclBadge() {
      if (!this.node?.isSclTree) return "";
      return SCL_BADGE_BY_MODE[this.node?.mode] || "";
    },
    baseChildren() {
      if (!this.node || !Array.isArray(this.node.children)) return [];
      const isSclTree = !!this.node.isSclTree;
      const sclHiddenModes = new Set(["dataObject", "dataAttribute"]);
      // Parameter trees can contain raw pc* nodes that should not be visible in the navigation tree.
      // They are meant to be rendered in the table pane instead of the left tree.
      const hiddenModes = new Set(["pcDataObject"]);
      return this.node.children.filter((child) => {
        if (hiddenModes.has(child?.mode)) return false;
        if (isSclTree && sclHiddenModes.has(child?.mode)) return false;
        const name = String(child.name ?? "")
          .toLowerCase()
          .trim();
        return name !== "operation";
      });
    },
    visibleChildren() {
      let candidates = this.baseChildren;

      if (this.node.isSclTree || this.sclModes.includes(this.node.mode)) {
        // keep all nodes in SCL tree
      }

      if (this.node?.mode === "ied" && !this.node.isSclTree) {
        if (!this.node.showParamTree) {
          return [];
        }
        const pgChildren = candidates.filter((c) => c.mode === "protectionGroup");
        if (pgChildren.length) {
          const showAll = !!this.node.showAllGroups;
          const count = showAll
            ? pgChildren.length
            : Math.max(1, Math.min(this.node.groupVisibleCount || 1, pgChildren.length));
          const allowedIds = new Set(
            pgChildren.slice(0, Math.min(count, pgChildren.length)).map((c) => c.id)
          );
          candidates = candidates.filter((c) =>
            c.mode !== "protectionGroup" || allowedIds.has(c.id)
          );
        }
      }

      if (!this.hideOperationOff) return candidates;
      return candidates.filter((child) => this.hasVisibleSubtree(child));
    },
    hasChildrenForToggle() {
      return this.visibleChildren.length > 0;
    },
    parentName() {
      return this.node?.parentNode?.name || "";
    },
  },
  watch: {
    "node.children"(val) {
      if (this.isLoading && Array.isArray(val)) {
        if (this.loadingTimer) {
          clearTimeout(this.loadingTimer);
          this.loadingTimer = null;
        }
        this.isLoading = false;
      }
    },
  },
  methods: {
    normalize(value) {
      return String(value ?? "")
        .toLowerCase()
        .trim();
    },
    isDirectOperationOff(node) {
      if (!node) return false;
      const children = Array.isArray(node.children)
        ? node.children
        : Array.isArray(node.childrenFromData)
          ? node.childrenFromData
          : [];
      return children.some(
        (child) =>
          this.normalize(child?.name) === "operation" &&
          this.normalize(child?.value) === "off"
      );
    },
    getChildList(node) {
      if (!node) return [];
      if (Array.isArray(node.children)) return node.children;
      if (Array.isArray(node.childrenFromData)) return node.childrenFromData;
      return [];
    },
    hasVisibleSubtree(node) {
      if (!this.hideOperationOff) return true;
      if (!node) return false;

      if (this.isDirectOperationOff(node)) return false;

      const kids = this.getChildList(node).filter((child) => {
        const name = this.normalize(child?.name);
        return name !== "operation";
      });

      if (!kids.length) return true;

      return kids.some((child) => this.hasVisibleSubtree(child));
    },
    toggle(event) {
  if (event && event.button !== 0) return;

  const isToggleIcon =
    event?.target?.getAttribute &&
    event.target.getAttribute("alt") === "toggle";

  const expanding = !this.node.expanded;
  
  const doToggle = () => {
    // Hủy timer cũ nếu có
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }
    
    if (expanding) {
      // Chỉ emit toggle, không cần loading state
      this.$emit("toggle-node", this.node);
      
      // Nếu chưa có children thì fetch
      if (!this.node.children || this.node.children.length === 0) {
        this.$emit("fetch-children", this.node);
      }
    } else {
      // Đóng node ngay lập tức
      this.isLoading = false;
      this.$emit("toggle-node", this.node);
    }
  };

  if (isToggleIcon) {
    doToggle();
    return;
  }

  if (event && event.ctrlKey) {
    this.updateSelection(this.node);
  } else {
    this.clearSelection();
    this.$emit("show-properties", this.node);

    if (
      this.node.mode === "settingFunction" ||
      this.node.mode === "protectionLevel" ||
      (this.node.mode === "protectionFunction" &&
        (!this.node.children ||
          !this.node.children.some((c) => c.mode === "protectionLevel")))
    ) {
      this.$emit("select-parameter", this.node);
      return;
    }
  }

  doToggle();
},

    canToggleNode() {
      if (!this.hasChildrenForToggle) return false;

      if (
        this.node?.mode === "protectionFunction" &&
        Array.isArray(this.node?.children) &&
        !this.node.children.some((c) => c.mode === "protectionLevel")
      ) {
        return false;
      }

      if (this.node?.mode === "ied" && !this.node.isSclTree && !this.node.showParamTree) {
        return false;
      }

      return true;
    },

    handleToggleClick(event) {
      if (event && event.button !== 0) return;
      if (!this.canToggleNode()) return;

      const expanding = !this.node.expanded;

      if (this.loadingTimer) {
        clearTimeout(this.loadingTimer);
        this.loadingTimer = null;
      }

      this.$emit("toggle-node", this.node);

      if (expanding) {
        const children = this.getChildList(this.node);
        if (!children.length) {
          this.$emit("fetch-children", this.node);
        }
      } else {
        this.isLoading = false;
      }
    },

    handleRowClick(event) {
      if (event && event.button !== 0) return;

      if (event && event.ctrlKey) {
        this.updateSelection(this.node);
        return;
      }

      this.clearSelection();
      this.$emit("show-properties", this.node);

      if (
        this.node.mode === "settingFunction" ||
        this.node.mode === "protectionLevel" ||
        (this.node.mode === "protectionFunction" &&
          (!this.node.children ||
            !this.node.children.some((c) => c.mode === "protectionLevel")))
      ) {
        this.$emit("select-parameter", this.node);
      }
    },
    handleRowDblClick(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      // behave exactly like clicking the toggle icon
      this.handleToggleClick({ button: 0 });
    },

    updateSelection(node) {
      this.$emit("update-selection", node);
    },
    clearSelection() {
      this.$emit("clear-selection");
    },

    handleRightClick(event, node) {
      event.preventDefault();
      event.stopPropagation();

      const fastOpenModes = new Set([
        "protectionFunction",
        "protectionLevel",
        "protectionGroup",
        "settingFunction",
        "systemSetting",
        "lineParameters",
      ]);

      if (fastOpenModes.has(node?.mode)) {
        this.$emit("node-dblclick", node);
        return;
      }

      this.$emit("open-context-menu", event, node);
    },
  },
  beforeUnmount() {
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }
  },
};
</script>

<style scoped>
.folder {
  display: block;
  padding: 3px 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: #555;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 4px;
  margin: 1cap 0;
}

.folder:hover {
  background: rgba(0, 198, 255, 0.08);
  backdrop-filter: blur(4px);
  color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

ul {
  list-style: none;
  padding-left: 12px;
  border-left: 1px solid rgba(0, 0, 0, 0.05);
}

.selected {
  background: linear-gradient(90deg, rgba(0, 123, 255, 0.15) 0%, transparent 100%) !important;
  color: #0056b3 !important;
  font-weight: 700;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.toggle-icon-container {
  width: 16px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.toggle-arrow {
  font-size: 12px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #999;
}

.toggle-arrow.hidden {
  visibility: hidden;
}

.toggle-arrow.rotated {
  transform: rotate(90deg);
  color: #007bff;
}

.accent-line {
  position: absolute;
  left: -12px;
  top: 10%;
  height: 80%;
  width: 3px;
  background: #00d2ff;
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.8);
  border-radius: 2px;
}

.node-name {
  white-space: nowrap;
  letter-spacing: 0.3px;
}

img {
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}

.folder:hover img {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

.scl-mode-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 16px;
  min-width: 16px;
  padding: 0 3px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
  color: #fff;
  background: #146ebe;
  flex: none;
  white-space: nowrap;
}

.scl-mode-badge.badge-da,
.scl-mode-badge.badge-do {
  background: #146ebe;
}

.scl-mode-badge.badge-ln,
.scl-mode-badge.badge-ld,
.scl-mode-badge.badge-ds,
.scl-mode-badge.badge-sg,
.scl-mode-badge.badge-g,
.scl-mode-badge.badge-r {
  background: #5a6b7d;
}

.dataset-icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  object-fit: contain;
  padding: 0;
  margin: 0;
  transform: scale(1.5) translateY(2px);
  transform-origin: center center;
  vertical-align: middle;
  filter: none !important;
  box-shadow: none !important;
}

.ld-icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  object-fit: contain;
  padding: 0;
  margin: 0;
  transform: scale(1.5) translateY(2px);
  transform-origin: center center;
  vertical-align: middle;
  filter: none !important;
  box-shadow: none !important;
}

.ln-icon,
.sg-icon,
.g-icon,
.r-icon,
.da-icon,
.do-icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  object-fit: contain;
  padding: 0;
  margin: 0;
  transform: scale(1.5) translateY(2px);
  transform-origin: center center;
  vertical-align: middle;
  filter: none !important;
  box-shadow: none !important;
}

.no-select {
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
}

.spinner-inline {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #cfd8dc;
  border-top-color: #409eff;
  border-radius: 50%;
  position: absolute;
  opacity: 0;
  visibility: hidden;
  transform: translateZ(0);
  will-change: transform;
  pointer-events: none;
}

.spinner-inline.active {
  opacity: 1;
  visibility: visible;
  animation: spinner-rotate 0.6s linear infinite;
}

@keyframes spinner-rotate {
  to {
    transform: translateZ(0) rotate(360deg);
  }
}
</style>
