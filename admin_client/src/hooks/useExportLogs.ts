import { usePaginatedApi } from "./useApi";

export interface ExportLogItem {
  id: string;
  export_id: string;
  student_count?: number;
  course_count?: number;
  success_count?: number;
  warning_count?: number;
  created_at: string;
  file_name?: string;
  class_code?: string;
  program_name?: string;
  program_code?: string;
}

export function useExportLogs(
  initialFilters: Record<string, unknown> = {},
  options?: { skip?: (filters: Record<string, unknown>) => boolean }
) {
  return usePaginatedApi<ExportLogItem>("/export_logs", initialFilters, options);
}
