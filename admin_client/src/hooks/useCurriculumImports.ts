import { usePaginatedApi } from "./useApi";
import { api } from "../services/api";

export interface ImportItem {
  id: string;
  advisor_id?: string;
  program_id: string;
  file_name: string;
  import_status: "PENDING" | "SUCCESS" | "FAILED";
  import_error?: string;
  uploaded_at: string;
  processed_at?: string;
  parsed_json?: string;
}

export interface GroupedImportItem extends ImportItem {
  versions: ImportItem[];
}

export function useCurriculumImports(initialFilters: Record<string, unknown> = {}) {
  const paginated = usePaginatedApi<ImportItem>("/curriculum_imports", initialFilters);

  const startImport = async (formData: FormData) => {
    const response = await api.post("/curriculum_imports", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    await paginated.refresh();
    return response.data;
  };

  const confirmImport = async (sessionId: string, courses: unknown[]) => {
    const response = await api.post(`/curriculum_imports/${sessionId}/confirm`, {
      courses,
    });
    await paginated.refresh();
    return response.data;
  };

  const cancelImport = async (sessionId: string) => {
    const response = await api.delete(`/curriculum_imports/${sessionId}`);
    await paginated.refresh();
    return response.data;
  };

  const changeSheet = async (sessionId: string, sheetIndex: number) => {
    const response = await api.post(`/curriculum_imports/${sessionId}/reparse`, {
      sheetIndex,
    });
    return response.data;
  };

  return {
    ...paginated,
    startImport,
    confirmImport,
    cancelImport,
    changeSheet,
  };
}
