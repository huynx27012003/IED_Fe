import { updateDeviceParameters } from "@/api/device";
import { getEntityTree } from "@/api/treenode";

export function useParamEdit() {
  return {
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    normalizeForCompare(v) {
      const s = String(v == null ? "" : v).trim().toLowerCase();
      if (s === "on" || s === "1" || s === "true") return "on";
      if (s === "off" || s === "0" || s === "false") return "off";
      return s;
    },
    async ensureFreshData(expectedMap, attempts = 6, intervalMs = 250) {
      for (let i = 0; i < attempts; i++) {
        const tree = await getEntityTree();
        let ok = true;
        if (expectedMap && typeof expectedMap === "object") {
          for (const [id, exp] of Object.entries(expectedMap)) {
            const node = this.findNodeLocal(tree, id);
            if (!node) {
              ok = false;
              break;
            }
            const a = this.normalizeForCompare(node.value);
            const e = this.normalizeForCompare(exp);
            if (a !== e) {
              ok = false;
              break;
            }
          }
        }
        this.applyTree(tree, true);
        if (ok) return true;
        await this.sleep(intervalMs);
      }
      return false;
    },
    updateLocalParameterValue(id, value) {
      const targetId = String(id);

      const visit = (node) => {
        if (!node) return false;
        if (String(node.id) === targetId) {
          node.value = value;
          return true;
        }
        const kids = Array.isArray(node.children) ? node.children : [];
        for (let i = 0; i < kids.length; i++) {
          if (visit(kids[i])) return true;
        }
        return false;
      };

      if (Array.isArray(this.parameterGroups)) {
        this.parameterGroups.forEach((root) => visit(root));
      }

      const focusRoot =
        this.freshFocusNode || this.focusNode || this.ownerData?.node;
      if (focusRoot) {
        visit(focusRoot);
      }
    },
    isSignalField(name) {
      const normalizedName = this.normalize(name);
      return (
        normalizedName === "lockout signal" ||
        normalizedName === "initiate signal"
      );
    },
    isARField(name) {
      const n = this.normalize(name);
      return n === "initiate ar" || n === "lockout ar";
    },
    hasAutoRecloseOffDeep(node) {
      if (!node) return false;
      const isARGroup = this.normalize(node.name) === "auto reclose";
      if (isARGroup && this.hasOperationOff(node)) return true;
      const kids = Array.isArray(node.children) ? node.children : [];
      return kids.some((c) => this.hasAutoRecloseOffDeep(c));
    },
    normalize(str) {
      return String(str ?? "").toLowerCase().trim();
    },
    findParentGroup(paramId) {
      let foundGroup = null;
      for (let i = 0; i < this.rowsToRender.length; i++) {
        const row = this.rowsToRender[i];
        if (row.isGroup) {
          foundGroup = row;
        } else if (row.id === paramId) {
          return foundGroup;
        }
      }
      return null;
    },
    getScrollParents(el) {
      const parents = [];
      let p = el && el.parentElement;
      while (p) {
        const s = getComputedStyle(p);
        const hasScroll = /(auto|scroll)/.test(
          `${s.overflow}${s.overflowX}${s.overflowY}`
        );
        if (hasScroll) parents.push(p);
        p = p.parentElement;
      }
      parents.push(window);
      return parents;
    },
    startDrag(e) {
      const fm = this.$refs.floatingEl;
      if (!fm) return;

      const rect = fm.getBoundingClientRect();
      this.fmLeft = rect.left;
      this.fmTop = rect.top;

      this.dragDX = e.clientX - this.fmLeft;
      this.dragDY = e.clientY - this.fmTop;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragMoved = false;
      this.isDragging = true;

      e.target.setPointerCapture?.(e.pointerId);
      document.documentElement.classList.add("dragging");

      window.addEventListener("pointermove", this.onDrag, { passive: false });
      window.addEventListener("pointerup", this.endDrag);
      window.addEventListener("pointercancel", this.endDrag);
    },
    onDrag(e) {
      if (!this.isDragging) return;
      if (this._fmFrame) cancelAnimationFrame(this._fmFrame);

      this._fmFrame = requestAnimationFrame(() => {
        const fm = this.$refs.floatingEl;
        if (!fm) return;

        let left = e.clientX - this.dragDX;
        let top = e.clientY - this.dragDY;

        const w = fm.offsetWidth || 0;
        const h = fm.offsetHeight || 0;
        const maxLeft = window.innerWidth - w;
        const maxTop = window.innerHeight - h;

        left = Math.max(0, Math.min(left, maxLeft));
        top = Math.max(0, Math.min(top, maxTop));

        fm.style.position = "fixed";
        fm.style.left = `${left}px`;
        fm.style.top = `${top}px`;

        this.fmLeft = left;
        this.fmTop = top;
      });
    },
    endDrag() {
      if (!this.isDragging) return;
      this.isDragging = false;
      document.documentElement.classList.remove("dragging");

      window.removeEventListener("pointermove", this.onDrag);
      window.removeEventListener("pointerup", this.endDrag);
      window.removeEventListener("pointercancel", this.endDrag);

      if (!this.dragMoved) {
        this.menuOpen = !this.menuOpen;
        return;
      }

      this.userPinned = true;
    },
    updateFloatingPos() {
      if (this._fmUpdateFrame) cancelAnimationFrame(this._fmUpdateFrame);

      this._fmUpdateFrame = requestAnimationFrame(() => {
        const fm = this.$refs.floatingEl;
        const root = this.$refs.rootEl;
        if (!fm || !root) return;

        if (this.userPinned && this.fmLeft != null && this.fmTop != null) return;

        const rect = root.getBoundingClientRect();
        const visLeft = Math.max(rect.left, 0);
        const visRight = Math.min(rect.right, window.innerWidth);
        const visTop = Math.max(rect.top, 0);
        const visBottom = Math.min(rect.bottom, window.innerHeight);
        const hasIntersection = visRight > visLeft && visBottom > visTop;

        if (!hasIntersection) {
          fm.style.display = "none";
          return;
        } else {
          fm.style.display = "";
        }

        const centerX = visLeft + (visRight - visLeft) / 2;
        const centerY = visTop + (visBottom - visTop) / 2;

        const fmRect = fm.getBoundingClientRect();
        const left = centerX - fmRect.width / 2;
        const top = centerY - fmRect.height / 2;

        fm.style.position = "fixed";
        fm.style.left = `${left}px`;
        fm.style.top = `${top}px`;

        this.fmLeft = left;
        this.fmTop = top;
      });
    },
    resetFloatingPos() {
      this.userPinned = false;
      this.$nextTick(this.updateFloatingPos);
    },
    onClickEdit() {
      this.menuOpen = false;
      if (!this.isEditing) this.enterEditMode();
    },
    async onClickSetOperation(val) {
      this.menuOpen = false;

      const targets = this.rowsToRender.filter(
        (r) =>
          !r.isGroup &&
          this.normalize(r.name) === "operation" &&
          this.isOnOff(r) &&
          r.value !== val
      );

      if (!targets.length) {
        this.$message.info(
          this.language === "vi-vi"
            ? "Không có 'Operation' nào cần thay đổi."
            : "No 'Operation' to change."
        );
        return;
      }

      const groups = new Map();
      targets.forEach((row) => {
        const groupId = this.findParentGroupId(row.id) || "ungrouped";
        if (!groups.has(groupId)) groups.set(groupId, []);
        groups.get(groupId).push({ key: row.id, value: val });
      });

      const payload = Array.from(groups.values());

      try {
        const res = await updateDeviceParameters(payload);
        if (res && typeof res.code !== "undefined" && res.code !== 1) {
          throw new Error(
            res.message ||
              (this.language === "vi-vi" ? "Lưu thất bại!" : "Save failed!")
          );
        }
        this.$message.success(
          (this.language === "vi-vi" ? "Đã đặt Operation = " : "Set Operation = ") +
            val
        );

        const expected = {};
        payload.forEach((arr) => arr.forEach((p) => {
          expected[p.key] = p.value;
        }));
        const ok = await this.ensureFreshData(expected);
        if (!ok) {
          await this.reloadFromServer(true);
        }
        this.$emit("device-saved");
        this.emitUpdateFocus();
      } catch (e) {
        let msg = this.language === "vi-vi" ? "Lưu thất bại!" : "Save failed!";
        if (e?.response?.data) msg = e.response.data.message || JSON.stringify(e.response.data);
        else if (e?.message) msg = e.message;
        this.$message.error(msg);
      }
    },
    hasOperationOff(node) {
      if (!node || !Array.isArray(node.children)) return false;
      const hasDirectOperationOff = node.children.some(
        (c) =>
          String(c?.name || "").toLowerCase() === "operation" &&
          String(c?.value || "").toLowerCase() === "off"
      );
      if (hasDirectOperationOff) return true;
      return node.children.some((child) => this.hasOperationOff(child));
    },
    isOnOff(row) {
      return (
        row.options &&
        row.options.length === 2 &&
        row.options.includes("On") &&
        row.options.includes("Off")
      );
    },
    getSwitchValue(row) {
      const value = row.value;
      if (value === true || value === 1 || value === "On" || value === "on") {
        return "On";
      } else {
        return "Off";
      }
    },
    getSwitchLabel(row, value = this.getSwitchValue(row)) {
      const labels = {
        "vi-vi": { On: "Bật", Off: "Tắt" },
        default: { On: "On", Off: "Off" },
      };
      const langConfig = labels[this.language] || labels.default;
      return langConfig[value];
    },
    async enterEditMode() {
      this.isLoadingEdit = true;
      await this.$nextTick();

      this.editStates = {};
      this.rowsToRender.forEach((row) => {
        if (!row.isGroup) {
          this.editStates[row.id] = this.isOnOff(row)
            ? this.getSwitchValue(row)
            : row.value;
        }
      });

      setTimeout(() => {
        this.isEditing = true;
        this.isLoadingEdit = false;
      }, 200);
    },
    cancelAll() {
      this.menuOpen = false;
      this.isEditing = false;
      this.editStates = {};
      this.changedValues = [];
    },
    async saveAll() {
      this.menuOpen = false;
      this.loadingSave = true;
      const groups = new Map();
      const processed = new Set();

      this.rowsToRender.forEach((row) => {
        if (row.isGroup) return;
        if (this.editStates[row.id] === undefined) return;
        if (processed.has(row.id)) return;

        const newVal = this.editStates[row.id];
        if (row.value === newVal) return;

        const groupId = this.findParentGroupId(row.id) || "ungrouped";
        if (!groups.has(groupId)) groups.set(groupId, []);
        groups.get(groupId).push({ key: row.id, value: newVal });
        processed.add(row.id);
      });

      const payload = Array.from(groups.values());

      try {
        if (!payload.length) {
          this.$message.info(
            this.language === "vi-vi" ? "Chưa có gì thay đổi!" : "No changes."
          );
          return;
        }

        const res = await updateDeviceParameters(payload);
        if (res && typeof res.code !== "undefined" && res.code !== 1) {
          throw new Error(res.message || this.failureMessage);
        }
        this.$message.success(this.successMessage);

        this.isEditing = false;
        this.editStates = {};

        payload.forEach((arr) =>
          arr.forEach((p) => this.updateLocalParameterValue(p.key, p.value))
        );
        this.rowsKey++;

        const expected = {};
        payload.forEach((arr) => arr.forEach((p) => {
          expected[p.key] = p.value;
        }));
        const ok = await this.ensureFreshData(expected);
        if (!ok) {
          await this.reloadFromServer(true);
        }
        this.$emit("device-saved");
        this.emitUpdateFocus();
      } catch (e) {
        let msg = this.failureMessage;
        if (e?.response?.data) msg = e.response.data.message || JSON.stringify(e.response.data);
        else if (e?.message) msg = e.message;
        this.$message.error(msg);
      } finally {
        this.loadingSave = false;
      }
    },
    findParentGroupId(paramId) {
      const items = this.rowsToRender || [];
      let paramIndex = -1;
      let paramPadding = null;
      for (let i = 0; i < items.length; i++) {
        const r = items[i];
        if (!r.isGroup && r.id === paramId) {
          paramIndex = i;
          paramPadding = r.padding || 0;
          break;
        }
      }

      if (paramIndex !== -1) {
        for (let j = paramIndex - 1; j >= 0; j--) {
          const r = items[j];
          if (r && r.isGroup) {
            const gpPad = r.padding || 0;
            if (gpPad < paramPadding) {
              return r.id;
            }
          }
        }
      }

      const keyStr = String(paramId);
      const firstDashIndex = keyStr.indexOf("-");
      if (firstDashIndex !== -1) {
        const prefix = keyStr.substring(0, firstDashIndex);
        if (/^\d+$/.test(prefix)) {
          return prefix;
        }
      }

      return "ungrouped";
    },
    emitUpdateFocus() {
      try {
        const focus = this.freshFocusNode || this.focusNode || this.ownerData?.node;
        const iedId = this.ownerData?.node?.id;
        if (iedId && focus) {
          this.$emit("update-focus", { iedId, focusNode: focus });
        }
      } catch (e) {
        // no-op
      }
    },
  };
}
