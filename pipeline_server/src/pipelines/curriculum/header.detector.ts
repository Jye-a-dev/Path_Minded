// header.detector.ts
import { TableHeaders } from './parser/curriculum-parser.types';
import { getCellString } from './parser/curriculum-parser.utils';

export function matchesMapping(
  cellVal: string,
  key: string,
  defaultPhrases: string[],
  columnMappings?: Record<string, string[]>,
): boolean {
  const phrases =
    columnMappings && Array.isArray(columnMappings[key])
      ? columnMappings[key]
      : defaultPhrases;
  const lowerVal = cellVal.toLowerCase();
  return phrases.some((phrase) => lowerVal.includes(phrase.toLowerCase()));
}

export function detectTableHeaders(
  sliceValues: unknown[],
  offset: number,
  columnMappings?: Record<string, string[]>,
): TableHeaders | null {
  let courseCodeIdx = -1,
    courseNameIdx = -1,
    creditsIdx = -1,
    theoryHoursIdx = -1,
    practiceHoursIdx = -1;
  let projectHoursIdx = -1,
    internshipHoursIdx = -1,
    semesterIdx = -1,
    courseTypeIdx = -1,
    knowledgeBlockIdx = -1;
  let prerequisiteIdx = -1,
    corequisiteIdx = -1,
    organizingSemesterIdx = -1;
  let courseNamePriority = 0;

  for (let i = 0; i < sliceValues.length; i++) {
    const val = getCellString(sliceValues[i]).trim();
    if (!val) continue;

    const actualIdx = i + offset;

    if (
      matchesMapping(
        val,
        'course_code',
        ['mã học phần', 'mã hp', 'mã môn', 'code', 'course code'],
        columnMappings,
      )
    ) {
      courseCodeIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'course_name',
        [
          'tên học phần',
          'tên hp',
          'tên môn',
          'name',
          'course name',
          'tên môn học',
        ],
        columnMappings,
      )
    ) {
      let priority = 2;
      if (/(tiếng việt|việt|vietnamese|việt nam)/i.test(val)) priority = 3;
      else if (/(tiếng anh|english|en)/i.test(val)) priority = 1;

      if (priority > courseNamePriority) {
        courseNameIdx = actualIdx;
        courseNamePriority = priority;
      }
    } else if (
      matchesMapping(
        val,
        'credits',
        ['tín chỉ', 'số tc', 'credits', 'stc', 'credit'],
        columnMappings,
      )
    ) {
      creditsIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'theory_hours',
        ['lt', 'lý thuyết', 'theory'],
        columnMappings,
      ) &&
      !val.toLowerCase().includes('tên')
    ) {
      theoryHoursIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'practice_hours',
        ['th', 'thực hành', 'practice'],
        columnMappings,
      ) &&
      !val.toLowerCase().includes('tên')
    ) {
      practiceHoursIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'project_hours',
        ['đa', 'đồ án', 'project'],
        columnMappings,
      ) &&
      !val.toLowerCase().includes('tên')
    ) {
      projectHoursIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'internship_hours',
        ['tt', 'thực tập', 'internship'],
        columnMappings,
      ) &&
      !val.toLowerCase().includes('tên')
    ) {
      internshipHoursIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'year_semester',
        ['năm - kì học', 'năm - kì', 'tt'],
        columnMappings,
      )
    ) {
      semesterIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'expected_semester',
        ['phân bổ học kỳ', 'học kỳ', 'semester', 'hk'],
        columnMappings,
      )
    ) {
      if (semesterIdx === -1) {
        semesterIdx = actualIdx;
      }
    } else if (
      matchesMapping(
        val,
        'course_type',
        ['bắt buộc', 'tự chọn', 'bb/tc', 'req', 'elec', 'bắt buộc/tự chọn'],
        columnMappings,
      )
    ) {
      courseTypeIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'knowledge_block',
        [
          'khối kiến thức',
          'khối kt',
          'nhóm học phần',
          'phân loại khối',
          'knowledge block',
          'knowledge_block',
          'nhóm môn',
        ],
        columnMappings,
      )
    ) {
      knowledgeBlockIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'prerequisite',
        ['tiên quyết', 'prereq', 'đk tiên quyết', 'điều kiện tiên quyết'],
        columnMappings,
      )
    ) {
      prerequisiteIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'corequisite',
        ['học trước', 'coreq', 'đk học trước', 'điều kiện học trước'],
        columnMappings,
      )
    ) {
      corequisiteIdx = actualIdx;
    } else if (
      matchesMapping(
        val,
        'organizing_semester',
        ['hk tổ chức', 'học kỳ tổ chức', 'organizing semester'],
        columnMappings,
      )
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
      knowledgeBlockIdx,
      prerequisiteIdx,
      corequisiteIdx,
      organizingSemesterIdx,
    };
  }
  return null;
}

export function detectHeaders(
  rowValues: unknown[],
  columnMappings?: Record<string, string[]>,
) {
  let hasSecondTable = false;
  for (let i = 12; i < rowValues.length; i++) {
    const val = getCellString(rowValues[i]).trim();
    if (
      matchesMapping(
        val,
        'course_code',
        ['mã học phần', 'mã hp', 'mã môn', 'code', 'course code'],
        columnMappings,
      )
    ) {
      hasSecondTable = true;
      break;
    }
  }

  if (hasSecondTable) {
    const t1 = detectTableHeaders(rowValues.slice(0, 12), 0, columnMappings);
    const t2 = detectTableHeaders(rowValues.slice(12), 12, columnMappings);
    if (t1) return { t1, t2 };
  } else {
    const t1 = detectTableHeaders(rowValues, 0, columnMappings);
    if (t1) return { t1, t2: null };
  }
  return null;
}
