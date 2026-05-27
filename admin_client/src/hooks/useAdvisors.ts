import { usePaginatedApi } from "./useApi";

export interface AdvisorItem {
  id: string;
  user_id?: string;
  full_name: string;
  department?: string;
  email?: string;
}

export function useAdvisors() {
  return usePaginatedApi<AdvisorItem>("/advisors");
}
