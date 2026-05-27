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

    // Helper to detect headers for a specific table slice
    const detectTableHeaders = (sliceValues: unknown[], offset: number) => {
      let courseCodeIdx = -1;
      let courseNameIdx = -1;
      let courseNamePriority = 0;
      let creditsIdx = -1;
      let theoryHoursIdx = -1;
      let practiceHoursIdx = -1;
      let projectHoursIdx = -1;
      let internshipHoursIdx = -1;
      let semesterIdx = -1;
      let courseTypeIdx = -1;
      let prerequisiteIdx = -1;
      let corequisiteIdx = -1;
      let organizingSemesterIdx = -1;

      for (let i = 0; i < sliceValues.length; i++) {
        const val = getCellString(sliceValues[i]).trim().toLowerCase();
        if (!val) {
          continue;
        }

        const actualIdx = i + offset;

        if (
          val.includes('mã học phần') ||
          val.includes('mã hp') ||
          val.includes('mã môn') ||
          val === 'code' ||
          val.includes('course code')
        ) {
          courseCodeIdx = actualIdx;
        } else if (
          val.includes('tên học phần') ||
          val.includes('tên hp') ||
          val.includes('tên môn') ||
          val === 'name' ||
          val.includes('course name') ||
          val.includes('tên môn học')
        ) {
          let priority = 2;
          if (
            val.includes('tiếng việt') ||
            val.includes('việt') ||
            val.includes('vietnamese') ||
            val.includes('việt nam')
          ) {
            priority = 3;
          } else if (
            val.includes('tiếng anh') ||
            val.includes('english') ||
            val.includes('en')
          ) {
            priority = 1;
          }

          if (priority > courseNamePriority) {
            courseNameIdx = actualIdx;
            courseNamePriority = priority;
          }
        } else if (
          val.includes('tín chỉ') ||
          val.includes('số tc') ||
          val === 'credits' ||
          val === 'stc' ||
          val.includes('credit')
        ) {
          creditsIdx = actualIdx;
        } else if (
          (val === 'lt' || val === 'lý thuyết' || val === 'theory') &&
          !val.includes('tên')
        ) {
          theoryHoursIdx = actualIdx;
        } else if (
          (val === 'th' || val === 'thực hành' || val === 'practice') &&
          !val.includes('tên')
        ) {
          practiceHoursIdx = actualIdx;
        } else if (
          (val === 'đa' || val === 'đồ án' || val === 'project') &&
          !val.includes('tên')
        ) {
          projectHoursIdx = actualIdx;
        } else if (
          (val === 'tt' || val === 'thực tập' || val === 'internship') &&
          !val.includes('tên')
        ) {
          internshipHoursIdx = actualIdx;
        } else if (
          val.includes('phân bổ học kỳ') ||
          val.includes('học kỳ') ||
          val === 'semester' ||
          val === 'hk'
        ) {
          semesterIdx = actualIdx;
        } else if (
          val.includes('bắt buộc') ||
          val.includes('tự chọn') ||
          val === 'bb/tc' ||
          val.includes('req') ||
          val.includes('elec') ||
          val.includes('bắt buộc/tự chọn')
        ) {
          courseTypeIdx = actualIdx;
        } else if (
          val.includes('tiên quyết') ||
          val.includes('prereq') ||
          val.includes('đk tiên quyết') ||
          val.includes('điều kiện tiên quyết')
        ) {
          prerequisiteIdx = actualIdx;
        } else if (
          val.includes('học trước') ||
          val.includes('coreq') ||
          val.includes('đk học trước') ||
          val.includes('điều kiện học trước')
        ) {
          corequisiteIdx = actualIdx;
        } else if (
          val.includes('hk tổ chức') ||
          val.includes('học kỳ tổ chức') ||
          val.includes('organizing semester')
        ) {
          organizingSemesterIdx = actualIdx;
        }
      }

      if (courseCodeIdx !== -1 && courseNameIdx !== -1) {
        return {
          courseCodeIdx,
          courseNameIdx,
          creditsIdx,
          theoryHoursIdx,
          practiceHoursIdx,
          projectHoursIdx,
          internshipHoursIdx,
          semesterIdx,
          courseTypeIdx,
          prerequisiteIdx,
          corequisiteIdx,
          organizingSemesterIdx,
        };
      }

      return null;
    };

    // Helper for header detection across multiple side-by-side tables
    const detectHeaders = (rowValues: unknown[]) => {
      const t1 = detectTableHeaders(rowValues.slice(0, 12), 0);
      const t2 = detectTableHeaders(rowValues.slice(12), 12);

      if (t1) {
        return { t1, t2 };
      }
      return null;
    };

    // Helper for semester extraction
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

      const semNum = nums.find((n) => n >= 1 && n <= 12);
      if (semNum !== undefined) {
        return semNum;
      }

      return nums[0];
    };

    // Helper for TT (serial number / organizing semester) extraction
    const parseTTValue = (
      val: unknown,
    ): { organizingSem: string | null; expectedSem: number | null } => {
      if (val === null || val === undefined) {
        return { organizingSem: null, expectedSem: null };
      }
      const str = getCellString(val).trim();
      if (!str) {
        return { organizingSem: null, expectedSem: null };
      }

      // Split by newline or spaces
      const parts = str
        .split(/[\s\n\r]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      let organizingSem: string | null = null;
      let expectedSem: number | null = null;

      for (const part of parts) {
        if (/HK\d+/i.test(part)) {
          organizingSem = part.toUpperCase();
        } else {
          const num = Number(part);
          if (Number.isFinite(num)) {
            expectedSem = num;
          }
        }
      }

      // Fallback: if we didn't find organizingSem but the whole string matches HK\d+
      if (!organizingSem) {
        const hkMatch = str.match(/HK\d+/i);
        if (hkMatch) {
          organizingSem = hkMatch[0].toUpperCase();
        }
      }

      // Fallback: if expectedSem is still null, look for a number in the parts or in the string
      if (expectedSem === null) {
        const cleaned = str.replace(/HK\d+/i, '').trim();
        const numMatch = cleaned.match(/\d+/);
        if (numMatch) {
          expectedSem = Number(numMatch[0]);
        }
      }

      return { organizingSem, expectedSem };
    };

    const sheets = wb.worksheets
      .filter((w) => w !== undefined && w !== null)
      .map((w) => w.name || 'Sheet');
    const activeSheetIndex = Math.min(
      targetSheetIdx ?? 0,
      Math.max(0, sheets.length - 1),
    );

    const ws = wb.worksheets[activeSheetIndex];
    if (ws) {
      let currentHeaderConfig: { t1: any; t2: any | null } | null = null;
      
      // Independent states for Table 1 and Table 2
      let t1Semester: number | null = null;
      let t1OrganizingSemester: string | null = null;
      let t1CourseGroup: string | null = null;

      let t2Semester: number | null = null;
      let t2OrganizingSemester: string | null = null;
      let t2CourseGroup: string | null = null;

      ws.eachRow((row, rowNumber) => {
        const rawValues = row.values;
        const vals: unknown[] = [];

        if (Array.isArray(rawValues)) {
          const maxCols = Math.max(rawValues.length, 30);
          for (let i = 1; i < maxCols; i++) {
            const val = rawValues[i];
            vals.push(val !== undefined ? val : null);
          }
        } else if (rawValues && typeof rawValues === 'object') {
          const rawObj = rawValues as Record<number | string, unknown>;
          const maxCols = 30;
          for (let i = 1; i < maxCols; i++) {
            const val = rawObj[i];
            vals.push(val !== undefined ? val : null);
          }
        }

        if (vals.length === 0 || vals.every((v) => v === null || v === '')) {
          return;
        }

        const detected = detectHeaders(vals);
        if (detected) {
          currentHeaderConfig = detected;
          return;
        }

        if (!currentHeaderConfig) {
          return;
        }

        const parseTableCourse = (config: any, isTable2: boolean) => {
          if (!config) return null;

          const {
            courseCodeIdx,
            courseNameIdx,
            creditsIdx,
            theoryHoursIdx,
            practiceHoursIdx,
            projectHoursIdx,
            internshipHoursIdx,
            semesterIdx,
            courseTypeIdx,
            prerequisiteIdx,
            corequisiteIdx,
          } = config;

          const rawCode = vals[courseCodeIdx];
          const rawName = vals[courseNameIdx];

          const code = getCellString(rawCode).trim();
          const name = getCellString(rawName).trim();

          if (!code && !name) {
            return null;
          }

          // Determine current state variables based on table side (Table 1 vs Table 2)
          let tableSemester = isTable2 ? t2Semester : t1Semester;
          let tableOrganizingSemester = isTable2 ? t2OrganizingSemester : t1OrganizingSemester;
          let tableCourseGroup = isTable2 ? t2CourseGroup : t1CourseGroup;

          const isGroupRow =
            !code ||
            code.toLowerCase().includes('chuyên ngành') ||
            code.toLowerCase().includes('chọn') ||
            code.toLowerCase().includes('khối') ||
            code.toLowerCase().includes('chương trình');

          if (isGroupRow) {
            const groupText = name || code;
            if (groupText) {
              if (isTable2) {
                t2CourseGroup = groupText;
              } else {
                t1CourseGroup = groupText;
              }
            }
            return null;
          }

          if (
            code.toLowerCase().includes('mã học phần') ||
            code.toLowerCase().includes('mã hp') ||
            code.toLowerCase() === 'code'
          ) {
            return null;
          }

          if (
            semesterIdx !== -1 &&
            vals[semesterIdx] !== null &&
            vals[semesterIdx] !== ''
          ) {
            const semVal = parseSemester(vals[semesterIdx]);
            if (semVal !== null) {
              if (isTable2) {
                t2Semester = semVal;
                tableSemester = semVal;
              } else {
                t1Semester = semVal;
                tableSemester = semVal;
              }
            }
          }

          const credits =
            creditsIdx !== -1 ? this.parseNumber(vals[creditsIdx]) : null;

          const courseTypeRaw =
            courseTypeIdx !== -1 && vals[courseTypeIdx] !== null
              ? getCellString(vals[courseTypeIdx]).trim().toUpperCase()
              : 'REQUIRED';

          const lowerName = name.toLowerCase();
          const lowerCode = code.toLowerCase();
          let isPE = false;
          let isDefense = false;

          if (
            lowerName.includes('thể chất') ||
            lowerName.includes('thể dục') ||
            lowerCode.includes('gdtc') ||
            lowerCode.startsWith('dgt')
          ) {
            isPE = true;
          } else if (
            lowerName.includes('quốc phòng') ||
            lowerName.includes('quân sự') ||
            lowerCode.includes('gdqp') ||
            lowerCode.startsWith('nad') ||
            lowerName.includes('an ninh')
          ) {
            isDefense = true;
          }

          let courseType: ParsedCurriculumCourse['courseType'] = 'REQUIRED';
          if (isPE) {
            courseType = 'PE';
          } else if (isDefense) {
            courseType = 'DEFENSE';
          } else if (
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

          const theoryHours =
            theoryHoursIdx !== -1 ? this.parseNumber(vals[theoryHoursIdx]) : null;
          const practiceHours =
            practiceHoursIdx !== -1
              ? this.parseNumber(vals[practiceHoursIdx])
              : null;
          const projectHours =
            projectHoursIdx !== -1
              ? this.parseNumber(vals[projectHoursIdx])
              : null;
          const internshipHours =
            internshipHoursIdx !== -1
              ? this.parseNumber(vals[internshipHoursIdx])
              : null;

          const prerequisite =
            prerequisiteIdx !== -1 && vals[prerequisiteIdx] !== null
              ? getCellString(vals[prerequisiteIdx]).trim() || null
              : null;
          const corequisite =
            corequisiteIdx !== -1 && vals[corequisiteIdx] !== null
              ? getCellString(vals[corequisiteIdx]).trim() || null
              : null;

          // Extract organizing semester & expected semester from TT column (semesterIdx - 1)
          let expectedSemesterRaw: number | null = null;
          if (semesterIdx !== -1 && semesterIdx > 0 && vals[semesterIdx - 1] !== null) {
            const ttParsed = parseTTValue(vals[semesterIdx - 1]);
            if (ttParsed.organizingSem) {
              if (isTable2) {
                t2OrganizingSemester = ttParsed.organizingSem;
                tableOrganizingSemester = ttParsed.organizingSem;
              } else {
                t1OrganizingSemester = ttParsed.organizingSem;
                tableOrganizingSemester = ttParsed.organizingSem;
              }
            }
            if (ttParsed.expectedSem !== null) {
              expectedSemesterRaw = ttParsed.expectedSem;
            }
          }

          const expectedSemester = expectedSemesterRaw !== null ? expectedSemesterRaw : tableSemester;
          const organizingSemester = tableOrganizingSemester || (tableSemester ? String(tableSemester) : null);

          const cleanCode = code.toUpperCase().replace(/\s+/g, '');
          if (cleanCode.length >= 3) {
            let finalGroup = tableCourseGroup;
            if (courseType === 'PE' || courseType === 'DEFENSE') {
              finalGroup = 'Giáo dục thể chất và Giáo dục quốc phòng';
            }

            return {
              courseCode: cleanCode,
              courseName: name,
              credits,
              theoryHours,
              practiceHours,
              projectHours,
              internshipHours,
              expectedSemester,
              courseGroup: finalGroup,
              courseType,
              isRequired:
                courseType === 'REQUIRED' ||
                courseType === 'ENGLISH' ||
                courseType === 'DEFENSE' ||
                courseType === 'PE',
              prerequisite,
              corequisite,
              organizingSemester,
            };
          } else {
            warnings.push({
              rowNumber: rowNumber,
              code: 'INVALID_CODE',
              message: `Skipped row with suspicious/invalid course code: "${code}"`,
              rawValue: JSON.stringify(vals),
            });
            return null;
          }
        };

        const c1 = parseTableCourse(currentHeaderConfig.t1, false);
        if (c1) {
          courses.push(c1);
        }

        const c2 = parseTableCourse(currentHeaderConfig.t2, true);
        if (c2) {
          courses.push(c2);
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

      const cleanCode = courseCode.toUpperCase().replace(/\s+/g, '');
      const lowerName = courseName.toLowerCase();
      const lowerCode = cleanCode.toLowerCase();
      let isPE = false;
      let isDefense = false;

      if (
        lowerName.includes('thể chất') ||
        lowerName.includes('thể dục') ||
        lowerCode.includes('gdtc') ||
        lowerCode.startsWith('dgt')
      ) {
        isPE = true;
      } else if (
        lowerName.includes('quốc phòng') ||
        lowerName.includes('quân sự') ||
        lowerCode.includes('gdqp') ||
        lowerCode.startsWith('nad') ||
        lowerName.includes('an ninh')
      ) {
        isDefense = true;
      }

      let courseType = this.mapCourseType(courseTypeRaw);
      if (isPE) {
        courseType = 'PE';
      } else if (isDefense) {
        courseType = 'DEFENSE';
      }

      let finalGroup = courseGroup;
      if (isPE || isDefense) {
        finalGroup = 'Giáo dục thể chất và Giáo dục quốc phòng';
      }

      courses.push({
        courseCode: cleanCode,
        courseName,
        credits,
        theoryHours: null,
        practiceHours: null,
        projectHours: null,
        internshipHours: null,
        expectedSemester,
        courseGroup: finalGroup,
        courseType,
        isRequired:
          courseType === 'REQUIRED' ||
          courseType === 'ENGLISH' ||
          courseType === 'DEFENSE' ||
          courseType === 'PE',
        prerequisite: null,
        corequisite: null,
        organizingSemester: null,
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
