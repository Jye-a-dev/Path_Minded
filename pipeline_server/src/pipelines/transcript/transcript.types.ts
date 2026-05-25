/** Types for the transcript parsing pipeline */

export type ParsedCourseResult = {
  courseCode: string;
  courseName: string | null;
  credits: number | null;
  schoolYear: string | null;
  semesterCode: string | null;
  semesterNumber: number | null;
  score10: number | null;
  score4: number | null;
  letterGrade: string | null;
  resultText: string | null;
  status: 'PASSED' | 'FAILED' | 'STUDYING';
  attemptNo: number;
};

export type TranscriptWarning = {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
};

export type TranscriptParseResult = {
  results: ParsedCourseResult[];
  warnings: TranscriptWarning[];
};

export type RawTranscriptInput = {
  textContent?: string;
  fileBuffer?: Buffer;
  fileMimetype?: string;
  fileName?: string;
};
