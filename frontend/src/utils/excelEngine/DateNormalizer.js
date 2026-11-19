/**
 * Universal Date Normalizer for Excel data.
 * Supports Excel serial numbers, JS Date instances, and diverse string formats.
 */

const MONTH_NAMES = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

export function normalizeDate(val) {
  if (val === undefined || val === null || val === '') {
    return { iso: '', display: '', raw: val, isValid: false };
  }

  // 1. JS Date instance
  if (val instanceof Date) {
    if (isNaN(val.getTime())) {
      return { iso: '', display: '', raw: val, isValid: false };
    }
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return {
      iso: `${y}-${m}-${d}`,
      display: `${d}/${m}/${y}`,
      raw: val,
      isValid: true,
    };
  }

  // 2. Numeric Excel serial number (days since 1899-12-30)
  // Handles both number type and string representation (e.g. 46388 or "46388")
  const numVal = typeof val === 'number'
    ? val
    : (typeof val === 'string' && /^\d{5}$/.test(val.trim()) ? Number(val.trim()) : null);

  if (numVal !== null && !isNaN(numVal) && numVal >= 10000 && numVal <= 90000) {
    // 25569 = days between 1899-12-30 and 1970-01-01
    const ms = Math.round((numVal - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return {
        iso: `${y}-${m}-${day}`,
        display: `${day}/${m}/${y}`,
        raw: val,
        isValid: true,
      };
    }
  }

  const str = String(val).trim();
  if (!str) {
    return { iso: '', display: '', raw: val, isValid: false };
  }

  // 3. String representation: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    const monthNum = parseInt(m, 10);
    const dayNum = parseInt(d, 10);
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return {
        iso: `${y}-${m}-${d}`,
        display: `${d}/${m}/${y}`,
        raw: val,
        isValid: true,
      };
    }
  }

  // 4. String representation: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    const monthNum = parseInt(m, 10);
    const dayNum = parseInt(d, 10);
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return {
        iso: `${y}-${m}-${d}`,
        display: `${d}/${m}/${y}`,
        raw: val,
        isValid: true,
      };
    }
  }

  // 5. String with named month: e.g. "01-Feb-2027", "1 February 2027", "Feb 01, 2027"
  const namedMatch = str.match(/(\d{1,2})[\s\-\/]+([a-zA-Z]+)[\s\-\/,]+(\d{4})/) ||
                     str.match(/([a-zA-Z]+)[\s\-\/]+(\d{1,2})[\s\-\/,]+(\d{4})/);
  if (namedMatch) {
    let d, mText, y;
    if (isNaN(Number(namedMatch[1]))) {
      mText = namedMatch[1].toLowerCase();
      d = namedMatch[2].padStart(2, '0');
      y = namedMatch[3];
    } else {
      d = namedMatch[1].padStart(2, '0');
      mText = namedMatch[2].toLowerCase();
      y = namedMatch[3];
    }
    const m = MONTH_NAMES[mText];
    if (m) {
      return {
        iso: `${y}-${m}-${d}`,
        display: `${d}/${m}/${y}`,
        raw: val,
        isValid: true,
      };
    }
  }

  // 6. Generic ISO / RFC date parsing fallback only if string contains date separators and numbers
  if (/[\/\-\.]/.test(str) && /\d/.test(str)) {
    const parsedTs = Date.parse(str);
    if (!isNaN(parsedTs)) {
      const d = new Date(parsedTs);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      if (y >= 2000 && y <= 2100) {
        return {
          iso: `${y}-${m}-${day}`,
          display: `${day}/${m}/${y}`,
          raw: val,
          isValid: true,
        };
      }
    }
  }

  return { iso: str, display: str, raw: val, isValid: false };
}

export const DateNormalizer = {
  normalizeDate,
};
