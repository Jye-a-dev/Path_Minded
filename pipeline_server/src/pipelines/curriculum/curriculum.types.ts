/** Types for the curriculum parsing pipeline */

export type ParsedCurriculumCourse = {
  courseCode: string;
  courseName: string;
  credits: number | null;
  expectedSemester: number | null;
  courseGroup: string | null;
  courseType: 'REQUIRED' | 'ELECTIVE' | 'PE' | 'ENGLISH' | 'DEFENSE' | 'OTHER';
  isRequired: boolean;
};

export type CurriculumWarning = {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
};

export type CurriculumParseResult = {
  preview: ParsedCurriculumCourse[];
  warnings: CurriculumWarning[];
};

export type RawCurriculumInput = {
  textContent?: string;
  fileBuffer?: Buffer;
  fileMimetype?: string;
  fileName?: string;
};
