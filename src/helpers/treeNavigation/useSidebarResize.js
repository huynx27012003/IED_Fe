export function useSidebarResize() {
  return {
    startResizeServer() {
      this.resizing = true;
      document.addEventListener("mousemove", this.resizeServer);
      document.addEventListener("mouseup", this.stopResizeServer);
    },
    resizeServer(event) {
      if (!this.$refs.sidebarServer || !this.$refs.sidebarServer.offsetParent) return;
      this._resizeServerX = event.clientX;
      if (this._resizeServerFrame) cancelAnimationFrame(this._resizeServerFrame);
      this._resizeServerFrame = requestAnimationFrame(() => {
        if (!this.resizing) return;
        const sidebarLeft =
          this.$refs.sidebarServer.offsetParent.getBoundingClientRect().left;
        const newWidth = this._resizeServerX - sidebarLeft;

        if (this.showParam) {
          const usedWidth =
            this.ownerWidthPx + (this.showSCL ? this.sclWidthPx + 4 : 0);
          this.paramWidthPx = Math.max(100, newWidth - usedWidth - 4);
        } else if (this.showSCL) {
          this.sclWidthPx = Math.max(100, newWidth - this.ownerWidthPx - 4);
        } else {
          this.ownerWidthPx = Math.max(100, newWidth);
        }
      });
    },
    stopResizeServer() {
      this.resizing = false;
      document.removeEventListener("mousemove", this.resizeServer);
      document.removeEventListener("mouseup", this.stopResizeServer);
      if (this._resizeServerFrame) cancelAnimationFrame(this._resizeServerFrame);
    },
    startResizeContentServer() {
      this.resizing = true;
      document.addEventListener("mousemove", this.resizeContentServer);
      document.addEventListener("mouseup", this.stopResizeContentServer);
    },
    resizeContentServer(event) {
      const propRef = this.$refs.properties;
      const propertiesEl = propRef && propRef.$el ? propRef.$el : propRef;
      if (!propertiesEl || !this.$refs.contentData) return;

      this._resizeContentX = event.clientX;
      if (this._resizeContentFrame) cancelAnimationFrame(this._resizeContentFrame);
      this._resizeContentFrame = requestAnimationFrame(() => {
        if (!this.resizing) return;
        const parentWidth = this.$refs.contextDataServer.clientWidth;
        let newWidth =
          parentWidth -
          this._resizeContentX +
          this.$refs.contextDataServer.getBoundingClientRect().left;
        const minWidth = parentWidth * 0.1;
        const maxWidth = parentWidth * 0.4;
        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        newWidth = (newWidth / parentWidth) * 100;
        propertiesEl.style.width = `${newWidth}%`;
        this.$refs.content.style.width = `${100 - newWidth}%`;
      });
    },
    stopResizeContentServer() {
      this.resizing = false;
      document.removeEventListener("mousemove", this.resizeContentServer);
      document.removeEventListener("mouseup", this.stopResizeContentServer);
      if (this._resizeContentFrame) cancelAnimationFrame(this._resizeContentFrame);
    },
    startResizeOwner() {
      this.resizing = true;
      document.addEventListener("mousemove", this.resizeOwner);
      document.addEventListener("mouseup", this.stopResizeOwner);
    },
    resizeOwner(event) {
      this._resizeOwnerX = event.clientX;
      if (this._resizeOwnerFrame) cancelAnimationFrame(this._resizeOwnerFrame);
      this._resizeOwnerFrame = requestAnimationFrame(() => {
        if (!this.resizing || !this.$refs.sidebarServer) return;
        const sidebarRect = this.$refs.sidebarServer.getBoundingClientRect();
        const newWidth = this._resizeOwnerX - sidebarRect.left;
        this.ownerWidthPx = Math.max(100, newWidth);
      });
    },
    stopResizeOwner() {
      this.resizing = false;
      document.removeEventListener("mousemove", this.resizeOwner);
      document.removeEventListener("mouseup", this.stopResizeOwner);
      if (this._resizeOwnerFrame) cancelAnimationFrame(this._resizeOwnerFrame);
    },
    startResizeScl() {
      this.resizing = true;
      document.addEventListener("mousemove", this.resizeScl);
      document.addEventListener("mouseup", this.stopResizeScl);
    },
    resizeScl(event) {
      this._resizeSclX = event.clientX;
      if (this._resizeSclFrame) cancelAnimationFrame(this._resizeSclFrame);
      this._resizeSclFrame = requestAnimationFrame(() => {
        if (!this.resizing || !this.$refs.ownerPane) return;
        const ownerRect = this.$refs.ownerPane.getBoundingClientRect();
        const newWidth = this._resizeSclX - ownerRect.right - 4;
        this.sclWidthPx = Math.max(100, newWidth);
      });
    },
    stopResizeScl() {
      this.resizing = false;
      document.removeEventListener("mousemove", this.resizeScl);
      document.removeEventListener("mouseup", this.stopResizeScl);
      if (this._resizeSclFrame) cancelAnimationFrame(this._resizeSclFrame);
    },
    startResizeParam() {
      this.resizing = true;
      document.addEventListener("mousemove", this.resizeParam);
      document.addEventListener("mouseup", this.stopResizeParam);
    },
    resizeParam(event) {
      this._resizeParamX = event.clientX;
      if (this._resizeParamFrame) cancelAnimationFrame(this._resizeParamFrame);
      this._resizeParamFrame = requestAnimationFrame(() => {
        if (!this.resizing || !this.$refs.paramPane) return;
        const paramRect = this.$refs.paramPane.getBoundingClientRect();
        const newWidth = this._resizeParamX - paramRect.left;
        this.paramWidthPx = Math.max(120, newWidth);
      });
    },
    stopResizeParam() {
      this.resizing = false;
      document.removeEventListener("mousemove", this.resizeParam);
      document.removeEventListener("mouseup", this.stopResizeParam);
      if (this._resizeParamFrame) cancelAnimationFrame(this._resizeParamFrame);
    },
  };
}
