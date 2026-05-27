import { usePaginatedApi } from "./useApi";
import { api } from "../services/api";

export interface ExportItem {
  id: string;
  advisor_id?: string;
  class_id?: string;
  program_id?: string;
  file_name: string;
  file_path?: string;
  export_type: "MATRIX";
  created_at: string;
}

export function useExports() {
  const paginated = usePaginatedApi<ExportItem>("/exports");

  const createExport = async (payload: {
    class_id: string;
    program_id: string | null;
    advisor_id: string | null;
  }) => {
    const fullPayload = {
      export_type: "MATRIX",
      ...payload,
    };
    const response = await api.post("/exports", fullPayload);
    await paginated.refresh();
    return response.data;
  };

  return {
    ...paginated,
    createExport,
  };
}
