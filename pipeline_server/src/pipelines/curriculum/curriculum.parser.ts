import { Injectable, Logger } from '@nestjs/common';
import { Workbook } from '@cj-tech-master/excelts';
import type {
  ParsedCurriculumCourse,
  CurriculumWarning,
} from './curriculum.types';

type RawRow = {
  rowNumber: number;
  values: (string | number | null)[];
};

/**
 * Parses curriculum data from Excel files or text input.
 *
 * Responsibilities:
 * - Read Excel worksheet
 * - Detect and validate headers
 * - Extract course rows
 */
@Injectable()
export class CurriculumParser {
  private readonly logger = new Logger(CurriculumParser.name);

  /**
   * Parse Excel buffer into raw rows.
   * TODO: Adjust column detection based on your Excel CTĐT format.
   */
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
      // Skip header row (first row)
      if (rowNumber === 1) return;

      const values = row.values as (string | number | null)[];
      // Remove first element (exceljs uses 1-indexed arrays)
      values.shift();

      rows.push({ rowNumber, values });
    });

    return rows;
  }

  /**
   * Parse text content into raw rows.
   * TODO: Adjust delimiter and format to match your text input.
   */
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

  /**
   * Map raw rows to curriculum courses.
   * TODO: Adjust column indices to match your Excel format.
   *
   * Expected columns (example):
   * [0] = course_code
   * [1] = course_name
   * [2] = credits
   * [3] = expected_semester
   * [4] = course_group
   * [5] = course_type
   */
  mapRows(rows: RawRow[]): {
    courses: ParsedCurriculumCourse[];
    warnings: CurriculumWarning[];
  } {
    const courses: ParsedCurriculumCourse[] = [];
    const warnings: CurriculumWarning[] = [];

    for (const row of rows) {
      const vals = row.values;
      const courseCode = String(vals[0] ?? '').trim();
      const courseName = String(vals[1] ?? '').trim();

      if (!courseCode || !courseName) {
        warnings.push({
          rowNumber: row.rowNumber,
          code: 'MISSING_REQUIRED',
          message: 'Missing course_code or course_name',
          rawValue: JSON.stringify(vals),
        });
        continue;
      }

      const credits = this.parseNumber(vals[2]);
      const expectedSemester = this.parseNumber(vals[3]);
      const courseGroup = vals[4] ? String(vals[4]).trim() : null;
      const courseTypeRaw = vals[5]
        ? String(vals[5]).trim().toUpperCase()
        : 'REQUIRED';

      courses.push({
        courseCode: courseCode.toUpperCase().replace(/\s+/g, ''),
        courseName,
        credits,
        expectedSemester,
        courseGroup,
        courseType: this.mapCourseType(courseTypeRaw),
        isRequired: courseTypeRaw === 'REQUIRED' || !courseTypeRaw,
      });
    }

    return { courses, warnings };
  }

  private mapCourseType(
    raw: string,
  ): 'REQUIRED' | 'ELECTIVE' | 'PE' | 'ENGLISH' | 'DEFENSE' | 'OTHER' {
    const map: Record<string, ParsedCurriculumCourse['courseType']> = {
      REQUIRED: 'REQUIRED',
      ELECTIVE: 'ELECTIVE',
      PE: 'PE',
      ENGLISH: 'ENGLISH',
      DEFENSE: 'DEFENSE',
    };
    return map[raw] ?? 'OTHER';
  }

  private parseNumber(val: unknown): number | null {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  }
}
