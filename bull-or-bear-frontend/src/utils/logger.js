/**
 * Утилита логирования для отладки ошибок API.
 * Все ошибки пишутся в консоль с полным контекстом.
 * История хранится в sessionStorage (последние 50 записей).
 */

const MAX_LOGS = 50;
const STORAGE_KEY = 'bull_bear_logs';

function getStored() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function store(entry) {
  try {
    const logs = getStored();
    logs.unshift(entry);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
  } catch {
    // sessionStorage недоступен — игнорируем
  }
}

/**
 * Извлекает читаемое сообщение из ответа DRF.
 * Поддерживает форматы:
 *   { error: '...' }
 *   { detail: '...' }
 *   { field: ['...'] }
 *   { non_field_errors: ['...'] }
 */
export function extractApiError(error, fallback = 'Неизвестная ошибка') {
  const data = error?.response?.data;
  if (!data) return fallback;

  if (typeof data === 'string') return data;
  if (data.error)  return data.error;
  if (data.detail) return data.detail;
  if (data.non_field_errors) return data.non_field_errors[0];

  // Ошибки валидации полей: { field: ['сообщение'] }
  const fieldErrors = Object.entries(data)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => `${k}: ${v[0]}`);
  if (fieldErrors.length) return fieldErrors.join('; ');

  return fallback;
}

/**
 * Логирует ошибку API с полным контекстом.
 * @param {string} context — где произошла ошибка (например 'BetPanel')
 * @param {Error}  error   — объект ошибки из axios
 */
export function logError(context, error) {
  const status   = error?.response?.status;
  const data     = error?.response?.data;
  const url      = error?.config?.url;
  const method   = error?.config?.method?.toUpperCase();
  const message  = extractApiError(error, error?.message);

  const entry = {
    ts:      new Date().toISOString(),
    context,
    status,
    method,
    url,
    message,
    data,
  };

  store(entry);

  // Вывод в консоль
  console.group(`[${entry.ts}] ${context} — ${message}`);
  console.log('URL:   ', method, url);
  console.log('Status:', status ?? 'нет ответа');
  console.log('Data:  ', data ?? '—');
  if (!error?.response) {
    console.log('Сеть:  ', error?.message);
  }
  console.groupEnd();

  return message;
}

/**
 * Логирует информационное сообщение.
 */
export function logInfo(context, message, data) {
  const entry = {
    ts:      new Date().toISOString(),
    level:   'info',
    context,
    message,
    data,
  };
  store(entry);
  console.log(`[INFO][${context}] ${message}`, data ?? '');
}

/**
 * Возвращает историю логов из sessionStorage.
 * Удобно вызывать в консоли браузера: getLogs()
 */
export function getLogs() {
  return getStored();
}

// Делаем getLogs доступным глобально в консоли браузера
if (typeof window !== 'undefined') {
  window.getLogs = getLogs;
}
