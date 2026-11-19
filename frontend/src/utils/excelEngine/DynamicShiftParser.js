/**
 * Unlimited Dynamic Shift Parser.
 * Never hardcodes shift limits (supports 1, 2, 5, 10, 20+ shifts).
 * Accurately parses numbered shifts, placeholders (Shift-N), and descriptive names.
 */

import { cleanCellText } from './SafeFormatters.js';

export class DynamicShiftParser {
  /**
   * Generates realistic operational shift timing presets based on shift sequence.
   */
  static getTimingForShiftNumber(shiftNumber) {
    switch (shiftNumber) {
      case 1:
        return { startTime: '09:00 AM', endTime: '12:00 PM', reportingTime: '07:30 AM' };
      case 2:
        return { startTime: '02:00 PM', endTime: '05:00 PM', reportingTime: '12:30 PM' };
      case 3:
        return { startTime: '05:30 PM', endTime: '08:30 PM', reportingTime: '04:00 PM' };
      case 4:
        return { startTime: '09:00 PM', endTime: '12:00 AM', reportingTime: '07:30 PM' };
      default: {
        // Dynamic offset for any Nth shift
        const startHour = 8 + (shiftNumber - 1) * 3;
        const normStart = startHour % 24;
        const normEnd = (normStart + 3) % 24;
        const formatHour = (h) => {
          const ampm = h >= 12 ? 'PM' : 'AM';
          const hr = h % 12 || 12;
          return `${String(hr).padStart(2, '0')}:00 ${ampm}`;
        };
        return {
          startTime: formatHour(normStart),
          endTime: formatHour(normEnd),
          reportingTime: formatHour((normStart - 1 + 24) % 24),
        };
      }
    }
  }

  /**
   * Parses a column header into a shift definition.
   * @param {string} rawHeader Column header string (e.g. 'Shift-1', 'Shift-N', 'Shift 10')
   * @param {number} existingShiftsCount Number of shifts already identified for this date
   */
  static parseShiftHeader(rawHeader, existingShiftsCount = 0) {
    const text = cleanCellText(rawHeader);
    const numMatch = text.match(/\d+/);

    let shiftNumber = null;
    let shiftName = text;

    if (numMatch) {
      shiftNumber = parseInt(numMatch[0], 10);
    } else if (/(?:shift|slot)[\s\-_]*n/i.test(text)) {
      // Shift-N placeholder: assign next sequential shift number for this date
      shiftNumber = existingShiftsCount + 1;
      shiftName = `Shift-${shiftNumber}`;
    } else if (/morning/i.test(text)) {
      shiftNumber = 1;
    } else if (/afternoon/i.test(text)) {
      shiftNumber = 2;
    } else if (/evening/i.test(text)) {
      shiftNumber = 3;
    } else if (/night/i.test(text)) {
      shiftNumber = 4;
    } else {
      shiftNumber = existingShiftsCount + 1;
      shiftName = `Shift ${shiftNumber}`;
    }

    const timing = this.getTimingForShiftNumber(shiftNumber);

    return {
      shiftNumber,
      shiftName,
      originalHeader: text,
      ...timing,
    };
  }
}
