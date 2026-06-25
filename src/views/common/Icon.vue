<template>
  <div class="icon-host">
    <template v-if="isFileIcon">
      <i :class="['file-icon', resolvedFileMeta.iconClass, resolvedFileMeta.toneClass]"></i>
    </template>
    <template v-else>
      <i class="fa-regular fa-folder-open main-icon"></i>
      <i :class="['badge', badgeIcon]"></i>
    </template>
  </div>
</template>

<script>
const EXTENSION_META = {
  xls: { iconClass: "fa-solid fa-file-excel", toneClass: "tone-excel" },
  xlsx: { iconClass: "fa-solid fa-file-excel", toneClass: "tone-excel" },
  csv: { iconClass: "fa-solid fa-file-csv", toneClass: "tone-excel" },
  doc: { iconClass: "fa-solid fa-file-word", toneClass: "tone-word" },
  docx: { iconClass: "fa-solid fa-file-word", toneClass: "tone-word" },
  ppt: { iconClass: "fa-solid fa-file-powerpoint", toneClass: "tone-ppt" },
  pptx: { iconClass: "fa-solid fa-file-powerpoint", toneClass: "tone-ppt" },
  pdf: { iconClass: "fa-solid fa-file-pdf", toneClass: "tone-pdf" },
  txt: { iconClass: "fa-solid fa-file-lines", toneClass: "tone-text" },
  md: { iconClass: "fa-solid fa-file-lines", toneClass: "tone-text" },
  log: { iconClass: "fa-solid fa-file-lines", toneClass: "tone-text" },
  sql: { iconClass: "fa-solid fa-database", toneClass: "tone-db" },
  db: { iconClass: "fa-solid fa-database", toneClass: "tone-db" },
  sqlite: { iconClass: "fa-solid fa-database", toneClass: "tone-db" },
  json: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  xml: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  yml: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  yaml: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  js: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  ts: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  jsx: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  tsx: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  vue: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  html: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  css: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  scss: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  scd: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  winmd: { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" },
  png: { iconClass: "fa-solid fa-file-image", toneClass: "tone-image" },
  jpg: { iconClass: "fa-solid fa-file-image", toneClass: "tone-image" },
  jpeg: { iconClass: "fa-solid fa-file-image", toneClass: "tone-image" },
  gif: { iconClass: "fa-solid fa-file-image", toneClass: "tone-image" },
  webp: { iconClass: "fa-solid fa-file-image", toneClass: "tone-image" },
  bmp: { iconClass: "fa-solid fa-file-image", toneClass: "tone-image" },
  svg: { iconClass: "fa-solid fa-file-image", toneClass: "tone-image" },
  mp3: { iconClass: "fa-solid fa-file-audio", toneClass: "tone-media" },
  wav: { iconClass: "fa-solid fa-file-audio", toneClass: "tone-media" },
  flac: { iconClass: "fa-solid fa-file-audio", toneClass: "tone-media" },
  mp4: { iconClass: "fa-solid fa-file-video", toneClass: "tone-media" },
  mov: { iconClass: "fa-solid fa-file-video", toneClass: "tone-media" },
  mkv: { iconClass: "fa-solid fa-file-video", toneClass: "tone-media" },
  avi: { iconClass: "fa-solid fa-file-video", toneClass: "tone-media" },
  zip: { iconClass: "fa-solid fa-file-zipper", toneClass: "tone-archive" },
  rar: { iconClass: "fa-solid fa-file-zipper", toneClass: "tone-archive" },
  '7z': { iconClass: "fa-solid fa-file-zipper", toneClass: "tone-archive" },
  tar: { iconClass: "fa-solid fa-file-zipper", toneClass: "tone-archive" },
  gz: { iconClass: "fa-solid fa-file-zipper", toneClass: "tone-archive" },
  exe: { iconClass: "fa-solid fa-box", toneClass: "tone-app" },
  msi: { iconClass: "fa-solid fa-box", toneClass: "tone-app" },
  msix: { iconClass: "fa-solid fa-box", toneClass: "tone-app" },
  apk: { iconClass: "fa-solid fa-box", toneClass: "tone-app" },
  dmg: { iconClass: "fa-solid fa-box", toneClass: "tone-app" },
  iso: { iconClass: "fa-solid fa-compact-disc", toneClass: "tone-app" },
};

export default {
  name: "CommonIcon",
  props: {
    iconType: {
      type: String,
      default: "folder",
      validator: (value) => ["folder", "file"].includes(value),
    },
    folderType: {
      type: String,
      default: "location",
      validator: (value) =>
        [
          "location",
          "asset",
          "job",
          "test",
          "owner",
          "building",
          "voltageLevel",
          "bay",
        ].includes(value),
    },
    fileName: {
      type: String,
      default: "",
    },
    contentType: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "20px",
      validator: (value) =>
        ["14px", "16px", "18px", "20px", "24px", "32px"].includes(value),
    },
    badgeColor: {
      type: String,
      default: "4285f4",
    },
  },
  computed: {
    isFileIcon() {
      return this.iconType === "file";
    },
    badgeIcon() {
      const icons = {
        location: "fa-solid fa-location-dot",
        asset: "fa-solid fa-gear",
        job: "fa-solid fa-toolbox",
        test: "fa-solid fa-file-lines",
        owner: "fa-solid fa-location-crosshairs",
        building: "fa-solid fa-building",
        voltageLevel: "fa-solid fa-bolt-lightning",
        bay: "fa-solid fa-bolt",
      };
      return icons[this.folderType] || "fa-solid fa-location-dot";
    },
    badgeStyle() {
      return {
        badgeColor: `#${this.badgeColor}`,
        fontSize: `calc(${this.size} * 0.75)`,
      };
    },
    fileExtension() {
      const name = String(this.fileName || "");
      const idx = name.lastIndexOf(".");
      if (idx < 0 || idx === name.length - 1) return "";
      return name.slice(idx + 1).toLowerCase();
    },
    resolvedFileMeta() {
      if (this.fileExtension) {
        if (EXTENSION_META[this.fileExtension]) return EXTENSION_META[this.fileExtension];
        return { iconClass: "fa-solid fa-file", toneClass: "tone-file" };
      }

      const type = String(this.contentType || "").toLowerCase();
      if (type.includes("image")) {
        return { iconClass: "fa-solid fa-file-image", toneClass: "tone-image" };
      }
      if (type.includes("audio")) {
        return { iconClass: "fa-solid fa-file-audio", toneClass: "tone-media" };
      }
      if (type.includes("video")) {
        return { iconClass: "fa-solid fa-file-video", toneClass: "tone-media" };
      }
      if (type.includes("pdf")) {
        return { iconClass: "fa-solid fa-file-pdf", toneClass: "tone-pdf" };
      }
      if (type.includes("zip") || type.includes("compressed")) {
        return { iconClass: "fa-solid fa-file-zipper", toneClass: "tone-archive" };
      }
      if (type.includes("json") || type.includes("xml") || type.includes("javascript")) {
        return { iconClass: "fa-solid fa-file-code", toneClass: "tone-code" };
      }
      if (type.includes("excel") || type.includes("spreadsheet") || type.includes("csv")) {
        return { iconClass: "fa-solid fa-file-excel", toneClass: "tone-excel" };
      }

      return { iconClass: "fa-solid fa-file", toneClass: "tone-file" };
    },
  },
};
</script>

<style scoped>
.icon-host {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: v-bind(size);
  height: v-bind(size);
}

.main-icon,
.file-icon {
  font-size: v-bind(size);
  line-height: 1;
}

.main-icon {
  color: #ffc107;
  position: relative;
  z-index: 1;
}

.badge {
  position: absolute;
  bottom: 0;
  right: 0;
  color: v-bind("badgeStyle.badgeColor");
  background-color: #fff;
  border-radius: 50%;
  padding: 1px;
  transform: translate(25%, 25%);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
  z-index: 2;
  font-size: v-bind("badgeStyle.fontSize");
}

.tone-excel {
  color: #217346;
}

.tone-word {
  color: #1a5fb4;
}

.tone-ppt {
  color: #d24726;
}

.tone-pdf {
  color: #c53030;
}

.tone-code {
  color: #006699;
}

.tone-db {
  color: #7c3aed;
}

.tone-image {
  color: #2563eb;
}

.tone-media {
  color: #6b46c1;
}

.tone-archive {
  color: #8b5e3c;
}

.tone-app {
  color: #4b5563;
}

.tone-text,
.tone-file {
  color: #64748b;
}
</style>
