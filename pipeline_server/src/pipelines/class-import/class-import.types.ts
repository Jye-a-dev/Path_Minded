/** Types for the class-import parsing pipeline */

export type ParsedClassRow = {
  studentCode: string;
  fullName: string;
  email: string | null;
};

export type ClassImportWarning = {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
};

export type ClassImportParseResult = {
  students: ParsedClassRow[];
  warnings: ClassImportWarning[];
};

export type RawClassImportInput = {
  textContent?: string;
  fileBuffer?: Buffer;
  fileMimetype?: string;
  fileName?: string;
};
