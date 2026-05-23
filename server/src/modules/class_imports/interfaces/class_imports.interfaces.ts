export type ClassImportEntity = {
  id: string;
  [key: string]: unknown;
};

export type ClassImportResponse = ClassImportEntity;

export type ClassImportsPaginationResponse = {
  data: ClassImportResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
