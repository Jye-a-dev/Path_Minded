import { usePaginatedApi } from "./useApi";
import { api } from "../services/api";

export interface StudentCourseResultItem {
  id: string;
  student_id: string;
  course_code: string;
  course_name?: string;
  credits?: number;
  school_year?: string;
  semester_code?: string;
  semester_number?: number;
  score_10?: number;
  score_4?: number;
  letter_grade?: string;
  result_text?: string;
  status: "PASSED" | "FAILED" | "STUDYING";
  attempt_no?: number;
  is_latest?: boolean;
}

export function useStudentCourseResults(studentId?: string) {
  const paginated = usePaginatedApi<StudentCourseResultItem>(
    "/student_course_results",
    studentId ? { student_id: studentId } : {}
  );

  const bulkDelete = async (ids: (string | number)[]) => {
    const response = await api.delete("/student_course_results/bulk", { data: { ids } });
    await paginated.refresh();
    return response.data;
  };

  return {
    ...paginated,
    bulkDelete,
  };
}
