import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { ExamSummaryEngine } from '../src/modules/admin/exam-summary.engine';

describe('Universal Examination Summary & Metric Calculation Engine', () => {
  // Helper to create an in-memory workbook buffer
  function createTestWorkbook(data: any[][], merges: any[] = []): Buffer {
    const ws = XLSX.utils.aoa_to_sheet(data);
    if (merges.length > 0) {
      ws['!merges'] = merges;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Requirements');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // 1. Reference Workbook
  it('correctly aggregates reference workbook (5 locations, 4 dates, 13 shifts, 17,400 target)', () => {
    const rawGrid = [
      ['', '', '', '', '', '', '', '', '01/02/2027', '', '', '', '02/02/2027', '', '', '', '03/02/2027', '', '', '04/02/2027', ''],
      ['S. No.', 'Region', 'State', 'City', 'Districts', 'City Code', 'Total Count', 'Max', 'Shift-1', 'Shift-2', 'Shift-3', 'Shift-N', 'Shift-1', 'Shift-2', 'Shift-3', 'Shift-N', 'Shift-1', 'Shift-2', 'Shift-3', 'Shift-1', 'Shift-2'],
      [1, 'North', 'Delhi', 'New Delhi', 'Central Delhi', 'DEL01', 3500, 500, 400, 500, 450, 450, 400, 450, 450, 400, 200, 200, 0, 0, 0],
      [2, 'West', 'Maharashtra', 'Mumbai', 'Mumbai City', 'MUM01', 4800, 700, 600, 650, 600, 600, 550, 600, 600, 600, 0, 0, 0, 0, 0],
      [3, 'South', 'Karnataka', 'Bengaluru', 'Bengaluru Urban', 'BLR01', 3800, 600, 500, 500, 500, 500, 450, 450, 450, 450, 0, 0, 0, 0, 0],
      [4, 'East', 'West Bengal', 'Kolkata', 'Kolkata', 'KOL01', 2800, 450, 350, 400, 350, 350, 350, 350, 350, 300, 0, 0, 0, 0, 0],
      [5, 'North', 'Uttar Pradesh', 'Lucknow', 'Lucknow', 'LKO01', 2500, 400, 300, 350, 350, 300, 300, 300, 300, 300, 0, 0, 0, 0, 0],
    ];

    const merges = [
      { s: { r: 0, c: 8 }, e: { r: 0, c: 11 } },
      { s: { r: 0, c: 12 }, e: { r: 0, c: 15 } },
      { s: { r: 0, c: 16 }, e: { r: 0, c: 18 } },
      { s: { r: 0, c: 19 }, e: { r: 0, c: 20 } },
    ];

    const buffer = createTestWorkbook(rawGrid, merges);
    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);

    expect(parsed.totalRows).toBe(5);
    expect(parsed.uniqueLocations.size).toBe(5);
    expect(parsed.locationTargetSum).toBe(17400);
    expect(parsed.dateGroups.length).toBe(4);

    const totalValidShifts = parsed.dateGroups.reduce((acc, dg) => acc + dg.shifts.length, 0);
    expect(totalValidShifts).toBe(13);
  });

  // 2. Different Workbook With 8 Locations, Different Candidate Target
  it('correctly aggregates a different workbook with 8 cities and 50,000 target', () => {
    const rawGrid = [
      ['', '', '', '', '', '', '', '15/03/2027', '', '16/03/2027', ''],
      ['S. No.', 'Zone', 'State Name', 'Location', 'Location Code', 'Candidate Count', 'Peak Capacity', 'Shift-1', 'Shift-2', 'Shift-1', 'Shift-2'],
      [1, 'North', 'Punjab', 'Amritsar', 'ASR01', 5000, 1500, 1500, 1500, 1000, 1000],
      [2, 'North', 'Punjab', 'Ludhiana', 'LDH01', 6000, 1800, 1800, 1800, 1200, 1200],
      [3, 'North', 'Haryana', 'Gurugram', 'GGN01', 8000, 2500, 2500, 2500, 1500, 1500],
      [4, 'West', 'Gujarat', 'Ahmedabad', 'AMD01', 9000, 2800, 2800, 2800, 1700, 1700],
      [5, 'West', 'Gujarat', 'Surat', 'SRT01', 7000, 2200, 2200, 2200, 1300, 1300],
      [6, 'South', 'Telangana', 'Hyderabad', 'HYD01', 8000, 2500, 2500, 2500, 1500, 1500],
      [7, 'South', 'Tamil Nadu', 'Chennai', 'MAA01', 4000, 1200, 1200, 1200, 800, 800],
      [8, 'East', 'Odisha', 'Bhubaneswar', 'BBI01', 3000, 1000, 1000, 1000, 500, 500],
    ];

    const merges = [
      { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } },
      { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } },
    ];

    const buffer = createTestWorkbook(rawGrid, merges);
    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);

    expect(parsed.totalRows).toBe(8);
    expect(parsed.uniqueLocations.size).toBe(8);
    expect(parsed.locationTargetSum).toBe(50000);
    expect(parsed.shiftAllocationSum).toBe(50000);
    expect(parsed.discrepancies.length).toBe(0);
    expect(parsed.dateGroups.length).toBe(2);
    expect(parsed.dateGroups.reduce((acc, dg) => acc + dg.shifts.length, 0)).toBe(4);
  });

  // 3. Shift-Wise Model C (No Total Count Column)
  it('correctly uses Model C (Shift-Wise Allocation) when Total Count column is absent', () => {
    const rawGrid = [
      ['', '', '', '', '10/04/2027', '', '11/04/2027', ''],
      ['S. No.', 'State', 'City', 'City Code', 'Shift-1', 'Shift-2', 'Shift-1', 'Shift-2'],
      [1, 'Rajasthan', 'Jaipur', 'JAI01', 1200, 1300, 1100, 1400],
      [2, 'Rajasthan', 'Jodhpur', 'JDH01', 800, 900, 850, 950],
      [3, 'Rajasthan', 'Udaipur', 'UDR01', 500, 600, 550, 650],
    ];

    const merges = [
      { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } },
      { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } },
    ];

    const buffer = createTestWorkbook(rawGrid, merges);
    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);

    expect(parsed.hasTotalCountColumn).toBe(false);
    expect(parsed.uniqueLocations.size).toBe(3);
    // Sum of all shifts: (1200+1300+1100+1400) + (800+900+850+950) + (500+600+550+650) = 5000 + 3500 + 2300 = 10800
    expect(parsed.shiftAllocationSum).toBe(10800);
  });

  // 4. Duplicate Location Detection & Prevention
  it('prevents double-counting when the same city appears across multiple rows', () => {
    const rawGrid = [
      ['', '', '', '', '01/05/2027', ''],
      ['S. No.', 'State', 'City', 'City Code', 'Total Count', 'Shift-1'],
      [1, 'Maharashtra', 'Pune', 'PUN01', 4000, 4000],
      [2, 'Maharashtra', 'Pune', 'PUN01', 4000, 4000], // Duplicate row
      [3, 'Maharashtra', 'Nagpur', 'NAG01', 3000, 3000],
    ];

    const merges = [{ s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }];
    const buffer = createTestWorkbook(rawGrid, merges);
    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);

    expect(parsed.totalRows).toBe(3);
    expect(parsed.uniqueLocations.size).toBe(2);
    expect(parsed.duplicateRows.length).toBe(1);
    // Pune (4000) counted only once + Nagpur (3000) = 7000
    expect(parsed.locationTargetSum).toBe(7000);
    expect(parsed.warnings.some(w => w.includes('Duplicate location detected'))).toBe(true);
  });

  // 5. Unconfigured Shift-N Placeholder Handling
  it('excludes unconfigured Shift-N placeholder columns with all zero/empty data', () => {
    const rawGrid = [
      ['', '', '', '', '', '20/05/2027', '', ''],
      ['S. No.', 'State', 'City', 'City Code', 'Total Count', 'Shift-1', 'Shift-2', 'Shift-N'],
      [1, 'Delhi', 'New Delhi', 'DEL01', 2000, 1000, 1000, ''],
      [2, 'Delhi', 'North Delhi', 'DEL02', 1500, 750, 750, ''],
    ];

    const merges = [{ s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }];
    const buffer = createTestWorkbook(rawGrid, merges);
    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);

    expect(parsed.dateGroups.length).toBe(1);
    const shifts = parsed.dateGroups[0].shifts.map(s => s.shiftName);
    // Shift-N has no data across any row, so it should be excluded as an unconfigured placeholder
    expect(shifts).toEqual(['Shift-1', 'Shift-2']);
    expect(shifts).not.toContain('Shift-N');
  });

  // 6. Header Aliases Robustness
  it('supports alternative header names (Zone, Centre City, Station Code, Requirement)', () => {
    const rawGrid = [
      ['', '', '', '', '', '01/06/2027'],
      ['S. No.', 'Zone', 'Province', 'Centre City', 'Station Code', 'Requirement', 'Shift 1'],
      [1, 'South', 'Kerala', 'Kochi', 'COK01', 6500, 6500],
    ];

    const buffer = createTestWorkbook(rawGrid);
    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);

    expect(parsed.hasTotalCountColumn).toBe(true);
    expect(parsed.locationTargetSum).toBe(6500);
    expect(parsed.uniqueLocations.get('COK01')?.city).toBe('Kochi');
  });

  // 7. Discrepancy Warnings between Total Count and Shift Sum
  it('records itemized discrepancies when Total Count differs from shift sum without crashing', () => {
    const rawGrid = [
      ['', '', '', '', '', '01/07/2027', ''],
      ['S. No.', 'State', 'City', 'City Code', 'Total Count', 'Shift-1', 'Shift-2'],
      [1, 'Bihar', 'Patna', 'PAT01', 5000, 2000, 2000], // Shift sum is 4000 != 5000
    ];

    const buffer = createTestWorkbook(rawGrid);
    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);

    expect(parsed.locationTargetSum).toBe(5000);
    expect(parsed.shiftAllocationSum).toBe(4000);
    expect(parsed.discrepancies.length).toBe(1);
    expect(parsed.discrepancies[0].city).toBe('Patna');
    expect(parsed.discrepancies[0].totalCount).toBe(5000);
    expect(parsed.discrepancies[0].shiftSum).toBe(4000);
  });

  // 8. Ten or More Shifts Across Multiple Dates
  it('supports 12 shifts across 3 dates with varying shift counts per date', () => {
    const rawGrid = [
      ['', '', '', '', '01/08/2027', '', '', '', '02/08/2027', '', '', '', '', '03/08/2027', '', ''],
      ['S. No.', 'State', 'City', 'Total Count',
        'Shift-1', 'Shift-2', 'Shift-3', 'Shift-4', // Date 1: 4 shifts
        'Shift-1', 'Shift-2', 'Shift-3', 'Shift-4', 'Shift-5', // Date 2: 5 shifts
        'Shift-1', 'Shift-2', 'Shift-3' // Date 3: 3 shifts
      ],
      [1, 'Maharashtra', 'Nagpur', 12000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
    ];

    const merges = [
      { s: { r: 0, c: 4 }, e: { r: 0, c: 7 } },
      { s: { r: 0, c: 8 }, e: { r: 0, c: 12 } },
      { s: { r: 0, c: 13 }, e: { r: 0, c: 15 } },
    ];

    const buffer = createTestWorkbook(rawGrid, merges);
    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);

    expect(parsed.dateGroups.length).toBe(3);
    const totalShifts = parsed.dateGroups.reduce((acc, dg) => acc + dg.shifts.length, 0);
    expect(totalShifts).toBe(12);
    expect(parsed.dateGroups[0].shifts.length).toBe(4);
    expect(parsed.dateGroups[1].shifts.length).toBe(5);
    expect(parsed.dateGroups[2].shifts.length).toBe(3);
    expect(parsed.locationTargetSum).toBe(12000);
  });

  // 9. Blank and Non-Numeric String Values Safe Handling
  it('safely handles non-numeric strings, empty cells, and whitespace without throwing', () => {
    const rawGrid = [
      ['', '', '', '', '01/09/2027'],
      ['S. No.', 'State', 'City', 'Total Count', 'Shift-1'],
      [1, 'Goa', 'Panaji', 'N/A', ' - '],
      [2, 'Goa', 'Margao', null, undefined],
      [3, 'Goa', 'Vasco', ' 4,500 ', ' 4,500 '],
    ];

    const buffer = createTestWorkbook(rawGrid);
    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);

    expect(parsed.totalRows).toBe(3);
    expect(parsed.locationTargetSum).toBe(4500);
    expect(parsed.shiftAllocationSum).toBe(4500);
  });

  // 10. Multi-Worksheet Support
  it('supports workbooks with multiple worksheets by selecting the first valid worksheet', () => {
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['', '', '', '', '01/10/2027'],
      ['S. No.', 'State', 'City', 'Total Count', 'Shift-1'],
      [1, 'Assam', 'Guwahati', 7500, 7500],
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([['Notes', 'This is an instruction sheet']]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Requirements');
    XLSX.utils.book_append_sheet(wb, ws2, 'Instructions');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const parsed = ExamSummaryEngine.parseWorkbookBuffer(buffer);
    expect(parsed.locationTargetSum).toBe(7500);
    expect(parsed.uniqueLocations.size).toBe(1);
  });
});
