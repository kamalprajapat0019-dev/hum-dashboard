/**
 * Dynamic Date Group Detector.
 * Associates shift columns with their parent exam date across merged and unmerged layouts,
 * Excel date serials, JS Dates, and formatted date strings.
 */

import { normalizeDate } from './DateNormalizer.js';
import { DynamicShiftParser } from './DynamicShiftParser.js';

export class DateGroupDetector {
  /**
   * Detects date groups and maps each shift column to its date.
   */
  static detectDateGroups({
    resolvedGrid,
    merges = [],
    headerRowIndex = 1,
    dateRowIndex = 0,
    columnDetails = [],
  }) {
    const shiftMappings = [];
    let lastActiveDate = null;
    let fallbackDateCounter = 1;

    // Track shifts count per dateIso to handle sequential Shift-N
    const dateShiftCounts = new Map();

    const maxCols = Math.max(
      resolvedGrid[dateRowIndex]?.length || 0,
      resolvedGrid[headerRowIndex]?.length || 0,
      columnDetails.length
    );

    for (let c = 0; c < maxCols; c++) {
      const colMeta = columnDetails[c];
      const isShift = colMeta?.isShift;
      const originalHeader = colMeta?.originalHeader || resolvedGrid[headerRowIndex]?.[c] || '';

      // Skip base standard columns that are not shifts
      if (colMeta?.isStandard && !isShift) {
        continue;
      }

      if (!isShift && !originalHeader) {
        continue;
      }

      // 1. Detect date value for column c
      let colDate = null;

      // Check date row in resolvedGrid (merged values have been propagated here)
      const rawDateVal = resolvedGrid[dateRowIndex]?.[c];
      if (rawDateVal !== undefined && rawDateVal !== null && rawDateVal !== '') {
        const norm = normalizeDate(rawDateVal);
        colDate = norm;
        lastActiveDate = norm;
      }

      // If not in date row, check if date is embedded in the column header itself
      if (!colDate && originalHeader) {
        const embeddedNorm = normalizeDate(originalHeader);
        if (embeddedNorm.isValid) {
          colDate = embeddedNorm;
          lastActiveDate = embeddedNorm;
        }
      }

      // If unmerged sequential column without explicit date, inherit previous date group
      if (!colDate && lastActiveDate) {
        colDate = lastActiveDate;
      }

      // If still no date found, create an inferred group
      if (!colDate) {
        const defaultIso = `DATE-TBD-${fallbackDateCounter}`;
        const defaultDisplay = `Date ${fallbackDateCounter}`;
        colDate = { iso: defaultIso, display: defaultDisplay, isValid: false };
      }

      // 2. Parse shift definition for this column
      const existingCount = dateShiftCounts.get(colDate.iso) || 0;
      const shiftDef = DynamicShiftParser.parseShiftHeader(originalHeader, existingCount);
      dateShiftCounts.set(colDate.iso, existingCount + 1);

      shiftMappings.push({
        colIndex: c,
        dateIso: colDate.iso,
        displayDate: colDate.display,
        isDateValid: colDate.isValid,
        ...shiftDef,
      });
    }

    // 3. Aggregate into structured date groups
    const dateGroupsMap = new Map();

    for (const mapping of shiftMappings) {
      if (!dateGroupsMap.has(mapping.dateIso)) {
        dateGroupsMap.set(mapping.dateIso, {
          dateIso: mapping.dateIso,
          displayDate: mapping.displayDate,
          isDateValid: mapping.isDateValid,
          shifts: [],
        });
      }

      dateGroupsMap.get(mapping.dateIso).shifts.push({
        colIndex: mapping.colIndex,
        shiftName: mapping.shiftName,
        shiftNumber: mapping.shiftNumber,
        originalHeader: mapping.originalHeader,
        startTime: mapping.startTime,
        endTime: mapping.endTime,
        reportingTime: mapping.reportingTime,
      });
    }

    const dateGroups = Array.from(dateGroupsMap.values());

    return {
      shiftMappings,
      dateGroups,
    };
  }
}
