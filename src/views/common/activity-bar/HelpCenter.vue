<template>
  <ActivityBarItem
    icon="fa-solid fa-circle-question"
    title="Help"
    :active="menuVisible || dialogVisible"
    @click="toggleMenu"
  >
    <div
      v-if="menuVisible"
      class="help-menu"
      @click.stop
    >
      <div class="help-menu-header">
        <div>
          <div class="help-menu-title">IED Web</div>
          <div class="help-menu-subtitle">v0.1.0</div>
        </div>
        <i class="fa-solid fa-circle-question"></i>
      </div>

      <div class="help-menu-list">
        <button
          v-for="item in menuItems"
          :key="item.id"
          type="button"
          :class="['help-menu-item', { separated: item.separated }]"
          @click="openDialog(item.id)"
        >
          <i :class="item.icon"></i>
          <div>
            <div class="help-menu-item-title">{{ item.title }}</div>
            <div class="help-menu-item-description">{{ item.description }}</div>
          </div>
        </button>
      </div>
    </div>
  </ActivityBarItem>

  <div
    v-if="dialogVisible"
    class="help-dialog-backdrop"
    @click.self="closeDialog"
  >
    <section
      class="help-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="activeDialog.title"
    >
      <header class="help-dialog-header">
        <div class="help-dialog-title-icon">
          <i :class="activeDialog.icon"></i>
        </div>
        <div>
          <div class="help-dialog-eyebrow">{{ activeDialog.eyebrow }}</div>
          <h2>{{ activeDialog.title }}</h2>
          <p>{{ activeDialog.description }}</p>
        </div>
        <button
          type="button"
          class="help-dialog-close"
          aria-label="Close help dialog"
          @click="closeDialog"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>

      <div class="help-dialog-body">
        <section
          v-for="section in activeDialog.sections"
          :key="section.title"
          class="help-dialog-section"
        >
          <h3>
            <i :class="section.icon"></i>
            {{ section.title }}
          </h3>
          <div class="help-dialog-items">
            <div
              v-for="item in section.items"
              :key="item.key"
              class="help-dialog-row"
            >
              <span
                class="help-dialog-demo"
                :class="{ empty: !item.demoIcon && !item.demoImage && !item.demoText }"
              >
                <img
                  v-if="item.demoImage"
                  :src="item.demoImage"
                  :alt="item.key"
                />
                <i v-else-if="item.demoIcon" :class="item.demoIcon"></i>
                <span v-else-if="item.demoText">{{ item.demoText }}</span>
              </span>
              <span class="help-dialog-key">{{ item.key }}</span>
              <span class="help-dialog-value">{{ item.value }}</span>
            </div>
          </div>

          <div
            v-if="section.tables && section.tables.length"
            class="help-dialog-tables"
          >
            <div
              v-for="table in section.tables"
              :key="table.title"
              class="help-dialog-table-card"
            >
              <div v-if="table.title" class="help-dialog-table-title">
                {{ table.title }}
              </div>
              <p v-if="table.description" class="help-dialog-table-description">
                {{ table.description }}
              </p>
              <div class="help-dialog-table-scroll">
                <table class="help-dialog-table">
                  <thead>
                    <tr>
                      <th
                        v-for="column in table.columns"
                        :key="column.key"
                        scope="col"
                      >
                        {{ column.label }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in table.rows"
                      :key="row.model"
                    >
                      <td
                        v-for="column in table.columns"
                        :key="`${row.model}-${column.key}`"
                      >
                        {{ row[column.key] }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <div v-if="activeDialog.note" class="help-dialog-note">
          {{ activeDialog.note }}
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import ownerIcon from '@/assets/images/owner.png';
import locationIcon from '@/assets/images/location.png';
import voltageIcon from '@/assets/images/Voltage_Level.png';
import feederIcon from '@/assets/images/feeder.png';
import iedIcon from '@/assets/images/IED.png';
import settingsIcon from '@/assets/images/settings.png';
import levelIcon from '@/assets/images/level.png';
import systemSettingIcon from '@/assets/images/systemSetting.png';
import protectionIcon from '@/assets/images/protection.png';
import groupIcon from '@/assets/images/group.png';
import ActivityBarItem from './ActivityBarItem.vue';

export default {
  name: 'HelpCenter',
  components: { ActivityBarItem },
  emits: ['open-whats-new'],
  data() {
    return {
      menuVisible: false,
      dialogVisible: false,
      activeDialogId: 'guide',
      menuItems: [
        {
          id: 'guide',
          icon: 'fa-solid fa-book-open',
          title: 'Hướng dẫn sử dụng IED',
          description: 'Các thao tác cơ bản với cây thiết bị, SCL và file.'
        },
        {
          id: 'shortcuts',
          icon: 'fa-solid fa-keyboard',
          title: 'Phím tắt',
          description: 'Xem các phím thao tác nhanh trong IED Web.'
        },
        {
          id: 'docs',
          icon: 'fa-solid fa-file-lines',
          title: 'Tài liệu IED',
          description: 'Tài liệu nghiệp vụ và hướng dẫn cấu hình IED.'
        },
        {
          id: 'whatsNew',
          icon: 'fa-solid fa-compass',
          title: 'Có gì mới',
          description: 'Các thay đổi và cập nhật gần đây của IED Web.',
          separated: true
        },
        {
          id: 'systemInfo',
          icon: 'fa-solid fa-circle-info',
          title: 'Thông tin hệ thống',
          description: 'Phiên bản ứng dụng, trình duyệt và thông tin môi trường.'
        }
      ],
      dialogs: {
        guide: {
          eyebrow: 'IED Web Help',
          icon: 'fa-solid fa-book-open',
          title: 'Hướng dẫn thao tác IED Web',
          description: 'Tổng hợp các thao tác chính đang hỗ trợ trên cây thiết bị, SCL và tab làm việc.',
          sections: [
            {
              title: 'Nút trên thanh bên',
              icon: 'fa-solid fa-bars-staggered',
              items: [
                { key: 'Collapse / Expand', value: 'Thu gọn hoặc mở lại sidebar bên trái.', demoIcon: 'fa-solid fa-angles-left' },
                { key: 'Explorer', value: 'Mở cây Owner, Substation, Voltage Level, Bay và IED.', demoIcon: 'fa-solid fa-folder-tree' },
                { key: 'SCL Import', value: 'Mở khu vực import và quản lý cây SCL.', demoIcon: 'fa-solid fa-file-import' },
                { key: 'What\'s new', value: 'Xem nhanh các cập nhật gần đây của IED Web.', demoIcon: 'fa-solid fa-compass' },
                { key: 'Help', value: 'Mở menu trợ giúp và các dialog hướng dẫn.', demoIcon: 'fa-solid fa-circle-question' }
              ]
            },
            {
              title: 'Biểu tượng trên cây',
              icon: 'fa-solid fa-icons',
              items: [
                { key: 'Organisation', value: 'Node chủ sở hữu/đơn vị trong cây thiết bị.', demoImage: ownerIcon },
                { key: 'Substation', value: 'Node trạm/substation bên dưới organisation.', demoImage: locationIcon },
                { key: 'Voltage Level', value: 'Node cấp điện áp bên trong substation.', demoImage: voltageIcon },
                { key: 'Bay', value: 'Node ngăn lộ/feeder chứa các IED.', demoImage: feederIcon },
                { key: 'IED', value: 'Thiết bị IEC 61850 IED trong bay.', demoImage: iedIcon },
                { key: 'Setting Function', value: 'Nhóm chức năng setting trong cây tham số.', demoImage: settingsIcon },
                { key: 'Protection Function', value: 'Nhóm chức năng bảo vệ trong cây tham số.', demoImage: protectionIcon },
                { key: 'Protection Level', value: 'Cấp bảo vệ bên dưới protection function.', demoImage: levelIcon },
                { key: 'System / Line Parameters', value: 'Nhóm thông số hệ thống hoặc đường dây.', demoImage: systemSettingIcon },
                { key: 'Protection Group', value: 'Nhóm bảo vệ trong cấu hình tham số.', demoImage: groupIcon },
                { key: 'SCL badge', value: 'Các node SCL dùng badge như DS, LD, LN, SG, G, R, DO, DA.', demoText: 'LD' }
              ]
            },
            {
              title: 'Thao tác chuột',
              icon: 'fa-solid fa-computer-mouse',
              items: [
                { key: 'Click trái', value: 'Chọn node, hiển thị thông tin ở Properties Pane và cập nhật breadcrumb.', demoIcon: 'fa-solid fa-arrow-pointer' },
                { key: 'Click mũi tên', value: 'Mở hoặc đóng nhánh cây; nếu chưa có dữ liệu con thì hệ thống tải children.', demoIcon: 'fa-solid fa-caret-right' },
                { key: 'Ctrl + Click', value: 'Chọn thêm node trong cây mà không làm mất lựa chọn hiện tại.', demoIcon: 'fa-solid fa-square-check' },
                { key: 'Double click', value: 'Mở hoặc đóng nhánh như click mũi tên; với IED/tham số sẽ mở hoặc focus tab Parameter Settings.', demoIcon: 'fa-solid fa-computer-mouse' },
                { key: 'Chuột phải', value: 'Mở context menu theo loại node; với node tham số sẽ mở nhanh tab Parameter Settings.', demoIcon: 'fa-solid fa-list' },
                { key: 'Kéo thả', value: 'Di chuyển node sang cấp cha hợp lệ: IED vào Bay, Bay vào Voltage Level, Voltage Level vào Substation, Substation vào Organisation.', demoIcon: 'fa-solid fa-up-down-left-right' }
              ]
            },
            {
              title: 'Menu chuột phải',
              icon: 'fa-solid fa-list-check',
              items: [
                { key: 'Add', value: 'Thêm Organisation, Substation, Voltage Level, Bay hoặc IEC 61850 IED tùy cấp đang chọn.', demoIcon: 'fa-solid fa-plus' },
                { key: 'Show', value: 'Mở dialog thông tin chi tiết của Organisation, Substation, Voltage Level, Bay hoặc IED.', demoIcon: 'fa-solid fa-eye' },
                { key: 'Device List', value: 'Mở danh sách thiết bị theo node đang chọn.', demoIcon: 'fa-solid fa-table-list' },
                { key: 'Hardware Information', value: 'Mở tab thông tin phần cứng của IED.', demoIcon: 'fa-solid fa-microchip' },
                { key: 'Parameter Settings', value: 'Mở, import, export hoặc generate report cho cấu hình tham số IED.', demoImage: settingsIcon },
                { key: 'SCL Management', value: 'Mở, import hoặc export SCL của IED.', demoIcon: 'fa-solid fa-file-code' },
                { key: 'Compare Setting', value: 'Chọn IED khác để mở tab so sánh setting.', demoIcon: 'fa-solid fa-code-compare' },
                { key: 'Communication & Services', value: 'Mở tab thông tin dịch vụ truyền thông của node.', demoIcon: 'fa-solid fa-network-wired' },
                { key: 'Copy / Paste', value: 'Copy node rồi paste vào node cha hợp lệ theo đúng cấp cây.', demoIcon: 'fa-solid fa-copy' },
                { key: 'Rename / Delete', value: 'Đổi tên node hoặc xóa node sau khi xác nhận.', demoIcon: 'fa-solid fa-pen-to-square' }
              ]
            }
          ]
        },
        shortcuts: {
          eyebrow: 'IED Web Help',
          icon: 'fa-solid fa-keyboard',
          title: 'Phím tắt và thao tác nhanh',
          description: 'Các phím và tổ hợp đang có tác dụng trực tiếp trong giao diện hiện tại.',
          sections: [
            {
              title: 'Phím đang hỗ trợ',
              icon: 'fa-solid fa-keyboard',
              items: [
                { key: 'Ctrl + Click', value: 'Chọn thêm node trên cây.', demoText: 'Ctrl' },
                { key: 'Enter', value: 'Xác nhận tên mới khi đang rename inline.', demoText: 'Enter' },
                { key: 'Escape', value: 'Hủy rename inline hoặc đóng dialog Help.', demoText: 'Esc' },
                { key: 'Double click', value: 'Mở nhanh nhánh cây hoặc focus tab Parameter Settings cho IED/tham số.', demoIcon: 'fa-solid fa-computer-mouse' }
              ]
            },
            {
              title: 'Copy / Paste',
              icon: 'fa-solid fa-copy',
              items: [
                { key: 'Copy', value: 'Chuột phải vào node hợp lệ rồi chọn Copy.', demoIcon: 'fa-solid fa-copy' },
                { key: 'Paste', value: 'Chuột phải vào node cha hợp lệ rồi chọn Paste.', demoIcon: 'fa-solid fa-paste' },
                { key: 'Cấp hợp lệ', value: 'IED -> Bay, Bay -> Voltage Level, Voltage Level -> Substation, Substation -> Organisation.', demoIcon: 'fa-solid fa-sitemap' },
                { key: 'Ctrl+C / Ctrl+V', value: 'Copy/Paste bằng phím tắt.', demoText: 'Ctrl' }
              ]
            }
          ]
        },
        docs: {
          eyebrow: 'IED Web Help',
          icon: 'fa-solid fa-file-lines',
          title: 'Tài liệu IED',
          description: 'Khu vực này dành cho tài liệu nghiệp vụ và hướng dẫn cấu hình IED.',
          sections: [
            {
              title: 'Nội dung nên đặt tại đây',
              icon: 'fa-solid fa-file-lines',
              items: [
                { key: 'SCL / IEC 61850', value: 'Quy trình import, export và kiểm tra dữ liệu SCL.', demoIcon: 'fa-solid fa-file-code' },
                { key: 'Parameter Settings', value: 'Quy trình xem, sửa, import/export setting và generate report.', demoImage: settingsIcon },
                { key: 'Communication', value: 'Hướng dẫn đọc thông tin GOOSE, Report, Setting Group và dịch vụ truyền thông.', demoIcon: 'fa-solid fa-network-wired' }
              ]
            },
            {
              title: 'Parameter Settings',
              icon: 'fa-solid fa-sliders',
              items: [
                { key: 'Import / Export', value: 'Định dạng file đang hỗ trợ theo model IED trong Parameter Settings.', demoImage: settingsIcon }
              ],
              tables: [
                {
                  title: 'Model và định dạng file',
                  description: 'Import chọn parser theo model của IED; Export tạo file XRIO, Generate Report tạo file DOCX.',
                  columns: [
                    { key: 'model', label: 'Model' },
                    { key: 'importFormat', label: 'Import' },
                    { key: 'exportFormat', label: 'Export' }
                  ],
                  rows: [
                    { model: 'REF615', importFormat: '.xrio / XML XRIO', exportFormat: '.xrio; .docx' },
                    { model: 'REX615', importFormat: '.csv', exportFormat: '.xrio; .docx' },
                    { model: 'REX620', importFormat: '.csv', exportFormat: '.xrio; .docx' },
                    { model: 'REX630', importFormat: '.csv', exportFormat: '.xrio; .docx' },
                    { model: 'REX640', importFormat: '.csv', exportFormat: '.xrio; .docx' },
                    { model: 'REF620', importFormat: '.csv', exportFormat: '.xrio; .docx' },
                    { model: 'REF630', importFormat: '.csv', exportFormat: '.xrio; .docx' },
                    { model: 'REL650', importFormat: '.csv', exportFormat: '.xrio; .docx' },
                    { model: 'REL670', importFormat: '.csv', exportFormat: '.xrio; .docx' },
                    { model: 'PCS9611S', importFormat: '.xlsx', exportFormat: '.xrio; .docx' },
                    { model: 'P543', importFormat: '.xls / .xlsx, sheet Settings', exportFormat: '.xrio; .docx' }
                  ]
                }
              ]
            }
          ]
        },
        systemInfo: {
          eyebrow: 'IED Web Help',
          icon: 'fa-solid fa-circle-info',
          title: 'Thông tin hệ thống',
          description: 'Thông tin cơ bản để kiểm tra phiên bản và môi trường khi hỗ trợ.',
          sections: [
            {
              title: 'Ứng dụng',
              icon: 'fa-solid fa-circle-info',
              items: [
                { key: 'Product', value: 'IED Web', demoIcon: 'fa-solid fa-laptop-code' },
                { key: 'Version', value: '0.1.0', demoIcon: 'fa-solid fa-code-branch' },
                { key: 'Frontend', value: 'Vue 3 + Element Plus', demoIcon: 'fa-brands fa-vuejs' },
                { key: 'Module chính', value: 'Tree Navigation, SCL Management, Parameter Settings, Device Management.', demoIcon: 'fa-solid fa-layer-group' }
              ]
            }
          ]
        }
      }
    };
  },
  computed: {
    activeDialog() {
      return this.dialogs[this.activeDialogId] || this.dialogs.guide;
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    toggleMenu(event) {
      event?.stopPropagation?.();
      this.menuVisible = !this.menuVisible;
    },
    openDialog(id) {
      if (id === 'whatsNew') {
        this.closeMenu();
        this.closeDialog();
        this.$emit('open-whats-new');
        return;
      }
      this.activeDialogId = this.dialogs[id] ? id : 'guide';
      this.dialogVisible = true;
      this.closeMenu();
    },
    closeDialog() {
      this.dialogVisible = false;
    },
    closeMenu() {
      this.menuVisible = false;
    },
    close() {
      this.closeDialog();
      this.closeMenu();
    },
    handleDocumentClick() {
      this.closeMenu();
    },
    handleKeydown(event) {
      if (event.key === 'Escape') this.close();
    }
  }
};
</script>

<style scoped>
.help-menu {
  position: absolute;
  left: 56px;
  bottom: 0;
  width: 330px;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
  border: 1px solid rgba(178, 204, 235, 0.8);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(250, 254, 255, 0.96), rgba(239, 247, 255, 0.94));
  color: #143260;
  box-shadow: 0 14px 32px rgba(12, 35, 70, 0.2);
  backdrop-filter: blur(12px) saturate(118%);
  -webkit-backdrop-filter: blur(12px) saturate(118%);
  cursor: default;
  text-align: left;
  z-index: 10002;
}

.help-menu::before {
  content: "";
  position: absolute;
  left: -7px;
  bottom: 16px;
  width: 12px;
  height: 12px;
  border-left: 1px solid rgba(178, 204, 235, 0.8);
  border-bottom: 1px solid rgba(178, 204, 235, 0.8);
  background: rgba(245, 251, 255, 0.96);
  transform: rotate(45deg);
}

.help-menu-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 14px;
  border-bottom: 1px solid rgba(183, 207, 235, 0.75);
}

.help-menu-header i {
  color: #2a5298;
  font-size: 22px;
  filter: none;
}

.help-menu-title {
  color: #0f274a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.help-menu-subtitle {
  margin-top: 4px;
  color: #55719b;
  font-size: 13px;
  font-weight: 600;
}

.help-menu-list {
  position: relative;
  padding: 8px 0;
}

.help-menu-item {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 12px;
  width: 100%;
  padding: 11px 18px;
  border: 0;
  background: transparent;
  color: #173968;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.help-menu-item.separated {
  margin-top: 6px;
  border-top: 1px solid rgba(183, 207, 235, 0.75);
  padding-top: 16px;
}

.help-menu-item > i {
  margin-top: 2px;
  color: #2a5298;
  font-size: 15px;
  filter: none;
}

.help-menu-item-title {
  color: #0f274a;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
}

.help-menu-item-description {
  margin-top: 3px;
  color: #526b92;
  font-size: 12px;
  line-height: 1.35;
}

.help-menu-item:hover {
  background: rgba(42, 82, 152, 0.08);
}

.help-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10003;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgba(12, 27, 52, 0.38);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.help-dialog {
  width: min(920px, calc(100vw - 56px));
  max-height: min(760px, calc(100vh - 56px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(178, 204, 235, 0.86);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(250, 254, 255, 0.98), rgba(238, 247, 255, 0.96));
  color: #10284c;
  box-shadow: 0 24px 64px rgba(7, 22, 47, 0.28);
}

.help-dialog-header {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  gap: 16px;
  align-items: flex-start;
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(183, 207, 235, 0.78);
}

.help-dialog-title-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(42, 82, 152, 0.14), rgba(0, 210, 255, 0.11));
  color: #245197;
  box-shadow: inset 0 0 0 1px rgba(42, 82, 152, 0.16);
}

.help-dialog-title-icon i {
  font-size: 22px;
}

.help-dialog-eyebrow {
  color: #2a5298;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.help-dialog h2 {
  margin: 4px 0 6px;
  color: #0f274a;
  font-size: 24px;
  line-height: 1.2;
}

.help-dialog-header p {
  margin: 0;
  color: #526b92;
  font-size: 14px;
  line-height: 1.5;
}

.help-dialog-close {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 12px;
  background: rgba(42, 82, 152, 0.08);
  color: #244d8f;
  cursor: pointer;
}

.help-dialog-close:hover {
  background: rgba(42, 82, 152, 0.14);
}

.help-dialog-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 18px 24px 24px;
}

.help-dialog-section {
  margin-top: 18px;
}

.help-dialog-section:first-child {
  margin-top: 0;
}

.help-dialog-section h3 {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 10px;
  color: #143260;
  font-size: 16px;
}

.help-dialog-section h3 i {
  color: #2a5298;
}

.help-dialog-items {
  display: grid;
  gap: 8px;
}

.help-dialog-row {
  display: grid;
  grid-template-columns: 42px minmax(150px, 220px) 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(183, 207, 235, 0.58);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.56);
}

.help-dialog-demo {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(42, 82, 152, 0.09);
  color: #245197;
  font-size: 15px;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgba(42, 82, 152, 0.1);
}

.help-dialog-demo img {
  max-width: 24px;
  max-height: 24px;
  object-fit: contain;
}

.help-dialog-demo.empty {
  visibility: hidden;
}

.help-dialog-key {
  color: #0f274a;
  font-size: 13px;
  font-weight: 800;
}

.help-dialog-value {
  color: #526b92;
  font-size: 13px;
  line-height: 1.45;
}

.help-dialog-tables {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.help-dialog-table-card {
  overflow: hidden;
  border: 1px solid rgba(183, 207, 235, 0.68);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.62);
}

.help-dialog-table-title {
  padding: 12px 14px 0;
  color: #0f274a;
  font-size: 14px;
  font-weight: 800;
}

.help-dialog-table-description {
  margin: 4px 0 0;
  padding: 0 14px 12px;
  color: #526b92;
  font-size: 13px;
  line-height: 1.45;
}

.help-dialog-table-scroll {
  overflow-x: auto;
}

.help-dialog-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  color: #244366;
  font-size: 13px;
}

.help-dialog-table th,
.help-dialog-table td {
  padding: 10px 12px;
  border-top: 1px solid rgba(183, 207, 235, 0.58);
  text-align: left;
  vertical-align: top;
}

.help-dialog-table th {
  background: rgba(42, 82, 152, 0.08);
  color: #143260;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.help-dialog-table td:first-child {
  color: #0f274a;
  font-weight: 800;
  white-space: nowrap;
}

.help-dialog-note {
  margin-top: 18px;
  padding: 12px 14px;
  border-left: 3px solid #2a5298;
  border-radius: 10px;
  background: rgba(42, 82, 152, 0.08);
  color: #244366;
  font-size: 13px;
  line-height: 1.45;
}

@media (max-width: 720px) {
  .help-dialog-backdrop {
    align-items: stretch;
    padding: 14px;
  }

  .help-dialog {
    width: 100%;
    max-height: calc(100vh - 28px);
  }

  .help-dialog-header {
    grid-template-columns: 44px 1fr auto;
    gap: 12px;
    padding: 18px;
  }

  .help-dialog-title-icon {
    width: 42px;
    height: 42px;
  }

  .help-dialog h2 {
    font-size: 20px;
  }

  .help-dialog-body {
    padding: 16px;
  }

  .help-dialog-row {
    grid-template-columns: 36px 1fr;
  }

  .help-dialog-value {
    grid-column: 2;
  }
}
</style>
