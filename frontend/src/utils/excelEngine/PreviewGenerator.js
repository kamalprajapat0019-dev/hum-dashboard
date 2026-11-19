/**
 * Preview Generator.
 * Transforms normalized engine state into a clean, crash-proof preview payload
 * with formatted metrics and manual column mapping metadata.
 */

import { safeFormatNumber, safeNumber } from './SafeFormatters.js';

export class PreviewGenerator {
  static generatePreview({
    sheetName,
    availableSheets = [],
    columnDetails = [],
    unmappedColumns = [],
    dateGroups = [],
    parsedRows = [],
    uniqueCitiesCount = 0,
    totalCandidates = 0,
    blockingErrors = [],
    warnings = [],
  }) {
    // Calculate total shift records across all dates
    const totalShiftsCount = dateGroups.reduce((acc, dg) => acc + (dg.shifts?.length || 0), 0);

    // Format preview sample rows (top 5) with bulletproof fallbacks
    const previewRows = (parsedRows || []).slice(0, 10).map((row, idx) => ({
      sNo: row.sNo !== undefined ? row.sNo : idx + 1,
      region: row.region || '—',
      state: row.state || '—',
      city: row.city || '—',
      districts: row.districts || '—',
      cityCode: row.cityCode || '—',
      totalCount: safeNumber(row.totalCount, 0),
      totalCountFormatted: safeFormatNumber(row.totalCount, '0'),
      max: safeNumber(row.max, 0),
      maxFormatted: safeFormatNumber(row.max, '0'),
      shifts: row.shifts || {},
    }));

    return {
      canImport: blockingErrors.length === 0 && parsedRows.length > 0,
      isValid: blockingErrors.length === 0,
      sheetName,
      availableSheets,
      
      // Standardized root-level metrics (safe against undefined access)
      totalCandidates: safeNumber(totalCandidates, 0),
      totalCities: safeNumber(uniqueCitiesCount, 0),
      totalDates: dateGroups.length,
      totalShifts: totalShiftsCount,
      totalRows: parsedRows.length,

      // Summary object for backwards compatibility
      summary: {
        totalRows: parsedRows.length,
        totalCities: safeNumber(uniqueCitiesCount, 0),
        totalCandidates: safeNumber(totalCandidates, 0),
        datesCount: dateGroups.length,
        shiftsCount: totalShiftsCount,
        dates: dateGroups.map(dg => ({
          examDate: dg.dateIso,
          displayDate: dg.displayDate,
          shifts: (dg.shifts || []).map(s => ({
            shiftNumber: s.shiftNumber,
            shiftName: s.shiftName,
            startTime: s.startTime,
            endTime: s.endTime,
            reportingTime: s.reportingTime,
          })),
        })),
      },

      columnDetails,
      unmappedColumns,
      dateGroups,
      previewRows,
      allRows: parsedRows,
      errors: blockingErrors,
      blockingErrors,
      warnings,
    };
  }
}
