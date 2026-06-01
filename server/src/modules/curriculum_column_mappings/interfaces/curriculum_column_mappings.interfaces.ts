export type CurriculumColumnMappingEntity = {
  id: string;
  field_key: string;
  display_label: string;
  phrases: string[];
  mapping_type?: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CurriculumColumnMappingResponse = CurriculumColumnMappingEntity;

export type CurriculumColumnMappingsPaginationResponse = {
  data: CurriculumColumnMappingResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
