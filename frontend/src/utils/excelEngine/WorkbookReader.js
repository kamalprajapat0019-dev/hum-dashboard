/**
 * Universal Workbook Reader.
 * Safely parses .xlsx / .xls workbooks, handles multiple worksheets,
 * extracts merged cells and 2D row matrices with safety guards.
 */

import * as XLSX from 'xlsx';

export class WorkbookReader {
  /**
   * Reads raw file/buffer and returns structured workbook representation.
   */
  static async readWorkbook(fileOrBuffer) {
    let buffer;

    if (fileOrBuffer instanceof ArrayBuffer) {
      buffer = fileOrBuffer;
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(fileOrBuffer)) {
      buffer = fileOrBuffer;
    } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
      buffer = await fileOrBuffer.arrayBuffer();
    } else if (fileOrBuffer instanceof Uint8Array) {
      buffer = fileOrBuffer;
    } else {
      throw new Error('Unsupported input format. Expected File, Blob, Buffer, or ArrayBuffer.');
    }

    let workbook;
    try {
      workbook = XLSX.read(buffer, {
        type: buffer instanceof ArrayBuffer ? 'array' : 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: true,
        raw: false,
      });
    } catch (err) {
      throw new Error(`Failed to parse Excel workbook: ${err.message || 'Corrupted or unsupported format'}`);
    }

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('The uploaded Excel workbook contains no worksheets.');
    }

    return workbook;
  }

  /**
   * Selects the most relevant sheet based on profile keywords or defaults to first sheet.
   */
  static selectWorksheet(workbook, requestedSheetName = null, keywords = []) {
    const sheetNames = workbook.SheetNames;

    if (requestedSheetName && sheetNames.includes(requestedSheetName)) {
      return {
        sheetName: requestedSheetName,
        worksheet: workbook.Sheets[requestedSheetName],
      };
    }

    // Try keyword match
    for (const kw of keywords) {
      const match = sheetNames.find(name => name.toLowerCase().includes(kw.toLowerCase()));
      if (match) {
        return {
          sheetName: match,
          worksheet: workbook.Sheets[match],
        };
      }
    }

    // Fallback to first sheet
    const defaultSheet = sheetNames[0];
    return {
      sheetName: defaultSheet,
      worksheet: workbook.Sheets[defaultSheet],
    };
  }

  /**
   * Extracts raw 2D grid and merged cells from worksheet.
   */
  static extractGridAndMerges(worksheet) {
    if (!worksheet) return { rawGrid: [], merges: [] };

    const rawGrid = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: true,
      raw: false,
    });

    const merges = worksheet['!merges'] || [];

    return {
      rawGrid,
      merges,
    };
  }
}
