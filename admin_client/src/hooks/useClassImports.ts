import { usePaginatedApi } from "./useApi";
import { api } from "../services/api";

export interface ClassImportItem {
  id: string;
  advisor_id?: string;
  class_id?: string;
  file_name: string;
  file_path?: string;
  import_status: "PENDING" | "SUCCESS" | "FAILED";
  import_error?: string;
  uploaded_at: string;
  processed_at?: string;
}

export function useClassImports() {
  const paginated = usePaginatedApi<ClassImportItem>("/class_imports");

  const createImport = async (payload: { class_id: string; textContent: string }) => {
    const fullPayload = {
      sourceType: "text",
      file_name: `pasted_class_import_${Date.now()}.csv`,
      ...payload,
    };
    const response = await api.post("/class_imports", fullPayload);
    await paginated.refresh();
    return response.data;
  };

  const confirmImport = async (id: string) => {
    const response = await api.post(`/class_imports/${id}/confirm`, {});
    await paginated.refresh();
    return response.data;
  };

  return {
    ...paginated,
    createImport,
    confirmImport,
  };
}
