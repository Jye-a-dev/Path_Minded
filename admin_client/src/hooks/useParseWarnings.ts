import { usePaginatedApi } from "./useApi";
import { api } from "../services/api";

export interface WarningItem {
  id: string;
  source_type: string;
  source_id: string;
  row_number?: number;
  warning_code?: string;
  warning_message?: string;
  raw_value?: string;
}

export function useParseWarnings() {
  const paginated = usePaginatedApi<WarningItem>("/parse_warnings");

  const deleteAll = async () => {
    const response = await api.delete("/parse_warnings/all");
    await paginated.refresh();
    return response.data;
  };

  return {
    ...paginated,
    deleteAll,
  };
}
