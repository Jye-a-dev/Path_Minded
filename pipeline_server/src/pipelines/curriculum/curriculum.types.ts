/** Types for the curriculum parsing pipeline */

export type ParsedCurriculumCourse = {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  projectHours: number | null;
  internshipHours: number | null;
  expectedSemester: number | null;
  courseGroup: string | null;
  courseType: 'REQUIRED' | 'ELECTIVE' | 'PE' | 'ENGLISH' | 'DEFENSE' | 'OTHER';
  isRequired: boolean;
  prerequisite: string | null;
  corequisite: string | null;
  organizingSemester: string | null;
  knowledgeBlock?: string | null;
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
  sheets: string[];
  activeSheetIndex: number;
  headersDetected?: boolean;
  rawHeaders?: string[];
  potentialHeaderRow?: number;
};

export type RawCurriculumInput = {
  textContent?: string;
  fileBuffer?: Buffer;
  fileMimetype?: string;
  fileName?: string;
  sheetIndex?: number;
  columnMappings?: Record<string, string[]>;
  courseTypeMappings?: Record<string, string[]>;
};
