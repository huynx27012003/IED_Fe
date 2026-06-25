export const API_REQUEST_START_EVENT = 'ied-api:request-start';
export const API_REQUEST_END_EVENT = 'ied-api:request-end';

const ACTION_SELECTOR = [
  'button',
  '.el-button',
  '[role="button"]',
  'input[type="button"]',
  'input[type="submit"]',
  '.context-menu li',
  '.submenu-item',
].join(',');

export function emitApiRequestStart(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(API_REQUEST_START_EVENT, { detail }));
}

export function emitApiRequestEnd(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(API_REQUEST_END_EVENT, { detail }));
}

function injectStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ied-api-action-feedback-style')) return;

  const style = document.createElement('style');
  style.id = 'ied-api-action-feedback-style';
  style.textContent = `
    .is-api-action-loading {
      opacity: 0.62 !important;
      pointer-events: none !important;
      cursor: not-allowed !important;
    }

    button.is-api-action-loading,
    .el-button.is-api-action-loading,
    [role="button"].is-api-action-loading,
    input.is-api-action-loading,
    .context-menu li.is-api-action-loading,
    .submenu-item.is-api-action-loading {
      position: relative;
    }

    button.is-api-action-loading::after,
    .el-button.is-api-action-loading::after,
    [role="button"].is-api-action-loading::after,
    .context-menu li.is-api-action-loading::after,
    .submenu-item.is-api-action-loading::after {
      content: "";
      width: 12px;
      height: 12px;
      display: inline-block;
      margin-left: 8px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      vertical-align: -2px;
      animation: ied-api-action-spin 0.72s linear infinite;
    }

    @keyframes ied-api-action-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function setElementBusy(el, busy) {
  if (!el) return;
  if (busy) {
    if (!el.__iedApiActionFeedback) {
      el.__iedApiActionFeedback = {
        disabled: el.disabled,
        ariaBusy: el.getAttribute('aria-busy'),
        ariaDisabled: el.getAttribute('aria-disabled'),
      };
    }
    el.classList.add('is-api-action-loading');
    el.setAttribute('aria-busy', 'true');
    el.setAttribute('aria-disabled', 'true');
    if ('disabled' in el) el.disabled = true;
    return;
  }

  const previous = el.__iedApiActionFeedback;
  el.classList.remove('is-api-action-loading');
  if (previous) {
    if ('disabled' in el) el.disabled = previous.disabled;
    if (previous.ariaBusy == null) el.removeAttribute('aria-busy');
    else el.setAttribute('aria-busy', previous.ariaBusy);
    if (previous.ariaDisabled == null) el.removeAttribute('aria-disabled');
    else el.setAttribute('aria-disabled', previous.ariaDisabled);
    delete el.__iedApiActionFeedback;
  } else {
    el.removeAttribute('aria-busy');
    el.removeAttribute('aria-disabled');
  }
}

export function installApiActionFeedback() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (window.__iedApiActionFeedbackInstalled) return;
  window.__iedApiActionFeedbackInstalled = true;

  injectStyle();

  let lastClickEl = null;
  let lastClickAt = 0;
  let pendingCount = 0;
  const busyElements = new Set();

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target?.closest?.(ACTION_SELECTOR);
      if (!target) return;
      lastClickEl = target;
      lastClickAt = Date.now();
    },
    true
  );

  window.addEventListener(API_REQUEST_START_EVENT, () => {
    pendingCount += 1;
    if (lastClickEl && Date.now() - lastClickAt <= 500) {
      busyElements.add(lastClickEl);
      setElementBusy(lastClickEl, true);
    }
  });

  window.addEventListener(API_REQUEST_END_EVENT, () => {
    pendingCount = Math.max(0, pendingCount - 1);
    if (pendingCount > 0) return;
    busyElements.forEach((el) => setElementBusy(el, false));
    busyElements.clear();
    lastClickEl = null;
    lastClickAt = 0;
  });
}
