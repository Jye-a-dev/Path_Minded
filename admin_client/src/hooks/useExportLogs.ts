import { usePaginatedApi } from "./useApi";

export interface ExportLogItem {
  id: string;
  export_id: string;
  student_count?: number;
  course_count?: number;
  success_count?: number;
  warning_count?: number;
  created_at: string;
}

export function useExportLogs() {
  return usePaginatedApi<ExportLogItem>("/export_logs");
}
