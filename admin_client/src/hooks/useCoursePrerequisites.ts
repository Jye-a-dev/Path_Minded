import { usePaginatedApi } from "./useApi";

export interface PrerequisiteItem {
  id: string;
  program_id?: string;
  course_code: string;
  prerequisite_course_code: string;
  prerequisite_type: "REQUIRED" | "RECOMMENDED" | "PREVIOUS" | "OTHER";
  course_name?: string;
  prerequisite_course_name?: string;
}

export function useCoursePrerequisites() {
  return usePaginatedApi<PrerequisiteItem>("/course_prerequisites");
}
