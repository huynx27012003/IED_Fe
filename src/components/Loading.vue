<template>
  <div class="loading-overlay">
    <div class="spinner-wrapper">
      <div class="spinner">
        <img
          src="@/assets/images/icon.png"
          alt="loading icon"
          class="spinner-icon"
        />
      </div>
      <span class="loading-text">Đang tải...</span>
    </div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: absolute;
  inset: 0; /* phủ toàn bộ cha */
  background: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}

/* spinner luôn ở giữa viewport */
.spinner-wrapper {
  position: fixed; /* 👈 quan trọng */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  display: flex;
  flex-direction: column;
  align-items: center;
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
