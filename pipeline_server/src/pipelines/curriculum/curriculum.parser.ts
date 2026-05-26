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

function toPrimitiveString(v: unknown): string {
  if (v === null || v === undefined) {
    return '';
  }
  if (typeof v === 'string') {
    return v;
  }
  if (typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }
  return '';
}

/**
 * Safely extracts a string from any Excel CellValue (handling rich text, formula, and hyperlink objects).
 */
function getCellString(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (obj.result !== undefined && obj.result !== null) {
      return toPrimitiveString(obj.result);
    }
    if (obj.text !== undefined && obj.text !== null) {
      return toPrimitiveString(obj.text);
    }
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((t: unknown) => {
          if (t && typeof t === 'object') {
            const richObj = t as Record<string, unknown>;
            return richObj.text !== undefined && richObj.text !== null
              ? toPrimitiveString(richObj.text)
              : '';
          }
          return toPrimitiveString(t);
        })
        .join('');
    }
    return '';
  }
  return toPrimitiveString(val);
}

@Injectable()
export class CurriculumParser {
  private readonly logger = new Logger(CurriculumParser.name);

  /**
   * Parse Excel buffer directly into mapped courses and warnings.
   * Features dynamic column detection, multi-table support, merged-cell semester inheritance,
   * specialization/group detection, and clean Vietnamese term mapping.
   */
  async parseExcel(
    buffer: Buffer,
    targetSheetIdx?: number,
  ): Promise<{
    courses: ParsedCurriculumCourse[];
    warnings: CurriculumWarning[];
    sheets: string[];
    activeSheetIndex: number;
  }> {
    const wb = new Workbook();
    await wb.xlsx.load(buffer);

    const courses: ParsedCurriculumCourse[] = [];
    const warnings: CurriculumWarning[] = [];

    // Helper for header detection
    const detectHeaders = (rowValues: unknown[]) => {
      let courseCodeIdx = -1;
      let courseNameIdx = -1;
      let courseNamePriority = 0;
      let creditsIdx = -1;
      let semesterIdx = -1;
      let courseTypeIdx = -1;
      let prerequisiteIdx = -1;
      let corequisiteIdx = -1;

      for (let i = 0; i < rowValues.length; i++) {
        const val = getCellString(rowValues[i]).trim().toLowerCase();
        if (!val) {
          continue;
        }

        if (
          val.includes('mã học phần') ||
          val.includes('mã hp') ||
          val.includes('mã môn') ||
          val === 'code' ||
          val.includes('course code')
        ) {
          courseCodeIdx = i;
        } else if (
          val.includes('tên học phần') ||
          val.includes('tên hp') ||
          val.includes('tên môn') ||
          val === 'name' ||
          val.includes('course name') ||
          val.includes('tên môn học')
        ) {
          let priority = 2; // Default priority for standard match
          if (
            val.includes('tiếng việt') ||
            val.includes('việt') ||
            val.includes('vietnamese') ||
            val.includes('việt nam')
          ) {
            priority = 3; // Highest priority for explicit Vietnamese name
          } else if (
            val.includes('tiếng anh') ||
            val.includes('english') ||
            val.includes('en') ||
            val.includes('tiếng pháp') ||
            val.includes('tiếng đức')
          ) {
            priority = 1; // Lowest priority for foreign language names
          }

          if (priority > courseNamePriority) {
            courseNameIdx = i;
            courseNamePriority = priority;
          }
        } else if (
          val.includes('tín chỉ') ||
          val.includes('số tc') ||
          val === 'credits' ||
          val === 'stc' ||
          val.includes('credit')
        ) {
          creditsIdx = i;
        } else if (
          val.includes('phân bổ học kỳ') ||
          val.includes('học kỳ') ||
          val === 'semester' ||
          val === 'hk'
        ) {
          semesterIdx = i;
        } else if (
          val.includes('bắt buộc') ||
          val.includes('tự chọn') ||
          val === 'bb/tc' ||
          val.includes('req') ||
          val.includes('elec') ||
          val.includes('bắt buộc/tự chọn')
        ) {
          courseTypeIdx = i;
        } else if (
          val.includes('tiên quyết') ||
          val.includes('prereq') ||
          val.includes('đk tiên quyết')
        ) {
          prerequisiteIdx = i;
        } else if (
          val.includes('học trước') ||
          val.includes('coreq') ||
          val.includes('đk học trước')
        ) {
          corequisiteIdx = i;
        }
      }

      if (courseCodeIdx !== -1 && courseNameIdx !== -1) {
        return {
          courseCodeIdx,
          courseNameIdx,
          creditsIdx,
          semesterIdx,
          courseTypeIdx,
          prerequisiteIdx,
          corequisiteIdx,
        };
      }

      return null;
    };

    // Helper for semester extraction (e.g. from "HK241 1" or "HK 2" or "Học kỳ 3")
    const parseSemester = (val: unknown): number | null => {
      if (val === null || val === undefined || val === '') {
        return null;
      }
      if (typeof val === 'number') {
        return val;
      }

      const str = getCellString(val).trim();
      if (!str) {
        return null;
      }

      const digits = str.match(/\d+/g);
      if (!digits || digits.length === 0) {
        return null;
      }

      const nums = digits.map(Number);
      if (nums.length === 1) {
        return nums[0];
      }

      // If multiple numbers exist (e.g. 241 and 1 in "HK241 1")
      // Find the one that is a standard semester number (1 to 12)
      const semNum = nums.find((n) => n >= 1 && n <= 12);
      if (semNum !== undefined) {
        return semNum;
      }

      return nums[0];
    };

    const sheets = wb.worksheets
      .filter((w) => w !== undefined && w !== null)
      .map((w) => w.name || 'Sheet');
    const activeSheetIndex = Math.min(
      targetSheetIdx ?? 0,
      Math.max(0, sheets.length - 1),
    );

    // Process only the active worksheet
    const ws = wb.worksheets[activeSheetIndex];
    if (ws) {
      let currentHeaderConfig: ReturnType<typeof detectHeaders> = null;
      let currentSemester: number | null = null;
      let currentCourseGroup: string | null = null;

      ws.eachRow((row, rowNumber) => {
        const rawValues = row.values;
        const vals: unknown[] = [];

        if (Array.isArray(rawValues)) {
          const maxCols = Math.max(rawValues.length, 25);
          for (let i = 1; i < maxCols; i++) {
            const val = rawValues[i];
            vals.push(val !== undefined ? val : null);
          }
        } else if (rawValues && typeof rawValues === 'object') {
          const rawObj = rawValues as Record<number | string, unknown>;
          const maxCols = 25;
          for (let i = 1; i < maxCols; i++) {
            const val = rawObj[i];
            vals.push(val !== undefined ? val : null);
          }
        }

        if (vals.length === 0 || vals.every((v) => v === null || v === '')) {
          return; // Skip empty row
        }

        // Try to detect a new header config in this row
        const detected = detectHeaders(vals);
        if (detected) {
          currentHeaderConfig = detected;
          return; // Skip header row itself
        }

        // Skip rows before any header is discovered
        if (!currentHeaderConfig) {
          return;
        }

        const {
          courseCodeIdx,
          courseNameIdx,
          creditsIdx,
          semesterIdx,
          courseTypeIdx,
        } = currentHeaderConfig;

        const rawCode = vals[courseCodeIdx];
        const rawName = vals[courseNameIdx];

        const code = getCellString(rawCode).trim();
        const name = getCellString(rawName).trim();

        if (!code && !name) {
          return; // Skip empty fields
        }

        // Group/Specialization/Subheader detection
        const isGroupRow =
          !code ||
          code.toLowerCase().includes('chuyên ngành') ||
          code.toLowerCase().includes('chọn') ||
          code.toLowerCase().includes('khối') ||
          code.toLowerCase().includes('chương trình');

        if (isGroupRow) {
          const groupText = name || code;
          if (groupText) {
            currentCourseGroup = groupText;
          }
          return;
        }

        // Skip repeated headers
        if (
          code.toLowerCase().includes('mã học phần') ||
          code.toLowerCase().includes('mã hp') ||
          code.toLowerCase() === 'code'
        ) {
          return;
        }

        // Parse & Inherit Semester (handles merged cells)
        if (
          semesterIdx !== -1 &&
          vals[semesterIdx] !== null &&
          vals[semesterIdx] !== ''
        ) {
          const semVal = parseSemester(vals[semesterIdx]);
          if (semVal !== null) {
            currentSemester = semVal;
          }
        }

        // Parse Credits
        const credits =
          creditsIdx !== -1 ? this.parseNumber(vals[creditsIdx]) : null;

        // Parse Course Type (REQUIRED / ELECTIVE)
        const courseTypeRaw =
          courseTypeIdx !== -1 && vals[courseTypeIdx] !== null
            ? getCellString(vals[courseTypeIdx]).trim().toUpperCase()
            : 'REQUIRED';

        let courseType: ParsedCurriculumCourse['courseType'] = 'REQUIRED';
        if (
          courseTypeRaw === 'TC' ||
          courseTypeRaw.includes('TỰ CHỌN') ||
          courseTypeRaw === 'ELECTIVE'
        ) {
          courseType = 'ELECTIVE';
        } else if (
          courseTypeRaw === 'BB' ||
          courseTypeRaw.includes('BẤT BUỘC') ||
          courseTypeRaw === 'REQUIRED'
        ) {
          courseType = 'REQUIRED';
        } else if (
          courseTypeRaw.includes('GDTC') ||
          courseTypeRaw === 'PE' ||
          courseTypeRaw.includes('THỂ DỤC') ||
          courseTypeRaw.includes('THỂ CHẤT')
        ) {
          courseType = 'PE';
        } else if (
          courseTypeRaw.includes('ANH VĂN') ||
          courseTypeRaw.includes('TIẾNG ANH') ||
          courseTypeRaw === 'ENGLISH'
        ) {
          courseType = 'ENGLISH';
        } else if (
          courseTypeRaw.includes('GDQP') ||
          courseTypeRaw.includes('QUÂN SỰ') ||
          courseTypeRaw === 'DEFENSE'
        ) {
          courseType = 'DEFENSE';
        } else {
          courseType = this.mapCourseType(courseTypeRaw);
        }

        const cleanCode = code.toUpperCase().replace(/\s+/g, '');
        if (cleanCode.length >= 3) {
          courses.push({
            courseCode: cleanCode,
            courseName: name,
            credits,
            expectedSemester: currentSemester,
            courseGroup: currentCourseGroup,
            courseType,
            isRequired:
              courseType === 'REQUIRED' ||
              courseType === 'ENGLISH' ||
              courseType === 'DEFENSE',
          });
        } else {
          warnings.push({
            rowNumber: rowNumber,
            code: 'INVALID_CODE',
            message: `Skipped row with suspicious/invalid course code: "${code}"`,
            rawValue: JSON.stringify(vals),
          });
        }
      });
    }

    return { courses, warnings, sheets, activeSheetIndex };
  }

  /**
   * Parse text content into raw rows.
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
   * Map raw rows to curriculum courses (for text input csv).
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
    if (val === null || val === undefined || val === '') {
      return null;
    }
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  }
}
