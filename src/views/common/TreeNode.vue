<template>
  <li @contextmenu.prevent="handleRightClick($event, node)">
    <span
      :class="{ selected: selectedNodes?.some((n) => n.id === node.id) }"
      class="folder"
      @click="toggle"
    >
      <div class="icon-wrapper">
        <img
          v-if="
            node.mode !== 'settingFunction' &&
            node.children &&
            node.children.length > 0
          "
          :src="
            !node.expanded
              ? require('@/assets/colapse.png')
              : require('@/assets/expand.png')
          "
          alt="toggle"
          style="width: 16px; height: 20px"
          @click.stop="toggle"
        />

        <!-- Icons theo mode -->
        <template v-if="node.mode === 'voltageLevel'">
          <img
            :src="require('@/assets/Voltage_Level.png')"
            alt="Voltage"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-if="node.mode === 'settingFunction'">
          <img
            :src="require('@/assets/parameter.png')"
            alt="Parameter"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.mode === 'systemSetting'">
          <img
            :src="require('@/assets/systemSetting.png')"
            alt="System Setting"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.mode === 'protection'">
          <img
            :src="require('@/assets/protection.png')"
            alt="Protection"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.mode === 'group'">
          <img
            :src="require('@/assets/group.png')"
            alt="Group"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.mode === 'bay'">
          <img
            :src="require('@/assets/feeder.png')"
            alt="Feeder"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="node.mode === 'ied'">
          <img
            :src="require('@/assets/IED.png')"
            alt="IED"
            style="width: 16px; height: 16px"
          />
        </template>
        <template v-else-if="dataOwnerType.includes(node.mode)">
          <icon size="16px" folderType="location" badgeColor="146EBE" />
        </template>
        <template v-else-if="dataType.includes(node.mode)">
          <icon size="16px" folderType="owner" badgeColor="146EBE" />
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

        <span class="node-name">{{ node.name || node.serial_no }}</span>
      </div>
    </span>

    <spinner style="margin-left: 20px" v-if="isLoading" />

    <ul v-if="node.expanded && node.mode !== 'settingFunction'">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selectedNodes="selectedNodes"
        @fetch-children="(n) => $emit('fetch-children', n)"
        @show-properties="(n) => $emit('show-properties', n)"
        @update-selection="updateSelection"
        @clear-selection="clearSelection"
        @open-context-menu="
          (event, childNode) => $emit('open-context-menu', event, childNode)
        "
        @toggle-node="(node) => $emit('toggle-node', node)"
      />
    </ul>
  </li>
</template>

<script>
import spinner from "@/views/common/Spinner.vue";
import icon from "@/views/common/Icon.vue";

export default {
  props: ["node", "selectedNodes", "selectedParameterId"],
  name: "TreeNode",
  components: {
    spinner,
    icon,
  },
  data() {
    return {
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
    };
  },
  methods: {
    toggle(event) {
      if (event.ctrlKey) {
        this.updateSelection(this.node);
      } else {
        this.clearSelection();
        this.$emit("show-properties", this.node);

        if (this.node.mode === "settingFunction") {
          this.$emit("select-parameter", this.node);
          return;
        }

        if (!this.node.expanded) {
          this.isLoading = true;
          this.$emit("fetch-children", this.node);

          this.isLoading = false;
        }

        this.$emit("toggle-node", this.node);
      }
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

      this.$emit("open-context-menu", event, node);
    },
  },
};
</script>

<style scoped>
.folder {
  display: block;
  padding: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}
.folder:hover {
  background-color: #555;
  color: white;
}
ul {
  list-style: none;
  padding-left: 20px;
}
.selected {
  background-color: #007bff;
  color: white;
}
.icon-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.node-name {
  white-space: nowrap;
}
</style>
