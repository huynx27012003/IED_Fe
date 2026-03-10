import { ref, onUnmounted } from 'vue'


export function useResizable() {
  const resizing = ref(false)
  let resizeHandler = null
  let stopHandler = null

  const startResize = (onResize, onStop) => {
    if (resizing.value) return
    
    resizing.value = true
    resizeHandler = (e) => {
      if (resizing.value) {
        requestAnimationFrame(() => {
          if (resizing.value) onResize(e)
        })
      }
    }
    stopHandler = () => stopResize(onStop)
    
    document.addEventListener('mousemove', resizeHandler)
    document.addEventListener('mouseup', stopHandler)
  }

  const stopResize = (onStop) => {
    if (!resizing.value) return
    
    resizing.value = false
    if (resizeHandler) {
      document.removeEventListener('mousemove', resizeHandler)
      resizeHandler = null
    }
    if (stopHandler) {
      document.removeEventListener('mouseup', stopHandler)
      stopHandler = null
    }
    if (onStop) onStop()
  }

  onUnmounted(() => {
    if (resizeHandler) {
      document.removeEventListener('mousemove', resizeHandler)
    }
    if (stopHandler) {
      document.removeEventListener('mouseup', stopHandler)
    }
  })

  return {
    resizing,
    startResize,
    stopResize
  }
}

/**
 * Calculate new width based on mouse position
 * @param {MouseEvent} event - Mouse event
 * @param {number} minWidth - Minimum width
 * @param {number} maxWidth - Maximum width (optional)
 * @param {HTMLElement} referenceEl - Reference element for calculation
 * @param {string} direction - 'left' or 'right' 
 * @returns {number} New width
 */
export function calculateResizeWidth(event, minWidth = 100, maxWidth = null, referenceEl = null, direction = 'right') {
  if (!referenceEl) return minWidth
  
  const rect = referenceEl.getBoundingClientRect()
  let newWidth
  
  if (direction === 'right') {
    newWidth = event.clientX - rect.left
  } else {
    newWidth = rect.right - event.clientX
  }
  
  newWidth = Math.max(minWidth, newWidth)
  if (maxWidth) {
    newWidth = Math.min(maxWidth, newWidth)
  }
  
  return newWidth
}
