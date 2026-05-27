// course-type.resolver.ts
import type { ParsedCurriculumCourse } from '../curriculum.types';

export function matchesCourseType(
  text: string,
  courseType: string,
  defaultPhrases: string[],
  courseTypeMappings?: Record<string, string[]>,
): boolean {
  const phrases =
    courseTypeMappings && Array.isArray(courseTypeMappings[courseType])
      ? courseTypeMappings[courseType]
      : defaultPhrases;
  const lowerText = text.toLowerCase();
  return phrases.some((phrase) => lowerText.includes(phrase.toLowerCase()));
}

export function resolveCourseType(
  courseName: string,
  courseCode: string,
  courseTypeRaw: string,
  courseTypeMappings?: Record<string, string[]>,
): ParsedCurriculumCourse['courseType'] {
  const lowerName = courseName.toLowerCase();
  const lowerCode = courseCode.toLowerCase();
  const lowerRaw = courseTypeRaw.toLowerCase();

  if (
    matchesCourseType(
      lowerName,
      'PE',
      ['thể chất', 'thể dục'],
      courseTypeMappings,
    ) ||
    matchesCourseType(lowerCode, 'PE', ['gdtc', 'dgt'], courseTypeMappings) ||
    matchesCourseType(
      lowerRaw,
      'PE',
      ['gdtc', 'thể dục', 'thể chất', 'pe'],
      courseTypeMappings,
    )
  ) {
    return 'PE';
  }

  if (
    matchesCourseType(
      lowerName,
      'DEFENSE',
      ['quốc phòng', 'quân sự', 'an ninh'],
      courseTypeMappings,
    ) ||
    matchesCourseType(
      lowerCode,
      'DEFENSE',
      ['gdqp', 'nad'],
      courseTypeMappings,
    ) ||
    matchesCourseType(
      lowerRaw,
      'DEFENSE',
      ['gdqp', 'quân sự', 'quốc phòng', 'defense'],
      courseTypeMappings,
    )
  ) {
    return 'DEFENSE';
  }

  if (
    matchesCourseType(
      lowerName,
      'ENGLISH',
      ['tiếng anh', 'anh văn', 'ngoại ngữ'],
      courseTypeMappings,
    ) ||
    matchesCourseType(
      lowerRaw,
      'ENGLISH',
      ['tiếng anh', 'anh văn', 'english'],
      courseTypeMappings,
    )
  ) {
    return 'ENGLISH';
  }

  if (
    matchesCourseType(
      lowerRaw,
      'ELECTIVE',
      ['tự chọn', 'tc', 'elective', 'elec'],
      courseTypeMappings,
    )
  ) {
    return 'ELECTIVE';
  }

  if (
    matchesCourseType(
      lowerRaw,
      'REQUIRED',
      ['bắt buộc', 'bb', 'required', 'req'],
      courseTypeMappings,
    )
  ) {
    return 'REQUIRED';
  }

  const exactMap: Record<string, ParsedCurriculumCourse['courseType']> = {
    required: 'REQUIRED',
    elective: 'ELECTIVE',
    pe: 'PE',
    english: 'ENGLISH',
    defense: 'DEFENSE',
    other: 'OTHER',
  };
  return exactMap[lowerRaw] ?? 'OTHER';
}
