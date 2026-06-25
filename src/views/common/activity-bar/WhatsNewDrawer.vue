<template>
  <ActivityBarItem
    icon="fa-solid fa-compass"
    title="What's new"
    :active="visible"
    @click="open"
  />

  <transition name="whats-new-drawer">
    <div
      v-if="visible"
      class="whats-new-backdrop"
      @click.self="close"
    >
      <aside
        class="whats-new-panel"
        role="dialog"
        aria-modal="true"
        aria-label="What's new in IED Web"
      >
        <header class="whats-new-header">
          <div>
            <div class="whats-new-eyebrow">IED Web updates</div>
            <h2>What's new in IED Web</h2>
          </div>
          <button
            type="button"
            class="whats-new-close"
            aria-label="Close what's new"
            @click="close"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div class="whats-new-body">
          <section class="whats-new-featured">
            <div class="whats-new-section-title">
              <i class="fa-solid fa-compass"></i>
              <span>Featured updates</span>
            </div>
            <article class="whats-new-hero-card">
              <div class="whats-new-hero-pattern"></div>
              <div class="whats-new-card-icon">
                <i class="fa-solid fa-circle-question"></i>
              </div>
              <h3>Help Center và What's New mới</h3>
              <p>IED Web bổ sung trung tâm trợ giúp, hướng dẫn thao tác trực quan và bảng cập nhật dạng panel trượt từ bên phải.</p>
            </article>
          </section>

          <section class="whats-new-release">
            <h3>0.1.0 Release</h3>
            <article
              v-for="item in items"
              :key="item.title"
              class="whats-new-update-card"
            >
              <div class="whats-new-update-icon">
                <i :class="item.icon"></i>
              </div>
              <div>
                <div class="whats-new-tags">
                  <span
                    v-for="tag in item.tags"
                    :key="tag"
                  >{{ tag }}</span>
                </div>
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
              </div>
            </article>
          </section>
        </div>
      </aside>
    </div>
  </transition>
</template>

<script>
import ActivityBarItem from './ActivityBarItem.vue';

export default {
  name: 'WhatsNewDrawer',
  components: { ActivityBarItem },
  data() {
    return {
      visible: false,
      items: [
        {
          icon: 'fa-solid fa-book-open',
          title: 'Help Center cho IED Web',
          description: 'Menu Help mới tập trung hướng dẫn thao tác cây thiết bị, phím tắt, chuột phải, kéo thả và demo icon/ảnh node đang dùng.',
          tags: ['Help Center', 'Guide']
        },
        {
          icon: 'fa-solid fa-compass',
          title: 'What\'s New dạng panel bên phải',
          description: 'Màn hình cập nhật mới mở từ góc phải như GitLab, giúp người dùng xem nhanh các thay đổi đáng chú ý trong IED Web.',
          tags: ['What\'s New', 'UI']
        },
        {
          icon: 'fa-solid fa-file-export',
          title: 'Export biên bản phiếu chỉnh định rơ le bảo vệ',
          description: 'Bổ sung khả năng xuất biên bản/phiếu chỉnh định rơ le bảo vệ từ dữ liệu cấu hình tham số của IED.',
          tags: ['Export', 'Relay Setting']
        }
      ]
    };
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    open() {
      this.visible = true;
    },
    close() {
      this.visible = false;
    },
    handleKeydown(event) {
      if (event.key === 'Escape') this.close();
    }
  }
};
</script>

<style scoped>
.whats-new-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10004;
  display: flex;
  justify-content: flex-end;
  background: rgba(10, 20, 38, 0.58);
}

.whats-new-panel {
  width: min(520px, 100vw);
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-left: 3px solid #2a78d6;
  background: #fff;
  color: #1f2430;
  box-shadow: -22px 0 56px rgba(8, 20, 44, 0.24);
}

.whats-new-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 30px 32px 24px;
  border-bottom: 1px solid #e2e6ee;
}

.whats-new-eyebrow {
  color: #2a5298;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.whats-new-header h2 {
  margin: 6px 0 0;
  color: #1f2430;
  font-size: 30px;
  line-height: 1.18;
}

.whats-new-close {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #313642;
  cursor: pointer;
}

.whats-new-close:hover {
  background: #f0f3f8;
}

.whats-new-close i {
  font-size: 22px;
}

.whats-new-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 32px 36px;
}

.whats-new-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  color: #1f2430;
  font-size: 18px;
  font-weight: 800;
}

.whats-new-section-title i {
  color: #2a5298;
}

.whats-new-hero-card {
  position: relative;
  overflow: hidden;
  min-height: 170px;
  padding: 28px;
  border: 3px solid #e6533d;
  border-right-color: #a27df0;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(29, 42, 68, 0.08);
}

.whats-new-hero-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.86;
  background-image:
    linear-gradient(90deg, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0.62) 46%, rgba(255, 255, 255, 0.08) 100%),
    url('~@/assets/images/help-center-hero.jpg');
  background-position: center, right 15%;
  background-repeat: no-repeat;
  background-size: 100% 100%, 86% auto;

  /* Old dotted background kept for reference.
  inset: 0 0 0 34%;
  opacity: 0.2;
  background-image: radial-gradient(circle at center, transparent 35%, #ae72e7 36%, #ae72e7 43%, transparent 44%);
  background-size: 24px 24px;
  transform: rotate(22deg) scale(1.15);
  */
}

.whats-new-card-icon {
  position: relative;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  border-radius: 13px;
  background: #e9f2ff;
  color: #2a5298;
}

.whats-new-hero-card h3,
.whats-new-hero-card p {
  position: relative;
}

.whats-new-hero-card h3 {
  max-width: 340px;
  margin: 0 0 12px;
  color: #1f2430;
  font-size: 23px;
  line-height: 1.2;
}

.whats-new-hero-card p {
  max-width: 360px;
  margin: 0;
  color: #4f5666;
  font-size: 15px;
  line-height: 1.5;
}

.whats-new-release {
  margin-top: 34px;
}

.whats-new-release h3 {
  margin: 0 0 18px;
  color: #1f2430;
  font-size: 22px;
}

.whats-new-update-card {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 14px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #cfd6e2;
  border-radius: 14px;
  background: #fff;
}

.whats-new-update-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #eaf3ff;
  color: #2a5298;
}

.whats-new-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.whats-new-tags span {
  padding: 4px 10px;
  border-radius: 999px;
  background: #d9ebff;
  color: #245197;
  font-size: 12px;
  font-weight: 700;
}

.whats-new-update-card h4 {
  margin: 0 0 8px;
  color: #1f2430;
  font-size: 19px;
  line-height: 1.28;
}

.whats-new-update-card p {
  margin: 0;
  color: #4f5666;
  font-size: 14px;
  line-height: 1.5;
}

.whats-new-drawer-enter-active,
.whats-new-drawer-leave-active {
  transition: opacity 0.2s ease;
}

.whats-new-drawer-enter-active .whats-new-panel,
.whats-new-drawer-leave-active .whats-new-panel {
  transition: transform 0.26s ease;
}

.whats-new-drawer-enter-from,
.whats-new-drawer-leave-to {
  opacity: 0;
}

.whats-new-drawer-enter-from .whats-new-panel,
.whats-new-drawer-leave-to .whats-new-panel {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .whats-new-panel {
    width: 100vw;
  }

  .whats-new-header,
  .whats-new-body {
    padding-left: 22px;
    padding-right: 22px;
  }

  .whats-new-header h2 {
    font-size: 24px;
  }

  .whats-new-update-card {
    grid-template-columns: 1fr;
  }
}
</style>
