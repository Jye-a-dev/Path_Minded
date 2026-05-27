import { usePaginatedApi } from "./useApi";

export interface StudentItem {
  id: string;
  user_id?: string;
  student_code: string;
  full_name: string;
  class_id?: string;
  program_id?: string;
  cohort_year?: number;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
}

export function useStudents() {
  return usePaginatedApi<StudentItem>("/students");
}
