import { Injectable, Logger } from '@nestjs/common';
import { Workbook } from '@cj-tech-master/excelts';
import type {
  ParsedCurriculumCourse,
  CurriculumWarning,
} from './curriculum.types';
import { TableHeaders, RawRow } from './parser/curriculum-parser.types';
import {
  getCellString,
  parseNumber,
  parseSemester,
  parseTTValue,
} from './parser/curriculum-parser.utils';
import { resolveCourseType } from './parser/course-type.resolver';
import { detectHeaders } from './header.detector';

@Injectable()
export class CurriculumParser {
  private readonly logger = new Logger(CurriculumParser.name);

  async parseExcel(
    buffer: Buffer,
    targetSheetIdx?: number,
    columnMappings?: Record<string, string[]>,
    courseTypeMappings?: Record<string, string[]>,
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

    const sheets = wb.worksheets
      .filter((w) => w !== undefined && w !== null)
      .map((w) => w.name || 'Sheet');
    const activeSheetIndex = Math.min(
      targetSheetIdx ?? 0,
      Math.max(0, sheets.length - 1),
    );
    const ws = wb.worksheets[activeSheetIndex];

    if (ws) {
      let currentHeaderConfig: {
        t1: TableHeaders;
        t2: TableHeaders | null;
      } | null = null;
      let t1Semester: number | null = null,
        t1OrganizingSemester: string | null = null,
        t1CourseGroup: string | null = null,
        t1KnowledgeBlock: string | null = null;
      let t2Semester: number | null = null,
        t2OrganizingSemester: string | null = null,
        t2CourseGroup: string | null = null,
        t2KnowledgeBlock: string | null = null;

      ws.eachRow((row, rowNumber) => {
        const rawValues = row.values;
        const vals: unknown[] = [];

        if (Array.isArray(rawValues)) {
          for (let i = 1; i < Math.max(rawValues.length, 30); i++)
            vals.push(rawValues[i] !== undefined ? rawValues[i] : null);
        } else if (rawValues && typeof rawValues === 'object') {
          const rawObj = rawValues as Record<number | string, unknown>;
          for (let i = 1; i < 30; i++)
            vals.push(rawObj[i] !== undefined ? rawObj[i] : null);
        }

        if (vals.length === 0 || vals.every((v) => v === null || v === ''))
          return;

        const detected = detectHeaders(vals, columnMappings);
        if (detected) {
          currentHeaderConfig = detected;
          return;
        }

        if (!currentHeaderConfig) return;

        const parseTableCourse = (
          config: TableHeaders | null,
          isTable2: boolean,
        ): ParsedCurriculumCourse | null => {
          if (!config) return null;

          const code = getCellString(vals[config.courseCodeIdx]).trim();
          const name = getCellString(vals[config.courseNameIdx]).trim();

          if (!code && !name) return null;

          let tableSemester = isTable2 ? t2Semester : t1Semester;
          let tableOrganizingSemester = isTable2
            ? t2OrganizingSemester
            : t1OrganizingSemester;
          const tableCourseGroup = isTable2 ? t2CourseGroup : t1CourseGroup;
          const tableKnowledgeBlock = isTable2
            ? t2KnowledgeBlock
            : t1KnowledgeBlock;

          const isGroupRow =
            !code || /chuyên ngành|chọn|khối|chương trình/i.test(code);

          if (isGroupRow) {
            const groupText = name || code;
            if (groupText) {
              if (isTable2) t2CourseGroup = groupText;
              else t1CourseGroup = groupText;
            }
            // Also capture knowledge block from group/section header row
            const kbText = name || code;
            if (kbText) {
              if (isTable2) t2KnowledgeBlock = kbText;
              else t1KnowledgeBlock = kbText;
            }
            return null;
          }

          if (/mã học phần|mã hp|code/i.test(code)) return null;

          if (
            config.semesterIdx !== -1 &&
            vals[config.semesterIdx] !== null &&
            vals[config.semesterIdx] !== ''
          ) {
            const semVal = parseSemester(vals[config.semesterIdx]);
            if (semVal !== null) {
              if (isTable2) {
                t2Semester = semVal;
                tableSemester = semVal;
              } else {
                t1Semester = semVal;
                tableSemester = semVal;
              }
            }

            const selfTTParsed = parseTTValue(vals[config.semesterIdx]);
            if (selfTTParsed.organizingSem) {
              if (isTable2) {
                t2OrganizingSemester = selfTTParsed.organizingSem;
                tableOrganizingSemester = selfTTParsed.organizingSem;
              } else {
                t1OrganizingSemester = selfTTParsed.organizingSem;
                tableOrganizingSemester = selfTTParsed.organizingSem;
              }
            }
            if (selfTTParsed.expectedSem !== null) {
              if (isTable2) {
                t2Semester = selfTTParsed.expectedSem;
                tableSemester = selfTTParsed.expectedSem;
              } else {
                t1Semester = selfTTParsed.expectedSem;
                tableSemester = selfTTParsed.expectedSem;
              }
            }
          }

          let expectedSemesterRaw: number | null = null;
          if (config.semesterIdx > 0 && vals[config.semesterIdx - 1] !== null) {
            const ttParsed = parseTTValue(vals[config.semesterIdx - 1]);
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
              if (isTable2) {
                t2Semester = ttParsed.expectedSem;
                tableSemester = ttParsed.expectedSem;
              } else {
                t1Semester = ttParsed.expectedSem;
                tableSemester = ttParsed.expectedSem;
              }
            }
          }

          const cleanCode = code.toUpperCase().replace(/\s+/g, '');
          if (cleanCode.length >= 3) {
            const courseTypeRaw =
              config.courseTypeIdx !== -1 && vals[config.courseTypeIdx] !== null
                ? getCellString(vals[config.courseTypeIdx]).trim()
                : '';

            // Removed the unnecessary 'as' assertion here
            const courseType = resolveCourseType(
              name,
              code,
              courseTypeRaw,
              courseTypeMappings,
            );

            let finalGroup = tableCourseGroup;
            if (courseType === 'PE' || courseType === 'DEFENSE')
              finalGroup = 'Giáo dục thể chất và Giáo dục quốc phòng';

            const requiredTypes: ParsedCurriculumCourse['courseType'][] = [
              'REQUIRED',
              'ENGLISH',
              'DEFENSE',
              'PE',
            ];

            return {
              courseCode: cleanCode,
              courseName: name,
              credits:
                config.creditsIdx !== -1
                  ? parseNumber(vals[config.creditsIdx])
                  : null,
              theoryHours:
                config.theoryHoursIdx !== -1
                  ? parseNumber(vals[config.theoryHoursIdx])
                  : null,
              practiceHours:
                config.practiceHoursIdx !== -1
                  ? parseNumber(vals[config.practiceHoursIdx])
                  : null,
              projectHours:
                config.projectHoursIdx !== -1
                  ? parseNumber(vals[config.projectHoursIdx])
                  : null,
              internshipHours:
                config.internshipHoursIdx !== -1
                  ? parseNumber(vals[config.internshipHoursIdx])
                  : null,
              expectedSemester:
                expectedSemesterRaw !== null
                  ? expectedSemesterRaw
                  : tableSemester,
              courseGroup: finalGroup,
              courseType,
              isRequired: requiredTypes.includes(courseType),
              prerequisite:
                config.prerequisiteIdx !== -1 &&
                vals[config.prerequisiteIdx] !== null
                  ? getCellString(vals[config.prerequisiteIdx]).trim() || null
                  : null,
              corequisite:
                config.corequisiteIdx !== -1 &&
                vals[config.corequisiteIdx] !== null
                  ? getCellString(vals[config.corequisiteIdx]).trim() || null
                  : null,
              organizingSemester:
                tableOrganizingSemester ||
                (tableSemester ? String(tableSemester) : null),
              knowledgeBlock:
                config.knowledgeBlockIdx !== -1 &&
                vals[config.knowledgeBlockIdx] !== null
                  ? getCellString(vals[config.knowledgeBlockIdx]).trim() ||
                    tableKnowledgeBlock
                  : tableKnowledgeBlock,
            };
          } else {
            warnings.push({
              rowNumber,
              code: 'INVALID_CODE',
              message: `Skipped row with suspicious/invalid course code: "${code}"`,
              rawValue: JSON.stringify(vals),
            });
            return null;
          }
        };

        const c1 = parseTableCourse(currentHeaderConfig.t1, false);
        if (c1) courses.push(c1);

        const c2 = parseTableCourse(currentHeaderConfig.t2, true);
        if (c2) courses.push(c2);
      });
    }

    return { courses, warnings, sheets, activeSheetIndex };
  }

  parseText(text: string): RawRow[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => ({
        rowNumber: idx + 1,
        values: line.split(',').map((col) => col.trim()),
      }));
  }

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

      const cleanCode = courseCode.toUpperCase().replace(/\s+/g, '');
      const courseTypeRaw = vals[5]
        ? String(vals[5]).trim().toUpperCase()
        : 'REQUIRED';

      // Removed the unnecessary 'as' assertion here as well
      const courseType = resolveCourseType(
        courseName,
        cleanCode.toLowerCase(),
        courseTypeRaw,
      );

      let finalGroup = vals[4] ? String(vals[4]).trim() : null;
      if (courseType === 'PE' || courseType === 'DEFENSE')
        finalGroup = 'Giáo dục thể chất và Giáo dục quốc phòng';

      const requiredTypes: ParsedCurriculumCourse['courseType'][] = [
        'REQUIRED',
        'ENGLISH',
        'DEFENSE',
        'PE',
      ];

      const mappedCourse: ParsedCurriculumCourse = {
        courseCode: cleanCode,
        courseName,
        credits: parseNumber(vals[2]),
        theoryHours: null,
        practiceHours: null,
        projectHours: null,
        internshipHours: null,
        expectedSemester: parseNumber(vals[3]),
        courseGroup: finalGroup,
        courseType,
        isRequired: requiredTypes.includes(courseType),
        prerequisite: null,
        corequisite: null,
        organizingSemester: null,
      };

      courses.push(mappedCourse);
    }
    return { courses, warnings };
  }
}
