export function useContextMenu() {
  return {
    openContextMenu(event, node) {
      event.preventDefault();
      if (!node || !node.id) return;

      this.rightClickNode = node;
      this.contextMenuVisible = true;
      let posX = event.clientX;
      let posY = event.clientY;
      this.$nextTick(() => {
        const menuEl = document.querySelector(".context-menu");
        if (menuEl) {
          const menuRect = menuEl.getBoundingClientRect();
          const maxHeight = window.innerHeight * 0.8;
          const menuHeight = Math.min(menuRect.height, maxHeight);
          if (posY + menuHeight > window.innerHeight) posY = 70;
          if (posX + menuRect.width > window.innerWidth) {
            posX = window.innerWidth - menuRect.width - 10;
          }
          if (posY < 10) posY = 10;
          if (posX < 10) posX = 10;
          this.contextMenuPosition = { x: posX, y: posY };
        } else {
          this.contextMenuPosition = { x: posX, y: posY };
        }
      });
      document.addEventListener("click", this.handleOutsideClick);
    },
    closeContextMenu() {
      this.contextMenuVisible = false;
      this.rightClickNode = null;
      document.removeEventListener("click", this.handleOutsideClick);
    },
    handleOutsideClick(e) {
      if (!this.$el) {
        console.warn("this.$el is not available");
        this.closeContextMenu();
        return;
      }
      const menu = this.$el.querySelector(".context-menu");
      if (menu && !menu.contains(e.target)) {
        this.closeContextMenu();
      }
    },
    openContextMenuParam(event, node) {
      if (node?.mode === "ied") {
        this.handleUpdateFocus({
          iedId: node.id,
          focusNode: node,
          action: "parameter",
        });
        return;
      }
      this.openContextMenu(event, node);
    },
  };
}
