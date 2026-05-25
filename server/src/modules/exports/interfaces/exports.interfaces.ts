export type ExportEntity = {
  id: string;
  advisor_id: string | null;
  class_id: string | null;
  program_id: string | null;
  file_name: string;
  file_path: string | null;
  export_type: 'MATRIX';
  created_at: Date;
};

export type ExportResponse = ExportEntity;

export type ExportsPaginationResponse = {
  data: ExportResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
