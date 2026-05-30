import type {
  ParsedCurriculumCourse,
  CurriculumWarning,
} from '../curriculum.types';
import type { RawRow } from './curriculum-parser.types';
import { parseNumber } from './curriculum-parser.utils';
import { resolveCourseType } from './course-type.resolver';

export function parseText(text: string): RawRow[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, idx) => ({
      rowNumber: idx + 1,
      values: line.split(',').map((col) => col.trim()),
    }));
}

export function mapRows(rows: RawRow[]): {
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
