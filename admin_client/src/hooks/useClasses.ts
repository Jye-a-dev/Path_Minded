import { usePaginatedApi } from "./useApi";

export interface ClassItem {
  id: string;
  advisor_id?: string;
  program_id?: string;
  class_code: string;
  class_name?: string;
  cohort_year?: number;
}

export function useClasses() {
  return usePaginatedApi<ClassItem>("/classes");
}
