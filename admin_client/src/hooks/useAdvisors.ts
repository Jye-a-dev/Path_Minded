import { usePaginatedApi } from "./useApi";

export interface AdvisorItem {
  id: string;
  user_id?: string;
  full_name: string;
  department?: string;
  email?: string;
}

export function useAdvisors(
  initialFilters: Record<string, unknown> = {},
  options?: { skip?: (filters: Record<string, unknown>) => boolean }
) {
  return usePaginatedApi<AdvisorItem>("/advisors", initialFilters, options);
}
