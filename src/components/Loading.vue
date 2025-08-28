<template>
  <div class="loading-overlay">
    <div class="spinner">
      <img
        src="@/assets/images/icon.png"
        alt="loading icon"
        class="spinner-icon"
      />
    </div>
    <span class="loading-text">Đang tải...</span>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}

.spinner-icon {
  width: 28px;
  height: 28px;
}

.loading-text {
  font-size: 14px;
  color: #606266;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
