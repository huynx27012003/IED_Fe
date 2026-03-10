<template>
  <div class="mock-view">
    <div class="mock-view-header">
      <i class="fa-brands fa-github"></i>
      <span>SOURCE CONTROL</span>
    </div>
    <div class="mock-view-content">
      <div class="source-section">
        <div class="source-section-header">
          <i class="fa-solid fa-chevron-down"></i>
          <span>Changes</span>
          <span class="badge">5</span>
        </div>
        <div class="source-file-list">
          <div class="source-file-item">
            <span class="file-status modified">M</span>
            <span class="file-name">treeNavigation.vue</span>
            <span class="file-path">src/views/MainScreenView</span>
          </div>
          <div class="source-file-item">
            <span class="file-status added">A</span>
            <span class="file-name">ActivityBar.vue</span>
            <span class="file-path">src/views/MainScreenView</span>
          </div>
          <div class="source-file-item">
            <span class="file-status added">A</span>
            <span class="file-name">SCLManage.vue</span>
            <span class="file-path">src/views/common</span>
          </div>
          <div class="source-file-item">
            <span class="file-status added">A</span>
            <span class="file-name">MockView2.vue</span>
            <span class="file-path">src/views/MainScreenView</span>
          </div>
          <div class="source-file-item">
            <span class="file-status modified">M</span>
            <span class="file-name">treeNavigation.script.js</span>
            <span class="file-path">src/views/MainScreenView</span>
          </div>
        </div>
      </div>
      
      <div class="commit-section">
        <div class="commit-input-wrapper">
          <textarea 
            class="commit-input" 
            placeholder="Message (press Ctrl+Enter to commit)"
            disabled
          ></textarea>
        </div>
        <button class="commit-btn" disabled>
          <i class="fa-solid fa-check"></i>
          Commit
        </button>
      </div>

      <div class="source-section">
        <div class="source-section-header">
          <i class="fa-solid fa-chevron-down"></i>
          <span>Branches</span>
        </div>
        <div class="branch-list">
          <div class="branch-item active">
            <i class="fa-solid fa-code-branch"></i>
            <span>main</span>
            <span class="branch-badge">current</span>
          </div>
          <div class="branch-item">
            <i class="fa-solid fa-code-branch"></i>
            <span>develop</span>
          </div>
          <div class="branch-item">
            <i class="fa-solid fa-code-branch"></i>
            <span>feature/activity-bar</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MockView2'
};
</script>

<style scoped>
.mock-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.mock-view-header {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  font-weight: 600;
  color: #555;
  font-size: 11px;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e0e0e0;
}

.mock-view-header i {
  font-size: 16px;
  color: #333;
}

.mock-view-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.source-section {
  margin-bottom: 16px;
}

.source-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
}

.source-section-header:hover {
  background: #f5f5f5;
}

.source-section-header i {
  font-size: 10px;
  color: #888;
}

.badge {
  background: #f0ad4e;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  margin-left: auto;
}

.source-file-list {
  padding: 0 8px;
}

.source-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.source-file-item:hover {
  background: #f5f5f5;
}

.file-status {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.file-status.modified {
  background: #f0ad4e;
  color: white;
}

.file-status.added {
  background: #5cb85c;
  color: white;
}

.file-status.deleted {
  background: #d9534f;
  color: white;
}

.file-name {
  color: #333;
  font-weight: 500;
}

.file-path {
  color: #999;
  font-size: 10px;
  margin-left: auto;
}

.commit-section {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  margin: 8px 0;
}

.commit-input-wrapper {
  margin-bottom: 8px;
}

.commit-input {
  width: 100%;
  height: 60px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  resize: none;
  box-sizing: border-box;
}

.commit-btn {
  width: 100%;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0.6;
}

.branch-list {
  padding: 0 8px;
}

.branch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #555;
}

.branch-item:hover {
  background: #f5f5f5;
}

.branch-item.active {
  color: #007bff;
  font-weight: 600;
}

.branch-item i {
  font-size: 14px;
}

.branch-badge {
  background: #007bff;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 9px;
  margin-left: auto;
}
</style>
