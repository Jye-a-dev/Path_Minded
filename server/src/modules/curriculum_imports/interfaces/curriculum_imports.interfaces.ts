export type CurriculumImportEntity = {
  id: string;
  [key: string]: unknown;
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

