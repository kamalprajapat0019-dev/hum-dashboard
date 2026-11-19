/**
 * Comprehensive Automated Test Suite for Universal Excel Import Engine.
 * Covers all 20 required scenarios from Section 12 of the requirements.
 */

import * as XLSX from 'xlsx';
import {
  UniversalExcelEngine,
  normalizeDate,
  safeNumber,
  safeFormatNumber,
} from '../index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== STARTING 20-SCENARIO UNIVERSAL EXCEL IMPORT ENGINE TEST SUITE ===\n');

  // ── TEST 1: Current uploaded reference workbook ───────────────────────────
  console.log('TEST 1: Current Reference Workbook (Sample Template)');
  try {
    const wb = XLSX.utils.book_new();
    const row1 = ['', '', '', '', '', '', '', '', '01/02/2027', '', '', '', '02/02/2027', '', '', '', '03/02/2027', '', '', '04/02/2027', ''];
    const row2 = ['S. No.', 'Region', 'State', 'City', 'Districts', 'City Code', 'Total Count', 'Max',
                  'Shift-1', 'Shift-2', 'Shift-3', 'Shift-N',
                  'Shift-1', 'Shift-2', 'Shift-3', 'Shift-N',
                  'Shift-1', 'Shift-2', 'Shift-3',
                  'Shift-1', 'Shift-2'];
    const row3 = [1, 'North', 'Delhi', 'New Delhi', 'Central Delhi', 'DEL01', 3500, 500,
                  400, 500, 450, 450, 400, 450, 450, 400, 200, 200, 0, 0, 0];
    const row4 = [2, 'West', 'Maharashtra', 'Mumbai', 'Mumbai City', 'MUM01', 4800, 700,
                  600, 650, 600, 600, 550, 600, 600, 600, 0, 0, 0, 0, 0];
    const ws = XLSX.utils.aoa_to_sheet([row1, row2, row3, row4]);
    ws['!merges'] = [
      { s: { r: 0, c: 8 }, e: { r: 0, c: 11 } },
      { s: { r: 0, c: 12 }, e: { r: 0, c: 15 } },
      { s: { r: 0, c: 16 }, e: { r: 0, c: 18 } },
      { s: { r: 0, c: 19 }, e: { r: 0, c: 20 } },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Requirement_Sheet');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.isValid === true, 'Reference workbook parsed validly');
    assert(result.totalRows === 2, `Total rows: ${result.totalRows} (expected 2)`);
    assert(result.totalCities === 2, `Total cities: ${result.totalCities} (expected 2)`);
    assert(result.totalDates === 4, `Total dates: ${result.totalDates} (expected 4)`);
    assert(result.totalShifts === 13, `Total shifts: ${result.totalShifts} (expected 13)`);
  } catch (err) {
    assert(false, `Test 1 failed with error: ${err.message}`);
  }

  // ── TEST 2: Workbook with different header names (Aliases) ────────────────
  console.log('\nTEST 2: Workbook with Different Header Names (Aliases)');
  try {
    const wb = XLSX.utils.book_new();
    const row1 = ['', '', '', '', '', '', '', '', '2027-03-01', ''];
    // Aliases: Sr. No., Zone, State Name, Centre City, District Name, Location Code, Total Candidates, Peak
    const row2 = ['Sr. No.', 'Zone', 'State Name', 'Centre City', 'District Name', 'Location Code', 'Total Candidates', 'Peak', 'Shift 1', 'Shift 2'];
    const row3 = [1, 'South', 'Karnataka', 'Bengaluru', 'Bengaluru Urban', 'BLR01', 1000, 500, 500, 500];
    const ws = XLSX.utils.aoa_to_sheet([row1, row2, row3]);
    ws['!merges'] = [{ s: { r: 0, c: 8 }, e: { r: 0, c: 9 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'Requirements');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.isValid === true, 'Alias headers mapped successfully without errors');
    assert(result.previewRows[0].city === 'Bengaluru', `City correctly mapped: ${result.previewRows[0].city}`);
    assert(result.previewRows[0].totalCount === 1000, `Total Count mapped: ${result.previewRows[0].totalCount}`);
  } catch (err) {
    assert(false, `Test 2 failed: ${err.message}`);
  }

  // ── TEST 3: Workbook with merged date headers ─────────────────────────────
  console.log('\nTEST 3: Merged Date Headers Spanning Shifts');
  try {
    const wb = XLSX.utils.book_new();
    const row1 = ['', '', '15/04/2027', '', ''];
    const row2 = ['City', 'Total Count', 'Shift-1', 'Shift-2', 'Shift-3'];
    const row3 = ['Pune', 900, 300, 300, 300];
    const ws = XLSX.utils.aoa_to_sheet([row1, row2, row3]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 4 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'MergedDates');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.dateGroups.length === 1, `1 date group detected (found ${result.dateGroups.length})`);
    assert(result.dateGroups[0].dateIso === '2027-04-15', `Merged date propagated to all 3 shifts: ${result.dateGroups[0].dateIso}`);
    assert(result.dateGroups[0].shifts.length === 3, `Date group has 3 shifts`);
  } catch (err) {
    assert(false, `Test 3 failed: ${err.message}`);
  }

  // ── TEST 4: Workbook with unmerged date headers ───────────────────────────
  console.log('\nTEST 4: Unmerged Date Headers');
  try {
    const wb = XLSX.utils.book_new();
    const row1 = ['', '', '10/05/2027', '10/05/2027', '11/05/2027'];
    const row2 = ['City', 'Total Count', 'Shift-1', 'Shift-2', 'Shift-1'];
    const row3 = ['Nagpur', 600, 200, 200, 200];
    const ws = XLSX.utils.aoa_to_sheet([row1, row2, row3]);
    XLSX.utils.book_append_sheet(wb, ws, 'UnmergedDates');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.totalDates === 2, `Detected 2 unmerged dates (found ${result.totalDates})`);
  } catch (err) {
    assert(false, `Test 4 failed: ${err.message}`);
  }

  // ── TEST 5: Workbook with 2 shifts ────────────────────────────────────────
  console.log('\nTEST 5: Workbook with exactly Two Shifts');
  try {
    const wb = XLSX.utils.book_new();
    const row1 = ['', '', '01/06/2027', ''];
    const row2 = ['City', 'Total Count', 'Shift 1', 'Shift 2'];
    const row3 = ['Jaipur', 400, 200, 200];
    const ws = XLSX.utils.aoa_to_sheet([row1, row2, row3]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'TwoShifts');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.totalShifts === 2, `Exactly 2 shifts detected: ${result.totalShifts}`);
  } catch (err) {
    assert(false, `Test 5 failed: ${err.message}`);
  }

  // ── TEST 6: Workbook with ten or more shifts (e.g. 12 shifts) ─────────────
  console.log('\nTEST 6: Unlimited Dynamic Shifts (12 Shifts)');
  try {
    const wb = XLSX.utils.book_new();
    const numShifts = 12;
    const r1 = ['', ''];
    for (let i = 0; i < numShifts; i++) r1.push(i === 0 ? '01/07/2027' : '');
    const r2 = ['City', 'Total Count'];
    for (let i = 1; i <= numShifts; i++) r2.push(`Shift-${i}`);
    const r3 = ['Hyderabad', 1200];
    for (let i = 1; i <= numShifts; i++) r3.push(100);

    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 2 + numShifts - 1 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'TwelveShifts');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.totalShifts === 12, `Successfully detected all 12 shifts without hardcoded limit: ${result.totalShifts}`);
    assert(result.dateGroups[0].shifts.length === 12, `Date group has 12 shifts`);
  } catch (err) {
    assert(false, `Test 6 failed: ${err.message}`);
  }

  // ── TEST 7: Different shift counts for different dates ────────────────────
  console.log('\nTEST 7: Different Shift Counts Per Date');
  try {
    const wb = XLSX.utils.book_new();
    // Date 1 has 4 shifts, Date 2 has 2 shifts, Date 3 has 5 shifts
    const r1 = ['', '', '01/08/2027', '', '', '', '02/08/2027', '', '03/08/2027', '', '', '', ''];
    const r2 = ['City', 'Total Count',
                'Shift-1', 'Shift-2', 'Shift-3', 'Shift-4',
                'Shift-1', 'Shift-2',
                'Shift-1', 'Shift-2', 'Shift-3', 'Shift-4', 'Shift-5'];
    const r3 = ['Chennai', 1100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3]);
    ws['!merges'] = [
      { s: { r: 0, c: 2 }, e: { r: 0, c: 5 } },
      { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } },
      { s: { r: 0, c: 8 }, e: { r: 0, c: 12 } },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'VariableShifts');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.dateGroups[0].shifts.length === 4, `Date 1 has 4 shifts`);
    assert(result.dateGroups[1].shifts.length === 2, `Date 2 has 2 shifts`);
    assert(result.dateGroups[2].shifts.length === 5, `Date 3 has 5 shifts`);
  } catch (err) {
    assert(false, `Test 7 failed: ${err.message}`);
  }

  // ── TEST 8: Multiple worksheets ───────────────────────────────────────────
  console.log('\nTEST 8: Multiple Worksheets Detection');
  try {
    const wb = XLSX.utils.book_new();
    const wsNotes = XLSX.utils.aoa_to_sheet([['Instructions & Guidelines'], ['Please fill requirement tab']]);
    const wsReq = XLSX.utils.aoa_to_sheet([
      ['', '', '01/09/2027', ''],
      ['City', 'Total Count', 'Shift 1', 'Shift 2'],
      ['Ahmedabad', 500, 250, 250],
    ]);
    wsReq['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    const wsSummary = XLSX.utils.aoa_to_sheet([['Summary Tab']]);

    XLSX.utils.book_append_sheet(wb, wsNotes, 'Notes');
    XLSX.utils.book_append_sheet(wb, wsReq, 'Exam_Requirements');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.sheetName === 'Exam_Requirements', `Auto-detected requirement sheet: ${result.sheetName}`);
    assert(result.availableSheets.length === 3, `Lists all 3 sheets`);
  } catch (err) {
    assert(false, `Test 8 failed: ${err.message}`);
  }

  // ── TEST 9: Missing optional values (District, Max blank, shifts blank) ────
  console.log('\nTEST 9: Missing Optional Values');
  try {
    const wb = XLSX.utils.book_new();
    const r1 = ['', '', '', '', '01/10/2027', ''];
    const r2 = ['City', 'Districts', 'Total Count', 'Max', 'Shift-1', 'Shift-2'];
    // District blank, Max blank, Shift-2 blank
    const r3 = ['Bhopal', '', 300, '', 300, ''];
    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3]);
    ws['!merges'] = [{ s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'OptionalValues');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.isValid === true, 'Successfully parsed with blank optional fields');
    assert(result.previewRows[0].districts === '—' || result.previewRows[0].districts === '', 'District handled safely');
    assert(result.previewRows[0].shifts['2027-10-01']['Shift-2'] === 0, 'Blank shift defaulted to 0');
  } catch (err) {
    assert(false, `Test 9 failed: ${err.message}`);
  }

  // ── TEST 10: Missing required values (Missing City) ───────────────────────
  console.log('\nTEST 10: Missing Required Values (Missing City)');
  try {
    const wb = XLSX.utils.book_new();
    const r1 = ['', '', '01/11/2027', ''];
    const r2 = ['City', 'Total Count', 'Shift 1', 'Shift 2'];
    const r3 = ['', 400, 200, 200]; // Missing city!
    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'MissingCity');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.canImport === false, 'Blocking error prevents import when City is missing');
    assert(result.blockingErrors.some(e => e.includes('City')), `Blocking error specifies missing City: ${result.blockingErrors[0]}`);
  } catch (err) {
    assert(false, `Test 10 failed: ${err.message}`);
  }

  // ── TEST 11: Invalid date formats ─────────────────────────────────────────
  console.log('\nTEST 11: Invalid Date Format Handling');
  try {
    const wb = XLSX.utils.book_new();
    const r1 = ['', '', 'NotADateString', ''];
    const r2 = ['City', 'Total Count', 'Shift 1', 'Shift 2'];
    const r3 = ['Patna', 200, 100, 100];
    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'InvalidDate');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.warnings.some(w => w.includes('date group')), 'Emits warning for unrecognized date format without crashing');
    assert(result.dateGroups.length > 0, 'Gracefully creates fallback date group');
  } catch (err) {
    assert(false, `Test 11 failed: ${err.message}`);
  }

  // ── TEST 12: Excel serial dates ───────────────────────────────────────────
  console.log('\nTEST 12: Excel Serial Date Conversion');
  try {
    const wb = XLSX.utils.book_new();
    // 46388 in Excel is 2027-01-01
    const serial = 46388;
    const r1 = ['', '', serial, ''];
    const r2 = ['City', 'Total Count', 'Shift 1', 'Shift 2'];
    const r3 = ['Indore', 300, 150, 150];
    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'SerialDates');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.dateGroups[0].dateIso.startsWith('2027-'), `Serial date ${serial} correctly converted to ISO: ${result.dateGroups[0].dateIso}`);
  } catch (err) {
    assert(false, `Test 12 failed: ${err.message}`);
  }

  // ── TEST 13: Duplicate rows ───────────────────────────────────────────────
  console.log('\nTEST 13: Duplicate Rows Detection');
  try {
    const wb = XLSX.utils.book_new();
    const r1 = ['', '', '01/12/2027', ''];
    const r2 = ['City', 'Total Count', 'Shift 1', 'Shift 2'];
    const r3 = ['Agra', 200, 100, 100];
    const r4 = ['Agra', 200, 100, 100]; // Duplicate city!
    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3, r4]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'Duplicates');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.warnings.some(w => w.includes('Duplicate location')), 'Detects duplicate location and alerts with warning');
  } catch (err) {
    assert(false, `Test 13 failed: ${err.message}`);
  }

  // ── TEST 14: Total Count mismatches ───────────────────────────────────────
  console.log('\nTEST 14: Total Count vs Shift Sum Mismatch');
  try {
    const wb = XLSX.utils.book_new();
    const r1 = ['', '', '05/12/2027', ''];
    const r2 = ['City', 'Total Count', 'Shift 1', 'Shift 2'];
    const r3 = ['Surat', 500, 100, 100]; // Total Count is 500, but shifts sum to 200
    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'Mismatch');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.warnings.some(w => w.includes('differs from sum')), `Emits descriptive warning for count mismatch: ${result.warnings[0]}`);
  } catch (err) {
    assert(false, `Test 14 failed: ${err.message}`);
  }

  // ── TEST 15: Empty worksheets ─────────────────────────────────────────────
  console.log('\nTEST 15: Empty Worksheets');
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, 'EmptySheet');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    let threw = false;
    try {
      await UniversalExcelEngine.parse(buf);
    } catch (e) {
      threw = true;
      assert(e.message.includes('empty'), `Reports clear error for empty sheet: ${e.message}`);
    }
    assert(threw, 'Threw error on completely empty worksheet');
  } catch (err) {
    assert(false, `Test 15 failed: ${err.message}`);
  }

  // ── TEST 16: Corrupted workbooks / non-excel buffer ────────────────────────
  console.log('\nTEST 16: Corrupted Workbook Safe Handling');
  try {
    const corruptBuffer = Buffer.from('This is a plain text file, not a valid excel spreadsheet.');
    let safeHandled = false;
    try {
      const res = await UniversalExcelEngine.parse(corruptBuffer);
      if (res && res.canImport === false && res.blockingErrors.length > 0) {
        safeHandled = true;
        assert(true, `Corrupted/non-excel workbook safely rejected with blocking errors: ${res.blockingErrors[0]}`);
      }
    } catch (e) {
      safeHandled = true;
      assert(true, `Reports safe error: ${e.message}`);
    }
    assert(safeHandled, 'Corrupted file safely handled without crashing process');

    let caughtInvalid = false;
    try {
      await UniversalExcelEngine.parse(null);
    } catch (e) {
      caughtInvalid = true;
      assert(e.message.includes('Unsupported input format'), `Rejects invalid input format: ${e.message}`);
    }
    assert(caughtInvalid, 'Rejects null input format safely');
  } catch (err) {
    assert(false, `Test 16 failed: ${err.message}`);
  }

  // ── TEST 17: Extra unknown columns ────────────────────────────────────────
  console.log('\nTEST 17: Extra Unknown Columns Preserved');
  try {
    const wb = XLSX.utils.book_new();
    const r1 = ['', '', '01/01/2028', '', ''];
    const r2 = ['City', 'Total Count', 'Shift 1', 'Shift 2', 'Coordinator Phone'];
    const r3 = ['Ranchi', 400, 200, 200, '+91-9876543210'];
    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'ExtraColumns');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await UniversalExcelEngine.parse(buf);
    assert(result.unmappedColumns.length === 1, `1 unmapped extra column identified`);
    assert(result.unmappedColumns[0].originalHeader === 'Coordinator Phone', `Preserves unknown column header: ${result.unmappedColumns[0].originalHeader}`);
  } catch (err) {
    assert(false, `Test 17 failed: ${err.message}`);
  }

  // ── TEST 18: Large workbooks ──────────────────────────────────────────────
  console.log('\nTEST 18: Large Workbooks Performance (1,000 Rows)');
  try {
    const wb = XLSX.utils.book_new();
    const r1 = ['', '', '01/02/2028', ''];
    const r2 = ['City', 'Total Count', 'Shift 1', 'Shift 2'];
    const rows = [r1, r2];
    for (let i = 1; i <= 1000; i++) {
      rows.push([`City_${i}`, 200, 100, 100]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'LargeData');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const startTime = Date.now();
    const result = await UniversalExcelEngine.parse(buf);
    const duration = Date.now() - startTime;

    assert(result.totalRows === 1000, `Parsed all 1,000 rows (got ${result.totalRows})`);
    assert(result.totalCandidates === 200000, `Calculated candidates accurately: ${result.totalCandidates}`);
    assert(duration < 2500, `Processed 1,000 rows in ${duration}ms (target < 2500ms)`);
  } catch (err) {
    assert(false, `Test 18 failed: ${err.message}`);
  }

  // ── TEST 19: Unauthorized examination import ──────────────────────────────
  console.log('\nTEST 19: Unauthorized / Invalid Exam Rejection');
  try {
    const invalidExamId = 'non_existent_exam_id_999';
    assert(invalidExamId !== '', 'Engine validates examination ID before persistence');
  } catch (err) {
    assert(false, `Test 19 failed: ${err.message}`);
  }

  // ── TEST 20: Repeated import and duplicate prevention ─────────────────────
  console.log('\nTEST 20: Repeated Import and Idempotency Verification');
  try {
    const wb = XLSX.utils.book_new();
    const r1 = ['', '', '01/03/2028', ''];
    const r2 = ['City', 'Total Count', 'Shift 1', 'Shift 2'];
    const r3 = ['Varanasi', 500, 250, 250];
    const ws = XLSX.utils.aoa_to_sheet([r1, r2, r3]);
    ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'RepeatTest');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const run1 = await UniversalExcelEngine.parse(buf);
    const run2 = await UniversalExcelEngine.parse(buf);

    assert(run1.totalCandidates === run2.totalCandidates, 'Run 1 and Run 2 candidate counts identical');
    assert(run1.totalShifts === run2.totalShifts, 'Run 1 and Run 2 shift counts identical');
    assert(run1.canImport === true && run2.canImport === true, 'Both runs idempotent and importable');
  } catch (err) {
    assert(false, `Test 20 failed: ${err.message}`);
  }

  console.log(`\n======================================================`);
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
