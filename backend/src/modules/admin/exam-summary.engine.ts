import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { prisma } from '../../config/database.js';

export interface MetricLineage {
  metricName: string;
  value: number | string;
  definition: string;
  aggregationMethod: string;
  sourceField: string;
  recordsIncluded: number;
  recordsExcluded: number;
  exclusionReason?: string;
  warnings: string[];
  businessRuleVersion: string;
}

export interface ScheduleDateBreakdown {
  examDate: string;
  displayDate?: string;
  shiftsCount: number;
  shifts: string[];
}

export interface ExamSummaryResult {
  examId: string;
  examCode: string;
  examName: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  lifecycleStage: string;
  candidateTarget: number;
  candidateTargetLineage: MetricLineage;
  coverageCount: number;
  coverageUnit: string;
  coverageLineage: MetricLineage;
  examinationDateCount: number;
  shiftCount: number;
  scheduleLineage: MetricLineage;
  scheduleBreakdown: ScheduleDateBreakdown[];
  registrationDeskTolerance: number;
  bufferNodesTolerance: number;
  centresBooked: number;
  centresBookedLineage: MetricLineage;
  validationStatus: 'VALID' | 'VALID_WITH_WARNINGS' | 'NEEDS_REVIEW' | 'INVALID';
  validationWarnings: string[];
  calculationModel:
    | 'MODEL_A_LOCATION_LEVEL'
    | 'MODEL_B_DATE_WISE'
    | 'MODEL_C_SHIFT_WISE'
    | 'MODEL_D_MIXED_WITH_WARNINGS'
    | 'MODEL_MANUAL_CONFIG';
  calculationTimestamp: string;
  ruleVersion: string;
}

export interface ParsedLocationRow {
  rowNumber: number;
  region: string;
  state: string;
  city: string;
  districts: string;
  cityCode: string;
  totalCount: number;
  max: number;
  shifts: Record<string, Record<string, number>>;
  calculatedShiftSum: number;
  locationKey: string;
}

export interface ParsedWorkbookData {
  hasWorkbook: boolean;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  totalRows: number;
  parsedRows: ParsedLocationRow[];
  uniqueLocations: Map<string, ParsedLocationRow>;
  duplicateRows: ParsedLocationRow[];
  dateGroups: Array<{
    dateIso: string;
    displayDate: string;
    shifts: Array<{ shiftName: string; shiftNumber: number; colIndex: number; hasData: boolean }>;
  }>;
  hasTotalCountColumn: boolean;
  locationTargetSum: number;
  shiftAllocationSum: number;
  discrepancies: Array<{
    rowNumber: number;
    locationKey: string;
    city: string;
    cityCode: string;
    totalCount: number;
    shiftSum: number;
  }>;
  warnings: string[];
  errors: string[];
}

const HEADER_ALIASES: Record<string, string[]> = {
  region: ['region', 'zone', 'exam region', 'reg'],
  state: ['state', 'state name', 'province', 'st'],
  city: ['city', 'city name', 'location', 'centre city', 'town'],
  districts: ['district', 'districts', 'dist', 'sub-region'],
  cityCode: ['city code', 'location code', 'centre code', 'code', 'city_code', 'station code'],
  totalCount: [
    'total count',
    'total candidates',
    'candidate count',
    'total required',
    'total',
    'target candidates',
    'candidates',
    'requirement',
    'total capacity',
  ],
  max: ['max', 'maximum', 'max nodes', 'max capacity', 'peak capacity', 'single shift max'],
};

function normalizeHeader(h: any): string {
  if (h == null) return '';
  return String(h).trim().toLowerCase().replace(/[\r\n\t_]+/g, ' ');
}

function parseDateCell(val: any): { dateIso: string; displayDate: string } | null {
  if (val == null || val === '') return null;

  // Handle Excel serial date numbers
  if (typeof val === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return {
        dateIso: `${yyyy}-${mm}-${dd}`,
        displayDate: `${dd}/${mm}/${yyyy}`,
      };
    }
  }

  const s = String(val).trim();
  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3];
    return {
      dateIso: `${yyyy}-${mm}-${dd}`,
      displayDate: `${dd}/${mm}/${yyyy}`,
    };
  }

  // Match YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (ymd) {
    const yyyy = ymd[1];
    const mm = ymd[2].padStart(2, '0');
    const dd = ymd[3].padStart(2, '0');
    return {
      dateIso: `${yyyy}-${mm}-${dd}`,
      displayDate: `${dd}/${mm}/${yyyy}`,
    };
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return {
      dateIso: `${yyyy}-${mm}-${dd}`,
      displayDate: `${dd}/${mm}/${yyyy}`,
    };
  }

  return null;
}

export class ExamSummaryEngine {
  public static readonly RULE_VERSION = '1.0.0';

  /**
   * Parse an Excel workbook file into normalized data structures
   */
  public static parseWorkbookBuffer(buffer: Buffer): ParsedWorkbookData {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawGrid: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
    const merges = ws['!merges'] || [];

    return this.parseGridData(rawGrid, merges);
  }

  /**
   * Parse 2D Grid with merge records
   */
  public static parseGridData(rawGrid: any[][], merges: any[] = []): ParsedWorkbookData {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!rawGrid || rawGrid.length < 2) {
      return {
        hasWorkbook: false,
        totalRows: 0,
        parsedRows: [],
        uniqueLocations: new Map(),
        duplicateRows: [],
        dateGroups: [],
        hasTotalCountColumn: false,
        locationTargetSum: 0,
        shiftAllocationSum: 0,
        discrepancies: [],
        warnings: ['Workbook contains fewer than 2 rows; cannot detect headers and data.'],
        errors: ['Insufficient workbook rows.'],
      };
    }

    // Determine header rows (standard layout: Row 0 has date spans or empty, Row 1 has column names)
    // Build a map of merged cells on row 0
    const row0 = rawGrid[0] || [];
    const row1 = rawGrid[1] || [];

    // Expand merged date cells in row 0
    const resolvedRow0 = [...row0];
    for (const m of merges) {
      if (m.s.r === 0 && m.e.r === 0) {
        const topVal = row0[m.s.c];
        for (let c = m.s.c; c <= m.e.c; c++) {
          resolvedRow0[c] = topVal;
        }
      }
    }

    // Detect column indexes for location attributes
    const colMap: Record<string, number> = {};
    for (let c = 0; c < row1.length; c++) {
      const h1 = normalizeHeader(row1[c]);
      const h0 = normalizeHeader(resolvedRow0[c]);

      for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
        if (colMap[key] === undefined) {
          if (aliases.includes(h1) || aliases.includes(h0)) {
            colMap[key] = c;
          }
        }
      }
    }

    const hasTotalCountColumn = colMap.totalCount !== undefined;

    // Detect date groups and shift columns
    // Date can be in resolvedRow0[c] or parsed from header strings
    const dateGroupsMap = new Map<
      string,
      {
        dateIso: string;
        displayDate: string;
        shifts: Array<{ shiftName: string; shiftNumber: number; colIndex: number; hasData: boolean }>;
      }
    >();

    for (let c = 0; c < row1.length; c++) {
      const subHeader = String(row1[c] || '').trim();
      const topDateParsed = parseDateCell(resolvedRow0[c]);

      // Check if subHeader matches Shift pattern (e.g. Shift-1, Shift 2, Shift-N, S1)
      const isShiftCol = /^(?:shift[\s-_]?(\d+|n)|s(\d+))/i.test(subHeader);

      if (topDateParsed && isShiftCol) {
        const match = subHeader.match(/^(?:shift[\s-_]?(\d+|n)|s(\d+))/i);
        const shiftToken = match ? (match[1] || match[2]).toUpperCase() : '1';
        const shiftNumber = shiftToken === 'N' ? 99 : parseInt(shiftToken, 10) || 1;
        const shiftName = `Shift-${shiftToken}`;

        if (!dateGroupsMap.has(topDateParsed.dateIso)) {
          dateGroupsMap.set(topDateParsed.dateIso, {
            dateIso: topDateParsed.dateIso,
            displayDate: topDateParsed.displayDate,
            shifts: [],
          });
        }

        dateGroupsMap.get(topDateParsed.dateIso)!.shifts.push({
          shiftName,
          shiftNumber,
          colIndex: c,
          hasData: false, // will check when reading rows
        });
      } else if (!topDateParsed && isShiftCol) {
        // Fallback: check if subHeader itself has date + shift, or default date
        const fallbackDate = '2027-01-01';
        if (!dateGroupsMap.has(fallbackDate)) {
          dateGroupsMap.set(fallbackDate, {
            dateIso: fallbackDate,
            displayDate: '01/01/2027',
            shifts: [],
          });
        }
        dateGroupsMap.get(fallbackDate)!.shifts.push({
          shiftName: subHeader || `Shift-${c}`,
          shiftNumber: c,
          colIndex: c,
          hasData: false,
        });
      }
    }

    const dateGroups = Array.from(dateGroupsMap.values()).sort((a, b) =>
      a.dateIso.localeCompare(b.dateIso)
    );

    // Parse Data Rows (start from row 2 onwards)
    const parsedRows: ParsedLocationRow[] = [];
    const uniqueLocations = new Map<string, ParsedLocationRow>();
    const duplicateRows: ParsedLocationRow[] = [];
    const discrepancies: Array<{
      rowNumber: number;
      locationKey: string;
      city: string;
      cityCode: string;
      totalCount: number;
      shiftSum: number;
    }> = [];

    let shiftAllocationSum = 0;

    for (let r = 2; r < rawGrid.length; r++) {
      const row = rawGrid[r];
      if (!row || row.length === 0) continue;

      // Extract attributes
      const city = String(colMap.city !== undefined ? row[colMap.city] || '' : '').trim();
      const cityCode = String(colMap.cityCode !== undefined ? row[colMap.cityCode] || '' : '').trim();
      const state = String(colMap.state !== undefined ? row[colMap.state] || '' : '').trim();
      const region = String(colMap.region !== undefined ? row[colMap.region] || '' : '').trim();
      const districts = String(colMap.districts !== undefined ? row[colMap.districts] || '' : '').trim();

      // Skip row if it has neither city nor cityCode nor region
      if (!city && !cityCode && !state && !region) {
        continue;
      }

      // Safe number parsing
      const rawTotalCount = colMap.totalCount !== undefined ? row[colMap.totalCount] : '';
      const totalCount = Number(String(rawTotalCount).replace(/,/g, '').trim()) || 0;

      const rawMax = colMap.max !== undefined ? row[colMap.max] : '';
      const max = Number(String(rawMax).replace(/,/g, '').trim()) || 0;

      // Parse shift counts for this row
      const rowShifts: Record<string, Record<string, number>> = {};
      let rowShiftSum = 0;

      for (const dg of dateGroups) {
        rowShifts[dg.dateIso] = {};
        for (const s of dg.shifts) {
          const cellVal = row[s.colIndex];
          const num = Number(String(cellVal || '').replace(/,/g, '').trim());
          if (!isNaN(num) && num > 0) {
            rowShifts[dg.dateIso][s.shiftName] = num;
            rowShiftSum += num;
            s.hasData = true; // Mark that this shift column has at least one real value!
          } else {
            rowShifts[dg.dateIso][s.shiftName] = 0;
          }
        }
      }

      shiftAllocationSum += rowShiftSum;

      // Location key for duplicate prevention
      const locationKey = cityCode
        ? cityCode.toUpperCase()
        : `${city.toLowerCase()}__${(state || '').toLowerCase()}`;

      const parsedRow: ParsedLocationRow = {
        rowNumber: r + 1,
        region,
        state,
        city,
        districts,
        cityCode,
        totalCount,
        max,
        shifts: rowShifts,
        calculatedShiftSum: rowShiftSum,
        locationKey,
      };

      parsedRows.push(parsedRow);

      // Check for duplicate location
      if (uniqueLocations.has(locationKey)) {
        duplicateRows.push(parsedRow);
        warnings.push(
          `Row ${r + 1}: Duplicate location detected for "${city || cityCode}" (${locationKey}). Excluded from distinct location total count.`
        );
      } else {
        uniqueLocations.set(locationKey, parsedRow);
      }

      // Check Total Count vs sum of shifts discrepancy
      if (hasTotalCountColumn && totalCount > 0 && rowShiftSum > 0 && totalCount !== rowShiftSum) {
        discrepancies.push({
          rowNumber: r + 1,
          locationKey,
          city: city || cityCode,
          cityCode,
          totalCount,
          shiftSum: rowShiftSum,
        });
      }
    }

    // Filter out unconfigured placeholder shifts (e.g. Shift-N with no data across all rows)
    for (const dg of dateGroups) {
      dg.shifts = dg.shifts.filter(s => {
        // If it's Shift-N and hasData is false, it's an unconfigured placeholder
        if (s.shiftName.toLowerCase() === 'shift-n' && !s.hasData) {
          return false;
        }
        return true;
      });
    }

    // Compute location-level target sum across DISTINCT locations
    let locationTargetSum = 0;
    for (const loc of uniqueLocations.values()) {
      locationTargetSum += loc.totalCount;
    }

    return {
      hasWorkbook: true,
      totalRows: parsedRows.length,
      parsedRows,
      uniqueLocations,
      duplicateRows,
      dateGroups,
      hasTotalCountColumn,
      locationTargetSum,
      shiftAllocationSum,
      discrepancies,
      warnings,
      errors,
    };
  }

  /**
   * Calculate universal summary for an examination
   */
  public static async calculateExamSummary(
    examId: string,
    options: { syncDatabaseDates?: boolean } = {}
  ): Promise<ExamSummaryResult> {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examType: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        dates: {
          include: {
            shifts: true,
          },
          orderBy: {
            examDate: 'asc',
          },
        },
      },
    });

    if (!exam) {
      throw new Error(`Examination not found for ID: ${examId}`);
    }

    // Parse exam metadata
    let meta: any = {};
    if (exam.description) {
      try {
        meta = JSON.parse(exam.description);
        if (typeof meta !== 'object' || meta === null) meta = {};
      } catch {
        meta = {};
      }
    }

    // Check bookings count
    const bookingsCount = await prisma.booking.count({
      where: {
        examId: exam.id,
        status: { notIn: ['Cancelled', 'Rejected'] },
      },
    });

    // Check if an Excel requirement workbook is attached
    const sheetMeta = meta.requirementSheet;
    const storageKey = sheetMeta?.storageKey;
    let workbookData: ParsedWorkbookData | null = null;

    if (storageKey && fs.existsSync(storageKey)) {
      try {
        const fileBuffer = fs.readFileSync(storageKey);
        workbookData = this.parseWorkbookBuffer(fileBuffer);
        workbookData.fileName = sheetMeta.fileName;
        workbookData.fileSize = sheetMeta.fileSize || fileBuffer.length;
        workbookData.uploadedAt = sheetMeta.uploadedAt;
      } catch (err: any) {
        console.error('Error reading workbook file:', err);
      }
    }

    // If no physical workbook file on disk, check if parsed rows exist in meta
    if (!workbookData && Array.isArray(sheetMeta?.rows) && sheetMeta.rows.length > 0) {
      // Reconstitute from stored rows
      const reconstitutedRows: ParsedLocationRow[] = sheetMeta.rows.map((r: any, idx: number) => ({
        rowNumber: idx + 3,
        region: r.region || '',
        state: r.state || '',
        city: r.city || '',
        districts: r.districts || '',
        cityCode: r.cityCode || '',
        totalCount: Number(r.totalCount) || 0,
        max: Number(r.max) || 0,
        shifts: r.shifts || {},
        calculatedShiftSum: Number(r.calculatedShiftSum) || 0,
        locationKey: r.cityCode ? r.cityCode.toUpperCase() : `${r.city || ''}__${r.state || ''}`.toLowerCase(),
      }));

      const uniqueLocs = new Map<string, ParsedLocationRow>();
      let locTargetSum = 0;
      let shiftSum = 0;
      const discrepancies: any[] = [];

      for (const row of reconstitutedRows) {
        if (!uniqueLocs.has(row.locationKey)) {
          uniqueLocs.set(row.locationKey, row);
          locTargetSum += row.totalCount;
        }
        shiftSum += row.calculatedShiftSum;
        if (row.totalCount > 0 && row.calculatedShiftSum > 0 && row.totalCount !== row.calculatedShiftSum) {
          discrepancies.push({
            rowNumber: row.rowNumber,
            locationKey: row.locationKey,
            city: row.city || row.cityCode,
            cityCode: row.cityCode,
            totalCount: row.totalCount,
            shiftSum: row.calculatedShiftSum,
          });
        }
      }

      workbookData = {
        hasWorkbook: true,
        fileName: sheetMeta.fileName,
        fileSize: sheetMeta.fileSize,
        uploadedAt: sheetMeta.uploadedAt,
        totalRows: reconstitutedRows.length,
        parsedRows: reconstitutedRows,
        uniqueLocations: uniqueLocs,
        duplicateRows: [],
        dateGroups: [],
        hasTotalCountColumn: true,
        locationTargetSum: locTargetSum,
        shiftAllocationSum: shiftSum,
        discrepancies,
        warnings: [],
        errors: [],
      };
    }

    const result = this.computeSummaryMetrics(exam, meta, workbookData, bookingsCount);

    // If options.syncDatabaseDates is true and workbookData has dateGroups, sync DB
    if (options.syncDatabaseDates && workbookData && workbookData.dateGroups.length > 0) {
      await this.syncDatabaseSchedule(exam, workbookData.dateGroups);
      // Re-query exam dates to reflect updated schedule breakdown
      const refreshedDates = await prisma.examDate.findMany({
        where: { examId: exam.id },
        include: { shifts: true },
        orderBy: { examDate: 'asc' },
      });
      result.scheduleBreakdown = refreshedDates.map((d: any) => ({
        examDate: d.examDate.toISOString().substring(0, 10),
        displayDate: new Date(d.examDate).toLocaleDateString('en-GB'),
        shiftsCount: d.shifts.length,
        shifts: d.shifts.map((s: any) => s.shiftName),
      }));
      result.examinationDateCount = refreshedDates.length;
      result.shiftCount = refreshedDates.reduce((acc: number, d: any) => acc + d.shifts.length, 0);
      result.scheduleLineage.value = `${result.examinationDateCount} Dates / ${result.shiftCount} Shifts`;
      result.scheduleLineage.recordsIncluded = result.shiftCount;
    }

    return result;
  }

  /**
   * Pure aggregation function that maps parsed entities and exam attributes into ExamSummaryResult
   */
  private static computeSummaryMetrics(
    exam: any,
    meta: any,
    wb: ParsedWorkbookData | null,
    centresBooked: number
  ): ExamSummaryResult {
    const warnings: string[] = [];

    let candidateTarget = 0;
    let calculationModel: ExamSummaryResult['calculationModel'] = 'MODEL_MANUAL_CONFIG';
    let targetMethod = 'MANUAL_EXAM_CONFIGURATION';
    let targetSourceField = 'Exam metadata (candidateRequiredCount)';
    let targetRecordsIncluded = 1;
    let targetRecordsExcluded = 0;

    let coverageCount = 0;
    let coverageUnit = 'Cities';
    let coverageMethod = 'MANUAL_EXAM_CONFIGURATION';
    let coverageSourceField = 'Exam metadata (coverage)';

    let examinationDateCount = 0;
    let shiftCount = 0;
    let scheduleBreakdown: ScheduleDateBreakdown[] = [];

    if (wb && wb.hasWorkbook && wb.parsedRows.length > 0) {
      // 1. CANDIDATE TARGET LOGIC
      if (wb.hasTotalCountColumn && wb.locationTargetSum > 0) {
        // Model A: Location-Level Target
        calculationModel = 'MODEL_A_LOCATION_LEVEL';
        candidateTarget = wb.locationTargetSum;
        targetMethod = 'SUM_DISTINCT_LOCATION_TOTAL_COUNT';
        targetSourceField = "Workbook Column 'Total Count' (Distinct Locations)";
        targetRecordsIncluded = wb.uniqueLocations.size;
        targetRecordsExcluded = wb.duplicateRows.length;

        // Check for discrepancies against shift allocations
        if (wb.discrepancies.length > 0) {
          calculationModel = 'MODEL_D_MIXED_WITH_WARNINGS';
          warnings.push(
            `Candidate Target (${candidateTarget.toLocaleString('en-IN')}) is derived from distinct Location Total Counts. ${wb.discrepancies.length} location row(s) have shift allocation sums differing from Total Count.`
          );
          for (const d of wb.discrepancies.slice(0, 5)) {
            warnings.push(
              `Row ${d.rowNumber} (${d.city}): Total Count (${d.totalCount.toLocaleString('en-IN')}) differs from shift sum (${d.shiftSum.toLocaleString('en-IN')}).`
            );
          }
          if (wb.discrepancies.length > 5) {
            warnings.push(`... and ${wb.discrepancies.length - 5} more row(s) with shift allocation differences.`);
          }
        }
      } else if (wb.shiftAllocationSum > 0) {
        // Model C: Shift-Wise Candidate Allocation
        calculationModel = 'MODEL_C_SHIFT_WISE';
        candidateTarget = wb.shiftAllocationSum;
        targetMethod = 'SUM_ALL_SHIFT_ALLOCATIONS';
        targetSourceField = 'Workbook Shift Allocation Columns';
        targetRecordsIncluded = wb.parsedRows.length;
        targetRecordsExcluded = 0;
      } else {
        // Fallback to manual metadata
        calculationModel = 'MODEL_MANUAL_CONFIG';
        candidateTarget = Number(meta.candidateRequiredCount ?? exam.examType?.project?.candidateTarget ?? 0);
        targetMethod = 'FALLBACK_METADATA_OR_PROJECT_TARGET';
        targetSourceField = 'Project / Exam Metadata';
      }

      // 2. COVERAGE LOGIC
      coverageCount = wb.uniqueLocations.size;
      coverageUnit = 'Cities';
      coverageMethod = 'COUNT_DISTINCT_LOCATION_KEYS';
      coverageSourceField = "Workbook 'City Code' / 'City' columns";

      // 3. SCHEDULE OVERVIEW LOGIC
      if (wb.dateGroups.length > 0) {
        scheduleBreakdown = wb.dateGroups.map(dg => ({
          examDate: dg.dateIso,
          displayDate: dg.displayDate,
          shiftsCount: dg.shifts.length,
          shifts: dg.shifts.map(s => s.shiftName),
        }));
        examinationDateCount = scheduleBreakdown.length;
        shiftCount = scheduleBreakdown.reduce((acc, dg) => acc + dg.shiftsCount, 0);
      } else if (Array.isArray(exam.dates) && exam.dates.length > 0) {
        scheduleBreakdown = exam.dates.map((d: any) => ({
          examDate: new Date(d.examDate).toISOString().substring(0, 10),
          displayDate: new Date(d.examDate).toLocaleDateString('en-GB'),
          shiftsCount: d.shifts?.length || 0,
          shifts: (d.shifts || []).map((s: any) => s.shiftName),
        }));
        examinationDateCount = exam.dates.length;
        shiftCount = exam.dates.reduce((acc: number, d: any) => acc + (d.shifts?.length || 0), 0);
      }

      // Append workbook warnings if any
      if (wb.warnings && wb.warnings.length > 0) {
        warnings.push(...wb.warnings);
      }
    } else {
      // MANUAL EXAM WITHOUT WORKBOOK
      candidateTarget = Number(meta.candidateRequiredCount ?? exam.examType?.project?.candidateTarget ?? 0);
      coverageCount = Number(meta.coverage ?? exam.examType?.project?.citiesCount ?? 0);
      coverageUnit = 'Cities';

      scheduleBreakdown = (exam.dates || []).map((d: any) => ({
        examDate: new Date(d.examDate).toISOString().substring(0, 10),
        displayDate: new Date(d.examDate).toLocaleDateString('en-GB'),
        shiftsCount: d.shifts?.length || 0,
        shifts: (d.shifts || []).map((s: any) => s.shiftName),
      }));
      examinationDateCount = exam.dates?.length || 0;
      shiftCount = (exam.dates || []).reduce((acc: number, d: any) => acc + (d.shifts?.length || 0), 0);
    }

    // Tolerances
    const registrationDeskTolerance = Number(meta.registrationDesk) || 5.0;
    const bufferNodesTolerance = Number(meta.bufferNodes) || 3.0;

    // Validation Status
    let validationStatus: ExamSummaryResult['validationStatus'] = 'VALID';
    if (warnings.length > 0) {
      validationStatus = 'VALID_WITH_WARNINGS';
    }
    if (candidateTarget <= 0 || coverageCount <= 0) {
      validationStatus = 'NEEDS_REVIEW';
    }

    // Lineages
    const candidateTargetLineage: MetricLineage = {
      metricName: 'Candidate Target',
      value: candidateTarget,
      definition: 'Total number of candidates planned for the examination across all valid locations.',
      aggregationMethod: targetMethod,
      sourceField: targetSourceField,
      recordsIncluded: targetRecordsIncluded,
      recordsExcluded: targetRecordsExcluded,
      exclusionReason: targetRecordsExcluded > 0 ? 'Duplicate location records excluded to prevent inflation.' : undefined,
      warnings: wb?.discrepancies?.length ? [
        `Location Total Count sums to ${candidateTarget.toLocaleString('en-IN')}; row shift allocations sum to ${wb.shiftAllocationSum.toLocaleString('en-IN')}.`
      ] : [],
      businessRuleVersion: this.RULE_VERSION,
    };

    const coverageLineage: MetricLineage = {
      metricName: 'Coverage (Cities)',
      value: coverageCount,
      definition: 'Distinct number of operational cities or examination locations required.',
      aggregationMethod: coverageMethod,
      sourceField: coverageSourceField,
      recordsIncluded: coverageCount,
      recordsExcluded: wb?.duplicateRows?.length || 0,
      exclusionReason: wb?.duplicateRows?.length ? 'Repeated city entries on multiple rows merged into single distinct count.' : undefined,
      warnings: [],
      businessRuleVersion: this.RULE_VERSION,
    };

    const scheduleLineage: MetricLineage = {
      metricName: 'Schedule Overview',
      value: `${examinationDateCount} Dates / ${shiftCount} Shifts`,
      definition: 'Total distinct scheduled examination dates and configured active examination shifts.',
      aggregationMethod: 'COUNT_DISTINCT_DATES_AND_ACTIVE_SHIFTS',
      sourceField: wb?.hasWorkbook ? 'Workbook date group headers & active shift columns' : 'Database ExamDate & ExamShift records',
      recordsIncluded: shiftCount,
      recordsExcluded: 0,
      warnings: [],
      businessRuleVersion: this.RULE_VERSION,
    };

    const centresBookedLineage: MetricLineage = {
      metricName: 'Centres Booked',
      value: centresBooked,
      definition: 'Distinct verified test centres with active bookings confirmed for this examination.',
      aggregationMethod: 'COUNT_DISTINCT_CENTRES_WITH_ACTIVE_BOOKINGS',
      sourceField: 'Database Booking records where examId matches',
      recordsIncluded: centresBooked,
      recordsExcluded: 0,
      warnings: [],
      businessRuleVersion: this.RULE_VERSION,
    };

    return {
      examId: exam.id,
      examCode: exam.examCode,
      examName: exam.examName,
      projectId: exam.examType?.project?.id || '',
      projectName: exam.examType?.project?.name || '—',
      clientId: exam.examType?.project?.client?.id || '',
      clientName: exam.examType?.project?.client?.name || '—',
      lifecycleStage: meta.lifecycleStage || exam.status || 'Scheduled',
      candidateTarget,
      candidateTargetLineage,
      coverageCount,
      coverageUnit,
      coverageLineage,
      examinationDateCount,
      shiftCount,
      scheduleLineage,
      scheduleBreakdown,
      registrationDeskTolerance,
      bufferNodesTolerance,
      centresBooked,
      centresBookedLineage,
      validationStatus,
      validationWarnings: warnings,
      calculationModel,
      calculationTimestamp: new Date().toISOString(),
      ruleVersion: this.RULE_VERSION,
    };
  }

  /**
   * Synchronize database ExamDate and ExamShift records with workbook date groups.
   * Cleans up stale placeholder dates that have NO bookings.
   */
  public static async syncDatabaseSchedule(
    exam: any,
    dateGroups: Array<{
      dateIso: string;
      displayDate?: string;
      shifts: Array<{ shiftName: string; shiftNumber: number }>;
    }>
  ): Promise<void> {
    if (!dateGroups || dateGroups.length === 0) return;

    await prisma.$transaction(async (tx: any) => {
      // 1. Fetch current ExamDates with shifts and bookings
      const existingDates = await tx.examDate.findMany({
        where: { examId: exam.id },
        include: {
          shifts: {
            include: {
              bookings: true,
            },
          },
        },
      });

      const sheetDateIsoSet = new Set(dateGroups.map(dg => dg.dateIso));

      // 2. Identify stale dates that are NOT in sheet
      for (const ed of existingDates) {
        const edIso = ed.examDate.toISOString().substring(0, 10);
        if (!sheetDateIsoSet.has(edIso)) {
          // Check if any shift has bookings
          const hasBookings = ed.shifts.some((s: any) => s.bookings && s.bookings.length > 0);
          if (!hasBookings) {
            // Delete stale date (cascades to shifts)
            await tx.examDate.delete({ where: { id: ed.id } });
          }
        }
      }

      // 3. Sync or create sheet dates and shifts
      for (const dg of dateGroups) {
        const targetDateObj = new Date(dg.dateIso);
        if (isNaN(targetDateObj.getTime())) continue;

        let existingDate = existingDates.find(
          (ed: any) => ed.examDate.toISOString().substring(0, 10) === dg.dateIso
        );

        if (!existingDate) {
          existingDate = await tx.examDate.create({
            data: {
              examId: exam.id,
              examDate: targetDateObj,
              reportingTime: '07:30 AM',
              status: 'Scheduled',
            },
            include: { shifts: { include: { bookings: true } } },
          });
        }

        const currentShifts = existingDate.shifts || [];
        const sheetShiftNumbers = new Set(dg.shifts.map(s => s.shiftNumber));

        // Remove old shifts that are not in sheet and have no bookings
        for (const cs of currentShifts) {
          if (!sheetShiftNumbers.has(cs.shiftNumber) && (!cs.bookings || cs.bookings.length === 0)) {
            await tx.examShift.delete({ where: { id: cs.id } });
          }
        }

        // Add missing shifts from sheet
        for (const s of dg.shifts) {
          const shiftNum = s.shiftNumber || 1;
          const exists = currentShifts.some((cs: any) => cs.shiftNumber === shiftNum);
          if (!exists) {
            await tx.examShift.create({
              data: {
                examDateId: existingDate.id,
                shiftName: s.shiftName || `Shift ${shiftNum}`,
                shiftNumber: shiftNum,
                startTime:
                  shiftNum === 1
                    ? '09:00 AM'
                    : shiftNum === 2
                    ? '02:00 PM'
                    : shiftNum === 3
                    ? '05:30 PM'
                    : '07:00 PM',
                endTime:
                  shiftNum === 1
                    ? '12:00 PM'
                    : shiftNum === 2
                    ? '05:00 PM'
                    : shiftNum === 3
                    ? '08:30 PM'
                    : '10:00 PM',
                reportingTime:
                  shiftNum === 1
                    ? '07:30 AM'
                    : shiftNum === 2
                    ? '12:30 PM'
                    : shiftNum === 3
                    ? '04:00 PM'
                    : '05:30 PM',
                status: 'Scheduled',
              },
            });
          }
        }
      }
    });
  }
}
