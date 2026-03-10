<template>
  <div class="properties">
    <div class="title-properties">
      <div class="title-wrapper">
        <div class="properties-tabs">
          <button
            type="button"
            class="properties-tab"
            :class="{ active: paneTab !== 'controlBlock' }"
            @click="$emit('update:paneTab', 'object')"
          >
            {{ t("objectProperties") }}
          </button>
          <button
            type="button"
            class="properties-tab"
            :class="{ active: paneTab === 'controlBlock' }"
            @click="$emit('update:paneTab', 'controlBlock')"
          >
            {{ controlBlockTitle || "Control Block" }}
          </button>
        </div>
        <div style="margin-right: 5px">
          <i @click="$emit('hide')" class="fa-solid fa-square-caret-right"></i>
        </div>
      </div>
    </div>

    <div v-show="paneTab !== 'controlBlock'" class="content-properties">
      <div class="content-properties-header">
        <i
          class="fa-solid fa-chevron-down"
          style="padding-right: 5px; font-size: 10px"
        ></i>
        {{ t("ownerAndPosition") }}
      </div>
      <div class="content-properties-table">
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("owner1") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ properties.Owner1 }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("owner2") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ properties.Owner2 }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("owner3") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ properties.Owner3 }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("location") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ properties.Location }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("voltageLevel") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ properties.VoltageLevel }}
          </div>
        </div>

        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("feeder") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ properties.Feeder }}
          </div>
        </div>
      </div>

      <div v-if="assetPropertySign" class="content-properties-header">
        <i
          class="fa-solid fa-chevron-down"
          style="padding-right: 5px; font-size: 10px"
        ></i>
        {{ t("deviceInformation") }}
      </div>
      <div v-if="assetPropertySign" class="content-properties-table">
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("name") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ information.name }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("description") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ information.description }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("vendor") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ information.vendor }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("model") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ information.model }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("serialNumber") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ information.serialNumber }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("hardwareVersion") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ information.hardwareVersion }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("softwareVersion") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ information.softwareVersion }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("orderCode") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ information.orderCode }}
          </div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("roles") }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ information.roles }}
          </div>
        </div>
      </div>

      <div class="content-properties-header">
        <i
          class="fa-solid fa-chevron-down"
          style="padding-right: 5px; font-size: 10px"
        ></i>
        {{ t("configurationVersion") }}
      </div>
      <div class="content-properties-table">
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("lastModified") }}
          </div>
          <div
            class="content-properties-table-content fixed-box pl10 break-word"
          ></div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("author") }}
          </div>
          <div
            class="content-properties-table-content fixed-box pl10 break-word"
          ></div>
        </div>
        <div class="content-properties-table-flex">
          <div class="content-properties-table-header">
            {{ t("lastSavedBy") }}
          </div>
          <div
            class="content-properties-table-content fixed-box pl10 break-word"
          ></div>
        </div>
      </div>
    </div>

    <div v-show="paneTab === 'controlBlock'" class="content-properties">
      <div class="content-properties-header">
        <i
          class="fa-solid fa-chevron-down"
          style="padding-right: 5px; font-size: 10px"
        ></i>
        {{ controlBlockTitle || "Control Block attributes" }}
      </div>
      <div v-if="controlBlockVisible" class="content-properties-table control-block-table">
        <div
          v-for="(row, idx) in controlBlockAttributeRows"
          :key="idx"
          class="content-properties-table-flex"
        >
          <div class="content-properties-table-header">
            {{ row.label }}
          </div>
          <div class="content-properties-table-content fixed-box pl10 break-word">
            {{ row.value }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PropertiesPane",
  props: {
    paneTab: { type: String, default: "object" },
    properties: {
      type: Object,
      default: () => ({
        Owner1: "",
        Owner2: "",
        Owner3: "",
        Location: "",
        VoltageLevel: "",
        Feeder: "",
      }),
    },
    assetPropertySign: { type: Boolean, default: false },
    information: {
      type: Object,
      default: () => ({
        name: "",
        description: "",
        vendor: "",
        model: "",
        serialNumber: "",
        hardwareVersion: "",
        softwareVersion: "",
        orderCode: "",
        roles: "",
      }),
    },
    controlBlockAttributeRows: { type: Array, default: () => [] },
    controlBlockTitle: { type: String, default: "" },
    controlBlockVisible: { type: Boolean, default: false },
    t: { type: Function, required: true },
  },
  emits: ["update:paneTab", "hide"],
};
</script>

<style scoped>
.properties {
  width: 25%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title-properties {
  width: 100%;
  height: 40px;
  flex: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.title-wrapper {
  width: 100%;
  height: 30px;
  border: 2px #b6b3b3 solid;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.properties-tabs {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  gap: 0;
  box-sizing: border-box;
  background: transparent;
}

.properties-tab {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  color: #555;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
}

.properties-tab + .properties-tab {
  border-left: 1px #dad7d7 solid;
}

.properties-tab:hover {
  background: #f3f4f6;
}

.properties-tab.active {
  background: #e2e8f0;
  color: #000;
}

.content-properties {
  width: 100%;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  border: 1px #dad7d7 solid;
  border-bottom: none;
  overflow-y: auto;
  background-color: #e2e8f0;
}

.content-properties-header {
  width: 100%;
  height: 40px;
  display: flex;
  background-color: #e2e8f0;
  align-items: center;
  box-sizing: border-box;
  padding-left: 10px;
}

.content-properties-table {
  width: 100%;
  box-sizing: border-box;
}

.content-properties-table-flex {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding-left: 10px;
  background-color: white;
}

.content-properties-table-header {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 50%;
  box-sizing: border-box;
  padding-top: 5px;
  padding-bottom: 5px;
}

.content-properties-table-content {
  width: 50%;
  padding-top: 5px;
  padding-bottom: 5px;
  box-sizing: border-box;
  border-left: 3px #e2e8f0 solid;
}
</style>
