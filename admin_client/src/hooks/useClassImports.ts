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

  const createImport = async (formData: FormData) => {
    const response = await api.post("/class_imports", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    await paginated.refresh();
    return response.data;
  };

  const confirmImport = async (
    id: string,
    students?: { student_code: string; full_name: string; email: string | null }[]
  ) => {
    const response = await api.post(`/class_imports/${id}/confirm`, { students });
    await paginated.refresh();
    return response.data;
  };

  return {
    ...paginated,
    createImport,
    confirmImport,
  };
}
