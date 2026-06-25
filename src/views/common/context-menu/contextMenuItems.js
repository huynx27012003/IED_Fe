const parameterNodeModes = [
  "settingFunction",
  "protectionFunction",
  "protectionLevel",
  "protectionGroup",
  "systemSetting",
  "lineParameters",
];

const pasteItem = ({ pasteActionLabel, canPasteHere }) => ({
  label: pasteActionLabel,
  action: "paste",
  disabled: !canPasteHere,
  pasteEnabled: canPasteHere,
});

const signalListExportItem = { label: "Export Signal List", action: "exportSignalList" };

const basicNodeActions = ({ pasteActionLabel, canPasteHere }) => [
  { label: "Device List", action: "deviceList" },
  { label: "Copy", action: "copy" },
  pasteItem({ pasteActionLabel, canPasteHere }),
  { label: "Show", action: "show" },
  { label: "Rename", action: "rename" },
  { label: "Download", action: "download" },
  { label: "Delete", action: "delete", danger: true },
  { label: "Duplicate", action: "duplicate" },
  { label: "Export", action: "export" },
  { label: "Import", action: "import" },
];

const iedSubmenus = [
  {
    label: "Parameter Settings",
    action: "parameterSettings",
    submenuKey: "parameterSettings",
    children: [
      { label: "Show", action: "parameterSettingsShow" },
      { label: "Import", action: "parameterSettingsImport" },
      { label: "Export", action: "parameterSettingsExport" },
      { label: "Export Protection Report", action: "parameterSettingsGenerateReport" },
      { label: "Export Test Report", action: "parameterSettingsExportTestReport" },
    ],
  },
  {
    label: "Compare Setting",
    action: "compareSetting",
    submenuKey: "compareSetting",
    submenuType: "compareSetting",
    submenuClass: "compare-submenu",
  },
  {
    label: "SCL Management",
    action: "sclManagement",
    submenuKey: "sclManagement",
    children: [
      { label: "Show", action: "sclManagementShow" },
      { label: "Import", action: "sclManagementImport" },
      { label: "Export", action: "sclManagementExport" },
    ],
  },
];

export function buildContextMenuSections({
  nodeMode,
  isOwnerMode,
  hasSelectedNode,
  pasteActionLabel,
  canPasteHere,
}) {
  const pasteContext = { pasteActionLabel, canPasteHere };
  const sections = [];

  if (nodeMode === "bay") {
    sections.push({
      key: "bay",
      items: [
        {
          label: "+ Add Devices",
          submenuKey: "addDevices",
          children: [{ label: "IEC 61850 IEDs", action: "addDevice" }],
        },
        { label: "Device List", action: "deviceList" },
        { label: "Copy", action: "copy" },
        pasteItem(pasteContext),
        { label: "Show", action: "show" },
        { label: "Cut" },
        { label: "Rename", action: "rename" },
        { label: "Import", action: "triggerImport" },
        { label: "Export", action: "export" },
        { label: "Sync" },
        { label: "Delete", action: "delete", danger: true },
      ],
    });
  } else if (nodeMode === "ied") {
    sections.push({
      key: "ied",
      items: [
        { label: "Hardware Information", action: "hardware" },
        ...iedSubmenus,
        { label: "Copy", action: "copy" },
        pasteItem(pasteContext),
        { label: "Show", action: "show" },
        { label: "Cut" },
        { label: "Rename", action: "rename" },
        { label: "Sync" },
        { label: "Delete", action: "delete", danger: true },
      ],
    });
  } else if (nodeMode === "sclFile") {
    sections.push({
      key: "sclFile",
      items: [{ label: "Open", action: "openSclFile" }],
    });
  } else if (parameterNodeModes.includes(nodeMode)) {
    sections.push({
      key: "parameterNode",
      items: [
        { label: "Open", action: nodeMode },
        { label: "Delete", action: "delete", danger: true },
      ],
    });
  } else if (nodeMode === "substation") {
    sections.push({
      key: "substation",
      items: [
        { label: "+ Add voltage level", action: "addVoltageLevel" },
        { label: "+ Add bay", action: "addBay" },
        { label: "+ Add asset", action: "addAsset" },
        ...basicNodeActions(pasteContext),
        signalListExportItem,
      ],
    });
  } else if (nodeMode === "voltageLevel") {
    sections.push({
      key: "voltageLevel",
      items: [
        { label: "+ Add bay", action: "addBay" },
        { label: "+ Add asset", action: "addAsset" },
        ...basicNodeActions(pasteContext),
        signalListExportItem,
      ],
    });
  } else if (isOwnerMode) {
    sections.push({
      key: "owner",
      items: [
        { label: "+ Add organisation", action: "addOrganisation" },
        { label: "+ Add substation", action: "addSubstation" },
        { label: "Device List", action: "deviceList" },
        { label: "Copy", action: "copy" },
        pasteItem(pasteContext),
        { label: "Show", action: "show" },
        { label: "Rename", action: "rename" },
        { label: "Download", action: "download" },
        { label: "Delete", action: "delete", danger: true },
        { label: "Duplicate", action: "duplicate" },
        { label: "Export", action: "export" },
        signalListExportItem,
        { label: "Import", action: "triggerImport" },
      ],
    });
  }

  if (hasSelectedNode) {
    sections.push({
      key: "communication",
      items: [{ label: "Communication & Services", action: "communicationServices" }],
    });
  }

  return sections;
}
