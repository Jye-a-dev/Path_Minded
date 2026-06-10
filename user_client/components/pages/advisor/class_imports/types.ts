export interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  advisor_id: string | null;
  program_id: string | null;
}

export interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string | null;
}

export interface ImportItem {
  id: string;
  class_id?: string;
  file_name: string;
  import_status: "PENDING" | "SUCCESS" | "FAILED";
  import_error?: string | null;
  uploaded_at: string;
  processed_at?: string | null;
}

export interface RowItem {
  id: string;
  import_id: string;
  row_number: number;
  student_code: string;
  full_name: string;
  email: string | null;
  row_status: "PENDING" | "SUCCESS" | "FAILED";
  row_error: string | null;
  class_code?: string;
}

export interface StudentItem {
  id: string;
  student_code: string;
  full_name: string;
  cohort_year: number | null;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
  user_id: string | null;
  class_id: string | null;
  program_id: string | null;
  email?: string | null;
}

export interface ParsedStudentItem {
  studentCode: string;
  fullName: string;
  email: string | null;
}

export interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

export interface UserAccount {
  id: string;
  email: string;
  role: string;
}
