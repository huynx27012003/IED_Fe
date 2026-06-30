const parameterNodeModes = [
  "settingFunction",
  "protectionFunction",
  "protectionLevel",
  "protectionGroup",
  "systemSetting",
  "lineParameters",
];

const menuLabel = (language, english, vietnamese) =>
  language === "vi-vi" ? vietnamese : english;

const pasteItem = ({ pasteActionLabel, canPasteHere }) => ({
  label: pasteActionLabel,
  action: "paste",
  disabled: !canPasteHere,
  pasteEnabled: canPasteHere,
});

const signalListExportItem = (language) => ({
  label: menuLabel(language, "Export Signal List", "Xuất danh sách tín hiệu"),
  action: "exportSignalList",
});

const basicNodeActions = ({ pasteActionLabel, canPasteHere, language }) => [
  { label: menuLabel(language, "Device List", "Danh sách thiết bị"), action: "deviceList" },
  { label: menuLabel(language, "Copy", "Sao chép"), action: "copy" },
  pasteItem({ pasteActionLabel, canPasteHere }),
  { label: menuLabel(language, "Show", "Xem"), action: "show" },
  { label: menuLabel(language, "Rename", "Đổi tên"), action: "rename" },
  { label: menuLabel(language, "Download", "Tải xuống"), action: "download" },
  { label: menuLabel(language, "Delete", "Xóa"), action: "delete", danger: true },
  { label: menuLabel(language, "Duplicate", "Nhân bản"), action: "duplicate" },
  { label: menuLabel(language, "Export", "Xuất"), action: "export" },
  { label: menuLabel(language, "Import", "Nhập"), action: "import" },
];

const substationNodeActions = (pasteContext, language) =>
  basicNodeActions({ ...pasteContext, language }).map((item) =>
    item.action === "import"
      ? { ...item, label: menuLabel(language, "Import IED", "Nhập IED"), action: "bulkIedImport" }
      : item
  );

const iedSubmenus = (language) => [
  {
    label: menuLabel(language, "Parameter Settings", "Cấu hình tham số"),
    action: "parameterSettings",
    submenuKey: "parameterSettings",
    children: [
      { label: menuLabel(language, "Show", "Xem"), action: "parameterSettingsShow" },
      { label: menuLabel(language, "Import", "Nhập"), action: "parameterSettingsImport" },
      { label: menuLabel(language, "Export", "Xuất"), action: "parameterSettingsExport" },
      { label: menuLabel(language, "Export Protection Report", "Xuất báo cáo bảo vệ"), action: "parameterSettingsGenerateReport" },
      { label: menuLabel(language, "Export Test Report", "Xuất báo cáo thử nghiệm"), action: "parameterSettingsExportTestReport" },
    ],
  },
  {
    label: menuLabel(language, "Compare Setting", "So sánh cấu hình"),
    action: "compareSetting",
    submenuKey: "compareSetting",
    submenuType: "compareSetting",
    submenuClass: "compare-submenu",
  },
  {
    label: menuLabel(language, "Compare Overcurrent Characteristic", "So sánh đặc tuyến quá dòng"),
    action: "compareOvercurrentCharacteristic",
    submenuKey: "compareOvercurrentCharacteristic",
    submenuType: "compareOvercurrentCharacteristic",
    submenuClass: "compare-submenu",
  },
  {
    label: menuLabel(language, "SCL Management", "Quản lý SCL"),
    action: "sclManagement",
    submenuKey: "sclManagement",
    children: [
      { label: menuLabel(language, "Show", "Xem"), action: "sclManagementShow" },
      { label: menuLabel(language, "Import", "Nhập"), action: "sclManagementImport" },
      { label: menuLabel(language, "Export", "Xuất"), action: "sclManagementExport" },
    ],
  },
];

export function buildContextMenuSections({
  nodeMode,
  isOwnerMode,
  hasSelectedNode,
  pasteActionLabel,
  canPasteHere,
  language,
}) {
  const pasteContext = { pasteActionLabel, canPasteHere };
  const actionContext = { pasteActionLabel, canPasteHere, language };
  const sections = [];

  if (nodeMode === "bay") {
    sections.push({
      key: "bay",
      items: [
        {
          label: menuLabel(language, "+ Add Devices", "+ Thêm thiết bị"),
          submenuKey: "addDevices",
          children: [{ label: "IEC 61850 IED", action: "addDevice" }],
        },
        { label: menuLabel(language, "Device List", "Danh sách thiết bị"), action: "deviceList" },
        { label: menuLabel(language, "Copy", "Sao chép"), action: "copy" },
        pasteItem(pasteContext),
        { label: menuLabel(language, "Show", "Xem"), action: "show" },
        { label: menuLabel(language, "Cut", "Cắt") },
        { label: menuLabel(language, "Rename", "Đổi tên"), action: "rename" },
        { label: menuLabel(language, "Import", "Nhập"), action: "triggerImport" },
        { label: menuLabel(language, "Export", "Xuất"), action: "export" },
        { label: menuLabel(language, "Sync", "Đồng bộ") },
        { label: menuLabel(language, "Delete", "Xóa"), action: "delete", danger: true },
      ],
    });
  } else if (nodeMode === "ied") {
    sections.push({
      key: "ied",
      items: [
        { label: menuLabel(language, "Hardware Information", "Thông tin phần cứng"), action: "hardware" },
        ...iedSubmenus(language),
        { label: menuLabel(language, "Copy", "Sao chép"), action: "copy" },
        pasteItem(pasteContext),
        { label: menuLabel(language, "Show", "Xem"), action: "show" },
        { label: menuLabel(language, "Cut", "Cắt") },
        { label: menuLabel(language, "Rename", "Đổi tên"), action: "rename" },
        { label: menuLabel(language, "Sync", "Đồng bộ") },
        { label: menuLabel(language, "Delete", "Xóa"), action: "delete", danger: true },
      ],
    });
  } else if (nodeMode === "sclFile") {
    sections.push({
      key: "sclFile",
      items: [{ label: menuLabel(language, "Open", "Mở"), action: "openSclFile" }],
    });
  } else if (parameterNodeModes.includes(nodeMode)) {
    sections.push({
      key: "parameterNode",
      items: [
        { label: menuLabel(language, "Open", "Mở"), action: nodeMode },
        { label: menuLabel(language, "Delete", "Xóa"), action: "delete", danger: true },
      ],
    });
  } else if (nodeMode === "substation") {
    sections.push({
      key: "substation",
      items: [
        { label: menuLabel(language, "+ Add voltage level", "+ Thêm cấp điện áp"), action: "addVoltageLevel" },
        { label: menuLabel(language, "+ Add bay", "+ Thêm ngăn lộ"), action: "addBay" },
        { label: menuLabel(language, "+ Add asset", "+ Thêm tài sản"), action: "addAsset" },
        ...substationNodeActions(pasteContext, language),
        signalListExportItem(language),
      ],
    });
  } else if (nodeMode === "voltageLevel") {
    sections.push({
      key: "voltageLevel",
      items: [
        { label: menuLabel(language, "+ Add bay", "+ Thêm ngăn lộ"), action: "addBay" },
        { label: menuLabel(language, "+ Add asset", "+ Thêm tài sản"), action: "addAsset" },
        ...basicNodeActions(actionContext),
        signalListExportItem(language),
      ],
    });
  } else if (isOwnerMode) {
    sections.push({
      key: "owner",
      items: [
        { label: menuLabel(language, "+ Add organisation", "+ Thêm đơn vị"), action: "addOrganisation" },
        { label: menuLabel(language, "+ Add substation", "+ Thêm trạm"), action: "addSubstation" },
        { label: menuLabel(language, "Device List", "Danh sách thiết bị"), action: "deviceList" },
        { label: menuLabel(language, "Copy", "Sao chép"), action: "copy" },
        pasteItem(pasteContext),
        { label: menuLabel(language, "Show", "Xem"), action: "show" },
        { label: menuLabel(language, "Rename", "Đổi tên"), action: "rename" },
        { label: menuLabel(language, "Download", "Tải xuống"), action: "download" },
        { label: menuLabel(language, "Delete", "Xóa"), action: "delete", danger: true },
        { label: menuLabel(language, "Duplicate", "Nhân bản"), action: "duplicate" },
        { label: menuLabel(language, "Export", "Xuất"), action: "export" },
        signalListExportItem(language),
        { label: menuLabel(language, "Import", "Nhập"), action: "triggerImport" },
      ],
    });
  }

  if (hasSelectedNode) {
    sections.push({
      key: "communication",
      items: [{ label: menuLabel(language, "Communication & Services", "Truyền thông và dịch vụ"), action: "communicationServices" }],
    });
  }

  return sections;
}
