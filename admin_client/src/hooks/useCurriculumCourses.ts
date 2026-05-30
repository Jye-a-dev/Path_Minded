import { usePaginatedApi } from "./useApi";
import { api } from "../services/api";

export interface CourseItem {
  id: string;
  program_id: string;
  course_code: string;
  course_name: string;
  credits?: number;
  expected_semester?: number;
  course_group?: string;
  course_type: "REQUIRED" | "ELECTIVE" | "PE" | "ENGLISH" | "DEFENSE" | "OTHER";
  is_required: boolean;
  theory_hours?: number | null;
  practice_hours?: number | null;
  project_hours?: number | null;
  internship_hours?: number | null;
  prerequisite?: string | null;
  corequisite?: string | null;
  organizing_semester?: string | null;
  sort_order?: number;
  knowledge_block?: string | null;
}

export function useCurriculumCourses(initialFilters: Record<string, unknown> = {}) {
  const paginated = usePaginatedApi<CourseItem>("/curriculum_courses", initialFilters);

  const bulkDelete = async (ids: (string | number)[]) => {
    const response = await api.delete("/curriculum_courses/bulk", { data: { ids } });
    await paginated.refresh();
    return response.data;
  };

  const deleteAll = async () => {
    const response = await api.delete("/curriculum_courses/all");
    await paginated.refresh();
    return response.data;
  };

  return {
    ...paginated,
    bulkDelete,
    deleteAll,
  };
}
