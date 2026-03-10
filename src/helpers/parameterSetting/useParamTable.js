export function useParamTable() {
  return {
    collapseMutedRows() {
      this.showMutedRows = false;
    },
    expandAllRows() {
      this.showMutedRows = true;
    },
    formatValue(row, v) {
      if (
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
      ) {
        return "";
      }
      if (
        row?.mode === "pcDataObject" &&
        /^(active\s*group)$/i.test(row?.name || "")
      ) {
        const s = String(v);
        const left = s.split(".")[0];
        return (left ?? s).trim();
      }
      if (this.isOnOff(row)) {
        return v === true || v === 1 || v === "On" ? "On" : "Off";
      }
      return v;
    },
    isNullish(v) {
      return (
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
      );
    },
    cellClass(v) {
      return this.isNullish(v) ? "null-cell" : "";
    },
    renderParamRows(
      children,
      level,
      inheritedMuted = false,
      seen = new Set(),
      inProtectionGroup = false,
      protectionGroupId = null,
      arOffInThisPG = false
    ) {
      const rows = [];
      const padding = level * 20;

      const hasOperationOff = children?.some(
        (child) =>
          !child.children?.length &&
          this.normalize(child?.name) === "operation" &&
          this.normalize(child?.value) === "off"
      );
      const levelMuted = inheritedMuted || hasOperationOff;

      const currentLevelRows =
        children?.filter((c) => !c.children?.length) || [];
      const characteristicRow = currentLevelRows.find(
        (r) => this.normalize(r.name) === "characteristic"
      );
      const characteristicValueLower = characteristicRow
        ? this.normalize(characteristicRow.value)
        : null;

      children?.forEach((child) => {
        if (seen.has(child.id)) return;
        seen.add(child.id);

        const isGroup = !!child.children?.length;

        const selfMuted =
          levelMuted ||
          (child.children?.some(
            (c) =>
              this.normalize(c?.name) === "operation" &&
              this.normalize(c?.value) === "off"
          ) ??
            false);

        let nextInPG = inProtectionGroup;
        let nextPGId = protectionGroupId;
        let nextArOffInPG = arOffInThisPG;
        if (
          isGroup &&
          this.normalize(child.mode) === "protectiongroup"
        ) {
          nextInPG = true;
          nextPGId = child.id;
          nextArOffInPG = this.hasAutoRecloseOffDeep(child);
        }

        let characteristicMuted = false;
        if (!isGroup && characteristicValueLower) {
          const rowNameLower = this.normalize(child.name);
          characteristicMuted =
            (characteristicValueLower === "definite time" &&
              rowNameLower === "time dial") ||
            (characteristicValueLower !== "definite time" &&
              rowNameLower === "delay time");
        }

        const isMuted = isGroup
          ? selfMuted
          : levelMuted || (nextInPG && nextArOffInPG && this.isARField(child.name));
        const isSignal = !isGroup && this.isSignalField(child.name);
        const isOnOff =
          !isGroup &&
          child.options &&
          child.options.length === 2 &&
          child.options.includes("On") &&
          child.options.includes("Off");

        const rowData = {
          key: (isGroup ? "group-" : "param-") + child.id,
          isGroup,
          ...child,
          padding,
          muted: isMuted,
          characteristicMuted,
          isSignal,
          isOnOff,
          protectionGroupId: nextPGId,
          displayUnit: this.displayValue(child.unit),
          displayMin: this.displayValue(child.minVal),
          displayMax: this.displayValue(child.maxVal),
          displayDesc: this.displayValue(child.description),
          valueClass: this.isNullish(child.value) ? "null-cell" : "",
          isEffectivelyMuted: isMuted || characteristicMuted,
        };

        if (isGroup) {
          rows.push(rowData);
          rows.push(
            ...this.renderParamRows(
              child.children,
              level + 1,
              selfMuted,
              seen,
              nextInPG,
              nextPGId,
              nextArOffInPG
            )
          );
        } else {
          rows.push(rowData);
        }
      });

      return rows;
    },
    displayValue(v) {
      return v == null ? "" : v;
    },
    // Column resize logic (single-edge resize)
    startColumnResize(event, index) {
      if (!event || index == null) return;
      if (!this.hasUserResized) {
        this.initColumnWidthsFromDom();
        this.hasUserResized = true;
      }
      const header = event.currentTarget?.parentElement;
      this.resizingCol = index;
      this.resizeStartX = event.clientX;
      this.resizeStartWidth = header?.offsetWidth || this.columnWidths[index] || 120;

      document.addEventListener("mousemove", this.onColumnResize);
      document.addEventListener("mouseup", this.stopColumnResize);
      document.body.style.cursor = "col-resize";
      event.preventDefault();
      event.stopPropagation();
    },
    initColumnWidthsFromDom() {
      const table = this.$el?.querySelector('.parameter-table');
      if (!table) return;
      const headers = table.querySelectorAll('thead th');
      if (!headers?.length) return;
      this.columnWidths = Array.from(headers).map((th) => th.offsetWidth || 120);
    },
    onColumnResize(event) {
      if (this.resizingCol == null) return;
      const dx = event.clientX - this.resizeStartX;
      const minWidth = this.getColumnMinWidth(this.resizingCol);
      const nextWidth = Math.max(minWidth, this.resizeStartWidth + dx);
      this.columnWidths.splice(this.resizingCol, 1, nextWidth);
    },
    stopColumnResize() {
      if (this.resizingCol == null) return;
      document.removeEventListener("mousemove", this.onColumnResize);
      document.removeEventListener("mouseup", this.stopColumnResize);
      document.body.style.cursor = "";
      this.resizingCol = null;
    },
    getColumnMinWidth(index) {
      const mins = [180, 180, 120, 120, 120, 200];
      return mins[index] || 120;
    },
    handleTableScroll(event) {
      if (!event?.target) return;
      const target = event.target;
      if (this._tableScrollFrame) cancelAnimationFrame(this._tableScrollFrame);
      this._tableScrollFrame = requestAnimationFrame(() => {
        this.virtualScrollTop = target.scrollTop || 0;
        this.virtualViewportHeight = target.clientHeight || 0;
      });
    },
    syncTableViewport() {
      const container = this.$el?.querySelector('.table-pane-body');
      if (!container) return;
      this.virtualScrollTop = container.scrollTop || 0;
      this.virtualViewportHeight = container.clientHeight || 0;
    },
  };
}
