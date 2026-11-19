/**
 * Safe formatting and parsing utilities.
 * Completely eliminates runtime crashes from calling methods on undefined/null values.
 */

export function safeNumber(val, defaultVal = 0) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = Number(val);
  return isNaN(num) ? defaultVal : num;
}

export function safeFormatNumber(val, defaultVal = '0', locale = 'en-IN') {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  try {
    return num.toLocaleString(locale);
  } catch {
    return String(num);
  }
}

export function safeString(val, defaultVal = '') {
  if (val === undefined || val === null) return defaultVal;
  return String(val).trim();
}

export function cleanCellText(val) {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/[\r\n\t]+/g, ' ')
    .trim();
}
