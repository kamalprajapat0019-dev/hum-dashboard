/**
 * Comprehensive Validation Engine for Excel Import.
 * Separates structural, data, and business validations into clear blocking errors and warnings.
 */

import { safeNumber, safeString, safeFormatNumber } from './SafeFormatters.js';

export class ValidationEngine {
  constructor(profile) {
    this.profile = profile;
  }

  /**
   * Performs structural validation on headers, column mappings, and date/shift structures.
   */
  validateStructure({
    totalRows = 0,
    headerMapping = {},
    dateGroups = [],
    shiftMappings = [],
  }) {
    const blockingErrors = [];
    const warnings = [];

    // 1. Row count check
    if (totalRows < 2) {
      blockingErrors.push('The worksheet contains insufficient rows. Expected header and at least one data row.');
      return { isValid: false, blockingErrors, warnings };
    }

    // 2. Required fields check
    const standardFields = this.profile.standardFields || [];
    const requiredFields = standardFields.filter(f => f.required);

    for (const req of requiredFields) {
      if (headerMapping[req.key] === undefined || headerMapping[req.key] === null || headerMapping[req.key] === -1) {
        blockingErrors.push(`Required column "${req.label}" is missing from the worksheet headers.`);
      }
    }

    // 3. Shift columns check
    if (!shiftMappings || shiftMappings.length === 0) {
      blockingErrors.push('No Shift columns (e.g. Shift-1, Shift-2) were detected in the worksheet.');
    }

    // 4. Date groups check
    if (!dateGroups || dateGroups.length === 0) {
      warnings.push('No examination dates were detected above the shift columns.');
    } else {
      const invalidDates = dateGroups.filter(d => !d.isDateValid);
      if (invalidDates.length > 0) {
        warnings.push(`${invalidDates.length} date group(s) have unrecognized date formats and will use placeholder dates.`);
      }
    }

    return {
      isValid: blockingErrors.length === 0,
      blockingErrors,
      warnings,
    };
  }

  /**
   * Validates data rows and executes business logic checks.
   */
  validateRows({
    rawRows = [],
    startRowIndex = 2,
    headerMapping = {},
    shiftMappings = [],
  }) {
    const blockingErrors = [];
    const warnings = [];
    const parsedRows = [];
    const seenLocations = new Set();
    let totalCandidates = 0;
    const uniqueCities = new Set();

    const cityCol = headerMapping.city;
    const stateCol = headerMapping.state;
    const regionCol = headerMapping.region;
    const distCol = headerMapping.districts;
    const codeCol = headerMapping.cityCode;
    const totalCountCol = headerMapping.totalCount;
    const maxCol = headerMapping.max;
    const sNoCol = headerMapping.sNo;

    let locationTargetSum = 0;
    let shiftAllocationSum = 0;
    const uniqueLocationMap = new Map();
    const configuredShiftColIndexes = new Set();

    for (let r = startRowIndex; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || !Array.isArray(row)) continue;

      // Check if entire row is empty
      const hasAnyContent = row.some(cell => safeString(cell) !== '');
      if (!hasAnyContent) continue;

      const rowNumber = r + 1; // 1-based row number in Excel
      const city = cityCol !== undefined ? safeString(row[cityCol]) : '';
      const state = stateCol !== undefined ? safeString(row[stateCol]) : '';
      const region = regionCol !== undefined ? safeString(row[regionCol]) : '';
      const districts = distCol !== undefined ? safeString(row[distCol]) : '';
      const cityCode = codeCol !== undefined ? safeString(row[codeCol]) : '';
      const sNo = sNoCol !== undefined && row[sNoCol] !== undefined && row[sNoCol] !== ''
        ? row[sNoCol]
        : (parsedRows.length + 1);

      // 1. Mandatory City check
      if (!city) {
        blockingErrors.push(`Row ${rowNumber}: Required field "City" is missing or blank.`);
        continue;
      }

      uniqueCities.add(city.toLowerCase());

      // 2. Duplicate Location Check
      const locKey = cityCode ? cityCode.toUpperCase() : `${city.toLowerCase()}__${state.toLowerCase()}`;
      if (seenLocations.has(locKey)) {
        warnings.push(`Row ${rowNumber}: Duplicate location entry for "${city}${state ? ', ' + state : ''}" (${locKey}). Only first entry included in location target.`);
      } else {
        seenLocations.add(locKey);
      }

      // 3. Numeric fields check
      const rawTotalCount = totalCountCol !== undefined ? row[totalCountCol] : '';
      const rawMax = maxCol !== undefined ? row[maxCol] : '';

      let totalCount = 0;
      if (rawTotalCount !== undefined && rawTotalCount !== null && safeString(rawTotalCount) !== '') {
        const num = Number(rawTotalCount);
        if (isNaN(num) || num < 0) {
          blockingErrors.push(`Row ${rowNumber}, Column "Total Count": Invalid value "${rawTotalCount}". Value must be a non-negative number.`);
        } else {
          totalCount = num;
        }
      }

      let maxCount = 0;
      if (rawMax !== undefined && rawMax !== null && safeString(rawMax) !== '') {
        const num = Number(rawMax);
        if (isNaN(num) || num < 0) {
          blockingErrors.push(`Row ${rowNumber}, Column "Max": Invalid value "${rawMax}". Value must be a non-negative number.`);
        } else {
          maxCount = num;
        }
      }

      // 4. Shift values parsing and validation
      const rowShifts = {};
      let calculatedRowSum = 0;

      for (const shift of shiftMappings) {
        const cellVal = row[shift.colIndex];
        const strVal = safeString(cellVal);

        if (!rowShifts[shift.dateIso]) {
          rowShifts[shift.dateIso] = {};
        }

        if (strVal !== '') {
          const num = Number(strVal);
          if (isNaN(num) || num < 0) {
            blockingErrors.push(
              `Row ${rowNumber}, Column "${shift.displayDate} - ${shift.shiftName}": Invalid count "${strVal}". Must be a non-negative number.`
            );
          } else {
            rowShifts[shift.dateIso][shift.shiftName] = num;
            calculatedRowSum += num;
            if (num > 0) {
              configuredShiftColIndexes.add(shift.colIndex);
            }
          }
        } else {
          rowShifts[shift.dateIso][shift.shiftName] = 0;
        }
      }

      // 5. Business rule: Total Count vs sum of shifts mismatch
      if (totalCount > 0 && calculatedRowSum > 0 && totalCount !== calculatedRowSum) {
        warnings.push(
          `Row ${rowNumber} (${city}): Total Count (${safeFormatNumber(totalCount)}) differs from sum of shift counts (${safeFormatNumber(calculatedRowSum)}).`
        );
      }

      shiftAllocationSum += calculatedRowSum;

      if (!uniqueLocationMap.has(locKey)) {
        uniqueLocationMap.set(locKey, totalCount > 0 ? totalCount : calculatedRowSum);
        locationTargetSum += (totalCount > 0 ? totalCount : calculatedRowSum);
      }

      parsedRows.push({
        sNo,
        region,
        state,
        city,
        districts,
        cityCode,
        totalCount: totalCount > 0 ? totalCount : calculatedRowSum,
        max: maxCount,
        shifts: rowShifts,
        calculatedShiftSum: calculatedRowSum,
      });
    }

    if (parsedRows.length === 0 && blockingErrors.length === 0) {
      blockingErrors.push('No location requirement rows were found in the worksheet.');
    }

    // Determine candidate target using configured aggregation rules:
    // If Total Count column exists and has values -> Model A (Sum of distinct location Total Counts)
    // Else if shift allocations exist -> Model C (Sum of all shift allocations)
    let calculationModel = 'MODEL_MANUAL_CONFIG';
    if (totalCountCol !== undefined && locationTargetSum > 0) {
      calculationModel = shiftAllocationSum > 0 && locationTargetSum !== shiftAllocationSum
        ? 'MODEL_D_MIXED_WITH_WARNINGS'
        : 'MODEL_A_LOCATION_LEVEL';
      totalCandidates = locationTargetSum;
    } else if (shiftAllocationSum > 0) {
      calculationModel = 'MODEL_C_SHIFT_WISE';
      totalCandidates = shiftAllocationSum;
    } else {
      totalCandidates = 0;
    }

    return {
      isValid: blockingErrors.length === 0,
      blockingErrors,
      warnings,
      parsedRows,
      uniqueCitiesCount: uniqueCities.size,
      totalCandidates,
      calculationModel,
      locationTargetSum,
      shiftAllocationSum,
      configuredShiftColIndexes,
    };
  }
}
