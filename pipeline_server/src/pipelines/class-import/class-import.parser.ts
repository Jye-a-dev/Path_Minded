import { Injectable, Logger } from '@nestjs/common';
import { Workbook } from '@cj-tech-master/excelts';
import type { ParsedClassRow, ClassImportWarning } from './class-import.types';

type RawRow = {
  rowNumber: number;
  values: (string | number | null)[];
};

/**
 * Parses class student list from Excel files or text input.
 */
@Injectable()
export class ClassImportParser {
  private readonly logger = new Logger(ClassImportParser.name);

  async parseExcel(buffer: Buffer): Promise<{
    headerRow?: string[];
    rows: RawRow[];
  }> {
    const wb = new Workbook();
    await wb.xlsx.load(buffer);
    const ws = wb.worksheets[0];

    if (!ws) {
      this.logger.warn('No worksheet found in Excel file');
      return { rows: [] };
    }

    let headerRow: string[] | undefined = undefined;
    const rows: RawRow[] = [];
    ws.eachRow((row, rowNumber) => {
      const values = row.values as (string | number | null)[];
      values.shift(); // Remove 1-indexed empty first element

      if (rowNumber === 1) {
        headerRow = values.map((v) => (v ? String(v).trim() : ''));
        return;
      }

      rows.push({ rowNumber, values });
    });

    return { headerRow, rows };
  }

  parseText(
    text: string,
    columnMappings?: Record<string, string[]>,
  ): {
    headerRow?: string[];
    rows: RawRow[];
  } {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return { rows: [] };
    }

    const defaultMappings: Record<string, string[]> = {
      student_code: [
        'mã sinh viên',
        'mã sv',
        'student code',
        'student_code',
        'mssv',
        'ms sv',
      ],
      full_name: [
        'họ và tên',
        'họ tên',
        'full name',
        'full_name',
        'tên sinh viên',
        'tên sv',
        'name',
      ],
      email: ['email', 'mail', 'thư điện tử'],
    };

    const matchesMapping = (cellVal: string, key: string): boolean => {
      const phrases =
        columnMappings && Array.isArray(columnMappings[key])
          ? columnMappings[key]
          : defaultMappings[key];
      const lowerVal = cellVal.toLowerCase();
      return phrases.some((phrase) => lowerVal.includes(phrase.toLowerCase()));
    };

    const firstLineValues = lines[0].split(',').map((col) => col.trim());
    let hasHeader = false;
    for (const val of firstLineValues) {
      if (
        matchesMapping(val, 'student_code') ||
        matchesMapping(val, 'full_name') ||
        matchesMapping(val, 'email')
      ) {
        hasHeader = true;
        break;
      }
    }

    let headerRow: string[] | undefined = undefined;
    let dataLines = lines;
    if (hasHeader) {
      headerRow = firstLineValues;
      dataLines = lines.slice(1);
    }

    const rows = dataLines.map((line, idx) => ({
      rowNumber: hasHeader ? idx + 2 : idx + 1,
      values: line.split(',').map((col) => col.trim()),
    }));

    return { headerRow, rows };
  }

  mapRows(
    parsed: { headerRow?: string[]; rows: RawRow[] },
    columnMappings?: Record<string, string[]>,
  ): {
    students: ParsedClassRow[];
    warnings: ClassImportWarning[];
  } {
    const { headerRow, rows } = parsed;
    const students: ParsedClassRow[] = [];
    const warnings: ClassImportWarning[] = [];
    const seenStudentCodes = new Set<string>();

    const defaultMappings: Record<string, string[]> = {
      student_code: [
        'mã sinh viên',
        'mã sv',
        'student code',
        'student_code',
        'mssv',
        'ms sv',
      ],
      full_name: [
        'họ và tên',
        'họ tên',
        'full name',
        'full_name',
        'tên sinh viên',
        'tên sv',
        'name',
      ],
      ho_lot: [
        'họ lót',
        'họ đệm',
        'họ tên đệm',
        'họ và tên đệm',
        'họ và chữ đệm',
        'họ',
      ],
      ten: ['tên', 'tên sv', 'tên học sinh', 'tên sinh viên'],
      email: ['email', 'mail', 'thư điện tử'],
    };

    const matchesMapping = (cellVal: string, key: string): boolean => {
      const phrases =
        columnMappings && Array.isArray(columnMappings[key])
          ? columnMappings[key]
          : defaultMappings[key];
      const lowerVal = cellVal.toLowerCase();
      return phrases.some((phrase) => lowerVal.includes(phrase.toLowerCase()));
    };

    let studentCodeIdx = 0;
    let fullNameIdx = 1;
    let emailIdx = 2;
    let hoLotIdx = -1;
    let tenIdx = -1;

    if (headerRow) {
      let foundCode = false;
      let foundName = false;
      let foundEmail = false;
      let foundHoLot = false;
      let foundTen = false;

      for (let i = 0; i < headerRow.length; i++) {
        const colName = headerRow[i];
        if (!colName) continue;

        if (!foundCode && matchesMapping(colName, 'student_code')) {
          studentCodeIdx = i;
          foundCode = true;
        } else if (!foundName && matchesMapping(colName, 'full_name')) {
          fullNameIdx = i;
          foundName = true;
        } else if (!foundEmail && matchesMapping(colName, 'email')) {
          emailIdx = i;
          foundEmail = true;
        } else if (!foundHoLot && matchesMapping(colName, 'ho_lot')) {
          hoLotIdx = i;
          foundHoLot = true;
        } else if (!foundTen && matchesMapping(colName, 'ten')) {
          tenIdx = i;
          foundTen = true;
        }
      }
    }

    for (const row of rows) {
      const vals = row.values;
      const studentCode = String(vals[studentCodeIdx] ?? '')
        .trim()
        .toUpperCase();

      let fullName = '';
      if (hoLotIdx !== -1 && tenIdx !== -1) {
        const hoLot = String(vals[hoLotIdx] ?? '').trim();
        const ten = String(vals[tenIdx] ?? '').trim();
        fullName = `${hoLot} ${ten}`.trim();
      } else {
        fullName = String(vals[fullNameIdx] ?? '').trim();
      }

      if (!studentCode || !fullName) {
        warnings.push({
          rowNumber: row.rowNumber,
          code: 'MISSING_REQUIRED',
          message: 'Missing student_code or full_name',
          rawValue: JSON.stringify(vals),
        });
        continue;
      }

      if (seenStudentCodes.has(studentCode)) {
        warnings.push({
          rowNumber: row.rowNumber,
          code: 'DUPLICATE_STUDENT',
          message: `Duplicate student code: ${studentCode}`,
          rawValue: studentCode,
        });
        continue;
      }

      seenStudentCodes.add(studentCode);

      students.push({
        studentCode,
        fullName,
        email: vals[emailIdx] ? String(vals[emailIdx]).trim() : null,
      });
    }

    return { students, warnings };
  }
}
