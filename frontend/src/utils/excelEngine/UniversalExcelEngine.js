/**
 * Universal Excel Engine.
 * Production-grade orchestrator that combines Reader, MergedCellResolver,
 * HeaderNormalizer, DynamicShiftParser, ValidationEngine, and PreviewGenerator.
 */

import * as XLSX from 'xlsx';
import { WorkbookReader } from './WorkbookReader.js';
import { MergedCellResolver } from './MergedCellResolver.js';
import { HeaderNormalizer } from './HeaderNormalizer.js';
import { DateGroupDetector } from './DateGroupDetector.js';
import { ValidationEngine } from './ValidationEngine.js';
import { PreviewGenerator } from './PreviewGenerator.js';
import { ProfileRegistry } from './ImportProfile.js';
import { cleanCellText } from './SafeFormatters.js';

export class UniversalExcelEngine {
  /**
   * Universal workbook parser.
   * Handles arbitrary dates, shifts, headers, merges, and sheets.
   */
  static async parse(fileOrBuffer, options = {}) {
    const profileId = options.profileId || 'EXAM_REQUIREMENT';
    const profile = ProfileRegistry.getProfile(profileId);
    const manualMapping = options.manualMapping || {};

    // 1. Read Workbook
    const workbook = await WorkbookReader.readWorkbook(fileOrBuffer);
    const availableSheets = workbook.SheetNames || [];

    // 2. Select Target Sheet
    const { sheetName, worksheet } = WorkbookReader.selectWorksheet(
      workbook,
      options.sheetName,
      profile.sheetNameKeywords
    );

    // 3. Extract Grid & Merged Ranges
    const { rawGrid, merges } = WorkbookReader.extractGridAndMerges(worksheet);

    if (!rawGrid || rawGrid.length === 0) {
      throw new Error(`Worksheet "${sheetName}" is empty.`);
    }

    // 4. Resolve Merged Cells
    const cellResolver = new MergedCellResolver(merges, rawGrid);
    const resolvedGrid = cellResolver.getResolvedGrid();

    // 5. Intelligent Header Row Detection
    // For 2-header templates: Row 0 = Dates, Row 1 = Headers
    // For single-header templates: Row 0 = Headers
    let headerRowIndex = options.headerRowIndex;
    let dateRowIndex = options.dateRowIndex;

    if (headerRowIndex === undefined) {
      // Test row 1 first if available
      if (rawGrid.length > 1 && this._isHeaderRow(rawGrid[1], profile)) {
        headerRowIndex = 1;
        dateRowIndex = 0;
      } else if (this._isHeaderRow(rawGrid[0], profile)) {
        headerRowIndex = 0;
        dateRowIndex = 0;
      } else {
        // Default to row 1 if >= 2 rows, else row 0
        headerRowIndex = rawGrid.length > 1 ? 1 : 0;
        dateRowIndex = 0;
      }
    } else if (dateRowIndex === undefined) {
      dateRowIndex = Math.max(0, headerRowIndex - 1);
    }

    const headerRow = rawGrid[headerRowIndex] || [];

    // 6. Header Normalization & Mapping
    const normalizer = new HeaderNormalizer(profile);
    const { mappedFields, columnDetails, unmappedColumns, duplicateMappings } = normalizer.mapHeaders(
      headerRow,
      manualMapping
    );

    // 7. Dynamic Date Group & Shift Detection
    const { shiftMappings, dateGroups } = DateGroupDetector.detectDateGroups({
      resolvedGrid,
      merges,
      headerRowIndex,
      dateRowIndex,
      columnDetails,
    });

    // 8. Validation Layer
    const validator = new ValidationEngine(profile);

    // Tier 1: Structural Validation
    const structural = validator.validateStructure({
      totalRows: rawGrid.length,
      headerMapping: mappedFields,
      dateGroups,
      shiftMappings,
    });

    let blockingErrors = [...structural.blockingErrors];
    let warnings = [...structural.warnings];

    if (duplicateMappings.length > 0) {
      duplicateMappings.forEach(dup => {
        warnings.push(`Multiple columns match "${dup.label}" (Columns ${dup.colIndexes.map(i => i + 1).join(', ')}).`);
      });
    }

    // Tier 2 & 3: Data & Business Validation (Rows starting immediately after headerRowIndex)
    const dataStartRow = headerRowIndex + 1;
    const rowResults = validator.validateRows({
      rawRows: rawGrid,
      startRowIndex: dataStartRow,
      headerMapping: mappedFields,
      shiftMappings,
    });

    blockingErrors = [...blockingErrors, ...rowResults.blockingErrors];
    warnings = [...warnings, ...rowResults.warnings];

    // Filter out unconfigured placeholder shifts (e.g. Shift-N with no allocations across all rows)
    const activeDateGroups = dateGroups.map(dg => ({
      ...dg,
      shifts: (dg.shifts || []).filter(s => {
        const isPlaceholder = /(?:shift|slot)[\s\-_]*n/i.test(s.originalHeader || s.shiftName);
        const hasData = rowResults.configuredShiftColIndexes?.has(s.colIndex);
        if (isPlaceholder && !hasData) {
          return false;
        }
        return true;
      }),
    })).filter(dg => dg.shifts.length > 0 || dg.isDateValid);

    // 9. Generate Crash-Proof Preview
    const preview = PreviewGenerator.generatePreview({
      sheetName,
      availableSheets,
      columnDetails,
      unmappedColumns,
      dateGroups: activeDateGroups,
      parsedRows: rowResults.parsedRows,
      uniqueCitiesCount: rowResults.uniqueCitiesCount,
      totalCandidates: rowResults.totalCandidates,
      blockingErrors,
      warnings,
    });

    // Cache internal state for fast manual re-mapping
    preview._internal = {
      rawGrid,
      merges,
      headerRowIndex,
      dateRowIndex,
      profile,
    };

    return preview;
  }

  /**
   * Helper to identify if a row contains standard headers.
   */
  static _isHeaderRow(row, profile) {
    if (!Array.isArray(row)) return false;
    let matchCount = 0;
    const allAliases = (profile.standardFields || []).flatMap(f => f.aliases);

    row.forEach(cell => {
      const text = cleanCellText(cell).toLowerCase();
      if (!text) return;
      if (allAliases.some(alias => text.includes(alias.toLowerCase()))) {
        matchCount++;
      }
    });

    return matchCount >= 2;
  }

  /**
   * Generates sample template adhering to official examination specification.
   */
  static generateTemplate(filename = 'Examination_Requirement_Sample.xlsx') {
    const wb = XLSX.utils.book_new();

    // Row 1: Merged dates across shifts
    const row1 = [
      '', '', '', '', '', '', '', '',
      '01/02/2027', '', '', '',
      '02/02/2027', '', '', '',
      '03/02/2027', '', '',
      '04/02/2027', '',
    ];

    // Row 2: Standard column headers
    const row2 = [
      'S. No.',
      'Region',
      'State',
      'City',
      'Districts',
      'City Code',
      'Total Count',
      'Max',
      'Shift-1', 'Shift-2', 'Shift-3', 'Shift-N',
      'Shift-1', 'Shift-2', 'Shift-3', 'Shift-N',
      'Shift-1', 'Shift-2', 'Shift-3',
      'Shift-1', 'Shift-2',
    ];

    // Sample data rows
    const sampleRows = [
      [
        1, 'North', 'Delhi', 'New Delhi', 'Central Delhi', 'DEL01', 3500, 500,
        400, 500, 450, 450,
        400, 450, 450, 400,
        200, 200, 0,
        0, 0,
      ],
      [
        2, 'West', 'Maharashtra', 'Mumbai', 'Mumbai City', 'MUM01', 4800, 700,
        600, 650, 600, 600,
        550, 600, 600, 600,
        0, 0, 0,
        0, 0,
      ],
      [
        3, 'South', 'Karnataka', 'Bengaluru', 'Bengaluru Urban', 'BLR01', 3800, 600,
        500, 500, 500, 500,
        450, 450, 450, 450,
        0, 0, 0,
        0, 0,
      ],
      [
        4, 'East', 'West Bengal', 'Kolkata', 'Kolkata', 'KOL01', 2800, 450,
        350, 400, 350, 350,
        350, 350, 350, 300,
        0, 0, 0,
        0, 0,
      ],
      [
        5, 'North', 'Uttar Pradesh', 'Lucknow', 'Lucknow', 'LKO01', 2500, 400,
        300, 350, 350, 300,
        300, 300, 300, 300,
        0, 0, 0,
        0, 0,
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([row1, row2, ...sampleRows]);

    // Merged headers across shift spans
    ws['!merges'] = [
      { s: { r: 0, c: 8 }, e: { r: 0, c: 11 } }, // 01/02/2027 (4 shifts)
      { s: { r: 0, c: 12 }, e: { r: 0, c: 15 } }, // 02/02/2027 (4 shifts)
      { s: { r: 0, c: 16 }, e: { r: 0, c: 18 } }, // 03/02/2027 (3 shifts)
      { s: { r: 0, c: 19 }, e: { r: 0, c: 20 } }, // 04/02/2027 (2 shifts)
    ];

    // Column widths
    ws['!cols'] = [
      { wch: 8 },  // S. No.
      { wch: 12 }, // Region
      { wch: 16 }, // State
      { wch: 18 }, // City
      { wch: 18 }, // Districts
      { wch: 12 }, // City Code
      { wch: 14 }, // Total Count
      { wch: 10 }, // Max
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 10 },
    ];

    ws['!freeze'] = { xSplit: 0, ySplit: 2 };

    XLSX.utils.book_append_sheet(wb, ws, 'Requirement_Sheet');
    XLSX.writeFile(wb, filename);
  }
}
