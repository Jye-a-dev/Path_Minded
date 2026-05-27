import { usePaginatedApi } from "./useApi";

export interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string;
  version?: string;
  total_credits?: number;
}

export function usePrograms() {
  return usePaginatedApi<ProgramItem>("/programs");
}
