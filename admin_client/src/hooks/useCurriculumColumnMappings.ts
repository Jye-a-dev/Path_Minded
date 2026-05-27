import { usePaginatedApi } from "./useApi";

export interface MappingItem {
  id: string;
  field_key: string;
  display_label: string;
  phrases: string[];
  created_at?: string;
  updated_at?: string;
}

export function useCurriculumColumnMappings() {
  const paginated = usePaginatedApi<MappingItem>("/curriculum_column_mappings", { limit: 50 });

  return {
    ...paginated,
  };
}
