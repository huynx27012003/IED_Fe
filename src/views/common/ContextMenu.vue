<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
  >
    <transition name="fade">
      <ul>
        <li @click="show"><i class="fa-solid fa-eye"></i> Open</li>
        <li @click="edit"><i class="fa-solid fa-pen-to-square"></i> Edit</li>
        <li @click="downloadNode">
          <i class="fa-solid fa-file-arrow-down"></i> Download
        </li>
        
        <li @click="addChild"><i class="fas fa-plus-circle"></i> Add</li>
        <li @click="duplicate"><i class="fa-solid fa-copy"></i> Duplicate</li>
        <li @click="deleteNode"><i class="fas fa-trash-alt"></i> Delete</li>
      </ul>
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    visible: Boolean,
    position: Object,
    selectedNode: Object,
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        document.addEventListener('click', this.handleClickOutside);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    }
  },
  methods: {
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.$emit('close');
      }
    },
    downloadNode() {
      this.$emit("show-data");
      this.$emit("close");
    },
    deleteNode() {
      if (this.selectedNode) {
        this.$emit("delete-node", this.selectedNode);
      }
      this.$emit("close");
    },
    addChild() {
      if (this.selectedNode) {
        this.$emit("add-child", this.selectedNode);
      }
    },
    show() {
      this.$emit("show-data", this.selectedNode);
      this.$emit("close");
    },
    edit() {
      if (this.selectedNode) {
        this.$emit("edit-node", {
          node: this.selectedNode,
          type: this.selectedNode.type,
        });
        this.$emit("close");
      }
    },
    duplicate() {
      this.$emit("close");
    },
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>

<style>
.context-menu {
  position: fixed;
  z-index: 1000;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
}

.context-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.context-menu li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.context-menu li:hover {
  background-color: #f0f0f0;
}

.context-menu i {
  width: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
