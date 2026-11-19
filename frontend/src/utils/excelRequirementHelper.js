/**
 * Compatibility wrapper delegating to UniversalExcelEngine.
 * Preserves existing import signatures while providing full enterprise-grade
 * multi-tier validation, merged cell propagation, and unlimited dynamic shifts.
 */

import {
  UniversalExcelEngine,
  normalizeDate,
  safeNumber,
  safeFormatNumber,
  safeString,
} from './excelEngine/index.js';

export { normalizeDate, safeNumber, safeFormatNumber, safeString, UniversalExcelEngine };

/**
 * Downloads standard Examination Requirement Excel template.
 */
export function generateRequirementSample() {
  UniversalExcelEngine.generateTemplate('Examination_Requirement_Sample.xlsx');
}

/**
 * Parses and validates uploaded examination requirement Excel sheet.
 */
export async function parseRequirementExcel(fileOrBuffer, options = {}) {
  return UniversalExcelEngine.parse(fileOrBuffer, options);
}
