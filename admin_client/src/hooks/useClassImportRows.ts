import { usePaginatedApi } from "./useApi";

export interface ClassImportRowItem {
  id: string;
  import_id: string;
  class_code?: string;
  row_number?: number;
  student_code?: string;
  full_name?: string;
  email?: string;
  row_status: "PENDING" | "SUCCESS" | "FAILED";
  row_error?: string;
}

export function useClassImportRows() {
  return usePaginatedApi<ClassImportRowItem>("/class_import_rows");
}
