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

  async parseExcel(buffer: Buffer): Promise<RawRow[]> {
    const wb = new Workbook();
    await wb.xlsx.load(buffer);
    const ws = wb.worksheets[0];

    if (!ws) {
      this.logger.warn('No worksheet found in Excel file');
      return [];
    }

    const rows: RawRow[] = [];
    ws.eachRow((row, rowNumber) => {
      // Skip header row
      if (rowNumber === 1) return;

      const values = row.values as (string | number | null)[];
      values.shift(); // Remove 1-indexed empty first element
      rows.push({ rowNumber, values });
    });

    return rows;
  }

  parseText(text: string): RawRow[] {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return lines.map((line, idx) => ({
      rowNumber: idx + 1,
      values: line.split(',').map((col) => col.trim()),
    }));
  }

  mapRows(rows: RawRow[]): {
    students: ParsedClassRow[];
    warnings: ClassImportWarning[];
  } {
    const students: ParsedClassRow[] = [];
    const warnings: ClassImportWarning[] = [];
    const seenStudentCodes = new Set<string>();

    for (const row of rows) {
      const vals = row.values;
      const studentCode = String(vals[0] ?? '')
        .trim()
        .toUpperCase();
      const fullName = String(vals[1] ?? '').trim();

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
        email: vals[2] ? String(vals[2]).trim() : null,
      });
    }

    return { students, warnings };
  }
}
