import { usePaginatedApi } from "./useApi";

export interface EquivalencyItem {
  id: string;
  program_id?: string;
  original_course_code: string;
  equivalent_course_code: string;
  note?: string;
}

export function useCourseEquivalencies() {
  return usePaginatedApi<EquivalencyItem>("/course_equivalencies");
}
