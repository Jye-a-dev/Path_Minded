import type {
  ParsedCurriculumCourse,
  CurriculumWarning,
} from '../curriculum.types';
import type { TableHeaders, TableState } from './curriculum-parser.types';
import {
  getCellString,
  parseNumber,
  parseSemester,
  parseTTValue,
} from './curriculum-parser.utils';
import { resolveCourseType } from './course-type.resolver';

export function isGroupRowHeader(code: string): boolean {
  return (
    !code ||
    /^(I{1,3}|IV|V?I{0,3}|IX|X{1,3}|XI{0,3}|XIV|XV?)$/i.test(code.trim()) ||
    /^\d+(\.\d+)*$/.test(code.trim()) ||
    /chuyên ngành|chọn|khối|chương trình|kiến thức|nhóm môn|đại cương|cơ sở/i.test(
      code,
    )
  );
}

export function parseTableCourse(
  vals: unknown[],
  config: TableHeaders | null,
  isTable2: boolean,
  state: TableState,
  rowNumber: number,
  warnings: CurriculumWarning[],
  courseTypeMappings?: Record<string, string[]>,
): ParsedCurriculumCourse | null {
  if (!config) return null;

  const code = getCellString(vals[config.courseCodeIdx]).trim();
  const name = getCellString(vals[config.courseNameIdx]).trim();

  if (!code && !name) return null;

  if (isGroupRowHeader(code)) {
    const groupText = name || code;
    if (groupText) {
      state.courseGroup = groupText;
      state.knowledgeBlock = groupText;
    }
    return null;
  }

  if (/mã học phần|mã hp|code/i.test(code)) return null;

  let parsedYear: number | null = null;
  if (
    config.yearIdx !== -1 &&
    vals[config.yearIdx] !== null &&
    vals[config.yearIdx] !== ''
  ) {
    parsedYear = parseNumber(vals[config.yearIdx]);
  }

  if (
    config.semesterIdx !== -1 &&
    vals[config.semesterIdx] !== null &&
    vals[config.semesterIdx] !== ''
  ) {
    const semVal = parseSemester(vals[config.semesterIdx]);
    if (semVal !== null) {
      state.semester = semVal;
    }

    const selfTTParsed = parseTTValue(vals[config.semesterIdx]);
    if (selfTTParsed.organizingSem) {
      state.organizingSemester = selfTTParsed.organizingSem;
    }
    if (selfTTParsed.expectedSem !== null) {
      state.semester = selfTTParsed.expectedSem;
    }
  }

  let expectedSemesterRaw: number | null = null;
  if (config.semesterIdx > 0) {
    // Scan columns to the left to find organizing semester (like HK241)
    for (let leftIdx = config.semesterIdx - 1; leftIdx >= 0; leftIdx--) {
      if (vals[leftIdx] !== null && vals[leftIdx] !== '') {
        const ttParsed = parseTTValue(vals[leftIdx]);
        if (ttParsed.organizingSem) {
          state.organizingSemester = ttParsed.organizingSem;
          break; // Stop at first column containing valid organizing semester
        }
      }
    }

    // Check immediate left column for expected semester
    if (
      vals[config.semesterIdx - 1] !== null &&
      vals[config.semesterIdx - 1] !== ''
    ) {
      const ttParsed = parseTTValue(vals[config.semesterIdx - 1]);
      if (ttParsed.expectedSem !== null) {
        expectedSemesterRaw = ttParsed.expectedSem;
        state.semester = ttParsed.expectedSem;
      }
    }
  }

  // Calculate absolute expected semester based on Year and Semester (if within 1-3)
  if (
    parsedYear !== null &&
    parsedYear >= 1 &&
    parsedYear <= 6 &&
    state.semester !== null &&
    state.semester >= 1 &&
    state.semester <= 3
  ) {
    state.semester = (parsedYear - 1) * 3 + state.semester;
  }

  const cleanCode = code.toUpperCase().replace(/\s+/g, '');
  if (cleanCode.length >= 3) {
    const courseTypeRaw =
      config.courseTypeIdx !== -1 && vals[config.courseTypeIdx] !== null
        ? getCellString(vals[config.courseTypeIdx]).trim()
        : '';

    const courseType = resolveCourseType(
      name,
      code,
      courseTypeRaw,
      courseTypeMappings,
    );

    let finalGroup = state.courseGroup;
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
        config.creditsIdx !== -1 ? parseNumber(vals[config.creditsIdx]) : null,
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
        expectedSemesterRaw !== null ? expectedSemesterRaw : state.semester,
      courseGroup: finalGroup,
      courseType,
      isRequired: requiredTypes.includes(courseType),
      prerequisite:
        config.prerequisiteIdx !== -1 && vals[config.prerequisiteIdx] !== null
          ? getCellString(vals[config.prerequisiteIdx]).trim() || null
          : null,
      corequisite:
        config.corequisiteIdx !== -1 && vals[config.corequisiteIdx] !== null
          ? getCellString(vals[config.corequisiteIdx]).trim() || null
          : null,
      organizingSemester:
        state.organizingSemester ||
        (state.semester ? String(state.semester) : null),
      knowledgeBlock:
        config.knowledgeBlockIdx !== -1 &&
        vals[config.knowledgeBlockIdx] !== null
          ? getCellString(vals[config.knowledgeBlockIdx]).trim() ||
            state.knowledgeBlock
          : state.knowledgeBlock,
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
}
