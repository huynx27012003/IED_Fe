const FALLBACK_ERROR_MESSAGE = 'Request failed';

function stringifyErrorValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyErrorValue(item))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    return extractMessageFromObject(value);
  }
  return '';
}

function extractMessageFromObject(obj) {
  if (!obj || typeof obj !== 'object') return '';

  const preferredKeys = [
    'message',
    'msg',
    'errorMessage',
    'error',
    'detail',
    'details',
    'reason',
    'title',
    'description',
  ];

  for (const key of preferredKeys) {
    const value = stringifyErrorValue(obj[key]);
    if (value) return value;
  }

  const nestedKeys = ['data', 'result', 'payload', 'body'];
  for (const key of nestedKeys) {
    const value = stringifyErrorValue(obj[key]);
    if (value) return value;
  }

  if (obj.errors) {
    const errors = obj.errors;
    if (Array.isArray(errors)) return stringifyErrorValue(errors);
    if (typeof errors === 'object') {
      const value = Object.values(errors)
        .map((item) => stringifyErrorValue(item))
        .filter(Boolean)
        .join(', ');
      if (value) return value;
    }
  }

  return '';
}

export function getApiErrorMessage(error, fallback = FALLBACK_ERROR_MESSAGE) {
  if (!error) return fallback;

  const responseData = error?.response?.data ?? error?.apiResponse ?? error?.data;
  const responseMessage = stringifyErrorValue(responseData);
  if (responseMessage) return responseMessage;

  const apiMessage = stringifyErrorValue(error?.apiMessage);
  if (apiMessage) return apiMessage;

  const responseStatusText = stringifyErrorValue(error?.response?.statusText);
  if (responseStatusText) return responseStatusText;

  const directMessage = stringifyErrorValue(error?.message);
  if (directMessage) return directMessage;

  return fallback;
}

export function logApiError(error, fallback) {
  const message = getApiErrorMessage(error, fallback);
  console.error(message, error);
  return message;
}

export function notifyApiError(vm, error, fallback) {
  const message = logApiError(error, fallback);
  vm?.$message?.error?.(message);
  return message;
}

export function installApiFeedback(app) {
  app.config.globalProperties.$apiErrorMessage = getApiErrorMessage;
  app.config.globalProperties.$notifyApiError = function notify(error, fallback) {
    return notifyApiError(this, error, fallback);
  };
}
