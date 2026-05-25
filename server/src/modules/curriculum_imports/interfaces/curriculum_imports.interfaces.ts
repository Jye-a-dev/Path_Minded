export type CurriculumImportEntity = {
  id: string;
  advisor_id: string | null;
  program_id: string | null;
  file_name: string;
  file_path: string | null;
  import_status: 'PENDING' | 'SUCCESS' | 'FAILED';
  import_error: string | null;
  uploaded_at: Date;
  processed_at: Date | null;
};

export type CurriculumImportResponse = CurriculumImportEntity;

export type CurriculumImportsPaginationResponse = {
  data: CurriculumImportResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
