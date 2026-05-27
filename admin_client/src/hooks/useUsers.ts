import { usePaginatedApi } from "./useApi";

export interface UserItem {
  id: string;
  email: string;
  role: "STUDENT" | "ADVISOR" | "ADMIN";
  display_name?: string;
}

export function useUsers() {
  return usePaginatedApi<UserItem>("/users");
}
